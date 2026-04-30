import mongoose from "mongoose";
import OpenAI from "openai";
import { DocumentChunk } from "../../models/DocumentChunk.model";

// Dynamically import transformers if OpenAI isn't used
let pipeline: any;

export const retrieveContext = async ({
  query,
  courseIds,
  topK = 5,
}: {
  query: string;
  courseIds: string[];
  topK?: number;
}) => {
  if (!courseIds.length) {
    return "No course context selected.";
  }

  let queryEmbedding: number[] = [];
  let openai: OpenAI | null = null;
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    if (!pipeline) {
      const transformers = await import("@xenova/transformers");
      pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
  }

  if (openai) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    queryEmbedding = response.data[0]?.embedding ?? [];
  } else {
    const output = await pipeline(query, { pooling: "mean", normalize: true });
    let embeddingArray = Array.from(output.data) as number[];
    if (embeddingArray.length < 1536) {
        const padded = new Array(1536).fill(0);
        for(let j=0; j<embeddingArray.length; j++) padded[j] = embeddingArray[j];
        embeddingArray = padded;
    }
    queryEmbedding = embeddingArray;
  }

  const objectIds = courseIds.map((courseId) => new mongoose.Types.ObjectId(courseId));

  const chunks = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: "document_chunks_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: topK,
        filter: {
          courseId: { $in: objectIds },
        },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        filename: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return chunks
    .map((chunk) => `[${chunk.filename}] ${chunk.text}`)
    .join("\n---\n");
};
