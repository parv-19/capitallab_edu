import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import OpenAI from "openai";

import { buildUserMessage, CFA_RAG_SYSTEM_PROMPT } from "../config/masterPrompt";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { ChunkSection } from "./schweserChunker";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let pipeline: any;

const DEFAULT_TOP_K = 6;
const DEFAULT_THRESHOLD = 0.8;
const SEARCH_CANDIDATES = 24;
const FULL_SCAN_LIMIT = 1200;
const SECTION_SCORE_WEIGHTS: Record<string, number> = {
  key_concepts: 1.2, content: 1.05, example: 0.8, los_statement: 0.7,
  formula: 0.45, quiz_question: 0.35, answer_key: 0.35,
};
const NOISY_CONTENT_PATTERNS = [
  /learning\s+outcome\s+statements/i, /answer\s+key\s+for\s+module\s+quizzes/i,
  /^book\s+\d+:/i, /\bcontents\b/i, /\bindex\b/i, /\btopic\s+quiz\b/i,
];
const GENERIC_TOPIC_TERMS = new Set(["investment","investments","portfolio","portfolios","definition","meaning"]);

export interface SearchResult {
  _id: string;
  content: string;
  metadata: {
    courseId: string;
    filename: string;
    page: number;
    reading: string;
    module: string;
    los: string;
    topic: string;
    section: ChunkSection;
    chunkIndex: number;
    parentChunkId?: string;
  };
  embedding?: number[];
  matchEmbedding?: number[];
  matchContent?: string;
  score: number;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isNoisyChunk(content: string): boolean {
  return NOISY_CONTENT_PATTERNS.some((p) => p.test(content));
}

function extractSearchTerms(query: string): string[] {
  const terms = query.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 2).filter(
    (t) => !["what","which","when","where","define","explain","simple","language","about","course","material","please","cfa","means","context","according","material","uploaded","documents","document","notes","simple","simply","briefly","shortly","difference","between","does","do","why","how","book","author","this","that","the","and"].includes(t),
  );
  const specificTerms = terms.filter((t) => !GENERIC_TOPIC_TERMS.has(t));
  return specificTerms.length > 0 ? specificTerms : terms;
}

function exactTopicPhrase(query: string): string {
  return normalizeText(query.replace(/^(what is|what are|define|explain|describe)\s+/i, "").replace(/^(how does|how do|why does|why do|difference between)\s+/i, "").replace(/\b(in cfa|for cfa|context)\b/gi, ""));
}

function matchesExactTopicPhrase(query: string, candidate: SearchResult): boolean {
  const phrase = exactTopicPhrase(query);
  if (!phrase || phrase.length < 4) return false;
  const haystack = normalizeText(`${candidate.metadata.topic ?? ""} ${candidate.metadata.los ?? ""} ${candidate.content}`);
  return haystack.includes(phrase);
}

function topicConsistencyScore(query: string, candidate: SearchResult): number {
  const keywords = extractSearchTerms(query);
  if (keywords.length === 0) return 0;
  const topicText = normalizeText(`${candidate.metadata.topic ?? ""} ${candidate.metadata.los ?? ""} ${candidate.content}`);
  const normalizedQuery = normalizeText(query);
  const strippedQuery = normalizeText(query.replace(/^(what is|what are|define|explain|describe)\s+/i, ""));
  let score = keywords.filter((kw) => topicText.includes(kw)).length;
  if (strippedQuery && topicText.includes(strippedQuery)) score += 3;
  if (normalizedQuery && topicText.includes(normalizedQuery)) score += 2;
  return score;
}

export async function rewriteQuery(userQuery: string): Promise<string[]> {
  try {
    const rewriteSystemPrompt = `Rewrite the student's question into exactly 3 search queries for retrieval.\nRules:\n- Keep the meaning unchanged.\n- Use important domain terms from the question when present.\n- Return one broad query, one focused query, and one keyword-style query.\n- Return only a JSON array of 3 strings.`;
    let raw = "[]";
    if (process.env.ANTHROPIC_API_KEY?.trim()) {
      const response = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 200, system: rewriteSystemPrompt, messages: [{ role: "user", content: userQuery }] });
      raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    } else if (process.env.GROQ_API_KEY?.trim()) {
      const response = await groq.chat.completions.create({ model: "llama-3.1-8b-instant", max_tokens: 200, messages: [{ role: "system", content: rewriteSystemPrompt }, { role: "user", content: userQuery }] });
      raw = response.choices[0]?.message?.content ?? "[]";
    } else {
      return [userQuery, userQuery, userQuery];
    }
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed) && parsed.length === 3) {
      const cleaned = parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      return cleaned.length === 3 ? cleaned : [userQuery, userQuery, userQuery];
    }
    return [userQuery, userQuery, userQuery];
  } catch {
    return [userQuery, userQuery, userQuery];
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY?.trim()) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({ model: "text-embedding-3-small", input: text.slice(0, 8000) });
    return response.data[0].embedding;
  }
  if (!pipeline) {
    const transformers = await import("@xenova/transformers");
    pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const output = await pipeline(text, { pooling: "mean", normalize: true });
  let embeddingArray = Array.from(output.data) as number[];
  if (embeddingArray.length < 1536) {
    const padded = new Array(1536).fill(0);
    for (let i = 0; i < embeddingArray.length; i++) padded[i] = embeddingArray[i];
    embeddingArray = padded;
  }
  return embeddingArray;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; normA += a[i] * a[i]; normB += b[i] * b[i]; }
  if (normA === 0 || normB === 0) return 0;
  return (dot / (Math.sqrt(normA) * Math.sqrt(normB)) + 1) / 2;
}

async function searchCandidates(query: string, courseId: string): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  const results = await DocumentChunk.vectorSearch({ queryEmbedding: embedding, courseIds: [courseId], limit: SEARCH_CANDIDATES });
  return results.map((result: any) => ({
    _id: String(result.id ?? result._id),
    content: result.content,
    metadata: result.metadata,
    embedding: undefined,
    matchEmbedding: undefined,
    matchContent: result.content,
    score: 0,
  }));
}

async function keywordSearchCandidates(query: string, courseId: string): Promise<SearchResult[]> {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];
  const normalizedQuery = query.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const phraseCandidates = [normalizedQuery, normalizedQuery.replace(/^(what is|define|explain)\s+/i, "").trim()].filter((p) => p.length >= 4);
  const rows = await DocumentChunk.keywordSearch({ keywords: terms, courseIds: [courseId], limit: SEARCH_CANDIDATES * 5 });
  return rows.map((row: any) => {
    const haystack = `${row.content}\n${row.metadata?.topic ?? ""}\n${row.metadata?.los ?? ""}`.toLowerCase();
    const overlapCount = terms.filter((t) => haystack.includes(t)).length;
    const hasExactPhrase = phraseCandidates.some((p) => haystack.includes(p));
    const keywordScore = Math.min(0.98, 0.72 + (overlapCount / Math.max(terms.length, 1)) * 0.2 + (hasExactPhrase ? 0.12 : 0));
    return { _id: String(row.id ?? row._id), content: row.content, metadata: row.metadata, embedding: undefined, matchEmbedding: undefined, matchContent: row.content, score: keywordScore } satisfies SearchResult;
  }).sort((a, b) => b.score - a.score).slice(0, SEARCH_CANDIDATES);
}

async function fullCourseKeywordScan(query: string, courseId: string): Promise<SearchResult[]> {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];
  const rows = await DocumentChunk.keywordSearch({ keywords: terms, courseIds: [courseId], limit: FULL_SCAN_LIMIT });
  const normalizedPhrase = exactTopicPhrase(query);
  const normalizedQuery = normalizeText(query);
  return rows.map((row: any) => {
    const haystack = normalizeText(`${row.content}\n${row.metadata?.topic ?? ""}\n${row.metadata?.los ?? ""}`);
    const overlapCount = terms.filter((t) => haystack.includes(t)).length;
    const hasExactPhrase = normalizedPhrase.length >= 4 && haystack.includes(normalizedPhrase);
    const hasFullQuery = normalizedQuery.length >= 4 && haystack.includes(normalizedQuery);
    const lexicalScore = overlapCount / Math.max(terms.length, 1) + (hasExactPhrase ? 1.2 : 0) + (hasFullQuery ? 0.5 : 0);
    return { _id: String(row.id ?? row._id), content: row.content, metadata: row.metadata, embedding: undefined, matchEmbedding: undefined, matchContent: row.content, score: Math.min(0.995, 0.68 + lexicalScore * 0.18) };
  }).filter((row) => row.score > 0.68).sort((a, b) => b.score - a.score).slice(0, SEARCH_CANDIDATES * 2);
}

async function expandToParents(results: SearchResult[], courseId: string): Promise<SearchResult[]> {
  const expanded: SearchResult[] = [];
  const seenIds = new Set<string>();
  for (const result of results) {
    if (seenIds.has(result._id)) continue;
    if (result.metadata.parentChunkId && result.metadata.section !== "los_statement" && result.metadata.section !== "key_concepts" && result.metadata.section !== "formula" && !isNoisyChunk(result.content)) {
      const parent = await DocumentChunk.findOne({ _id: result.metadata.parentChunkId, courseId });
      if (parent && !seenIds.has(parent._id)) {
        expanded.push({ _id: parent._id, content: parent.content, metadata: parent.metadata as any, embedding: undefined, matchEmbedding: result.matchEmbedding ?? result.embedding, matchContent: result.matchContent ?? result.content, score: result.score });
        seenIds.add(parent._id);
        continue;
      }
    }
    seenIds.add(result._id);
    expanded.push(result);
  }
  return expanded;
}

function deduplicate(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result._id}:${result.metadata.page}:${result.metadata.section}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function retrieve(userQuery: string, courseId: string, topK: number = DEFAULT_TOP_K, threshold: number = DEFAULT_THRESHOLD): Promise<SearchResult[]> {
  const rewrittenQueries = await rewriteQuery(userQuery);
  const queryEmbeddings = await Promise.all(rewrittenQueries.map((q) => getEmbedding(q)));
  const candidateSets = await Promise.all(rewrittenQueries.map((q) => searchCandidates(q, courseId)));
  const keywordCandidateSets = await Promise.all([...new Set([userQuery, ...rewrittenQueries])].map((q) => keywordSearchCandidates(q, courseId)));
  const broadKeywordSets = await Promise.all([...new Set([userQuery, ...rewrittenQueries])].map((q) => fullCourseKeywordScan(q, courseId)));
  const expandedCandidates = await Promise.all(candidateSets.map((set) => expandToParents(set, courseId)));

  const rescored = deduplicate([...expandedCandidates.flat(), ...keywordCandidateSets.flat(), ...broadKeywordSets.flat()]).map((candidate) => {
    const cosineScore = queryEmbeddings.reduce((maxScore, embedding) => Math.max(maxScore, cosineSimilarity(embedding, candidate.matchEmbedding ?? candidate.embedding ?? [])), 0);
    const combinedScore = Math.max(candidate.score ?? 0, cosineScore);
    const sectionWeight = SECTION_SCORE_WEIGHTS[candidate.metadata.section] ?? 1;
    const topicScore = topicConsistencyScore(userQuery, candidate);
    return { ...candidate, topicScore, score: combinedScore * sectionWeight };
  }).filter((c) => !isNoisyChunk(c.content)).filter((c) => c.score >= threshold).filter((c) => c.topicScore > 0).sort((a, b) => b.score - a.score);

  const bestTopicScore = rescored[0]?.topicScore ?? 0;
  const exactTopicMatches = rescored.filter((c) => matchesExactTopicPhrase(userQuery, c));
  if (exactTopicMatches.length > 0) {
    return exactTopicMatches.sort((a, b) => b.score - a.score).slice(0, topK).map(({ embedding, matchEmbedding, matchContent, topicScore, ...result }) => result);
  }
  const topicConsistent = rescored.filter((c) => c.topicScore === bestTopicScore).sort((a, b) => b.score - a.score);
  return topicConsistent.slice(0, topK).map(({ embedding, matchEmbedding, matchContent, topicScore, ...result }) => result);
}

export async function handleCFAChatQuery(userQuery: string, courseId: string, conversationHistory: { role: "user" | "assistant"; content: string }[] = []): Promise<string> {
  const chunks = await retrieve(userQuery, courseId, DEFAULT_TOP_K, DEFAULT_THRESHOLD);
  if (chunks.length === 0) return "This is not covered in your course material.";
  const userMessage = buildUserMessage(chunks, userQuery);
  const recentHistory = conversationHistory.slice(-6);
  const response = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 700, system: CFA_RAG_SYSTEM_PROMPT, messages: [...recentHistory, { role: "user", content: userMessage }] });
  return response.content[0]?.type === "text" ? response.content[0].text : "Unable to generate response.";
}
