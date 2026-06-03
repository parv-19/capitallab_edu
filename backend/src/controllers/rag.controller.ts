import type { Request, Response } from "express";

import { DEBUG_RAG } from "../config/rag";
import { ChatMessage } from "../models/ChatMessage.model";
import { Conversation } from "../models/Conversation.model";
import { Course } from "../models/Course.model";
import { CourseDocument } from "../models/CourseDocument.model";
import { MessageFeedback } from "../models/MessageFeedback.model";
import { RagChatLog } from "../models/RagChatLog.model";
import { RagUnansweredQuestion } from "../models/RagUnansweredQuestion.model";
import {
  answerSyllabusQuestion,
  type ConversationTurn,
} from "../services/ragChat.service";
import {
  createCourseDocumentRecord,
  deleteCourseDocumentById,
  queueCourseDocumentProcessing,
  serializeDocument,
} from "../services/ragIngestion.service";
import type { AuthedRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";

function buildConversationTitle(question: string): string {
  const trimmed = question.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 70 ? `${trimmed.slice(0, 67)}...` : trimmed;
}

function splitIntoStreamingChunks(answer: string): string[] {
  const words = answer.split(/(\s+)/).filter((part) => part.length > 0);
  const chunks: string[] = [];
  let buffer = "";
  words.forEach((word) => {
    if ((buffer + word).length > 80 && buffer.trim().length > 0) { chunks.push(buffer); buffer = word; return; }
    buffer += word;
  });
  if (buffer.trim().length > 0) chunks.push(buffer);
  return chunks.length > 0 ? chunks : [answer];
}

function serializeConversation(conversation: any, messageCount = 0, lastMessagePreview?: string) {
  return {
    _id: String(conversation.id ?? conversation._id),
    title: conversation.title,
    courseIds: Array.isArray(conversation.courseIds) ? conversation.courseIds.map((id: any) => String(id)) : [],
    subject: conversation.subject,
    chapterName: conversation.chapterName,
    lastMessageAt: conversation.lastMessageAt,
    messageCount,
    lastMessagePreview,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function serializeChatMessage(message: any, feedback?: any) {
  return {
    _id: String(message.id ?? message._id),
    conversationId: String(message.conversationId),
    role: message.role,
    content: message.content,
    sources: Array.isArray(message.sources) ? message.sources : [],
    metadata: message.metadata ?? {},
    feedback: feedback ? { _id: String(feedback.id ?? feedback._id), rating: feedback.rating, reason: feedback.reason, category: feedback.category, createdAt: feedback.createdAt, updatedAt: feedback.updatedAt } : null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function getAllowedCourseIds(req: AuthedRequest): string[] {
  return req.user?.role === "student" ? (req.user.enrollments ?? []).map((e: any) => String(e)) : [];
}

function resolveCourseIds(params: { req: AuthedRequest; courseId?: string; conversation?: any }): string[] {
  const allowedCourseIds = getAllowedCourseIds(params.req);
  const explicitCourseId = params.courseId?.trim();
  if (explicitCourseId) return [explicitCourseId];
  if (params.conversation?.courseIds?.length) return params.conversation.courseIds.map((e: any) => String(e));
  return params.req.user?.role === "student" ? allowedCourseIds : [];
}

async function getConversationOrThrow(conversationId: string, userId?: string) {
  const conversation = await Conversation.findOne({ _id: conversationId, userId });
  if (!conversation) throw new Error("Conversation not found");
  return conversation;
}

async function buildConversationHistoryFromDb(conversationId: string): Promise<ConversationTurn[]> {
  const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });
  return messages
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => ({ role: m.role, content: String(m.content ?? "") }));
}

async function ensureConversation(params: {
  userId?: string;
  conversationId?: string;
  titleFromQuestion?: string;
  courseIds: string[];
  subject?: string;
  chapterName?: string;
}) {
  if (!params.userId) throw new Error("Authenticated user is required");

  if (params.conversationId?.trim()) {
    const conversation = await getConversationOrThrow(params.conversationId.trim(), params.userId);
    if (params.courseIds.length > 0) conversation.courseIds = params.courseIds;
    if (params.subject?.trim()) conversation.subject = params.subject.trim();
    if (params.chapterName?.trim()) conversation.chapterName = params.chapterName.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();
    return conversation;
  }

  return Conversation.create({
    userId: params.userId,
    title: buildConversationTitle(params.titleFromQuestion ?? ""),
    courseIds: params.courseIds,
    subject: params.subject?.trim() || undefined,
    chapterName: params.chapterName?.trim() || undefined,
    lastMessageAt: new Date(),
  });
}

async function saveConversationTurn(params: {
  conversation: any;
  question: string;
  subject?: string;
  chapterName?: string;
  courseIds: string[];
  result: Awaited<ReturnType<typeof answerSyllabusQuestion>>;
  regeneratedFromMessageId?: string;
}) {
  const userMessage = await ChatMessage.create({
    conversationId: params.conversation.id ?? params.conversation._id,
    role: "user",
    content: params.question,
    metadata: { subject: params.subject, chapterName: params.chapterName, courseIds: params.courseIds },
  });

  const assistantMessage = await ChatMessage.create({
    conversationId: params.conversation.id ?? params.conversation._id,
    role: "assistant",
    content: params.result.answer,
    sources: params.result.sources,
    metadata: { answered: params.result.answered, confidenceScore: params.result.confidenceScore, suggestedQuestions: params.result.suggestedQuestions, debug: params.result.debug, subject: params.subject, chapterName: params.chapterName, courseIds: params.courseIds, regeneratedFromMessageId: params.regeneratedFromMessageId },
  });

  if (!params.conversation.title || params.conversation.title === "New chat" || params.conversation.title === "New Chat") {
    params.conversation.title = buildConversationTitle(params.question);
  }
  params.conversation.lastMessageAt = new Date();
  await params.conversation.save();

  return { userMessage, assistantMessage };
}

async function resolveConversationInputs(req: AuthedRequest, body: Record<string, any>) {
  const { question, subject, courseId, chapterName, conversationId, conversationHistory = [] } = body;
  if (!question?.trim()) throw new Error("question is required");

  let conversation = null;
  if (conversationId?.trim()) conversation = await getConversationOrThrow(conversationId.trim(), req.user?.userId);

  const allowedCourseIds = getAllowedCourseIds(req);
  const courseIds = resolveCourseIds({ req, courseId, conversation });

  if (req.user?.role === "student" && courseIds.some((id) => !allowedCourseIds.includes(id))) {
    throw new Error("You can only ask about courses you are enrolled in.");
  }

  const history =
    conversation && conversationId?.trim()
      ? await buildConversationHistoryFromDb(String(conversation.id ?? conversation._id))
      : Array.isArray(conversationHistory) ? (conversationHistory as ConversationTurn[]) : [];

  return {
    question: String(question).trim(),
    subject: subject?.trim() || conversation?.subject,
    chapterName: chapterName?.trim() || conversation?.chapterName,
    courseIds,
    conversation,
    history,
  };
}

export const uploadRagDocument = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const { courseId, subject, chapterName, title } = req.body as Record<string, string>;
  if (!courseId) return res.status(400).json({ message: "courseId is required" });

  const document = await createCourseDocumentRecord({ courseId, file, title, subject, chapterName, uploadedBy: req.user?.userId });
  await queueCourseDocumentProcessing(String(document.id ?? document._id));
  const queuedDocument = await CourseDocument.findById(document.id ?? document._id);

  res.status(201).json({ document: serializeDocument(queuedDocument ?? document), queued: true });
});

export const listRagDocuments = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  const { courseId, subject, chapterName, status } = req.query as Record<string, string>;
  if (courseId) filter.courseId = courseId;
  if (subject) filter.subject = subject;
  if (chapterName) filter.chapterName = chapterName;
  if (status) filter.status = status;

  const documents = await CourseDocument.find(filter).sort({ createdAt: -1 });
  res.json({ documents: documents.map(serializeDocument) });
});

export const processRagDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await queueCourseDocumentProcessing(String(req.params.id ?? ""));
  const queuedDocument = await CourseDocument.findById(String(req.params.id ?? ""));
  res.status(result.alreadyRunning ? 200 : 202).json({ success: true, queued: result.queued, alreadyRunning: result.alreadyRunning, document: serializeDocument(queuedDocument ?? result.document) });
});

export const reindexRagDocument = processRagDocument;

export const deleteRagDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await deleteCourseDocumentById(String(req.params.id ?? ""));
  if (!document) return res.status(404).json({ message: "Document not found" });
  res.json({ message: "Document deleted" });
});

export const ragChat = asyncHandler(async (req: AuthedRequest, res: Response) => {
  try {
    const inputs = await resolveConversationInputs(req, req.body as Record<string, any>);
    const conversation = await ensureConversation({ userId: req.user?.userId, conversationId: String((req.body as any).conversationId ?? ""), titleFromQuestion: inputs.question, courseIds: inputs.courseIds, subject: inputs.subject, chapterName: inputs.chapterName });
    const result = await answerSyllabusQuestion({ userId: req.user?.userId, question: inputs.question, courseIds: inputs.courseIds, subject: inputs.subject, chapterName: inputs.chapterName, conversationHistory: inputs.history });
    const { assistantMessage } = await saveConversationTurn({ conversation, question: inputs.question, subject: inputs.subject, chapterName: inputs.chapterName, courseIds: inputs.courseIds, result });
    res.json({ ...result, conversationId: String(conversation.id ?? conversation._id), messageId: String(assistantMessage.id ?? assistantMessage._id) });
  } catch (error: any) {
    const message = error?.message || "Failed to answer question.";
    const status = message === "Conversation not found" ? 404 : message === "You can only ask about courses you are enrolled in." ? 403 : message === "question is required" ? 400 : 500;
    res.status(status).json({ message });
  }
});

export const ragChatStream = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  try {
    const inputs = await resolveConversationInputs(req, req.body as Record<string, any>);
    const conversation = await ensureConversation({ userId: req.user?.userId, conversationId: String((req.body as any).conversationId ?? ""), titleFromQuestion: inputs.question, courseIds: inputs.courseIds, subject: inputs.subject, chapterName: inputs.chapterName });
    const result = await answerSyllabusQuestion({ userId: req.user?.userId, question: inputs.question, courseIds: inputs.courseIds, subject: inputs.subject, chapterName: inputs.chapterName, conversationHistory: inputs.history });
    const { assistantMessage } = await saveConversationTurn({ conversation, question: inputs.question, subject: inputs.subject, chapterName: inputs.chapterName, courseIds: inputs.courseIds, result });
    splitIntoStreamingChunks(result.answer).forEach((delta) => { res.write(`data: ${JSON.stringify({ type: "delta", delta })}\n\n`); });
    res.write(`data: ${JSON.stringify({ type: "done", answered: result.answered, sources: result.sources, confidenceScore: result.confidenceScore, suggestedQuestions: result.suggestedQuestions, conversationId: String(conversation.id ?? conversation._id), messageId: String(assistantMessage.id ?? assistantMessage._id), ...(DEBUG_RAG ? { debug: result.debug } : {}) })}\n\n`);
    res.write("data: [DONE]\n\n");
  } catch (error: any) {
    console.error("ragChatStream failed:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: error?.message || "Failed to stream answer." })}\n\n`);
    res.write("data: [DONE]\n\n");
  } finally {
    res.end();
  }
});

export const listConversations = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const conversations = await Conversation.find({ userId: req.user?.userId }).sort({ lastMessageAt: -1 });

  const conversationIds = conversations.map((c: any) => String(c.id ?? c._id));
  const [messageCounts, latestMessages] = await Promise.all([
    ChatMessage.countByConversation(conversationIds),
    ChatMessage.latestByConversation(conversationIds),
  ]);

  const countMap = new Map(messageCounts.map((e) => [e.conversationId, e.count]));
  const previewMap = new Map(latestMessages.map((e) => [e.conversationId, e.content]));

  res.json({
    conversations: conversations.map((conversation: any) =>
      serializeConversation(conversation, countMap.get(String(conversation.id ?? conversation._id)) ?? 0, previewMap.get(String(conversation.id ?? conversation._id))),
    ),
  });
});

export const getConversation = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const conversation = await Conversation.findOne({ _id: String(req.params.id ?? ""), userId: req.user?.userId });
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const messages = await ChatMessage.find({ conversationId: conversation.id ?? conversation._id }).sort({ createdAt: 1 });
  const messageIds = messages.map((m: any) => String(m.id ?? m._id));
  const feedbackRows = await MessageFeedback.find({ messageId: { $in: messageIds }, userId: req.user?.userId });
  const feedbackMap = new Map(feedbackRows.map((f: any) => [String(f.messageId), f]));

  res.json({
    conversation: serializeConversation(conversation, messages.length),
    messages: messages.map((m: any) => serializeChatMessage(m, feedbackMap.get(String(m.id ?? m._id)))),
  });
});

export const deleteConversation = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const conversation = await Conversation.findOneAndDelete({ _id: String(req.params.id ?? ""), userId: req.user?.userId ?? "" });
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const conversationId = String(conversation.id ?? conversation._id);
  const messages = await ChatMessage.find({ conversationId }).sort({ createdAt: 1 });
  const messageIds = messages.map((m: any) => String(m.id ?? m._id));

  await Promise.all([
    ChatMessage.deleteMany({ conversationId }),
    MessageFeedback.deleteMany({ messageId: { $in: messageIds } }),
  ]);

  res.json({ message: "Conversation deleted" });
});

export const submitMessageFeedback = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { rating, reason, category } = req.body as { rating: "like" | "dislike"; reason?: string; category?: string };
  if (!rating || !["like", "dislike"].includes(rating)) return res.status(400).json({ message: "rating must be like or dislike" });

  const message = await ChatMessage.findById(String(req.params.id ?? ""));
  if (!message || message.role !== "assistant") return res.status(404).json({ message: "Assistant message not found" });

  const conversation = await Conversation.findOne({ _id: message.conversationId, userId: req.user?.userId });
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const feedback = await MessageFeedback.findOneAndUpdate(
    { messageId: message.id ?? message._id, userId: req.user?.userId },
    { conversationId: message.conversationId, rating, reason: reason?.trim() || undefined, category: category || "other" },
    { upsert: true, new: true },
  );

  res.json({ feedback: { _id: String(feedback?.id ?? feedback?._id), rating: feedback?.rating, reason: feedback?.reason, category: feedback?.category, createdAt: feedback?.createdAt, updatedAt: feedback?.updatedAt } });
});

export const regenerateMessage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const targetMessage = await ChatMessage.findById(String(req.params.id ?? ""));
  if (!targetMessage || targetMessage.role !== "assistant") return res.status(404).json({ message: "Assistant message not found" });

  const conversation = await Conversation.findOne({ _id: targetMessage.conversationId, userId: req.user?.userId });
  if (!conversation) return res.status(404).json({ message: "Conversation not found" });

  const messages = await ChatMessage.find({ conversationId: conversation.id ?? conversation._id }).sort({ createdAt: 1 });
  const targetIndex = messages.findIndex((m: any) => String(m.id ?? m._id) === String(targetMessage.id ?? targetMessage._id));
  if (targetIndex <= 0) return res.status(400).json({ message: "Cannot regenerate this message." });

  const previousUserMessage = messages.slice(0, targetIndex).reverse().find((m: any) => m.role === "user");
  if (!previousUserMessage) return res.status(400).json({ message: "Original user question not found." });

  const historyUntilQuestion = messages
    .slice(0, messages.findIndex((m: any) => String(m.id ?? m._id) === String(previousUserMessage.id ?? previousUserMessage._id)))
    .filter((m: any) => m.role === "user" || m.role === "assistant")
    .map((m: any) => ({ role: m.role, content: String(m.content ?? "") })) as ConversationTurn[];

  const metadata = targetMessage.metadata ?? {};
  const courseIds = Array.isArray(metadata.courseIds) ? metadata.courseIds.map((e: any) => String(e)) : Array.isArray(conversation.courseIds) ? conversation.courseIds.map((e: any) => String(e)) : [];
  const subject = String(metadata.subject ?? conversation.subject ?? "");
  const chapterName = String(metadata.chapterName ?? conversation.chapterName ?? "");

  const result = await answerSyllabusQuestion({ userId: req.user?.userId, question: String(previousUserMessage.content ?? ""), courseIds, subject: subject || undefined, chapterName: chapterName || undefined, conversationHistory: historyUntilQuestion });
  const assistantMessage = await ChatMessage.create({ conversationId: conversation.id ?? conversation._id, role: "assistant", content: result.answer, sources: result.sources, metadata: { answered: result.answered, confidenceScore: result.confidenceScore, suggestedQuestions: result.suggestedQuestions, debug: result.debug, subject: subject || undefined, chapterName: chapterName || undefined, courseIds, regeneratedFromMessageId: String(targetMessage.id ?? targetMessage._id), originalUserMessageId: String(previousUserMessage.id ?? previousUserMessage._id) } });
  conversation.lastMessageAt = new Date();
  await conversation.save();

  res.json({ answer: result.answer, answered: result.answered, confidenceScore: result.confidenceScore, sources: result.sources, suggestedQuestions: result.suggestedQuestions, conversationId: String(conversation.id ?? conversation._id), messageId: String(assistantMessage.id ?? assistantMessage._id), ...(DEBUG_RAG ? { debug: result.debug } : {}) });
});

export const listRagLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await RagChatLog.find().sort({ createdAt: -1 }).limit(100);
  res.json({ logs });
});

export const listRagUnanswered = asyncHandler(async (_req: Request, res: Response) => {
  const unanswered = await RagUnansweredQuestion.find().sort({ createdAt: -1 }).limit(100);
  res.json({ unanswered });
});

export const getRagOptions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const filter: Record<string, unknown> = { status: { $in: ["indexed", "completed"] } };
  if (req.user?.role === "student") filter.courseId = { $in: req.user.enrollments ?? [] };

  const documents = await CourseDocument.find(filter);

  const courseMap = new Map<string, { courseId: string; courseName: string; subjects: Set<string>; chapters: Set<string> }>();
  documents.forEach((document: any) => {
    const key = String(document.courseId);
    if (!courseMap.has(key)) courseMap.set(key, { courseId: key, courseName: document.courseName ?? "Course", subjects: new Set(), chapters: new Set() });
    const current = courseMap.get(key)!;
    if (document.subject) current.subjects.add(document.subject);
    if (document.chapterName) current.chapters.add(document.chapterName);
  });

  const options = Array.from(courseMap.values()).map((e) => ({ courseId: e.courseId, courseName: e.courseName, subjects: Array.from(e.subjects).sort(), chapters: Array.from(e.chapters).sort() }));

  if (req.user?.role !== "student") {
    const courses = await Course.find();
    courses.forEach((course: any) => {
      const key = String(course.id ?? course._id);
      if (!courseMap.has(key)) options.push({ courseId: key, courseName: course.title, subjects: [], chapters: [] });
    });
  }

  res.json({ options });
});
