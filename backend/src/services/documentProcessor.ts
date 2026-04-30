import fs from "fs";

import pdfParse from "pdf-parse";

import { chunkGenericPDF } from "./genericChunker";
import { chunkSchweserPDF, type DocumentChunk } from "./schweserChunker";

async function extractFirstPageText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const [firstPage = ""] = data.text.split("\f");
  return firstPage;
}

export async function processUploadedPDF(
  filePath: string,
  courseId: string,
): Promise<DocumentChunk[]> {
  const text = await extractFirstPageText(filePath);

  const isSchweser =
    /SCHWESERNOTES/i.test(text) ||
    /Kaplan Schweser/i.test(text) ||
    /LOS \d+\.[a-z]:/i.test(text);

  if (isSchweser) {
    console.log("Detected Schweser format - using smart chunker");
    return chunkSchweserPDF(filePath, courseId);
  }

  console.log("Unknown format - using generic chunker");
  return chunkGenericPDF(filePath, courseId);
}
