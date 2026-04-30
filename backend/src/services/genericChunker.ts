import fs from "fs";
import path from "path";

import pdfParse from "pdf-parse";

import type { DocumentChunk } from "./schweserChunker";

export async function chunkGenericPDF(
  filePath: string,
  courseId: string,
): Promise<DocumentChunk[]> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const filename = path.basename(filePath) || "document.pdf";
  const pages = data.text.split("\f");

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (let pageNum = 0; pageNum < pages.length; pageNum += 1) {
    const pageText = pages[pageNum].trim();
    if (!pageText || pageText.length < 100) continue;

    const paragraphs = pageText
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\n/g, " ").trim())
      .filter((paragraph) => paragraph.length > 80);

    let bufferText = "";

    for (const paragraph of paragraphs) {
      bufferText += ` ${paragraph}`;

      if (bufferText.length > 700 && /[.?!]\s*$/.test(bufferText)) {
        chunks.push({
          content: bufferText.trim(),
          metadata: {
            courseId,
            filename,
            page: pageNum + 1,
            reading: "unknown",
            module: "unknown",
            los: "unknown",
            topic: "unknown",
            section: "content",
            chunkIndex: chunkIndex++,
          },
        });
        bufferText = "";
      }
    }

    if (bufferText.trim().length > 80) {
      chunks.push({
        content: bufferText.trim(),
        metadata: {
          courseId,
          filename,
          page: pageNum + 1,
          reading: "unknown",
          module: "unknown",
          los: "unknown",
          topic: "unknown",
          section: "content",
          chunkIndex: chunkIndex++,
        },
      });
    }
  }

  console.log(`Generic chunked ${filename}: ${chunks.length} chunks`);
  return chunks;
}
