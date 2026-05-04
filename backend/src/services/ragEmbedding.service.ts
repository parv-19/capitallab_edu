import OpenAI from "openai";

import {
  EMBEDDING_MODEL,
  EMBEDDING_PROVIDER,
  getExpectedEmbeddingDimension,
} from "../config/rag";

let pipeline: any;

function normalizeDimension(embedding: number[]): number[] {
  const expectedDimension = getExpectedEmbeddingDimension();

  if (embedding.length === expectedDimension) {
    return embedding;
  }

  if (embedding.length > expectedDimension) {
    return embedding.slice(0, expectedDimension);
  }

  const padded = new Array(expectedDimension).fill(0);
  for (let index = 0; index < embedding.length; index += 1) {
    padded[index] = embedding[index];
  }
  return padded;
}

async function getLocalPipeline() {
  if (!pipeline) {
    const transformers = await import("@xenova/transformers");
    pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  return pipeline;
}

export async function createEmbeddings(inputs: string[]): Promise<number[][]> {
  if (
    EMBEDDING_PROVIDER === "openai" &&
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.trim() !== ""
  ) {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: inputs.map((input) => input.slice(0, 8000)),
    });

    return response.data.map((entry) => normalizeDimension(entry.embedding));
  }

  const localPipeline = await getLocalPipeline();
  const embeddings: number[][] = [];

  for (const input of inputs) {
    const output = await localPipeline(input, { pooling: "mean", normalize: true });
    embeddings.push(normalizeDimension(Array.from(output.data) as number[]));
  }

  return embeddings;
}

export async function createEmbedding(input: string): Promise<number[]> {
  const [embedding] = await createEmbeddings([input]);
  return embedding ?? new Array(getExpectedEmbeddingDimension()).fill(0);
}
