import path from "path";
import fs from "fs";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Course } from "../models/Course.model";
import { CourseDocument } from "../models/CourseDocument.model";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { Lead } from "../models/Lead.model";
import { Lesson } from "../models/Lesson.model";
import { Testimonial } from "../models/Testimonial.model";
import { User } from "../models/User.model";
import { asyncHandler } from "../utils/asyncHandler";
import { chunkText } from "../lib/rag/chunkText";
import { embedAndStore } from "../lib/rag/embedAndStore";
import { parseDocument } from "../lib/rag/parseDocument";

// ─── Stats ─────────────────────────────────────────────────────────
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalLeads, totalStudents, activeCourses, pendingTestimonials] = await Promise.all([
    Lead.countDocuments(),
    User.countDocuments({ role: "student" }),
    Course.countDocuments({ status: "published" }),
    Testimonial.countDocuments({ status: "pending" }),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const newLeadsThisMonth = await Lead.countDocuments({ createdAt: { $gte: startOfMonth } });

  const weeklyLeads = await Lead.aggregate([
    {
      $group: {
        _id: { $week: "$createdAt" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 6 },
    { $project: { _id: 0, week: { $concat: ["Wk ", { $toString: "$_id" }] }, count: 1 } },
  ]);

  res.json({ totalLeads, newLeadsThisMonth, totalStudents, activeCourses, pendingTestimonials, weeklyLeads });
});

// ─── Courses ────────────────────────────────────────────────────────
export const getAdminCourses = asyncHandler(async (_req: Request, res: Response) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.json({ courses });
});

export const createCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.create(req.body);
  res.status(201).json({ course });
});

export const updateCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ course });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = new mongoose.Types.ObjectId(req.params.id as string);
  await Promise.all([
    Course.findByIdAndDelete(courseId),
    Lesson.deleteMany({ courseId }),
    CourseDocument.deleteMany({ courseId }),
    DocumentChunk.deleteMany({ courseId }),
  ]);
  res.json({ message: "Course deleted" });
});

// ─── Lessons ────────────────────────────────────────────────────────
export const getCourseLessons = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await Lesson.find({ courseId: req.params.courseId }).sort({ order: 1 });
  res.json({ lessons });
});

export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.create({ ...req.body, courseId: req.params.courseId });
  res.status(201).json({ lesson });
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.findOneAndUpdate(
    { _id: req.params.id, courseId: req.params.courseId },
    req.body,
    { new: true },
  );
  res.json({ lesson });
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  await Lesson.findOneAndDelete({ _id: req.params.id, courseId: req.params.courseId });
  res.json({ message: "Lesson deleted" });
});

export const reorderLessons = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  await Promise.all(orderedIds.map((id, index) => Lesson.findByIdAndUpdate(id, { order: index + 1 })));
  res.json({ message: "Lesson order updated" });
});

// ─── Documents ──────────────────────────────────────────────────────
export const getCourseDocuments = asyncHandler(async (req: Request, res: Response) => {
  const documents = await CourseDocument.find({ courseId: req.params.courseId }).sort({ uploadedAt: -1 });
  res.json({ documents });
});

export const uploadCourseDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  // Derive a clean file type
  const extMap: Record<string, string> = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
  };
  const ext = path.extname(file.originalname).toLowerCase();
  const fileType = extMap[ext] ?? ext.replace(".", "");

  const document = await CourseDocument.create({
    courseId: req.params.courseId,
    name: file.originalname,
    filePath: file.path,
    fileType,
    size: file.size,
    processedForAI: false,
    chunksCount: 0,
  });

  res.status(201).json({ document });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await CourseDocument.findOneAndDelete({
    _id: req.params.id,
    courseId: req.params.courseId,
  });
  if (!document) return res.status(404).json({ message: "Document not found" });

  // Delete chunks and physical file
  await DocumentChunk.deleteMany({ documentId: document._id });
  try { fs.unlinkSync(document.filePath); } catch { /* file may not exist on disk */ }

  res.json({ message: "Document deleted" });
});

// ─── RAG: Process Document ──────────────────────────────────────────
export const processDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await CourseDocument.findById(req.params.id);
  if (!document) return res.status(404).json({ message: "Document not found" });

  // Reset status to processing
  document.processedForAI = false;
  document.processingError = undefined;
  await document.save();

  try {
    // Delete old chunks first (re-processing scenario)
    await DocumentChunk.deleteMany({ documentId: document._id });

    const { text } = await parseDocument(
      document.filePath,
      document.fileType as "pdf" | "docx" | "txt",
    );

    if (!text || text.trim().length === 0) {
      throw new Error("Document appears to be empty or unreadable.");
    }

    const chunks = await chunkText(text);
    const result = await embedAndStore({
      chunks,
      documentId: String(document._id),
      courseId: String(document.courseId),
      filename: document.name,
    });

    document.processedForAI = true;
    document.chunksCount = result.chunksStored;
    document.processedAt = new Date();
    await document.save();

    res.json({ success: true, chunksStored: result.chunksStored });
  } catch (error) {
    document.processingError =
      error instanceof Error ? error.message : "Unknown processing error";
    await document.save();
    throw error;
  }
});

// ─── Leads ──────────────────────────────────────────────────────────
export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, status, search } = req.query as Record<string, string>;
  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  if (search) query.$or = [{ name: new RegExp(search, "i") }, { phone: new RegExp(search, "i") }];

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Lead.countDocuments(query),
  ]);

  res.json({ leads, total, pages: Math.ceil(total / Number(limit)) });
});

export const exportLeads = asyncHandler(async (_req: Request, res: Response) => {
  const leads = await Lead.find().sort({ createdAt: -1 });

  const headers = ["Name", "Phone", "Email", "Course Interest", "Preferred Time", "Status", "Date"];
  const rows = leads.map((l) => [
    l.name,
    l.phone,
    l.email ?? "",
    l.courseInterest,
    l.preferredTime,
    l.status,
    new Date(l.createdAt as Date).toLocaleDateString("en-IN"),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
  res.send(csv);
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ lead });
});

export const updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const validStatuses = ["new", "contacted", "visit_scheduled", "enrolled", "closed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ lead });
});

export const updateLeadNote = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text?.trim()) return res.status(400).json({ message: "Note text is required" });
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { $push: { notes: { text: text.trim(), addedAt: new Date() } } },
    { new: true },
  );
  res.json({ lead });
});

// ─── Students ───────────────────────────────────────────────────────
export const getStudents = asyncHandler(async (_req: Request, res: Response) => {
  const students = await User.find({ role: "student" })
    .populate("enrollments", "title slug")
    .sort({ createdAt: -1 })
    .select("-password -resetToken -resetExpiry");
  res.json({ students });
});

export const toggleStudentBlock = asyncHandler(async (req: Request, res: Response) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  student.isBlocked = !student.isBlocked;
  await student.save();
  res.json({ student });
});

export const manualEnroll = asyncHandler(async (req: Request, res: Response) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const courseId = req.body.courseId;
  if (!student.enrollments.some((entry: any) => String(entry) === String(courseId))) {
    student.enrollments.push(courseId);
    await student.save();
  }
  res.json({ student });
});

// ─── Testimonials ────────────────────────────────────────────────────
export const getTestimonials = asyncHandler(async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });
  res.json({ testimonials });
});

export const updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ testimonial });
});
