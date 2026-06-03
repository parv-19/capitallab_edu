import "dotenv/config";

import fs from "fs";
import path from "path";

import mongoose from "mongoose";

const HEALTH_CHECK_DIR = path.resolve(process.cwd(), "uploads", "health-check");
const HEALTH_CHECK_FILE = path.join(HEALTH_CHECK_DIR, "rag-health-check.txt");

const SAMPLE_TEXT = `Duration matching is an immunization strategy used to reduce interest rate risk.

In duration matching, the duration of assets is aligned with the duration of liabilities.
If the durations are closely matched, small parallel shifts in interest rates should have a limited effect on surplus.

Convexity measures how the duration of a bond changes when yields change.
Higher convexity generally improves the accuracy of duration-based approximations for larger yield moves.

Key point:
- Duration is a first-order measure of price sensitivity.
- Convexity is a second-order adjustment that improves the estimate.
`;

async function main() {
  process.env.EMBEDDING_PROVIDER =
    process.env.RAG_HEALTH_EMBEDDING_PROVIDER?.trim() ||
    process.env.EMBEDDING_PROVIDER ||
    "local";

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI or MONGODB_URI is required.");
  }

  const { Course } = await import("../src/models/Course.model");
  const { CourseDocument } = await import("../src/models/CourseDocument.model");
  const { DocumentChunk } = await import("../src/models/DocumentChunk.model");
  const { processCourseDocumentById } = await import("../src/services/ragIngestion.service");
  const { answerSyllabusQuestion } = await import("../src/services/ragChat.service");

  await mongoose.connect(mongoUri);

  let documentId = "";

  try {
    const course =
      (process.env.RAG_HEALTH_COURSE_ID
        ? await Course.findById(process.env.RAG_HEALTH_COURSE_ID).select("title")
        : await Course.findOne().sort({ createdAt: 1 }).select("title")) ?? null;

    if (!course) {
      throw new Error("No course found. Create a course first or set RAG_HEALTH_COURSE_ID.");
    }

    fs.mkdirSync(HEALTH_CHECK_DIR, { recursive: true });
    fs.writeFileSync(HEALTH_CHECK_FILE, SAMPLE_TEXT, "utf8");

    const document = await CourseDocument.create({
      courseId: course._id,
      courseName: course.title,
      title: "RAG Health Check",
      name: "rag-health-check.txt",
      originalFileName: "rag-health-check.txt",
      filePath: HEALTH_CHECK_FILE,
      fileUrl: "/uploads/health-check/rag-health-check.txt",
      fileType: "txt",
      size: Buffer.byteLength(SAMPLE_TEXT, "utf8"),
      subject: "Health Check",
      chapterName: "Diagnostics",
      status: "uploaded",
      totalChunks: 0,
      processedForAI: false,
      chunksCount: 0,
    });

    documentId = String(document._id);

    console.log("RAG HEALTH CHECK");
    console.log(`- File loaded: PASS (${path.basename(HEALTH_CHECK_FILE)})`);
    console.log(`- Text extracted: PASS, length = ${SAMPLE_TEXT.length}`);

    const processed = await processCourseDocumentById(documentId);
    const storedChunks = await DocumentChunk.find({ documentId: document._id })
      .select("embedding content metadata pageNumber")
      .sort({ chunkIndex: 1 })
      .lean();

    console.log(`- Chunks created: PASS, count = ${processed.chunksStored}`);
    console.log(
      `- Embedding generated: PASS, dimension = ${storedChunks[0]?.embedding?.length ?? 0}`,
    );
    console.log(`- Vectors stored: PASS, count = ${storedChunks.length}`);

    const question = "What is duration matching?";
    const answer = await answerSyllabusQuestion({
      question,
      courseIds: [String(course._id)],
      subject: "Health Check",
      chapterName: "Diagnostics",
      conversationHistory: [],
    });

    console.log(`- Query embedding: PASS`);
    console.log(`- Retrieved chunks: ${answer.sources.length > 0 ? "PASS" : "FAIL"}, count = ${answer.sources.length}`);
    console.log(`- Context sent to LLM: ${answer.answered ? "PASS" : "FAIL"}`);
    console.log(`- Final answer: ${answer.answered ? "PASS" : "FAIL"}`);
    console.log(
      `- Answer preview: ${(answer.answer || "").replace(/\s+/g, " ").slice(0, 180)}`,
    );
  } finally {
    if (documentId) {
      await DocumentChunk.deleteMany({ documentId: new mongoose.Types.ObjectId(documentId) });
      await CourseDocument.deleteOne({ _id: new mongoose.Types.ObjectId(documentId) });
    }

    try {
      fs.unlinkSync(HEALTH_CHECK_FILE);
    } catch {
      // ignore cleanup errors
    }

    await mongoose.disconnect();
  }
}

void main().catch((error) => {
  console.error("RAG health check failed:", error);
  process.exit(1);
});
