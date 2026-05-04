import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import mongoose from "mongoose";
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
  key_concepts: 1.2,
  content: 1.05,
  example: 0.8,
  los_statement: 0.7,
  formula: 0.45,
  quiz_question: 0.35,
  answer_key: 0.35,
};
const NOISY_CONTENT_PATTERNS = [
  /learning\s+outcome\s+statements/i,
  /answer\s+key\s+for\s+module\s+quizzes/i,
  /^book\s+\d+:/i,
  /\bcontents\b/i,
  /\bindex\b/i,
  /\btopic\s+quiz\b/i,
];
const GENERIC_TOPIC_TERMS = new Set([
  "investment",
  "investments",
  "portfolio",
  "portfolios",
  "definition",
  "meaning",
]);

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
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoisyChunk(content: string): boolean {
  return NOISY_CONTENT_PATTERNS.some((pattern) => pattern.test(content));
}

function extractSearchTerms(query: string): string[] {
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2)
    .filter(
      (term) =>
        ![
          "what",
          "which",
          "when",
          "where",
          "define",
          "explain",
          "simple",
          "language",
          "about",
          "course",
          "material",
          "please",
          "cfa",
          "means",
          "context",
          "according",
          "material",
          "uploaded",
          "documents",
          "document",
          "notes",
          "simple",
          "simply",
          "briefly",
          "shortly",
          "difference",
          "between",
          "does",
          "do",
          "why",
          "how",
          "book",
          "author",
          "this",
          "that",
          "the",
          "and",
        ].includes(term),
    );

  const specificTerms = terms.filter((term) => !GENERIC_TOPIC_TERMS.has(term));
  return specificTerms.length > 0 ? specificTerms : terms;
}

function exactTopicPhrase(query: string): string {
  return normalizeText(
    query
      .replace(/^(what is|what are|define|explain|describe)\s+/i, "")
      .replace(/^(how does|how do|why does|why do|difference between)\s+/i, "")
      .replace(/\b(in cfa|for cfa|context)\b/gi, ""),
  );
}

function matchesExactTopicPhrase(query: string, candidate: SearchResult): boolean {
  const phrase = exactTopicPhrase(query);
  if (!phrase || phrase.length < 4) return false;

  const haystack = normalizeText(
    `${candidate.metadata.topic ?? ""} ${candidate.metadata.los ?? ""} ${candidate.content}`,
  );
  return haystack.includes(phrase);
}

function topicConsistencyScore(query: string, candidate: SearchResult): number {
  const keywords = extractSearchTerms(query);
  if (keywords.length === 0) return 0;

  const topicText = normalizeText(
    `${candidate.metadata.topic ?? ""} ${candidate.metadata.los ?? ""} ${candidate.content}`,
  );
  const normalizedQuery = normalizeText(query);
  const strippedQuery = normalizeText(
    query.replace(/^(what is|what are|define|explain|describe)\s+/i, ""),
  );

  let score = keywords.filter((keyword) => topicText.includes(keyword)).length;
  if (strippedQuery && topicText.includes(strippedQuery)) score += 3;
  if (normalizedQuery && topicText.includes(normalizedQuery)) score += 2;

  return score;
}

export async function rewriteQuery(userQuery: string): Promise<string[]> {
  try {
    const rewriteSystemPrompt = `Rewrite the student's question into exactly 3 search queries for retrieval.
Rules:
- Keep the meaning unchanged.
- Use important domain terms from the question when present.
- Return one broad query, one focused query, and one keyword-style query.
- Return only a JSON array of 3 strings.`;

    let raw = "[]";

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "") {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: rewriteSystemPrompt,
        messages: [{ role: "user", content: userQuery }],
      });
      raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    } else if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 200,
        messages: [
          { role: "system", content: rewriteSystemPrompt },
          { role: "user", content: userQuery },
        ],
      });
      raw = response.choices[0]?.message?.content ?? "[]";
    } else {
      return [userQuery, userQuery, userQuery];
    }

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed) && parsed.length === 3) {
      const cleaned = parsed.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      );
      return cleaned.length === 3 ? cleaned : [userQuery, userQuery, userQuery];
    }

    return [userQuery, userQuery, userQuery];
  } catch {
    return [userQuery, userQuery, userQuery];
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
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
    for (let index = 0; index < embeddingArray.length; index += 1) {
      padded[index] = embeddingArray[index];
    }
    embeddingArray = padded;
  }
  return embeddingArray;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) return 0;
  const rawCosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));

  // Normalize cosine from [-1, 1] to [0, 1] so a 0.75 threshold is usable in practice.
  return (rawCosine + 1) / 2;
}

async function searchCandidates(query: string, courseId: string): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: "document_chunks_vector_index",
        path: "embedding",
        queryVector: embedding,
        numCandidates: Math.max(SEARCH_CANDIDATES * 4, 50),
        limit: SEARCH_CANDIDATES,
        filter: {
          courseId: courseObjectId,
        },
      },
    },
    {
      $project: {
        content: 1,
        metadata: 1,
        embedding: 1,
      },
    },
  ]);

  return results.map((result: any) => ({
    _id: String(result._id),
    content: result.content,
    metadata: result.metadata,
    embedding: Array.isArray(result.embedding) ? result.embedding : [],
    matchEmbedding: Array.isArray(result.embedding) ? result.embedding : [],
    matchContent: result.content,
    score: 0,
  }));
}

async function keywordSearchCandidates(query: string, courseId: string): Promise<SearchResult[]> {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const regex = new RegExp(terms.join("|"), "i");
  const normalizedQuery = query.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const phraseCandidates = [
    normalizedQuery,
    normalizedQuery.replace(/^(what is|define|explain)\s+/i, "").trim(),
  ].filter((phrase) => phrase.length >= 4);
  const rows = await DocumentChunk.find(
    {
      courseId: courseObjectId,
      $or: [{ content: regex }, { "metadata.topic": regex }, { "metadata.los": regex }],
    },
    {
      content: 1,
      metadata: 1,
      embedding: 1,
    },
  )
    .limit(SEARCH_CANDIDATES * 5)
    .lean();

  return rows
    .map((row: any) => {
      const haystack = `${row.content}\n${row.metadata?.topic ?? ""}\n${row.metadata?.los ?? ""}`.toLowerCase();
      const overlapCount = terms.filter((term) => haystack.includes(term)).length;
      const hasExactPhrase = phraseCandidates.some((phrase) => haystack.includes(phrase));
      const keywordScore = Math.min(
        0.98,
        0.72 + overlapCount / Math.max(terms.length, 1) * 0.2 + (hasExactPhrase ? 0.12 : 0),
      );

      return {
        _id: String(row._id),
        content: row.content,
        metadata: row.metadata,
        embedding: Array.isArray(row.embedding) ? row.embedding : [],
        matchEmbedding: Array.isArray(row.embedding) ? row.embedding : [],
        matchContent: row.content,
        score: keywordScore,
      } satisfies SearchResult;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_CANDIDATES);
}

async function fullCourseKeywordScan(query: string, courseId: string): Promise<SearchResult[]> {
  const terms = extractSearchTerms(query);
  if (terms.length === 0) return [];

  const courseObjectId = new mongoose.Types.ObjectId(courseId);
  const rows = await DocumentChunk.find(
    { courseId: courseObjectId },
    {
      content: 1,
      metadata: 1,
      embedding: 1,
    },
  )
    .limit(FULL_SCAN_LIMIT)
    .lean();

  const normalizedPhrase = exactTopicPhrase(query);
  const normalizedQuery = normalizeText(query);

  return rows
    .map((row: any) => {
      const haystack = normalizeText(`${row.content}\n${row.metadata?.topic ?? ""}\n${row.metadata?.los ?? ""}`);
      const overlapCount = terms.filter((term) => haystack.includes(term)).length;
      const hasExactPhrase = normalizedPhrase.length >= 4 && haystack.includes(normalizedPhrase);
      const hasFullQuery = normalizedQuery.length >= 4 && haystack.includes(normalizedQuery);

      const lexicalScore =
        overlapCount / Math.max(terms.length, 1) +
        (hasExactPhrase ? 1.2 : 0) +
        (hasFullQuery ? 0.5 : 0);

      return {
        _id: String(row._id),
        content: row.content,
        metadata: row.metadata,
        embedding: Array.isArray(row.embedding) ? row.embedding : [],
        matchEmbedding: Array.isArray(row.embedding) ? row.embedding : [],
        matchContent: row.content,
        score: Math.min(0.995, 0.68 + lexicalScore * 0.18),
        lexicalScore,
      };
    })
    .filter((row) => row.lexicalScore > 0)
    .sort((a, b) => b.lexicalScore - a.lexicalScore || b.score - a.score)
    .slice(0, SEARCH_CANDIDATES * 2)
    .map(({ lexicalScore, ...result }) => result satisfies SearchResult);
}

async function expandToParents(results: SearchResult[], courseId: string): Promise<SearchResult[]> {
  const expanded: SearchResult[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (seenIds.has(result._id)) continue;

    if (
      result.metadata.parentChunkId &&
      result.metadata.section !== "los_statement" &&
      result.metadata.section !== "key_concepts" &&
      result.metadata.section !== "formula" &&
      !isNoisyChunk(result.content)
    ) {
      const parent = (await DocumentChunk.findOne({
        _id: new mongoose.Types.ObjectId(result.metadata.parentChunkId),
        courseId: new mongoose.Types.ObjectId(courseId),
      }).lean()) as
        | {
            _id: mongoose.Types.ObjectId;
            content: string;
            metadata: SearchResult["metadata"];
            embedding?: number[];
          }
        | null;

      if (parent && !seenIds.has(String(parent._id))) {
        expanded.push({
          _id: String(parent._id),
          content: parent.content,
          metadata: parent.metadata,
          embedding: Array.isArray(parent.embedding) ? parent.embedding : [],
          matchEmbedding: result.matchEmbedding ?? result.embedding ?? [],
          matchContent: result.matchContent ?? result.content,
          score: result.score,
        });
        seenIds.add(String(parent._id));
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

export async function retrieve(
  userQuery: string,
  courseId: string,
  topK: number = DEFAULT_TOP_K,
  threshold: number = DEFAULT_THRESHOLD,
): Promise<SearchResult[]> {
  const rewrittenQueries = await rewriteQuery(userQuery);
  const queryEmbeddings = await Promise.all(rewrittenQueries.map((query) => getEmbedding(query)));
  const candidateSets = await Promise.all(rewrittenQueries.map((query) => searchCandidates(query, courseId)));
  const keywordCandidateSets = await Promise.all(
    [...new Set([userQuery, ...rewrittenQueries])].map((query) => keywordSearchCandidates(query, courseId)),
  );
  const broadKeywordSets = await Promise.all(
    [...new Set([userQuery, ...rewrittenQueries])].map((query) => fullCourseKeywordScan(query, courseId)),
  );
  const expandedCandidates = await Promise.all(candidateSets.map((set) => expandToParents(set, courseId)));

  const rescored = deduplicate([...expandedCandidates.flat(), ...keywordCandidateSets.flat(), ...broadKeywordSets.flat()])
    .map((candidate) => {
      const cosineScore = queryEmbeddings.reduce((maxScore, embedding) => {
        const nextScore = cosineSimilarity(
          embedding,
          candidate.matchEmbedding ?? candidate.embedding ?? [],
        );
        return Math.max(maxScore, nextScore);
      }, 0);

      const combinedScore = Math.max(candidate.score ?? 0, cosineScore);
      const sectionWeight = SECTION_SCORE_WEIGHTS[candidate.metadata.section] ?? 1;
      const topicScore = topicConsistencyScore(userQuery, candidate);

      return {
        ...candidate,
        topicScore,
        score: combinedScore * sectionWeight,
      };
    })
    .filter((candidate) => !isNoisyChunk(candidate.content))
    .filter((candidate) => candidate.score >= threshold)
    .filter((candidate) => candidate.topicScore > 0)
    .sort((a, b) => b.score - a.score);

  const bestTopicScore = rescored[0]?.topicScore ?? 0;
  const exactTopicMatches = rescored.filter((candidate) =>
    matchesExactTopicPhrase(userQuery, candidate),
  );
  if (exactTopicMatches.length > 0) {
    return exactTopicMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ embedding, matchEmbedding, matchContent, topicScore, ...result }) => result);
  }

  const topicConsistent = rescored
    .filter((candidate) => candidate.topicScore === bestTopicScore)
    .sort((a, b) => b.score - a.score);

  return topicConsistent
    .slice(0, topK)
    .map(({ embedding, matchEmbedding, matchContent, topicScore, ...result }) => result);
}

export async function handleCFAChatQuery(
  userQuery: string,
  courseId: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const chunks = await retrieve(userQuery, courseId, DEFAULT_TOP_K, DEFAULT_THRESHOLD);

  if (chunks.length === 0) {
    return "This is not covered in your course material.";
  }

  const userMessage = buildUserMessage(chunks, userQuery);
  const recentHistory = conversationHistory.slice(-6);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 700,
    system: CFA_RAG_SYSTEM_PROMPT,
    messages: [...recentHistory, { role: "user", content: userMessage }],
  });

  return response.content[0]?.type === "text"
    ? response.content[0].text
    : "Unable to generate response.";
}
