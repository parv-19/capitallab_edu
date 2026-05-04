import type { Request, Response } from "express";
import mongoose from "mongoose";

import { CourseDocument } from "../models/CourseDocument.model";
import { RagChatLog } from "../models/RagChatLog.model";
import { RagUnansweredQuestion } from "../models/RagUnansweredQuestion.model";
import type { AuthedRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";
import { answerSyllabusQuestion } from "../services/ragChat.service";
import {
  createCourseDocumentRecord,
  deleteCourseDocumentById,
  processCourseDocumentById,
  serializeDocument,
} from "../services/ragIngestion.service";
import { Course } from "../models/Course.model";

export const uploadRagDocument = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { courseId, subject, chapterName, title } = req.body as Record<string, string>;
  if (!courseId) {
    return res.status(400).json({ message: "courseId is required" });
  }

  const document = await createCourseDocumentRecord({
    courseId,
    file,
    title,
    subject,
    chapterName,
    uploadedBy: req.user?.userId,
  });

  res.status(201).json({ document: serializeDocument(document) });
});

export const listRagDocuments = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  const { courseId, subject, chapterName, status } = req.query as Record<string, string>;

  if (courseId) {
    filter.courseId = new mongoose.Types.ObjectId(courseId);
  }
  if (subject) {
    filter.subject = subject;
  }
  if (chapterName) {
    filter.chapterName = chapterName;
  }
  if (status) {
    filter.status = status;
  }

  const documents = await CourseDocument.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ documents: documents.map(serializeDocument) });
});

export const processRagDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await processCourseDocumentById(String(req.params.id ?? ""));
  res.json({
    success: true,
    document: serializeDocument(result.document),
    chunksStored: result.chunksStored,
  });
});

export const reindexRagDocument = processRagDocument;

export const deleteRagDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await deleteCourseDocumentById(String(req.params.id ?? ""));
  if (!document) {
    return res.status(404).json({ message: "Document not found" });
  }

  res.json({ message: "Document deleted" });
});

export const ragChat = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { question, subject, courseId, chapterName } = req.body as Record<string, string>;
  if (!question?.trim()) {
    return res.status(400).json({ message: "question is required" });
  }

  const allowedCourseIds =
    req.user?.role === "student"
      ? (req.user.enrollments ?? []).map((entry: any) => String(entry))
      : [];

  const courseIds =
    courseId && courseId.trim()
      ? [courseId.trim()]
      : req.user?.role === "student"
        ? allowedCourseIds
        : [];

  if (req.user?.role === "student" && courseId && !allowedCourseIds.includes(courseId)) {
    return res.status(403).json({ message: "You can only ask about courses you are enrolled in." });
  }

  const result = await answerSyllabusQuestion({
    userId: req.user?.userId,
    question,
    courseIds,
    subject,
    chapterName,
  });

  res.json(result);
});

export const listRagLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await RagChatLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ logs });
});

export const listRagUnanswered = asyncHandler(async (_req: Request, res: Response) => {
  const unanswered = await RagUnansweredQuestion.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ unanswered });
});

export const getRagOptions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const courseIds =
    req.user?.role === "student"
      ? (req.user.enrollments ?? []).map((entry: any) => new mongoose.Types.ObjectId(String(entry)))
      : [];

  const match =
    req.user?.role === "student"
      ? { courseId: { $in: courseIds }, status: "indexed" }
      : { status: "indexed" };

  const documents = await CourseDocument.find(match)
    .select("courseId courseName subject chapterName")
    .lean();

  const courseMap = new Map<string, { courseId: string; courseName: string; subjects: Set<string>; chapters: Set<string> }>();

  documents.forEach((document: any) => {
    const key = String(document.courseId);
    if (!courseMap.has(key)) {
      courseMap.set(key, {
        courseId: key,
        courseName: document.courseName ?? "Course",
        subjects: new Set<string>(),
        chapters: new Set<string>(),
      });
    }

    const current = courseMap.get(key)!;
    if (document.subject) current.subjects.add(document.subject);
    if (document.chapterName) current.chapters.add(document.chapterName);
  });

  const options = Array.from(courseMap.values()).map((entry) => ({
    courseId: entry.courseId,
    courseName: entry.courseName,
    subjects: Array.from(entry.subjects).sort(),
    chapters: Array.from(entry.chapters).sort(),
  }));

  if (req.user?.role !== "student") {
    const courses = await Course.find().select("title").lean();
    courses.forEach((course: any) => {
      const key = String(course._id);
      if (!courseMap.has(key)) {
        options.push({
          courseId: key,
          courseName: course.title,
          subjects: [],
          chapters: [],
        });
      }
    });
  }

  res.json({ options });
});
