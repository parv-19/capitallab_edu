import OpenAI from "openai";

import {
  EMBEDDING_BATCH_SIZE,
  DEBUG_RAG,
  EMBEDDING_PROVIDER,
  EMBEDDING_TIMEOUT_MS,
  LARGE_DOCUMENT_EMBEDDING_PROVIDER,
  LOCAL_EMBEDDING_MODEL,
  LOCAL_EMBEDDING_MAX_INPUTS_BEFORE_FALLBACK,
  OPENAI_EMBEDDING_MODEL,
  getExpectedEmbeddingDimension,
} from "../config/rag";

let pipeline: any;

export interface EmbeddingRunResult {
  embeddings: number[][];
  provider: "local" | "openai";
}

function chunkArray<T>(items: T[], batchSize: number): T[][] {
  const size = Math.max(1, batchSize);
  const batches: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
}

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function getLocalPipeline() {
  if (!pipeline) {
    const transformers = await import("@xenova/transformers");
    pipeline = await transformers.pipeline("feature-extraction", LOCAL_EMBEDDING_MODEL);
  }

  return pipeline;
}

function assertProviderConfiguration() {
  if (
    EMBEDDING_PROVIDER === "openai" &&
    (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "")
  ) {
    throw new Error("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai");
  }
}

function hasOpenAiEmbeddingsAvailable() {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "");
}

function extractLocalBatch(output: any, batchSize: number): number[][] {
  if (typeof output?.tolist === "function") {
    const rows = output.tolist();
    if (Array.isArray(rows) && Array.isArray(rows[0])) {
      return rows.map((row: number[]) => normalizeDimension(Array.from(row)));
    }
  }

  const flat = Array.from(output?.data ?? []) as number[];
  const dims = Array.isArray(output?.dims) ? output.dims : [];
  const rowLength = Number(dims[dims.length - 1] ?? 0);

  if (batchSize === 1) {
    return [normalizeDimension(flat)];
  }

  if (rowLength > 0 && flat.length >= rowLength) {
    const rows: number[][] = [];
    for (let index = 0; index < batchSize; index += 1) {
      const start = index * rowLength;
      const end = start + rowLength;
      const slice = flat.slice(start, end);
      if (slice.length === rowLength) {
        rows.push(normalizeDimension(slice));
      }
    }
    if (rows.length > 0) {
      return rows;
    }
  }

  return [normalizeDimension(flat)];
}

// Max parallel OpenAI embedding requests — keeps rate limits safe while giving 3-4× speed-up
const OPENAI_EMBEDDING_CONCURRENCY = Number(process.env.OPENAI_EMBEDDING_CONCURRENCY ?? 4);

async function createOpenAiEmbeddings(inputs: string[]): Promise<number[][]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: EMBEDDING_TIMEOUT_MS,
  });

  // Use a large batch size (up to 100) to minimise the number of API calls.
  // OpenAI supports up to 2048 inputs per request; 100 is safe and fast.
  const effectiveBatchSize = Math.max(EMBEDDING_BATCH_SIZE, 100);
  const batches = chunkArray(inputs, effectiveBatchSize);

  console.log(`[RAG][embedding] Provider: openai | ${inputs.length} inputs → ${batches.length} batch(es) × max ${OPENAI_EMBEDDING_CONCURRENCY} concurrent`);

  // Process batches in parallel windows of OPENAI_EMBEDDING_CONCURRENCY
  const results: number[][] = new Array(inputs.length);
  let batchStart = 0;

  for (let windowStart = 0; windowStart < batches.length; windowStart += OPENAI_EMBEDDING_CONCURRENCY) {
    const window = batches.slice(windowStart, windowStart + OPENAI_EMBEDDING_CONCURRENCY);

    const windowResults = await Promise.all(
      window.map(async (batch, windowIndex) => {
        const batchIndex = windowStart + windowIndex;
        console.log(`[RAG][embedding] Dispatching batch ${batchIndex + 1}/${batches.length} (${batch.length} inputs)`);
        const response = await withTimeout(
          openai.embeddings.create({
            model: OPENAI_EMBEDDING_MODEL,
            input: batch.map((input) => input.slice(0, 8000)),
          }),
          EMBEDDING_TIMEOUT_MS,
          `Embedding batch ${batchIndex + 1}`,
        );
        return response.data.map((entry) => normalizeDimension(entry.embedding));
      }),
    );

    // Write results in original order
    for (const batchEmbeddings of windowResults) {
      for (const embedding of batchEmbeddings) {
        results[batchStart++] = embedding;
      }
    }
  }

  return results;
}

async function createLocalEmbeddings(inputs: string[]): Promise<number[][]> {
  const localPipeline = await getLocalPipeline();
  const batches = chunkArray(inputs, EMBEDDING_BATCH_SIZE);
  const embeddings: number[][] = [];

  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`[RAG][embedding] Provider: local`);
    console.log(`[RAG][embedding] Batch ${batchIndex + 1}/${batches.length}`);

    const output = await withTimeout(
      localPipeline(batch.length === 1 ? batch[0] : batch, {
        pooling: "mean",
        normalize: true,
      }),
      EMBEDDING_TIMEOUT_MS,
      "Embedding generation",
    );

    embeddings.push(...extractLocalBatch(output, batch.length));
  }

  return embeddings;
}

export async function createEmbeddings(inputs: string[]): Promise<EmbeddingRunResult> {
  assertProviderConfiguration();

  if (inputs.length === 0) {
    return {
      embeddings: [],
      provider: EMBEDDING_PROVIDER === "openai" ? "openai" : "local",
    };
  }

  if (DEBUG_RAG) {
    console.log(
      `[RAG][embedding] Starting ${inputs.length} embedding input(s) with provider=${EMBEDDING_PROVIDER}`,
    );
  }

  const shouldUseLargeDocumentFallback =
    EMBEDDING_PROVIDER === "local" &&
    LARGE_DOCUMENT_EMBEDDING_PROVIDER === "openai" &&
    hasOpenAiEmbeddingsAvailable() &&
    inputs.length >= LOCAL_EMBEDDING_MAX_INPUTS_BEFORE_FALLBACK;

  const providerToUse: "local" | "openai" =
    EMBEDDING_PROVIDER === "openai" || shouldUseLargeDocumentFallback ? "openai" : "local";

  if (shouldUseLargeDocumentFallback) {
    console.log(
      `[RAG][embedding] Switching large document to OpenAI embeddings because inputCount=${inputs.length} exceeds LOCAL_EMBEDDING_MAX_INPUTS_BEFORE_FALLBACK=${LOCAL_EMBEDDING_MAX_INPUTS_BEFORE_FALLBACK}`,
    );
  }

  const embeddings =
    providerToUse === "openai"
      ? await createOpenAiEmbeddings(inputs)
      : await createLocalEmbeddings(inputs);

  console.log(`[RAG][embedding] Generated ${embeddings.length} embedding(s)`);
  return {
    embeddings,
    provider: providerToUse,
  };
}

export async function createEmbedding(input: string): Promise<number[]> {
  const { embeddings } = await createEmbeddings([input]);
  const [embedding] = embeddings;
  return embedding ?? new Array(getExpectedEmbeddingDimension()).fill(0);
}
