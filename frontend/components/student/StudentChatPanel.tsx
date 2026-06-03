"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Loader2,
  MessageSquarePlus,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import api from "@/lib/axios";

interface RagSource {
  documentTitle: string;
  fileName: string;
  chapterName?: string;
  sectionTitle?: string;
  pageNumber?: number;
  chunkId?: string;
  chunkIndex?: number;
}

interface ConversationSummary {
  _id: string;
  title: string;
  courseIds: string[];
  subject?: string;
  chapterName?: string;
  lastMessageAt?: string;
  messageCount?: number;
  lastMessagePreview?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MessageFeedback {
  _id: string;
  rating: "like" | "dislike";
  reason?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ConversationMessage {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  answered?: boolean;
  confidenceScore?: number;
  sources?: RagSource[];
  suggestedQuestions?: string[];
  feedback?: MessageFeedback | null;
  metadata?: Record<string, any>;
  isStreaming?: boolean;
}

interface StudentChatPanelProps {
  courseId: string;
  courseName: string;
  subject?: string;
  chapterName?: string;
  suggestedQuestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "What is risk governance?",
  "Define investment risk",
  "What is the role of a code of ethics in a profession?",
  "Explain risk tolerance in simple language",
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function buildAuthHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const accessToken = window.localStorage.getItem("capitalLabAccessToken");
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return headers;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100">
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200 opacity-80 transition hover:opacity-100"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </button>
      <pre className="overflow-x-auto px-4 py-4 text-xs leading-6">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RichText({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-7
      prose-headings:font-semibold prose-headings:text-slate-900
      prose-strong:text-slate-900 prose-strong:font-semibold
      prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:rounded prose-code:px-1 prose-code:text-xs
      prose-ul:pl-5 prose-ol:pl-5
      prose-li:text-slate-700 prose-li:leading-7
      prose-table:text-sm prose-table:border-collapse
      prose-th:border prose-th:border-slate-300 prose-th:bg-slate-100 prose-th:px-3 prose-th:py-1.5
      prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-1.5
      prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-4 prose-blockquote:text-slate-600
      [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2
      [&_.katex]:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }: any) {
            const isBlock = className?.startsWith("language-") || String(children).includes("\n");
            if (isBlock) {
              return <CodeBlock code={String(children).replace(/\n$/, "")} />;
            }
            return (
              <code className="rounded bg-blue-50 px-1 py-0.5 text-xs text-blue-700 font-mono" {...props}>
                {children}
              </code>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full text-sm border-collapse border border-slate-200 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function formatTimeLabel(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeLoadedMessage(message: any): ConversationMessage {
  return {
    _id: message._id,
    role: message.role,
    content: message.content,
    answered: Boolean(message.metadata?.answered),
    confidenceScore:
      typeof message.metadata?.confidenceScore === "number"
        ? message.metadata.confidenceScore
        : undefined,
    sources: Array.isArray(message.sources) ? message.sources : [],
    suggestedQuestions: Array.isArray(message.metadata?.suggestedQuestions)
      ? message.metadata.suggestedQuestions
      : [],
    feedback: message.feedback ?? null,
    metadata: message.metadata ?? {},
  };
}

function collapseRegeneratedMessages(messages: ConversationMessage[]): ConversationMessage[] {
  const supersededIds = new Set(
    messages
      .map((message) => String(message.metadata?.regeneratedFromMessageId ?? ""))
      .filter(Boolean),
  );

  return messages.filter((message) => !(message._id && supersededIds.has(String(message._id))));
}

export default function StudentChatPanel({
  courseId,
  courseName,
  subject,
  chapterName,
  suggestedQuestions = DEFAULT_SUGGESTIONS,
}: StudentChatPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [composerRows, setComposerRows] = useState(1);
  const [busyFeedbackIds, setBusyFeedbackIds] = useState<Set<string>>(new Set());
  const [busyRegenerateId, setBusyRegenerateId] = useState<string | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const starterChips = useMemo(
    () => (suggestedQuestions.length >= 4 ? suggestedQuestions.slice(0, 4) : DEFAULT_SUGGESTIONS),
    [suggestedQuestions],
  );

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    const nextHeight = Math.min(textareaRef.current.scrollHeight, 160);
    textareaRef.current.style.height = `${nextHeight}px`;
    setComposerRows(nextHeight > 88 ? 4 : nextHeight > 56 ? 3 : nextHeight > 40 ? 2 : 1);
  }, [input]);

  const loadConversations = async (preserveSelection = true) => {
    try {
      const response = await api.get("/conversations");
      const nextConversations = response.data?.conversations ?? [];
      setConversations(nextConversations);
      if (
        !preserveSelection ||
        (activeConversationId &&
          !nextConversations.some((conversation: ConversationSummary) => conversation._id === activeConversationId))
      ) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch {
      toast.error("Failed to load saved chats.");
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    void loadConversations(false);
  }, []);

  const openConversation = async (conversationId: string) => {
    if (loadingConversationId || isStreaming) {
      return;
    }

    setLoadingConversationId(conversationId);
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      const loadedMessages = collapseRegeneratedMessages(
        (response.data?.messages ?? []).map(normalizeLoadedMessage),
      );
      setMessages(loadedMessages);
      setActiveConversationId(conversationId);
    } catch {
      toast.error("Could not open this chat.");
    } finally {
      setLoadingConversationId(null);
    }
  };

  const startNewChat = () => {
    if (isStreaming) {
      return;
    }

    setActiveConversationId(null);
    setMessages([]);
    setInput("");
  };

  const deleteCurrentConversation = async (conversationId: string) => {
    setBusyDeleteId(conversationId);
    try {
      await api.delete(`/conversations/${conversationId}`);
      setConversations((current) =>
        current.filter((conversation) => conversation._id !== conversationId),
      );
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast.success("Chat deleted.");
    } catch {
      toast.error("Could not delete this chat.");
    } finally {
      setBusyDeleteId(null);
    }
  };

  const upsertConversationSummary = (conversationId: string, titleSeed: string, lastAnswer: string) => {
    setConversations((current) => {
      const existing = current.find((conversation) => conversation._id === conversationId);
      const nextSummary: ConversationSummary = {
        _id: conversationId,
        title: existing?.title || titleSeed.trim().slice(0, 70) || "New chat",
        courseIds: existing?.courseIds ?? (courseId ? [courseId] : []),
        subject: existing?.subject ?? subject,
        chapterName: existing?.chapterName ?? chapterName,
        lastMessageAt: new Date().toISOString(),
        messageCount: (existing?.messageCount ?? 0) + 2,
        lastMessagePreview: lastAnswer.slice(0, 120),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const next = [nextSummary, ...current.filter((conversation) => conversation._id !== conversationId)];
      return next;
    });
  };

  const sendMessage = async (seedQuestion?: string) => {
    const question = (seedQuestion ?? input).trim();
    if (!question || isStreaming) {
      return;
    }

    const previousMessages = [...messages];
    const nextUserMessage: ConversationMessage = {
      role: "user",
      content: question,
    };
    const pendingAssistantMessage: ConversationMessage = {
      role: "assistant",
      content: "",
      sources: [],
      suggestedQuestions: [],
      isStreaming: true,
    };

    setInput("");
    setIsStreaming(true);
    setMessages((current) => [...current, nextUserMessage, pendingAssistantMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          question,
          conversationId: activeConversationId || undefined,
          courseId: courseId || undefined,
          subject: subject || undefined,
          chapterName: chapterName || undefined,
          conversationHistory: previousMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        const fallback = await response.json().catch(() => null);
        throw new Error(fallback?.message || "Failed to get an answer.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let streamedAnswer = "";
      let resolvedConversationId = activeConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventText of events) {
          const line = eventText
            .split("\n")
            .find((entry) => entry.startsWith("data: "));

          if (!line) {
            continue;
          }

          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            continue;
          }

          const parsed = JSON.parse(payload) as
            | { type: "delta"; delta: string }
            | {
                type: "done";
                answered: boolean;
                confidenceScore: number;
                sources: RagSource[];
                suggestedQuestions: string[];
                conversationId: string;
                messageId: string;
              }
            | { type: "error"; message: string };

          if (parsed.type === "delta") {
            streamedAnswer += parsed.delta;
            setMessages((current) => {
              const next = [...current];
              const lastIndex = next.length - 1;
              if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
                next[lastIndex] = {
                  ...next[lastIndex],
                  content: `${next[lastIndex].content}${parsed.delta}`,
                };
              }
              return next;
            });
            continue;
          }

          if (parsed.type === "done") {
            resolvedConversationId = parsed.conversationId;
            setActiveConversationId(parsed.conversationId);
            setMessages((current) => {
              const next = [...current];
              const lastIndex = next.length - 1;
              if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
                next[lastIndex] = {
                  ...next[lastIndex],
                  _id: parsed.messageId,
                  answered: parsed.answered,
                  confidenceScore: parsed.confidenceScore,
                  sources: parsed.sources,
                  suggestedQuestions: parsed.suggestedQuestions,
                  isStreaming: false,
                  metadata: {
                    answered: parsed.answered,
                    confidenceScore: parsed.confidenceScore,
                    suggestedQuestions: parsed.suggestedQuestions,
                  },
                };
              }
              return next;
            });
            upsertConversationSummary(parsed.conversationId, question, streamedAnswer);
            continue;
          }

          if (parsed.type === "error") {
            throw new Error(parsed.message);
          }
        }
      }

      if (resolvedConversationId) {
        void loadConversations(true);
      }
    } catch (error: any) {
      const message = error?.message || "Failed to get an answer.";
      setMessages((current) => {
        const next = [...current];
        const lastIndex = next.length - 1;
        if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
          next[lastIndex] = {
            role: "assistant",
            content: message,
            answered: false,
            sources: [],
            suggestedQuestions: [],
            isStreaming: false,
          };
        }
        return next;
      });
      toast.error(message);
    } finally {
      setIsStreaming(false);
    }
  };

  const copyAnswer = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Answer copied");
    } catch {
      toast.error("Could not copy answer");
    }
  };

  const submitFeedback = async (
    messageId: string,
    rating: "like" | "dislike",
    currentFeedback?: MessageFeedback | null,
  ) => {
    if (busyFeedbackIds.has(messageId)) {
      return;
    }

    setBusyFeedbackIds((current) => new Set(current).add(messageId));
    try {
      const response = await api.post(`/messages/${messageId}/feedback`, {
        rating,
        category: rating === "dislike" ? "not_grounded" : "other",
      });
      const feedback = response.data?.feedback ?? null;
      setMessages((current) =>
        current.map((message) =>
          message._id === messageId
            ? {
                ...message,
                feedback,
              }
            : message,
        ),
      );
      toast.success(
        currentFeedback?.rating === rating
          ? "Feedback updated"
          : rating === "like"
            ? "Marked helpful"
            : "Feedback saved",
      );
    } catch {
      toast.error("Could not save feedback");
    } finally {
      setBusyFeedbackIds((current) => {
        const next = new Set(current);
        next.delete(messageId);
        return next;
      });
    }
  };

  const regenerateAnswer = async (messageId: string) => {
    if (busyRegenerateId || isStreaming) {
      return;
    }

    setBusyRegenerateId(messageId);
    try {
      await api.post(`/messages/${messageId}/regenerate`);
      if (activeConversationId) {
        await openConversation(activeConversationId);
      }
      await loadConversations(true);
      toast.success("Answer regenerated");
    } catch {
      toast.error("Could not regenerate answer");
    } finally {
      setBusyRegenerateId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:rounded-[32px]">
      <div className="grid min-h-[620px] lg:min-h-[720px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_#f8fafc_0%,_#f3f6fb_100%)] lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200/80 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-slate-900 text-white shadow-[0_14px_30px_rgba(16,35,79,0.22)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Conversation Hub</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Saved Chats</div>
                <div className="truncate text-xs text-slate-500">{courseName || "All enrolled courses"}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={isStreaming}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-navy to-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </button>
          </div>

          <div className="max-h-[260px] overflow-y-auto px-3 py-3 lg:max-h-[640px]">
            {loadingConversations ? (
              <div className="px-3 py-6 text-sm text-slate-400">Loading saved chats...</div>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400 shadow-sm">
                Your future chats will appear here.
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const isActive = conversation._id === activeConversationId;
                  return (
                    <div
                      key={conversation._id}
                      className={`group rounded-2xl border px-3 py-3 transition ${
                        isActive
                          ? "border-slate-300 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void openConversation(conversation._id)}
                        className="w-full text-left"
                      >
                        <div className="truncate text-sm font-medium text-slate-800">
                          {conversation.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {conversation.lastMessagePreview || "Open to continue this conversation."}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-400">
                          {loadingConversationId === conversation._id
                            ? "Opening..."
                            : formatTimeLabel(conversation.lastMessageAt || conversation.updatedAt)}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCurrentConversation(conversation._id)}
                        disabled={busyDeleteId === conversation._id || isStreaming}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="flex min-h-[720px] flex-col bg-[radial-gradient(circle_at_top,_rgba(30,58,138,0.09),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)]">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                CapitalLab GPT
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                {activeConversation?.title || "Capital Lab AI Tutor"}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
                Grounded only in uploaded material
                <span className="text-slate-300">•</span>
                <span>{courseName || "All enrolled courses"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={startNewChat}
              disabled={isStreaming}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              New thread
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
            {messages.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-brand-navy to-slate-900 text-white shadow-[0_18px_44px_rgba(16,35,79,0.24)]">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">Your AI Study Tutor</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  Ask me anything from your uploaded class material. If the answer is not supported by the uploaded
                  documents, I will say so clearly.
                </p>

                <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
                  {starterChips.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => void sendMessage(starter)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              collapseRegeneratedMessages(messages).map((message, index) => {
                const isAssistant = message.role === "assistant";

                return (
                  <div
                    key={message._id ?? `${message.role}-${index}`}
                    className={`flex ${isAssistant ? "justify-start" : "justify-end"} animate-[fadeInUp_0.25s_ease-out]`}
                  >
                    <div
                      className={`max-w-[94%] rounded-[22px] px-4 py-3 sm:max-w-[82%] sm:rounded-[28px] sm:px-5 sm:py-4 ${
                        isAssistant
                          ? "rounded-tl-md border border-slate-200/90 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
                          : "rounded-tr-md bg-gradient-to-br from-brand-navy to-slate-900 text-white shadow-[0_18px_36px_rgba(16,35,79,0.22)]"
                      }`}
                    >
                      {isAssistant ? (
                        <>
                          {message.content ? (
                            <RichText content={message.content} />
                          ) : message.isStreaming ? (
                            <TypingIndicator />
                          ) : null}

                          <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span
                                className={`rounded-full px-2.5 py-1 font-medium ${
                                  message.answered
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {message.answered ? "Answered from uploaded material" : "Strict fallback"}
                              </span>
                              {typeof message.confidenceScore === "number" ? (
                                <span className="text-slate-500">
                                  Confidence {message.confidenceScore.toFixed(2)}
                                </span>
                              ) : null}
                            </div>

                            {message.sources && message.sources.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {message.sources.slice(0, 4).map((source, sourceIndex) => (
                                  <span
                                    key={`${source.chunkId || source.fileName}-${sourceIndex}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                                    {source.sectionTitle || source.chapterName || source.documentTitle}
                                    {typeof source.pageNumber === "number" ? `, Page ${source.pageNumber}` : ""}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void copyAnswer(message.content)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                Copy
                              </button>
                              {message._id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void submitFeedback(
                                        message._id!,
                                        "like",
                                        message.feedback,
                                      )
                                    }
                                    disabled={busyFeedbackIds.has(message._id)}
                                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                      message.feedback?.rating === "like"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    } disabled:opacity-50`}
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    Helpful
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void submitFeedback(
                                        message._id!,
                                        "dislike",
                                        message.feedback,
                                      )
                                    }
                                    disabled={busyFeedbackIds.has(message._id)}
                                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                      message.feedback?.rating === "dislike"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                    } disabled:opacity-50`}
                                  >
                                    <ThumbsDown className="h-3.5 w-3.5" />
                                    Not grounded
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void regenerateAnswer(message._id!)}
                                    disabled={busyRegenerateId === message._id || isStreaming}
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    {busyRegenerateId === message._id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    )}
                                    Regenerate
                                  </button>
                                </>
                              ) : null}
                            </div>

                            {message.suggestedQuestions && message.suggestedQuestions.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                                  Try Next
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {message.suggestedQuestions.map((suggestion) => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => void sendMessage(suggestion)}
                                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-7">{message.content}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-200/80 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
            {messages.length === 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {starterChips.map((starter) => (
                  <button
                    key={`chip-${starter}`}
                    type="button"
                    onClick={() => void sendMessage(starter)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_12px_26px_rgba(15,23,42,0.05)]">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  rows={composerRows}
                  placeholder="Ask a question from your uploaded class material..."
                  className="max-h-40 min-h-[28px] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-slate-900 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-11 sm:w-11"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
