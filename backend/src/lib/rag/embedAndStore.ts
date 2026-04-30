import OpenAI from "openai";
import { DocumentChunk } from "../../models/DocumentChunk.model";

// Dynamically import transformers if OpenAI isn't used
let pipeline: any;

export const embedAndStore = async ({
  chunks,
  documentId,
  courseId,
  filename,
}: {
  chunks: string[];
  documentId: string;
  courseId: string;
  filename: string;
}) => {
  let chunksStored = 0;
  
  let openai: OpenAI | null = null;
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== "") {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } else {
    console.log("No OPENAI_API_KEY found. Falling back to local Xenova/transformers for embeddings.");
    if (!pipeline) {
      const transformers = await import("@xenova/transformers");
      pipeline = await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
  }

  for (let index = 0; index < chunks.length; index += 100) {
    const batch = chunks.slice(index, index + 100);
    
    let embeddings: number[][] = [];
    
    if (openai) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });
      embeddings = embeddingResponse.data.map((d: any) => d.embedding);
    } else {
      for (const text of batch) {
        const output = await pipeline(text, { pooling: "mean", normalize: true });
        let embeddingArray = Array.from(output.data) as number[];
        // Zero-pad to 1536 dimensions so it matches the existing MongoDB Atlas Vector Search index requirements
        if (embeddingArray.length < 1536) {
            const padded = new Array(1536).fill(0);
            for(let j=0; j<embeddingArray.length; j++) padded[j] = embeddingArray[j];
            embeddingArray = padded;
        }
        embeddings.push(embeddingArray);
      }
    }

    const docs = batch.map((text, batchIndex) => ({
      documentId,
      courseId,
      filename,
      chunkIndex: index + batchIndex,
      text,
      embedding: embeddings[batchIndex] ?? [],
    }));

    await DocumentChunk.insertMany(docs);
    chunksStored += docs.length;
  }

  return { chunksStored };
};
