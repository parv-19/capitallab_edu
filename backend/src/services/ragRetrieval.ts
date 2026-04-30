// ============================================================
//  CAPITAL LAB EDUCATION — RAG RETRIEVAL PIPELINE
//  backend/src/services/ragRetrieval.ts
//
//  Full pipeline:
//  1. Query rewriting (3 search queries from 1 student question)
//  2. Hybrid search (vector + keyword via MongoDB Atlas)
//  3. Parent chunk expansion
//  4. Re-ranking by section weight + vector score
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import Groq from "groq-sdk";
import mongoose from "mongoose";
import OpenAI from "openai";

import { buildUserMessage, CFA_RAG_SYSTEM_PROMPT } from "../config/masterPrompt";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { ChunkSection, weightedScore } from "./schweserChunker";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
let pipeline: any;

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
  score: number;
}

export async function rewriteQuery(userQuery: string): Promise<string[]> {
  try {
    const rewriteSystemPrompt = `You are a CFA Level I exam expert. Convert the student's question into exactly 3
search queries optimized for finding answers in Kaplan SchweserNotes.
Rules:
- Use precise CFA terminology (e.g., "hurdle rate hard soft", "Standard III(A) loyalty")
- Vary each query: one broad, one specific, one formula/definition-focused
- Return ONLY a valid JSON array of 3 strings, nothing else
 - No explanation, no markdown`;

    let raw = "[]";

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "") {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: rewriteSystemPrompt,
        messages: [{ role: "user", content: userQuery }],
      });
      raw = response.content[0]?.type === "text" ? response.content[0].text : "[]";
    } else if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 300,
        messages: [
          { role: "system", content: rewriteSystemPrompt },
          { role: "user", content: userQuery },
        ],
      });
      raw = response.choices[0]?.message?.content ?? "[]";
    } else {
      return [userQuery];
    }

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
    return [userQuery];
  } catch {
    console.warn("Query rewrite failed, using original:", userQuery);
    return [userQuery];
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

export async function hybridSearch(
  query: string,
  courseId: string,
  topK: number = 8,
): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query);
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  try {
    const results = await DocumentChunk.aggregate([
      {
        $search: {
          index: "document_chunks_vector_index",
          compound: {
            should: [
              {
                knnBeta: {
                  vector: embedding,
                  path: "embedding",
                  k: topK * 2,
                  filter: {
                    equals: { path: "courseId", value: courseObjectId },
                  },
                },
              },
              {
                text: {
                  query,
                  path: "content",
                  fuzzy: { maxEdits: 1 },
                  score: { boost: { value: 1.2 } },
                },
              },
            ],
            minimumShouldMatch: 1,
            filter: [
              {
                equals: { path: "courseId", value: courseObjectId },
              },
            ],
          },
        },
      },
      { $limit: topK * 2 },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: "searchScore" },
        },
      },
    ]);

    return results.map((result: any) => ({
      _id: String(result._id),
      content: result.content,
      metadata: result.metadata,
      score: result.score,
    }));
  } catch (error) {
    console.warn("Hybrid $search failed, falling back to $vectorSearch:", error);

    const results = await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: "document_chunks_vector_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: Math.max(topK * 10, 50),
          limit: topK * 2,
          filter: {
            courseId: courseObjectId,
          },
        },
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    return results.map((result: any) => ({
      _id: String(result._id),
      content: result.content,
      metadata: result.metadata,
      score: result.score,
    }));
  }
}

async function expandToParents(results: SearchResult[], courseId: string): Promise<SearchResult[]> {
  const expanded: SearchResult[] = [];
  const seenIds = new Set<string>();

  for (const result of results) {
    if (seenIds.has(result._id)) continue;

    if (result.metadata.parentChunkId) {
      const parent = (await DocumentChunk.findOne({
        _id: new mongoose.Types.ObjectId(result.metadata.parentChunkId),
        courseId: new mongoose.Types.ObjectId(courseId),
      }).lean()) as any;

      if (parent && !seenIds.has(String(parent._id))) {
        expanded.push({
          _id: String(parent._id),
          content: parent.content,
          metadata: parent.metadata,
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
    const key = result._id || result.content.slice(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rerank(results: SearchResult[]): SearchResult[] {
  return results
    .map((result) => ({
      ...result,
      score: weightedScore(result.score, result.metadata.section),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function retrieve(
  userQuery: string,
  courseId: string,
  topK: number = 5,
): Promise<SearchResult[]> {
  const queries = await rewriteQuery(userQuery);
  console.log("Rewritten queries:", queries);

  const searchPromises = queries.map((query) => hybridSearch(query, courseId, topK));
  const allResults = (await Promise.all(searchPromises)).flat();
  const deduped = deduplicate(allResults);
  const expanded = await expandToParents(deduped, courseId);
  const reranked = rerank(expanded);

  return reranked.slice(0, topK);
}

export async function handleCFAChatQuery(
  userQuery: string,
  courseId: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
): Promise<string> {
  const chunks = await retrieve(userQuery, courseId, 5);

  if (chunks.length === 0) {
    return "❌ No relevant content found in your uploaded course material. Try rephrasing, or check that documents are processed in your dashboard.";
  }

  const userMessage = buildUserMessage(chunks, userQuery);
  const recentHistory = conversationHistory.slice(-6);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: CFA_RAG_SYSTEM_PROMPT,
    messages: [...recentHistory, { role: "user", content: userMessage }],
  });

  return response.content[0]?.type === "text"
    ? response.content[0].text
    : "Unable to generate response.";
}
