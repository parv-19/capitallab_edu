// ============================================================
//  CAPITAL LAB EDUCATION — SCHWESER PDF CHUNKER
//  backend/src/services/schweserChunker.ts
//
//  This chunker understands the exact structure of Kaplan
//  SchweserNotes PDFs — it splits by LOS, Module, Key Concepts,
//  and Quiz sections rather than by fixed token count.
// ============================================================

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import pdfParse from "pdf-parse";

export interface ChunkMetadata {
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
}

export type ChunkSection =
  | "los_statement"
  | "content"
  | "key_concepts"
  | "quiz_question"
  | "answer_key"
  | "formula"
  | "example";

export interface DocumentChunk {
  _id?: mongoose.Types.ObjectId;
  content: string;
  metadata: ChunkMetadata;
}

const PATTERNS = {
  READING_HEADER: /^READING\s+(\d+)\s*$/m,
  MODULE_HEADER: /MODULE\s+(\d+\.\d+):\s+(.+)/i,
  LOS_HEADER: /LOS\s+(\d+\.[a-z]):\s+(.+)/i,
  KEY_CONCEPTS: /^KEY CONCEPTS\s*$/m,
  KEY_CONCEPTS_LOS: /^LOS\s+(\d+\.[a-z])\s*$/m,
  MODULE_QUIZ: /MODULE QUIZ\s+(\d+\.\d+)/i,
  ANSWER_KEY: /^ANSWER KEY FOR MODULE QUIZZES\s*$/m,
  FORMULA_LINE: /[A-Z]\s*=\s*.+|[A-Za-z]+\s*[×÷]\s*|[Ss]harpe|[Tt]reynor|CAPM|WACC|FCFF|FCFE|beta|NPV|IRR/,
};

export async function chunkSchweserPDF(
  filePath: string,
  courseId: string,
): Promise<DocumentChunk[]> {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  const pages = pdfData.text.split("\f");
  const filename = path.basename(filePath) || "document.pdf";

  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;
  let currentReading = "unknown";
  let currentModule = "unknown";
  let currentLOS = "unknown";
  let currentTopic = "unknown";
  let currentSection: ChunkSection = "content";
  let buffer: string[] = [];
  let currentPage = 1;

  function flushBuffer(pageNumber: number, overrideSection?: ChunkSection) {
    const text = buffer.join("\n").trim();
    if (text.length < 80) {
      buffer = [];
      return;
    }

    const section = overrideSection ?? currentSection;
    const isFormula = PATTERNS.FORMULA_LINE.test(text);

    chunks.push({
      content: text,
      metadata: {
        courseId,
        filename,
        page: pageNumber,
        reading: currentReading,
        module: currentModule,
        los: currentLOS,
        topic: currentTopic,
        section: isFormula && section === "content" ? "formula" : section,
        chunkIndex: chunkIndex++,
      },
    });

    buffer = [];
  }

  for (const pageText of pages) {
    const lines = pageText.split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const readingMatch = line.match(PATTERNS.READING_HEADER);
      if (readingMatch) {
        flushBuffer(currentPage);
        currentReading = readingMatch[1];
        currentModule = `${currentReading}.1`;
        currentSection = "content";
        continue;
      }

      const moduleMatch = line.match(PATTERNS.MODULE_HEADER);
      if (moduleMatch) {
        flushBuffer(currentPage);
        currentModule = moduleMatch[1];
        currentTopic = moduleMatch[2].trim();
        currentSection = "content";
        continue;
      }

      const losMatch = line.match(PATTERNS.LOS_HEADER);
      if (losMatch) {
        flushBuffer(currentPage);
        currentLOS = losMatch[1];
        currentSection = "los_statement";
        chunks.push({
          content: line,
          metadata: {
            courseId,
            filename,
            page: currentPage,
            reading: currentReading,
            module: currentModule,
            los: currentLOS,
            topic: currentTopic,
            section: "los_statement",
            chunkIndex: chunkIndex++,
          },
        });
        currentSection = "content";
        continue;
      }

      if (PATTERNS.KEY_CONCEPTS.test(line)) {
        flushBuffer(currentPage);
        currentSection = "key_concepts";
        continue;
      }

      const keyConceptLosMatch = line.match(PATTERNS.KEY_CONCEPTS_LOS);
      if (currentSection === "key_concepts" && keyConceptLosMatch) {
        flushBuffer(currentPage, "key_concepts");
        currentLOS = keyConceptLosMatch[1];
        continue;
      }

      const quizMatch = line.match(PATTERNS.MODULE_QUIZ);
      if (quizMatch) {
        flushBuffer(currentPage);
        currentModule = quizMatch[1];
        currentSection = "quiz_question";
        continue;
      }

      if (PATTERNS.ANSWER_KEY.test(line)) {
        flushBuffer(currentPage);
        currentSection = "answer_key";
        continue;
      }

      if (/^(For example|Consider a fund|Example:|EXAMPLE)/i.test(line)) {
        flushBuffer(currentPage);
        currentSection = "example";
      }

      const bufferText = buffer.join(" ");

      if (currentSection === "key_concepts" && bufferText.length > 350) {
        flushBuffer(currentPage);
      } else if (currentSection === "content" && bufferText.length > 900) {
        if (line.endsWith(".") || line.endsWith("?")) {
          buffer.push(line);
          flushBuffer(currentPage);
          continue;
        }
      } else if (currentSection === "quiz_question") {
        if (/^\d+\./.test(line) && buffer.length > 0) {
          flushBuffer(currentPage);
        }
      } else if (currentSection === "answer_key") {
        if (/^\d+\.\s+[ABC]/.test(line) && buffer.length > 0) {
          flushBuffer(currentPage);
        }
      }

      buffer.push(line);
    }

    currentPage++;
  }

  flushBuffer(Math.max(currentPage - 1, 1));

  console.log(`Chunked ${filename}: ${chunks.length} chunks from ${pages.length} pages`);
  return chunks;
}

export function createParentChildPairs(chunks: DocumentChunk[]): {
  parents: DocumentChunk[];
  children: DocumentChunk[];
} {
  const parents: DocumentChunk[] = [];
  const children: DocumentChunk[] = [];
  const groups = new Map<string, DocumentChunk[]>();

  for (const chunk of chunks) {
    const key = `${chunk.metadata.reading}-${chunk.metadata.los}-${chunk.metadata.section}`;
    const group = groups.get(key) ?? [];
    group.push(chunk);
    groups.set(key, group);
  }

  for (const [, group] of groups) {
    if (group.length <= 1 || group[0].metadata.section === "los_statement") {
      parents.push(group[0]);
      continue;
    }

    const parentId = new mongoose.Types.ObjectId();
    const parentContent = group.map((c) => c.content).join("\n\n");

    parents.push({
      _id: parentId,
      content: parentContent,
      metadata: {
        ...group[0].metadata,
        chunkIndex: group[0].metadata.chunkIndex,
      },
    });

    for (const child of group) {
      children.push({
        ...child,
        metadata: {
          ...child.metadata,
          parentChunkId: parentId.toString(),
        },
      });
    }
  }

  return { parents, children };
}

export const SECTION_WEIGHTS: Record<ChunkSection, number> = {
  key_concepts: 1.4,
  los_statement: 1.3,
  formula: 1.25,
  content: 1.0,
  example: 0.95,
  quiz_question: 0.85,
  answer_key: 0.8,
};

export function weightedScore(vectorScore: number, section: ChunkSection): number {
  return vectorScore * (SECTION_WEIGHTS[section] ?? 1.0);
}
