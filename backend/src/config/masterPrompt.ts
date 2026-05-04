import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";

import {
  GROQ_MODEL,
  LLM_MODEL,
  LLM_PROVIDER,
  RAG_NOT_FOUND_MESSAGE,
  STRICT_RAG_SYSTEM_PROMPT,
} from "./rag";

export const NOT_FOUND_MESSAGE = RAG_NOT_FOUND_MESSAGE;
export const FULL_NOTES_REFUSAL_MESSAGE =
  "I can help with specific syllabus questions, but I can't provide full notes or large excerpts from uploaded documents.";
export const UNRELATED_REFUSAL_MESSAGE = RAG_NOT_FOUND_MESSAGE;
export const MASTER_RAG_SYSTEM_PROMPT = STRICT_RAG_SYSTEM_PROMPT;
export const CFA_RAG_SYSTEM_PROMPT = STRICT_RAG_SYSTEM_PROMPT;

export interface RetrievedChunk {
  content: string;
  score?: number;
  metadata: {
    courseId: string;
    filename: string;
    page?: number;
    pageNumber?: number;
    reading?: string;
    module?: string;
    los?: string;
    topic?: string;
    section?:
      | "los_statement"
      | "content"
      | "key_concepts"
      | "quiz_question"
      | "answer_key"
      | "formula"
      | "example";
    chunkIndex?: number;
    parentChunkId?: string;
    chapterName?: string;
    documentTitle?: string;
    documentId?: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function sanitizeContextText(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeForDedup(content: string): string {
  return content.replace(/\s+/g, " ").trim().toLowerCase();
}

function sectionDisplayName(section?: RetrievedChunk["metadata"]["section"]): string {
  const sectionMap: Record<NonNullable<RetrievedChunk["metadata"]["section"]>, string> = {
    los_statement: "LOS Statement",
    content: "Core Content",
    key_concepts: "Key Concepts",
    quiz_question: "Quiz Question",
    answer_key: "Answer Key",
    formula: "Formula",
    example: "Worked Example",
  };

  return section ? sectionMap[section] : "Core Content";
}

function inferQuestionIntent(userQuery: string): string {
  const query = userQuery.trim().toLowerCase();

  if (/\b(compare|difference|different|vs|versus)\b/.test(query)) {
    return "comparison";
  }

  if (/\b(calculate|compute|solve|formula|equation|ratio)\b/.test(query)) {
    return "calculation";
  }

  if (/\b(why|how)\b/.test(query)) {
    return "reasoning";
  }

  if (/\b(quiz|practice|mcq|test me)\b/.test(query)) {
    return "practice";
  }

  if (/\b(define|definition|what is|explain)\b/.test(query)) {
    return "definition";
  }

  return "general";
}

function buildQuestionGuidance(userQuery: string): string {
  const intent = inferQuestionIntent(userQuery);
  const guidance: Record<string, string> = {
    comparison:
      "Question intent: comparison. Contrast the items in parallel, then state the key difference using only supported context.",
    calculation:
      "Question intent: calculation. Prefer formulas, variable definitions, and worked steps only when those appear in the retrieved context.",
    reasoning:
      "Question intent: reasoning. Explain the relationship step by step, but do not infer beyond what the retrieved context explicitly supports.",
    practice:
      "Question intent: practice. Build a 3-option question only from the retrieved context and wait for the student's answer.",
    definition:
      "Question intent: definition/explanation. Start with the clearest direct definition from the retrieved context, then simplify it.",
    general:
      "Question intent: general. Synthesize the strongest overlapping points from the retrieved context into a clear student-friendly answer.",
  };

  return guidance[intent];
}

export function buildUserMessage(chunks: RetrievedChunk[], userQuery: string): string {
  const uniqueChunks = chunks
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .filter((chunk, index, allChunks) => {
      const normalized = normalizeForDedup(chunk.content);
      return (
        normalized.length > 0 &&
        allChunks.findIndex((candidate) => normalizeForDedup(candidate.content) === normalized) === index
      );
    });

  const cleanChunks = uniqueChunks
    .map((chunk, index) => {
      const pageNumber = chunk.metadata.pageNumber ?? chunk.metadata.page ?? 1;
      const title = chunk.metadata.documentTitle ?? chunk.metadata.filename;
      const reading = chunk.metadata.reading?.trim() || "Unknown Reading";
      const module = chunk.metadata.module?.trim() || "Unknown Module";
      const los = chunk.metadata.los?.trim();
      const topic = chunk.metadata.topic?.trim();
      const section = sectionDisplayName(chunk.metadata.section);
      const headerParts = [
        `[SOURCE ${index + 1}]`,
        `Reading: ${reading}`,
        `Module: ${module}`,
        `Page: ${pageNumber}`,
        `File: ${title}`,
        `Section: ${section}`,
      ];

      if (los) {
        headerParts.push(`LOS: ${los}`);
      }

      if (topic) {
        headerParts.push(`Topic: ${topic}`);
      }

      return `${headerParts.join(" | ")}\n${sanitizeContextText(chunk.content)}`;
    })
    .filter((chunk) => chunk.length > 0);

  const contextBlock = cleanChunks.length > 0 ? cleanChunks.join("\n\n") : "[no relevant context found]";
  const questionGuidance = buildQuestionGuidance(userQuery);

  return STRICT_RAG_SYSTEM_PROMPT
    .replace("{retrieved_context}", contextBlock)
    .replace("{question}", userQuery.trim())
    .replace(
      "{answering_guidance}",
      `QUESTION-SPECIFIC GUIDANCE:\n${questionGuidance}\nUse the most relevant sources first. If sources overlap, combine them into one clear answer without repeating the same point.`,
    );
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === "") {
    return RAG_NOT_FOUND_MESSAGE;
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: LLM_MODEL,
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0]?.type === "text"
    ? response.content[0].text.trim()
    : RAG_NOT_FOUND_MESSAGE;
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
    return RAG_NOT_FOUND_MESSAGE;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: LLM_MODEL,
    input: prompt,
  });

  return response.output_text?.trim() || RAG_NOT_FOUND_MESSAGE;
}

async function callGroq(prompt: string): Promise<string> {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "") {
    return RAG_NOT_FOUND_MESSAGE;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0]?.message?.content?.trim() || RAG_NOT_FOUND_MESSAGE;
}

export async function runCFAChat(
  userQuery: string,
  retrievedChunks: RetrievedChunk[],
  _conversationHistory: ChatMessage[] = [],
): Promise<string> {
  const prompt = buildUserMessage(retrievedChunks, userQuery);

  if (LLM_PROVIDER === "openai") {
    const openAiResult = await callOpenAI(prompt);
    if (
      openAiResult !== RAG_NOT_FOUND_MESSAGE ||
      (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY)
    ) {
      return openAiResult;
    }

    const groqResult = await callGroq(prompt);
    if (groqResult !== RAG_NOT_FOUND_MESSAGE || !process.env.ANTHROPIC_API_KEY) {
      return groqResult;
    }

    return callAnthropic(prompt);
  }

  if (LLM_PROVIDER === "groq") {
    const groqResult = await callGroq(prompt);
    if (
      groqResult !== RAG_NOT_FOUND_MESSAGE ||
      (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY)
    ) {
      return groqResult;
    }

    const openAiResult = await callOpenAI(prompt);
    if (openAiResult !== RAG_NOT_FOUND_MESSAGE || !process.env.ANTHROPIC_API_KEY) {
      return openAiResult;
    }

    return callAnthropic(prompt);
  }

  const anthropicResult = await callAnthropic(prompt);
  if (
    anthropicResult !== RAG_NOT_FOUND_MESSAGE ||
    (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY)
  ) {
    return anthropicResult;
  }

  const groqResult = await callGroq(prompt);
  if (groqResult !== RAG_NOT_FOUND_MESSAGE || !process.env.OPENAI_API_KEY) {
    return groqResult;
  }

  return callOpenAI(prompt);
}
