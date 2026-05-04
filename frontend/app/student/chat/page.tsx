"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

interface RagOption {
  courseId: string;
  courseName: string;
  subjects: string[];
  chapters: string[];
}

interface RagSource {
  documentTitle: string;
  fileName: string;
  chapterName?: string;
  pageNumber?: number;
}

interface RagResponse {
  answered: boolean;
  answer: string;
  sources: RagSource[];
  confidenceScore: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  answered?: boolean;
  confidenceScore?: number;
  sources?: RagSource[];
}

const fallbackMessage = "I could not find this answer in the uploaded syllabus chapters.";

const starterQuestions = [
  "What is risk governance?",
  "Define investment risk",
  "What is the role of a code of ethics in a profession?",
];

export default function ChatPage() {
  const [options, setOptions] = useState<RagOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await api.get("/rag/options");
        const nextOptions = response.data?.options ?? [];
        setOptions(nextOptions);
        setSelectedCourseId("");
        setSelectedSubject("");
        setSelectedChapter("");
      } catch {
        toast.error("Failed to load available course material.");
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, []);

  const activeCourse = useMemo(
    () => options.find((option) => option.courseId === selectedCourseId) ?? null,
    [options, selectedCourseId],
  );

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedSubject("");
      setSelectedChapter("");
      return;
    }

    if (!activeCourse) {
      setSelectedSubject("");
      setSelectedChapter("");
      return;
    }

    if (activeCourse.subjects.length > 0 && !activeCourse.subjects.includes(selectedSubject)) {
      setSelectedSubject(activeCourse.subjects[0]);
    }

    if (selectedChapter && !activeCourse.chapters.includes(selectedChapter)) {
      setSelectedChapter("");
    }
  }, [activeCourse, selectedChapter, selectedSubject]);

  const sendQuestion = async (input?: string) => {
    const nextQuestion = (input ?? question).trim();
    if (!nextQuestion || submitting) {
      return;
    }

    setQuestion("");
    setSubmitting(true);
    setMessages((current) => [...current, { role: "user", content: nextQuestion }]);

    try {
      const response = await api.post<RagResponse>("/rag/chat", {
        question: nextQuestion,
        courseId: selectedCourseId || undefined,
        subject: selectedSubject || undefined,
        chapterName: selectedChapter || undefined,
      });

      const result = response.data;
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.answer,
          answered: result.answered,
          confidenceScore: result.confidenceScore,
          sources: result.sources,
        },
      ]);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to get an answer.";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: message, answered: false, sources: [] },
      ]);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              Ask From Uploaded Class Material
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Answers come only from admin-uploaded class PDFs and documents. If the uploaded material does not support the answer, the assistant will clearly say so.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedCourseId}
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
                setSelectedChapter("");
              }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              <option value="">
                {loadingOptions ? "Loading courses..." : "All enrolled courses"}
              </option>
              {options.map((option) => (
                <option key={option.courseId} value={option.courseId}>
                  {option.courseName}
                </option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              <option value="">All subjects</option>
              {(activeCourse?.subjects ?? []).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select
              value={selectedChapter}
              onChange={(event) => setSelectedChapter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              <option value="">All chapters</option>
              {(activeCourse?.chapters ?? []).map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white shadow-soft">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <Search className="h-4 w-4 text-indigo-500" />
            Ask From Uploaded Material
          </div>
        </div>

        <div className="min-h-[420px] space-y-4 px-6 py-5">
          {messages.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 text-center">
              <div className="rounded-2xl bg-indigo-50 p-4">
                <BookOpen className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-navy">Start with a class-material question</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Ask from your uploaded class material, or narrow the course, subject, and chapter above before asking.
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                {starterQuestions.map((starter) => (
                  <button
                    key={starter}
                    onClick={() => void sendQuestion(starter)}
                    className="rounded-2xl bg-indigo-50 px-4 py-3 text-left text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-indigo-600 text-white"
                      : "rounded-tl-sm border border-gray-100 bg-gray-50 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.role === "assistant" ? (
                    <div className="mt-4 space-y-3 border-t border-gray-200 pt-3">
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${
                            message.answered
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {message.answered ? "Answered from syllabus" : "Fallback returned"}
                        </span>
                        {typeof message.confidenceScore === "number" ? (
                          <span className="text-gray-500">
                            Confidence: {message.confidenceScore.toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      {message.sources && message.sources.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Sources
                          </div>
                          {message.sources.map((source, sourceIndex) => (
                            <div
                              key={`${source.fileName}-${sourceIndex}`}
                              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600"
                            >
                              <div className="font-semibold text-brand-navy">{source.documentTitle}</div>
                              <div>
                                File: {source.fileName}
                                {source.chapterName ? ` | Chapter: ${source.chapterName}` : ""}
                                {typeof source.pageNumber === "number"
                                  ? ` | Page: ${source.pageNumber}`
                                  : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : message.content === fallbackMessage ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          No supporting syllabus chunks were strong enough for this question.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}

          {submitting ? (
            <div className="flex justify-start">
              <div className="rounded-3xl rounded-tl-sm border border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching uploaded chapters...
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex gap-3">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuestion();
                }
              }}
              rows={3}
              placeholder="Ask a question from your uploaded class material..."
              className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
            <button
              onClick={() => void sendQuestion()}
              disabled={!question.trim() || submitting || loadingOptions}
              className="self-end rounded-2xl bg-indigo-600 p-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
