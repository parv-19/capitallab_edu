import bcrypt from "bcryptjs";
import type { Request, Response } from "express";

import pool from "../db/pool";
import type { ProgressDoc } from "../models/Progress.model";
import { ChatSession } from "../models/ChatSession.model";
import { Course } from "../models/Course.model";
import { Lesson } from "../models/Lesson.model";
import { LessonQuestion } from "../models/LessonQuestion.model";
import { Progress } from "../models/Progress.model";
import { Testimonial } from "../models/Testimonial.model";
import { User } from "../models/User.model";
import { answerSyllabusQuestion } from "../services/ragChat.service";
import type { AuthedRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";

// Dashboard
export const getDashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.userId ?? "";
  const [user, progresses] = await Promise.all([
    userId ? User.findById(userId) : Promise.resolve(null),
    userId ? Progress.find({ userId }).sort({ updatedAt: -1 }) : Promise.resolve<ProgressDoc[]>([]),
  ]) as [any, ProgressDoc[]];

  let enrolledCourses: any[] = [];
  if (user && user.enrollments.length > 0) {
    const { rows: courseRows } = await pool.query(
      `SELECT id, title, slug, instructor, duration FROM courses WHERE id = ANY($1::uuid[])`,
      [user.enrollments],
    );
    enrolledCourses = courseRows.map((course: any) => {
      const prog = progresses.find((p) => String(p.courseId) === String(course.id));
      return {
        _id: course.id, title: course.title, slug: course.slug, instructor: course.instructor,
        duration: course.duration, progress: prog?.percentComplete ?? 0,
        completedLessons: prog?.completedLessons?.length ?? 0, totalLessons: 0,
      };
    });
  }

  const recentActivity = progresses.slice(0, 5).map((p) => ({
    courseId: p.courseId, lastAccessed: p.lastAccessed, percentComplete: p.percentComplete,
  }));

  res.json({
    enrolledCourses,
    stats: {
      lessonsCompleted: progresses.reduce((sum, p) => sum + (p.completedLessons?.length ?? 0), 0),
      coursesEnrolled: user?.enrollments?.length ?? 0,
      streak: 0,
    },
    recentActivity,
  });
});

// My Courses
export const getMyCourses = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.user?.userId ? await User.findById(req.user.userId) : null;
  if (!user || user.enrollments.length === 0) return res.json({ courses: [] });

  const { rows } = await pool.query(
    `SELECT id, title, slug, instructor, duration, level, status FROM courses WHERE id = ANY($1::uuid[])`,
    [user.enrollments],
  );
  res.json({ courses: rows.map((c: any) => ({ ...c, _id: c.id })) });
});

// Course Player
export const getCoursePlayer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const courseId = String(req.params.courseId ?? "");
  const user = req.user?.userId ? await User.findById(req.user.userId) : null;
  const enrolled = user?.enrollments?.includes(courseId) ?? false;
  if (!enrolled) return res.status(403).json({ message: "You are not enrolled in this course." });

  const [course, lessons, progress] = await Promise.all([
    Course.findById(courseId),
    Lesson.find({ courseId }).sort({ order: 1 }),
    Progress.findOne({ courseId, userId: req.user?.userId ?? "" }),
  ]);

  res.json({ course, lessons, progress });
});

// Mark Lesson Complete
export const markLessonComplete = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const courseId = String(req.params.courseId ?? "");
  const lessonId = String(req.params.lessonId ?? "");
  const userId = req.user?.userId ?? "";
  const lessonsCount = await Lesson.countDocuments({ courseId });

  let progress = await Progress.findOne({ courseId, userId });
  if (!progress) {
    progress = await Progress.create({ courseId, userId, completedLessons: [] });
  }

  if (!progress.completedLessons.includes(lessonId)) {
    progress.completedLessons.push(lessonId);
  }

  progress.percentComplete = lessonsCount ? Math.round((progress.completedLessons.length / lessonsCount) * 100) : 0;
  progress.lastAccessed = new Date();
  await progress.save();

  res.json({ progress });
});

// Lesson Q&A
export const askLessonQuestion = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const question = await LessonQuestion.create({
    lessonId: String(req.params.lessonId ?? ""),
    userId: req.user?.userId ?? "",
    question: req.body.question,
  });
  res.status(201).json({ question });
});

export const listLessonQuestions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const lessonId = String(req.params.lessonId ?? "");
  const filter = req.user?.role === "admin"
    ? { lessonId }
    : { lessonId, userId: req.user?.userId ?? "" };
  const questions = await LessonQuestion.find(filter).sort({ createdAt: -1 });
  res.json({ questions });
});

// Testimonials
export const createTestimonial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.user?.userId ? await User.findById(req.user.userId) : null;
  const { courseId, rating, review } = req.body as { courseId: string; rating: number; review: string };

  if (!user?.enrollments.includes(courseId)) {
    return res.status(403).json({ message: "Enrollment required to leave a testimonial." });
  }

  const testimonial = await Testimonial.create({ studentId: user.id, studentName: user.name, courseId, rating, review });
  res.status(201).json({ testimonial });
});

// Profile
export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const updateData: Record<string, unknown> = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.phone) updateData.phone = req.body.phone;
  if (req.file) updateData.avatar = `/uploads/images/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user?.userId ?? "", updateData, { new: true });
  res.json({ user: user ? { _id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: user.avatar, enrollments: user.enrollments, role: user.role, isBlocked: user.isBlocked } : null });
});

export const updatePassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword are required." });
  if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters." });

  const user = req.user?.userId ? await User.findById(req.user.userId) : null;
  if (!user) return res.status(404).json({ message: "User not found." });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ message: "Current password is incorrect." });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: "Password updated successfully." });
});

export const deleteProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await User.findByIdAndDelete(req.user?.userId ?? "");
  res.json({ message: "Profile deleted successfully" });
});

// Chat Sessions (legacy)
export const listChatSessions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sessions = await ChatSession.find({ userId: req.user?.userId }).sort({ updatedAt: -1 });
  res.json({ sessions: sessions.map((s) => ({ _id: s.id, title: s.title, courseIds: s.courseIds, createdAt: s.createdAt, updatedAt: s.updatedAt })) });
});

export const createChatSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const session = await ChatSession.create({ userId: req.user?.userId, courseIds: req.body.courseIds ?? [], title: req.body.title ?? "New Chat", messages: [] });
  res.status(201).json({ session });
});

// RAG Streaming Chat
export const streamChatMessage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { message, courseIds = [], subject, chapterName } = req.body as { message: string; courseIds: string[]; subject?: string; chapterName?: string };
  if (!message?.trim()) return res.status(400).json({ message: "message is required." });

  const user = req.user?.userId ? await User.findById(req.user.userId) : null;
  const allowedCourseIds = new Set<string>((user?.enrollments ?? []).map((e) => String(e)));

  const targetCourseIds = courseIds.length > 0 ? courseIds.filter((id) => allowedCourseIds.has(id)) : [...allowedCourseIds];
  if (courseIds.length > 0 && targetCourseIds.length === 0) return res.status(403).json({ message: "You can only ask about courses you are enrolled in." });

  const session = req.params.sessionId !== "temp" ? await ChatSession.findOne({ _id: req.params.sessionId, userId: req.user?.userId }) : null;
  if (req.params.sessionId !== "temp" && !session) return res.status(404).json({ message: "Chat session not found." });

  if (session) { session.messages.push({ role: "user", content: message, timestamp: new Date() }); await session.save(); }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let assistantResponse = "";
  try {
    const result = await answerSyllabusQuestion({ userId: req.user?.userId, question: message, courseIds: targetCourseIds, subject, chapterName });
    assistantResponse += result.answer;
    res.write(result.answer);
  } catch (error) {
    console.error("Chat Error:", error);
    const errorMsg = "\n\n[An error occurred while generating the response. Please try again.]";
    assistantResponse += errorMsg;
    res.write(errorMsg);
  }

  if (session) {
    session.messages.push({ role: "assistant", content: assistantResponse, timestamp: new Date() });
    if (session.title === "New Chat" && message.trim()) session.title = message.trim().slice(0, 60);
    await session.save();
  }

  res.end();
});
