import OpenAI from "openai";
import { DocumentChunk } from "../../models/DocumentChunk.model";

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
  if (!courseIds.length) return "No course context selected.";

  let queryEmbedding: number[] = [];

  if (process.env.OPENAI_API_KEY?.trim()) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({ model: "text-embedding-3-small", input: query });
    queryEmbedding = response.data[0]?.embedding ?? [];
  } else {
    if (!pipeline) {
      const transformers = await import("@xenova/transformers");
      pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    const output = await pipeline(query, { pooling: "mean", normalize: true });
    let embeddingArray = Array.from(output.data) as number[];
    if (embeddingArray.length < 1536) {
      const padded = new Array(1536).fill(0);
      for (let j = 0; j < embeddingArray.length; j++) padded[j] = embeddingArray[j];
      embeddingArray = padded;
    }
    queryEmbedding = embeddingArray;
  }

  const chunks = await DocumentChunk.vectorSearch({ queryEmbedding, courseIds, limit: topK });

  return chunks.map((chunk) => `[${chunk.filename}] ${chunk.text}`).join("\n---\n");
};
