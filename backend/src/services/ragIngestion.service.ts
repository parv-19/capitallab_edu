import fs from "fs";

import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import mongoose from "mongoose";

import { Course } from "../models/Course.model";
import { CourseDocument } from "../models/CourseDocument.model";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { createEmbeddings } from "./ragEmbedding.service";

interface ParsedPage {
  pageNumber: number;
  text: string;
}

interface PreparedChunk {
  pageNumber: number;
  content: string;
  semanticType: string;
  headingTrail: string[];
  topic: string;
  hasFormula: boolean;
  hasTable: boolean;
  formulaLines: string[];
}

function cleanText(text: string): string {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeInlineWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\s+\n/g, "\n").trim();
}

function looksLikeFormula(line: string): boolean {
  const normalized = line.trim();
  if (!normalized) return false;

  return (
    /[A-Za-z][A-Za-z0-9()/_-]*\s*=\s*.+/.test(normalized) ||
    /\b(NPV|IRR|WACC|CAPM|FCFF|FCFE|Sharpe|Treynor|Jensen|beta|covariance|correlation|variance)\b/i.test(
      normalized,
    ) ||
    (/[+\-*/=^]/.test(normalized) && /\d/.test(normalized) && /[A-Za-z]/.test(normalized))
  );
}

function looksLikeTableLine(line: string): boolean {
  const normalized = line.trim();
  if (!normalized) return false;

  return (
    /\t/.test(line) ||
    /\s{3,}/.test(line) ||
    /^\|.+\|$/.test(normalized) ||
    /^[-–—]{3,}$/.test(normalized) ||
    /^([A-Za-z][A-Za-z %()./-]*\s+){2,}\d/.test(normalized)
  );
}

function extractFormulaLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => looksLikeFormula(line))
    .filter((line, index, allLines) => allLines.indexOf(line) === index)
    .slice(0, 6);
}

function detectTableLikeBlock(block: string): boolean {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return false;

  return lines.filter((line) => looksLikeTableLine(line)).length >= 2;
}

function splitIntoBlocks(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n"),
    )
    .map((block) => normalizeInlineWhitespace(block))
    .filter(Boolean);
}

function inferSemanticType(block: string, headingTrail: string[]): string {
  const text = `${headingTrail.join(" ")} ${block}`.toLowerCase();
  const formulaLines = extractFormulaLines(block);
  const hasTable = detectTableLikeBlock(block);

  if (/\b(example|illustration|case study)\b/.test(text)) {
    return formulaLines.length > 0 ? "worked_example" : "example";
  }

  if (hasTable) {
    return "table";
  }

  if (
    formulaLines.length > 0 ||
    /\b(formula|equation|ratio|covariance|correlation|variance|standard deviation|beta)\b/.test(text)
  ) {
    return "formula_or_measure";
  }

  if (/\b(key points?|summary|takeaways?)\b/.test(text)) {
    return "summary";
  }

  if (/^definition[:\s]|\bis defined as\b|\brefers to\b/i.test(block)) {
    return "definition";
  }

  if (/\b(steps?|process|procedure|how to)\b/.test(text)) {
    return "process";
  }

  return "concept";
}

function looksLikeHeading(block: string): boolean {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length !== 1) return false;

  const line = lines[0];
  if (line.length < 3 || line.length > 90) return false;
  if (/[.?!:]$/.test(line)) return false;

  if (/^(chapter|section|module|reading|lesson|topic)\b/i.test(line)) {
    return true;
  }

  if (/^[A-Z0-9][A-Z0-9\s\-&,/()]+$/.test(line) && /[A-Z]{3,}/.test(line)) {
    return true;
  }

  if (/^([A-Z][a-z0-9&/-]*)(\s+[A-Z][a-z0-9&/-]*){0,7}$/.test(line)) {
    return true;
  }

  return false;
}

function buildTopic(headingTrail: string[], block: string): string {
  const lastHeading = headingTrail[headingTrail.length - 1]?.trim();
  if (lastHeading) {
    return lastHeading;
  }

  const firstSentence = normalizeInlineWhitespace(block).split(/(?<=[.!?])\s+/)[0] ?? "";
  return firstSentence.slice(0, 120).trim() || "General";
}

function buildEmbeddingInput(params: {
  documentTitle: string;
  subject?: string;
  chapterName?: string;
  pageNumber: number;
  topic: string;
  semanticType: string;
  headingTrail: string[];
  content: string;
}) {
  const headingContext = params.headingTrail.length > 0 ? params.headingTrail.join(" > ") : params.topic;

  return [
    `Document: ${params.documentTitle}`,
    params.subject ? `Subject: ${params.subject}` : null,
    params.chapterName ? `Chapter: ${params.chapterName}` : null,
    `Topic: ${params.topic}`,
    `Section Path: ${headingContext}`,
    `Semantic Type: ${params.semanticType}`,
    `Page: ${params.pageNumber}`,
    params.content.split("\n").some((line) => looksLikeFormula(line)) ? "Contains Formula: yes" : null,
    detectTableLikeBlock(params.content) ? "Contains Table: yes" : null,
    "",
    params.content,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
}

function prepareStructuredChunks(pages: ParsedPage[]): PreparedChunk[] {
  const preparedChunks: PreparedChunk[] = [];
  const headingTrail: string[] = [];
  let runningBuffer = "";
  let runningPage = 1;
  let runningTopic = "General";
  let runningSemanticType = "concept";

  function flushBuffer() {
    const content = normalizeInlineWhitespace(runningBuffer);
    if (content.length < 120) {
      runningBuffer = "";
      return;
    }

    preparedChunks.push({
      pageNumber: runningPage,
      content,
      semanticType: runningSemanticType,
      headingTrail: [...headingTrail],
      topic: runningTopic,
      hasFormula: extractFormulaLines(content).length > 0,
      hasTable: detectTableLikeBlock(content),
      formulaLines: extractFormulaLines(content),
    });

    runningBuffer = "";
  }

  for (const page of pages) {
    const blocks = splitIntoBlocks(page.text);

    for (const block of blocks) {
      if (looksLikeHeading(block)) {
        flushBuffer();

        const heading = block.replace(/\n/g, " ").trim();
        const currentDepth = /^(\d+(\.\d+)*)/.test(heading) ? heading.split(".").length : undefined;
        if (currentDepth && currentDepth > 0) {
          headingTrail.splice(Math.max(currentDepth - 1, 0));
        } else if (headingTrail.length >= 4) {
          headingTrail.splice(headingTrail.length - 1, 1);
        }

        headingTrail.push(heading);
        runningTopic = buildTopic(headingTrail, block);
        continue;
      }

      const semanticType = inferSemanticType(block, headingTrail);
      const topic = buildTopic(headingTrail, block);

      if (!runningBuffer) {
        runningPage = page.pageNumber;
        runningTopic = topic;
        runningSemanticType = semanticType;
      }

      const shouldFlush =
        runningBuffer.length > 0 &&
        (runningSemanticType !== semanticType ||
          runningTopic !== topic ||
          normalizeInlineWhitespace(`${runningBuffer}\n\n${block}`).length > 1200);

      if (shouldFlush) {
        flushBuffer();
        runningPage = page.pageNumber;
        runningTopic = topic;
        runningSemanticType = semanticType;
      }

      runningBuffer = runningBuffer ? `${runningBuffer}\n\n${block}` : block;

      if (normalizeInlineWhitespace(runningBuffer).length > 900 && /[.!?]$/.test(block)) {
        flushBuffer();
      }
    }
  }

  flushBuffer();

  const overlappedChunks: PreparedChunk[] = [];
  for (let index = 0; index < preparedChunks.length; index += 1) {
    const chunk = preparedChunks[index];
    const previousChunk = preparedChunks[index - 1];
    const overlap = previousChunk
      ? previousChunk.content.split(/\s+/).slice(-40).join(" ")
      : "";

    overlappedChunks.push({
      ...chunk,
      content: overlap ? `${overlap}\n\n${chunk.content}` : chunk.content,
      hasFormula: chunk.hasFormula,
      hasTable: chunk.hasTable,
      formulaLines: chunk.formulaLines,
    });
  }

  return overlappedChunks;
}

async function parsePdfPages(filePath: string): Promise<ParsedPage[]> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const rawPages = data.text.split("\f").map((page) => cleanText(page)).filter(Boolean);

  return rawPages.length > 0
    ? rawPages.map((text, index) => ({ pageNumber: index + 1, text }))
    : [{ pageNumber: 1, text: cleanText(data.text) }];
}

async function parseDocxPages(filePath: string): Promise<ParsedPage[]> {
  const result = await mammoth.extractRawText({ path: filePath });
  return [{ pageNumber: 1, text: cleanText(result.value) }];
}

async function parseTxtPages(filePath: string): Promise<ParsedPage[]> {
  return [{ pageNumber: 1, text: cleanText(fs.readFileSync(filePath, "utf8")) }];
}

async function parseDocumentPages(filePath: string, fileType: string): Promise<ParsedPage[]> {
  if (fileType === "pdf") {
    return parsePdfPages(filePath);
  }

  if (fileType === "docx") {
    return parseDocxPages(filePath);
  }

  return parseTxtPages(filePath);
}

function buildDocumentTitle(document: {
  title?: string;
  originalFileName: string;
  chapterName?: string;
}) {
  return document.title?.trim() || document.chapterName?.trim() || document.originalFileName;
}

export function serializeDocument(document: any) {
  return {
    _id: String(document._id),
    title: document.title,
    name: document.name ?? document.originalFileName,
    originalFileName: document.originalFileName,
    fileType: document.fileType,
    filePath: document.filePath,
    courseId: String(document.courseId),
    courseName: document.courseName,
    subject: document.subject,
    chapterName: document.chapterName,
    status: document.status,
    totalChunks: document.totalChunks ?? 0,
    processedForAI: Boolean(document.processedForAI),
    chunksCount: document.chunksCount ?? document.totalChunks ?? 0,
    processingError: document.processingError,
    uploadedAt: document.uploadedAt,
    processedAt: document.processedAt,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    size: document.size,
  };
}

export async function createCourseDocumentRecord(params: {
  courseId: string;
  file: Express.Multer.File;
  title?: string;
  subject?: string;
  chapterName?: string;
  uploadedBy?: string;
}) {
  const course = await Course.findById(params.courseId).select("title");
  if (!course) {
    throw new Error("Course not found");
  }

  const document = await CourseDocument.create({
    courseId: params.courseId,
    courseName: course.title,
    title: params.title?.trim() || params.chapterName?.trim() || params.file.originalname,
    name: params.file.originalname,
    originalFileName: params.file.originalname,
    filePath: params.file.path,
    fileUrl: `/uploads/documents/${params.file.filename}`,
    fileType: params.file.originalname.split(".").pop()?.toLowerCase() || params.file.mimetype,
    size: params.file.size,
    subject: params.subject?.trim() || "General",
    chapterName: params.chapterName?.trim() || undefined,
    uploadedBy: params.uploadedBy ? new mongoose.Types.ObjectId(params.uploadedBy) : undefined,
    status: "uploaded",
    totalChunks: 0,
    processedForAI: false,
    chunksCount: 0,
  });

  return document;
}

export async function processCourseDocumentById(documentId: string) {
  const document = await CourseDocument.findById(documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  document.status = "processing";
  document.processedForAI = false;
  document.processingError = undefined;
  await document.save();

  try {
    const pages = await parseDocumentPages(document.filePath, document.fileType);
    const preparedChunks = prepareStructuredChunks(pages);

    const chunkPayloads: {
      documentId: mongoose.Types.ObjectId;
      courseId: mongoose.Types.ObjectId;
      subject?: string;
      chapterName?: string;
      filename: string;
      chunkIndex: number;
      pageNumber: number;
      content: string;
      metadata: Record<string, unknown>;
      embedding: number[];
    }[] = [];

    const documentTitle = buildDocumentTitle(document);
    const embeddingInputs = preparedChunks.map((chunk) =>
      buildEmbeddingInput({
        documentTitle,
        subject: document.subject,
        chapterName: document.chapterName,
        pageNumber: chunk.pageNumber,
        topic: chunk.topic,
        semanticType: chunk.semanticType,
        headingTrail: chunk.headingTrail,
        content: chunk.content,
      }),
    );
    const embeddings = embeddingInputs.length > 0 ? await createEmbeddings(embeddingInputs) : [];

    preparedChunks.forEach((chunk, chunkIndex) => {
      chunkPayloads.push({
        documentId: document._id,
        courseId: document.courseId,
        subject: document.subject,
        chapterName: document.chapterName,
        filename: document.originalFileName,
        chunkIndex,
        pageNumber: chunk.pageNumber,
        content: chunk.content,
        metadata: {
          documentId: String(document._id),
          documentTitle,
          fileName: document.originalFileName,
          courseId: String(document.courseId),
          courseName: document.courseName,
          subject: document.subject,
          chapterName: document.chapterName,
          pageNumber: chunk.pageNumber,
          page: chunk.pageNumber,
          chunkIndex,
          topic: chunk.topic,
          semanticType: chunk.semanticType,
          headingTrail: chunk.headingTrail,
          hasFormula: chunk.hasFormula,
          hasTable: chunk.hasTable,
          formulaLines: chunk.formulaLines,
        },
        embedding: embeddings[chunkIndex] ?? [],
      });
    });

    await DocumentChunk.deleteMany({ documentId: document._id });
    if (chunkPayloads.length > 0) {
      await DocumentChunk.insertMany(chunkPayloads);
    }

    document.status = "indexed";
    document.totalChunks = chunkPayloads.length;
    document.processedForAI = true;
    document.chunksCount = chunkPayloads.length;
    document.processedAt = new Date();
    await document.save();

    return {
      document,
      chunksStored: chunkPayloads.length,
    };
  } catch (error) {
    document.status = "failed";
    document.processingError =
      error instanceof Error ? error.message : "Unknown processing error";
    await document.save();
    throw error;
  }
}

export async function deleteCourseDocumentById(documentId: string, courseId?: string) {
  const filter: Record<string, unknown> = { _id: documentId };
  if (courseId) {
    filter.courseId = courseId;
  }

  const document = await CourseDocument.findOneAndDelete(filter);
  if (!document) {
    return null;
  }

  await DocumentChunk.deleteMany({ documentId: document._id });

  try {
    fs.unlinkSync(document.filePath);
  } catch {
    // File may already be missing on disk.
  }

  return document;
}
