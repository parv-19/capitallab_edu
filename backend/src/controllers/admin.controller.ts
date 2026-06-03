import type { Request, Response } from "express";

import pool from "../db/pool";
import { Course } from "../models/Course.model";
import { CourseDocument } from "../models/CourseDocument.model";
import { DocumentChunk } from "../models/DocumentChunk.model";
import { Lead } from "../models/Lead.model";
import { Lesson } from "../models/Lesson.model";
import { Testimonial } from "../models/Testimonial.model";
import { User } from "../models/User.model";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createCourseDocumentRecord,
  deleteCourseDocumentById,
  queueCourseDocumentProcessing,
  serializeDocument,
} from "../services/ragIngestion.service";

// ─── Stats ─────────────────────────────────────────────────────────
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalLeads, totalStudents, activeCourses, pendingTestimonials, newLeadsThisMonth] =
    await Promise.all([
      Lead.countDocuments(),
      User.countDocuments({ role: "student" }),
      Course.countDocuments({ status: "published" }),
      Testimonial.countDocuments({ status: "pending" }),
      Lead.countDocuments({ createdAt: { $gte: startOfMonth } }),
    ]);

  const { rows: weeklyLeadsRows } = await pool.query(
    `SELECT EXTRACT(WEEK FROM created_at)::int AS week, COUNT(*) AS count
     FROM leads
     GROUP BY EXTRACT(WEEK FROM created_at)
     ORDER BY week
     LIMIT 6`,
  );
  const weeklyLeads = weeklyLeadsRows.map((r: any) => ({ week: `Wk ${r.week}`, count: parseInt(r.count, 10) }));

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
  const course = await Course.findByIdAndUpdate(String(req.params.id ?? ""), req.body, { new: true });
  res.json({ course });
});

export const deleteCourse = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.id ?? "");
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
  const lessons = await Lesson.find({ courseId: String(req.params.courseId ?? "") }).sort({ order: 1 });
  res.json({ lessons });
});

export const createLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.create({ ...req.body, courseId: String(req.params.courseId ?? "") });
  res.status(201).json({ lesson });
});

export const updateLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await Lesson.findOneAndUpdate(
    { _id: String(req.params.id ?? ""), courseId: String(req.params.courseId ?? "") },
    req.body,
    { new: true },
  );
  res.json({ lesson });
});

export const deleteLesson = asyncHandler(async (req: Request, res: Response) => {
  await Lesson.findOneAndDelete({ _id: String(req.params.id ?? ""), courseId: String(req.params.courseId ?? "") });
  res.json({ message: "Lesson deleted" });
});

export const reorderLessons = asyncHandler(async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  await Promise.all(orderedIds.map((id, index) => Lesson.findByIdAndUpdate(id, { order: index + 1 })));
  res.json({ message: "Lesson order updated" });
});

// ─── Documents ──────────────────────────────────────────────────────
export const getCourseDocuments = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId ?? req.params.id ?? "");
  const documents = await CourseDocument.find({ courseId }).sort({ uploadedAt: -1 });
  res.json({ documents: documents.map(serializeDocument) });
});

export const uploadCourseDocument = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const document = await createCourseDocumentRecord({
    courseId: String(req.params.courseId ?? req.params.id ?? ""),
    file,
    title: String(req.body.title ?? ""),
    subject: String(req.body.subject ?? ""),
    chapterName: String(req.body.chapterName ?? ""),
    uploadedBy: (req as any).user?.userId,
  });

  const documentId = String(document.id ?? document._id);

  // Let the upload request return immediately; processing continues in the background.
  setTimeout(() => {
    void queueCourseDocumentProcessing(documentId).catch((error) => {
      console.error(`[RAG][ingest] Failed to queue document ${documentId}:`, error);
    });
  }, 0);

  res.status(201).json({ document: serializeDocument(document), queued: true });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const document = await deleteCourseDocumentById(String(req.params.id ?? ""), String(req.params.courseId ?? ""));
  if (!document) return res.status(404).json({ message: "Document not found" });
  res.json({ message: "Document deleted" });
});

// ─── RAG: Process Document ──────────────────────────────────────────
export const processDocument = asyncHandler(async (req: Request, res: Response) => {
  const result = await queueCourseDocumentProcessing(String(req.params.id ?? ""));
  const queuedDocument = await CourseDocument.findById(String(req.params.id ?? ""));
  res.status(result.alreadyRunning ? 200 : 202).json({ success: true, queued: result.queued, alreadyRunning: result.alreadyRunning, document: serializeDocument(queuedDocument ?? result.document) });
});

// ─── Leads ──────────────────────────────────────────────────────────
export const getLeads = asyncHandler(async (req: Request, res: Response) => {
  const { page = "1", limit = "50", status, search } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (status) { conditions.push(`status=$${idx++}`); params.push(status); }
  if (search) {
    conditions.push(`(name ILIKE $${idx} OR phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const [{ rows: leads }, { rows: countRows }] = await Promise.all([
    pool.query(`SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...params, limitNum, offset]),
    pool.query(`SELECT COUNT(*) FROM leads ${where}`, params),
  ]);
  const total = parseInt(countRows[0].count, 10);

  res.json({ leads, total, pages: Math.ceil(total / limitNum) });
});

export const exportLeads = asyncHandler(async (_req: Request, res: Response) => {
  const leads = await Lead.find().sort({ createdAt: -1 });
  const headers = ["Name", "Phone", "Email", "Course Interest", "Preferred Time", "Status", "Date"];
  const rows = leads.map((l) => [l.name, l.phone, l.email ?? "", l.courseInterest, l.preferredTime, l.status, new Date(l.createdAt as any).toLocaleDateString("en-IN")]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
  res.send(csv);
});

export const updateLead = asyncHandler(async (req: Request, res: Response) => {
  const lead = await Lead.findByIdAndUpdate(String(req.params.id ?? ""), req.body, { new: true });
  res.json({ lead });
});

export const updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const validStatuses = ["new", "contacted", "visit_scheduled", "enrolled", "closed"];
  if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status value" });
  const lead = await Lead.findByIdAndUpdate(String(req.params.id ?? ""), { status }, { new: true });
  res.json({ lead });
});

export const updateLeadNote = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text?.trim()) return res.status(400).json({ message: "Note text is required" });
  const lead = await Lead.findByIdAndUpdate(String(req.params.id ?? ""), { $push: { notes: { text: text.trim(), addedAt: new Date() } } }, { new: true });
  res.json({ lead });
});

// ─── Students ───────────────────────────────────────────────────────
export const getStudents = asyncHandler(async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.enrollments, u.avatar,
            u.is_blocked, u.created_at, u.updated_at,
            COALESCE(
              json_agg(json_build_object('_id', c.id, 'id', c.id, 'title', c.title, 'slug', c.slug))
              FILTER (WHERE c.id IS NOT NULL), '[]'
            ) AS enrollment_details
     FROM users u
     LEFT JOIN courses c ON c.id = ANY(u.enrollments)
     WHERE u.role = 'student'
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  );
  const students = rows.map((row: any) => ({
    _id: row.id, id: row.id, name: row.name, email: row.email, phone: row.phone,
    role: row.role, avatar: row.avatar, isBlocked: row.is_blocked,
    enrollments: row.enrollment_details ?? [],
    createdAt: row.created_at, updatedAt: row.updated_at,
  }));
  res.json({ students });
});

export const toggleStudentBlock = asyncHandler(async (req: Request, res: Response) => {
  const student = await User.findById(String(req.params.id ?? ""));
  if (!student) return res.status(404).json({ message: "Student not found" });
  student.isBlocked = !student.isBlocked;
  await student.save();
  res.json({ student });
});

export const manualEnroll = asyncHandler(async (req: Request, res: Response) => {
  const student = await User.findById(String(req.params.id ?? ""));
  if (!student) return res.status(404).json({ message: "Student not found" });
  const courseId = req.body.courseId as string;
  if (!student.enrollments.includes(courseId)) {
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
  const testimonial = await Testimonial.findByIdAndUpdate(String(req.params.id ?? ""), req.body, { new: true });
  res.json({ testimonial });
});
