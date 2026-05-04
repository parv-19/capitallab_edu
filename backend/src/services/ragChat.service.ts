import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import mongoose from "mongoose";
import OpenAI from "openai";

import {
  GROQ_MODEL,
  LLM_MODEL,
  LLM_PROVIDER,
  RAG_NOT_FOUND_MESSAGE,
  RAG_SIMILARITY_THRESHOLD,
  RAG_TOP_K,
  STRICT_RAG_SYSTEM_PROMPT,
  VECTOR_INDEX_NAME,
} from "../config/rag";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { RagChatLog } from "../models/RagChatLog.model";
import { RagUnansweredQuestion } from "../models/RagUnansweredQuestion.model";
import { createEmbedding } from "./ragEmbedding.service";

const MIN_CONTEXT_RESULTS = 6;
const MAX_CONTEXT_RESULTS = 8;

interface RetrievedChunk {
  _id: string;
  documentId: string;
  content: string;
  score: number;
  chunkIndex?: number;
  subject?: string;
  chapterName?: string;
  pageNumber?: number;
  metadata: Record<string, any>;
}

interface SourceReference {
  documentId?: string;
  documentTitle: string;
  fileName: string;
  chapterName?: string;
  pageNumber?: number;
}

export interface RagAnswerResult {
  answered: boolean;
  answer: string;
  sources: SourceReference[];
  confidenceScore: number;
}

interface RetrievedChunkCandidate extends RetrievedChunk {
  lexicalScore?: number;
  supportScore?: number;
  exactPhraseMatch?: boolean;
}

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/g, " ");
}

function inferQuestionIntent(question: string): string {
  const normalized = question.toLowerCase();

  if (/\b(compare|difference|different|vs|versus)\b/.test(normalized)) {
    return "comparison";
  }

  if (/\b(calculate|compute|formula|equation|ratio)\b/.test(normalized)) {
    return "calculation";
  }

  if (/\b(why|how)\b/.test(normalized)) {
    return "reasoning";
  }

  if (/\b(quiz|practice|mcq|test me)\b/.test(normalized)) {
    return "practice";
  }

  if (/\b(define|what is|what are|explain)\b/.test(normalized)) {
    return "definition";
  }

  return "general";
}

function buildAnsweringGuidance(question: string) {
  const intent = inferQuestionIntent(question);
  const guidanceMap: Record<string, string> = {
    comparison:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: comparison. Contrast the items in parallel, then state the key difference using only supported context.",
    calculation:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: calculation. Prefer formulas, variable definitions, and worked steps only when those appear in the retrieved context.",
    reasoning:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: reasoning. Explain the relationship step by step, but do not infer beyond what the retrieved context explicitly supports.",
    practice:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: practice. Build a 3-option question only from the retrieved context and wait for the student's answer.",
    definition:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: definition/explanation. Start with the clearest direct definition from the retrieved context, then simplify it.",
    general:
      "QUESTION-SPECIFIC GUIDANCE:\nQuestion intent: general. Synthesize the strongest overlapping points from the retrieved context into a clear student-friendly answer.",
  };

  return `${guidanceMap[intent]}\nUse the most relevant sources first. If sources overlap, combine them into one clear answer without repeating the same point.`;
}

function formatChunkForPrompt(chunk: RetrievedChunk): string {
  const content = String(chunk.content ?? "").trim();
  const formulaLines = Array.isArray(chunk.metadata.formulaLines)
    ? chunk.metadata.formulaLines.filter((line: unknown) => typeof line === "string" && line.trim().length > 0)
    : [];
  const notes: string[] = [];

  if (chunk.metadata.hasFormula) {
    notes.push("Contains formula content");
  }

  if (chunk.metadata.hasTable) {
    notes.push("Contains table or structured numeric content");
  }

  if (formulaLines.length === 0) {
    return content;
  }

  return [
    notes.length > 0 ? `Notes: ${notes.join(" | ")}` : null,
    content,
    "Formula lines:",
    ...formulaLines.map((line) => `- ${line}`),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRetrievedContext(chunks: RetrievedChunk[]) {
  return chunks
    .map((chunk, index) => {
      const source = chunk.metadata.documentTitle ?? chunk.metadata.fileName ?? "Uploaded Document";
      const pageNumber = chunk.pageNumber ?? chunk.metadata.pageNumber ?? 1;
      const topic = chunk.metadata.topic ? ` | Topic: ${chunk.metadata.topic}` : "";
      const semanticType = chunk.metadata.semanticType ? ` | Type: ${chunk.metadata.semanticType}` : "";
      return `[Source ${index + 1}] ${source} | Page ${pageNumber}${topic}${semanticType}\n${formatChunkForPrompt(chunk)}`;
    })
    .join("\n\n");
}

function buildSystemPrompt(question: string) {
  return STRICT_RAG_SYSTEM_PROMPT
    .replace("{retrieved_context}", "[provided in the user message]")
    .replace("{question}", "[provided in the user message]")
    .replace("{answering_guidance}", buildAnsweringGuidance(question));
}

function buildUserPrompt(question: string, chunks: RetrievedChunk[]) {
  return [
    "Use only the retrieved context below.",
    "",
    "═══════════ RETRIEVED CONTEXT START ═══════════",
    buildRetrievedContext(chunks),
    "═══════════ RETRIEVED CONTEXT END ═══════════",
    "",
    `Student Question: ${question}`,
  ].join("\n");
}

function extractQuestionKeywords(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .filter(
      (word) =>
        ![
          "what",
          "which",
          "when",
          "where",
          "why",
          "how",
          "from",
          "with",
          "that",
          "this",
          "into",
          "about",
          "your",
          "their",
          "there",
          "have",
          "does",
          "show",
          "explain",
          "define",
          "using",
          "question",
          "answer",
          "simple",
          "language",
          "according",
          "material",
          "uploaded",
          "documents",
          "difference",
          "between",
          "role",
          "process",
          "management",
          "framework",
          "describe",
          "candidate",
          "able",
          "should",
          "main",
          "features",
        ].includes(word),
    );
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function exactTopicPhrase(question: string) {
  return normalizeText(
    question
      .replace(/^(what is|what are|define|explain|describe)\s+/i, "")
      .replace(/^(how does|how do|why does|why do|difference between|what is the difference between)\s+/i, "")
      .replace(/\b(in simple language|simply|simple language|according to the material|in the material)\b/gi, ""),
  );
}

function buildChunkHaystack(chunk: RetrievedChunk) {
  return normalizeText(
    [
      chunk.content,
      chunk.subject ?? "",
      chunk.chapterName ?? "",
      chunk.metadata.documentTitle ?? "",
      chunk.metadata.topic ?? "",
      chunk.metadata.semanticType ?? "",
      Array.isArray(chunk.metadata.headingTrail) ? chunk.metadata.headingTrail.join(" ") : "",
    ].join(" "),
  );
}

function scoreChunkSupport(question: string, chunk: RetrievedChunk) {
  const keywords = extractQuestionKeywords(question);
  const haystack = buildChunkHaystack(chunk);
  const phrase = exactTopicPhrase(question);
  const keywordMatches = keywords.filter((keyword) => haystack.includes(keyword)).length;
  const exactPhraseMatch = phrase.length >= 4 && haystack.includes(phrase);
  const semanticBoost =
    typeof chunk.metadata.semanticType === "string" &&
    /\b(define|what is|what are)\b/i.test(question) &&
    chunk.metadata.semanticType === "definition"
      ? 2
      : 0;
  const formulaBoost =
    typeof chunk.metadata.semanticType === "string" &&
    /\b(formula|equation|calculate|ratio|covariance|correlation|variance|standard deviation|beta)\b/i.test(
      question,
    ) &&
    chunk.metadata.semanticType === "formula_or_measure"
      ? 2
      : 0;
  const workedExampleBoost =
    typeof chunk.metadata.semanticType === "string" &&
    /\b(calculate|compute|solve|example|worked example|show)\b/i.test(question) &&
    /\b(worked_example|example)\b/i.test(chunk.metadata.semanticType)
      ? 2
      : 0;
  const tableBoost =
    /\b(table|compare|comparison|data|schedule|breakdown|numbers)\b/i.test(question) &&
    chunk.metadata.hasTable
      ? 1
      : 0;

  return {
    keywordMatches,
    exactPhraseMatch,
    total:
      keywordMatches +
      (exactPhraseMatch ? 3 : 0) +
      semanticBoost +
      formulaBoost +
      workedExampleBoost +
      tableBoost,
  };
}

function hasKeywordSupport(question: string, chunks: RetrievedChunk[]) {
  const keywords = extractQuestionKeywords(question);
  if (keywords.length === 0) {
    return true;
  }

  const haystack = chunks.map((chunk) => buildChunkHaystack(chunk)).join(" ");

  const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword));
  const minimumMatches = keywords.length === 1 ? 1 : Math.max(2, Math.ceil(keywords.length / 2));
  return matchedKeywords.length >= minimumMatches;
}

function passesRelevanceGate(question: string, chunks: RetrievedChunk[]): boolean {
  if (chunks.length === 0) {
    return false;
  }

  const keywords = extractQuestionKeywords(question);
  const phrase = exactTopicPhrase(question);
  const supportEntries = chunks.map((chunk) => ({
    chunk,
    support: scoreChunkSupport(question, chunk),
  }));

  const bestSupport = supportEntries[0]?.support;
  const exactPhraseSupported =
    phrase.length >= 4 && supportEntries.some((entry) => entry.support.exactPhraseMatch);
  const strongChunkCount = supportEntries.filter(
    (entry) => entry.support.keywordMatches >= 2 || entry.support.total >= 4,
  ).length;

  if (keywords.length <= 1) {
    return (bestSupport?.keywordMatches ?? 0) >= 1 || exactPhraseSupported;
  }

  if (keywords.length === 2) {
    return exactPhraseSupported || strongChunkCount >= 1;
  }

  return exactPhraseSupported || strongChunkCount >= 2;
}

function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "");
}

function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "");
}

function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "");
}

async function runLlm(prompt: string): Promise<string> {
  const [systemPrompt, userPrompt] = prompt.split("\n\n<<<USER_PROMPT>>>\n\n");
  const preferredProvider = LLM_PROVIDER;
  const providerOrder =
    preferredProvider === "openai"
      ? ["openai", "groq", "anthropic"]
      : preferredProvider === "groq"
        ? ["groq", "openai", "anthropic"]
        : ["anthropic", "groq", "openai"];

  for (const provider of providerOrder) {
    try {
      if (provider === "openai" && hasOpenAIKey()) {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.responses.create({
          model: LLM_MODEL,
          input: [
            { role: "system", content: systemPrompt || "" },
            { role: "user", content: userPrompt || prompt },
          ],
        });

        return response.output_text?.trim() || RAG_NOT_FOUND_MESSAGE;
      }

      if (provider === "groq" && hasGroqKey()) {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const response = await groq.chat.completions.create({
          model: GROQ_MODEL,
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt || "" },
            { role: "user", content: userPrompt || prompt },
          ],
        });

        return response.choices[0]?.message?.content?.trim() || RAG_NOT_FOUND_MESSAGE;
      }

      if (provider === "anthropic" && hasAnthropicKey()) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const response = await anthropic.messages.create({
          model: LLM_MODEL,
          max_tokens: 700,
          system: systemPrompt || "",
          messages: [{ role: "user", content: userPrompt || prompt }],
        });

        return response.content[0]?.type === "text"
          ? response.content[0].text.trim()
          : RAG_NOT_FOUND_MESSAGE;
      }
    } catch (error) {
      console.error(`RAG ${provider} provider failed:`, error);
    }
  }

  return RAG_NOT_FOUND_MESSAGE;
}

function sanitizeLlmAnswer(answer: string): string {
  const cleaned = answer
    .replace(/═══════════ RETRIEVED CONTEXT START ═══════════[\s\S]*?═══════════ RETRIEVED CONTEXT END ═══════════/gi, "")
    .replace(/\[Source\s+\d+\][\s\S]*?(?=(?:\n1\.\s+DIRECT ANSWER|\nQUESTION\b|$))/gi, "")
    .replace(/Please answer the following question:[\s\S]*$/gi, "")
    .replace(/You are ready to assist the student[\s\S]*$/gi, "")
    .replace(/^QUESTION\s*$/gim, "")
    .replace(/^\s*Student Question:\s*/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return RAG_NOT_FOUND_MESSAGE;
  }

  if (cleaned.includes(RAG_NOT_FOUND_MESSAGE)) {
    return RAG_NOT_FOUND_MESSAGE;
  }

  return cleaned;
}

function dedupeRetrievedChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();

  return chunks.filter((chunk) => {
    const normalized = normalizeText(chunk.content);
    if (!normalized) {
      return false;
    }

    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

async function retrieveRelevantChunks(params: {
  question: string;
  courseIds: string[];
  subject?: string;
  chapterName?: string;
}) {
  const queryEmbedding = await createEmbedding(params.question);
  const courseObjectIds = params.courseIds.map((courseId) => new mongoose.Types.ObjectId(courseId));

  const filter: Record<string, unknown> =
    courseObjectIds.length === 1
      ? { courseId: courseObjectIds[0] }
      : { courseId: { $in: courseObjectIds } };

  if (params.subject?.trim()) {
    filter.subject = params.subject.trim();
  }

  if (params.chapterName?.trim()) {
    filter.chapterName = params.chapterName.trim();
  }

  const vectorResults = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(RAG_TOP_K * 12, 60),
        limit: Math.max(RAG_TOP_K * 3, 12),
        filter,
      },
    },
    {
      $project: {
        documentId: 1,
        chunkIndex: 1,
        content: 1,
        subject: 1,
        chapterName: 1,
        pageNumber: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  const keywords = extractQuestionKeywords(params.question);
  const regex =
    keywords.length > 0 ? new RegExp(keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i") : null;

  const lexicalRows = regex
    ? await DocumentChunk.find(
        {
          ...filter,
          $or: [
            { content: regex },
            { "metadata.topic": regex },
            { "metadata.headingTrail": regex },
            { "metadata.semanticType": regex },
          ],
        },
        {
          documentId: 1,
          chunkIndex: 1,
          content: 1,
          subject: 1,
          chapterName: 1,
          pageNumber: 1,
          metadata: 1,
        },
      )
        .limit(Math.max(RAG_TOP_K * 5, 20))
        .lean()
    : [];

  const merged = new Map<string, RetrievedChunkCandidate>();

  vectorResults.forEach((result: any) => {
    const chunk: RetrievedChunkCandidate = {
      _id: String(result._id),
      documentId: String(result.documentId),
      content: String(result.content ?? ""),
      score: Number(result.score ?? 0),
      chunkIndex: Number(result.chunkIndex ?? result.metadata?.chunkIndex ?? 0),
      subject: result.subject,
      chapterName: result.chapterName,
      pageNumber: result.pageNumber,
      metadata: result.metadata ?? {},
    };
    merged.set(chunk._id, chunk);
  });

  lexicalRows.forEach((row: any) => {
    const chunkId = String(row._id);
    const rowChunk: RetrievedChunkCandidate = {
      _id: chunkId,
      documentId: String(row.documentId),
      content: String(row.content ?? ""),
      score: 0,
      chunkIndex: Number(row.chunkIndex ?? row.metadata?.chunkIndex ?? 0),
      subject: row.subject,
      chapterName: row.chapterName,
      pageNumber: row.pageNumber,
      metadata: row.metadata ?? {},
    };

    const support = scoreChunkSupport(params.question, rowChunk);
    const lexicalScore = Math.min(0.99, 0.62 + support.total * 0.08);
    const existing = merged.get(chunkId);

    if (existing) {
      existing.lexicalScore = Math.max(existing.lexicalScore ?? 0, lexicalScore);
      return;
    }

    rowChunk.lexicalScore = lexicalScore;
    merged.set(chunkId, rowChunk);
  });

  const rescored = [...merged.values()]
    .map((chunk) => {
      const support = scoreChunkSupport(params.question, chunk);
      const vectorScore = Number(chunk.score ?? 0);
      const lexicalScore = Number(chunk.lexicalScore ?? 0);
      const combinedScore = Math.max(vectorScore, lexicalScore) + support.total * 0.03;

      return {
        ...chunk,
        score: Number(combinedScore.toFixed(4)),
        supportScore: support.total,
        exactPhraseMatch: support.exactPhraseMatch,
      };
    })
    .filter((chunk) => (chunk.supportScore ?? 0) > 0)
    .sort((a, b) => {
      if ((a.exactPhraseMatch ? 1 : 0) !== (b.exactPhraseMatch ? 1 : 0)) {
        return (b.exactPhraseMatch ? 1 : 0) - (a.exactPhraseMatch ? 1 : 0);
      }
      return b.score - a.score;
    });

  const seedChunks = rescored.slice(0, Math.max(RAG_TOP_K, MIN_CONTEXT_RESULTS));
  const adjacentPairs = seedChunks
    .slice(0, 4)
    .flatMap((chunk) => {
      const chunkIndex = Number(chunk.chunkIndex ?? chunk.metadata.chunkIndex ?? 0);
      if (!Number.isFinite(chunkIndex) || chunkIndex < 0) {
        return [];
      }

      return [
        { documentId: new mongoose.Types.ObjectId(chunk.documentId), chunkIndex: chunkIndex - 1 },
        { documentId: new mongoose.Types.ObjectId(chunk.documentId), chunkIndex: chunkIndex + 1 },
      ].filter((candidate) => candidate.chunkIndex >= 0);
    })
    .filter(
      (pair, index, allPairs) =>
        allPairs.findIndex(
          (candidate) =>
            String(candidate.documentId) === String(pair.documentId) && candidate.chunkIndex === pair.chunkIndex,
        ) === index,
    );

  if (adjacentPairs.length === 0) {
    return seedChunks.slice(0, MAX_CONTEXT_RESULTS);
  }

  const adjacentRows = await DocumentChunk.find(
    { $or: adjacentPairs },
    {
      documentId: 1,
      chunkIndex: 1,
      content: 1,
      subject: 1,
      chapterName: 1,
      pageNumber: 1,
      metadata: 1,
    },
  ).lean();

  adjacentRows.forEach((row: any) => {
    const chunkId = String(row._id);
    if (merged.has(chunkId)) {
      return;
    }

    const candidate: RetrievedChunkCandidate = {
      _id: chunkId,
      documentId: String(row.documentId),
      content: String(row.content ?? ""),
      score: 0,
      chunkIndex: Number(row.chunkIndex ?? row.metadata?.chunkIndex ?? 0),
      subject: row.subject,
      chapterName: row.chapterName,
      pageNumber: row.pageNumber,
      metadata: row.metadata ?? {},
    };

    const support = scoreChunkSupport(params.question, candidate);
    const neighborContextBoost =
      typeof candidate.metadata.semanticType === "string" &&
      /\b(example|formula_or_measure|process|definition)\b/i.test(candidate.metadata.semanticType)
        ? 0.08
        : 0.03;

    merged.set(chunkId, {
      ...candidate,
      lexicalScore: 0.5 + support.total * 0.04 + neighborContextBoost,
      supportScore: support.total,
      exactPhraseMatch: support.exactPhraseMatch,
    });
  });

  return [...merged.values()]
    .map((chunk) => {
      const support = scoreChunkSupport(params.question, chunk);
      const vectorScore = Number(chunk.score ?? 0);
      const lexicalScore = Number(chunk.lexicalScore ?? 0);
      const semanticTypeBoost =
        typeof chunk.metadata.semanticType === "string" &&
        /\b(example|formula_or_measure|process|definition)\b/i.test(chunk.metadata.semanticType)
          ? 0.02
          : 0;
      const combinedScore = Math.max(vectorScore, lexicalScore) + support.total * 0.03 + semanticTypeBoost;

      return {
        ...chunk,
        score: Number(combinedScore.toFixed(4)),
        supportScore: support.total,
        exactPhraseMatch: support.exactPhraseMatch,
      };
    })
    .filter((chunk) => (chunk.supportScore ?? 0) > 0)
    .sort((a, b) => {
      if ((a.exactPhraseMatch ? 1 : 0) !== (b.exactPhraseMatch ? 1 : 0)) {
        return (b.exactPhraseMatch ? 1 : 0) - (a.exactPhraseMatch ? 1 : 0);
      }
      return b.score - a.score;
    })
    .slice(0, MAX_CONTEXT_RESULTS);
}

function buildSources(chunks: RetrievedChunk[]): SourceReference[] {
  const seen = new Set<string>();

  return chunks
    .map((chunk) => ({
      documentId: chunk.metadata.documentId ?? chunk.documentId,
      documentTitle:
        chunk.metadata.documentTitle ?? chunk.metadata.fileName ?? "Uploaded Document",
      fileName: chunk.metadata.fileName ?? "uploaded-file",
      chapterName: chunk.chapterName ?? chunk.metadata.chapterName,
      pageNumber: chunk.pageNumber ?? chunk.metadata.pageNumber ?? chunk.metadata.page,
    }))
    .filter((source) => {
      const key = `${source.documentId}:${source.pageNumber}:${source.chapterName ?? ""}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

async function logChat(params: {
  userId?: string;
  question: string;
  answer: string;
  answered: boolean;
  subject?: string;
  courseId?: string;
  chapterName?: string;
  sources: SourceReference[];
  confidenceScore: number;
  unansweredReason?: string;
}) {
  if (!params.userId) {
    return;
  }

  await RagChatLog.create({
    userId: params.userId,
    question: params.question,
    answer: params.answer,
    answered: params.answered,
    subject: params.subject,
    courseId: params.courseId,
    chapterName: params.chapterName,
    sourcesUsed: params.sources,
    confidenceScore: params.confidenceScore,
  });

  if (!params.answered) {
    await RagUnansweredQuestion.create({
      userId: params.userId,
      question: params.question,
      reason: params.unansweredReason ?? "not_found",
      subject: params.subject,
      courseId: params.courseId,
      chapterName: params.chapterName,
    });
  }
}

export async function answerSyllabusQuestion(params: {
  userId?: string;
  question: string;
  courseIds: string[];
  subject?: string;
  chapterName?: string;
}) : Promise<RagAnswerResult> {
  const question = normalizeQuestion(params.question);
  if (!question || params.courseIds.length === 0) {
    return {
      answered: false,
      answer: RAG_NOT_FOUND_MESSAGE,
      sources: [],
      confidenceScore: 0,
    };
  }

  const retrievedChunks = dedupeRetrievedChunks(await retrieveRelevantChunks({
    question,
    courseIds: params.courseIds,
    subject: params.subject,
    chapterName: params.chapterName,
  }));

  const confidenceScore = Number((retrievedChunks[0]?.score ?? 0).toFixed(4));
  const sources = buildSources(retrievedChunks);

  if (retrievedChunks.length === 0) {
    await logChat({
      userId: params.userId,
      question,
      answer: RAG_NOT_FOUND_MESSAGE,
      answered: false,
      subject: params.subject,
      courseId: params.courseIds[0],
      chapterName: params.chapterName,
      sources,
      confidenceScore,
      unansweredReason: "no_chunks_found",
    });

    return {
      answered: false,
      answer: RAG_NOT_FOUND_MESSAGE,
      sources: [],
      confidenceScore,
    };
  }

  if (
    confidenceScore < RAG_SIMILARITY_THRESHOLD ||
    !hasKeywordSupport(question, retrievedChunks) ||
    !passesRelevanceGate(question, retrievedChunks)
  ) {
    await logChat({
      userId: params.userId,
      question,
      answer: RAG_NOT_FOUND_MESSAGE,
      answered: false,
      subject: params.subject,
      courseId: params.courseIds[0],
      chapterName: params.chapterName,
      sources,
      confidenceScore,
      unansweredReason:
        confidenceScore < RAG_SIMILARITY_THRESHOLD
          ? "low_similarity"
          : !hasKeywordSupport(question, retrievedChunks)
            ? "insufficient_keyword_support"
            : "relevance_gate_failed",
    });

    return {
      answered: false,
      answer: RAG_NOT_FOUND_MESSAGE,
      sources: [],
      confidenceScore,
    };
  }

  const answer = await runLlm(
    `${buildSystemPrompt(question)}\n\n<<<USER_PROMPT>>>\n\n${buildUserPrompt(question, retrievedChunks)}`,
  );
  const normalizedAnswer =
    !answer || answer.includes("I don't know")
      ? RAG_NOT_FOUND_MESSAGE
      : sanitizeLlmAnswer(answer);
  const answered = normalizedAnswer !== RAG_NOT_FOUND_MESSAGE;

  await logChat({
    userId: params.userId,
    question,
    answer: normalizedAnswer,
    answered,
    subject: params.subject,
    courseId: params.courseIds[0],
    chapterName: params.chapterName,
    sources: answered ? sources : [],
    confidenceScore,
    unansweredReason: answered ? undefined : "llm_not_grounded",
  });

  return {
    answered,
    answer: normalizedAnswer,
    sources: answered ? sources : [],
    confidenceScore,
  };
}
