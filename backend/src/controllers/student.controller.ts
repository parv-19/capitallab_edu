import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import mongoose from "mongoose";

import { runCFAChat, type RetrievedChunk } from "../config/masterPrompt";
import { ChatSession } from "../models/ChatSession.model";
import { Course } from "../models/Course.model";
import { Lesson } from "../models/Lesson.model";
import { LessonQuestion } from "../models/LessonQuestion.model";
import { Progress } from "../models/Progress.model";
import { Testimonial } from "../models/Testimonial.model";
import { User } from "../models/User.model";
import { retrieve } from "../services/ragRetrieval";
import type { AuthedRequest } from "../types";
import { asyncHandler } from "../utils/asyncHandler";

// Dashboard
export const getDashboard = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const [user, progresses] = await Promise.all([
    User.findById(req.user?.userId).populate("enrollments", "title slug instructor duration"),
    Progress.find({ userId: req.user?.userId }).sort({ updatedAt: -1 }),
  ]);

  const enrolledCourses = ((user?.enrollments ?? []) as any[]).map((course) => {
    const prog = progresses.find((p) => String(p.courseId) === String(course._id));
    return {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      instructor: course.instructor,
      duration: course.duration,
      progress: prog?.percentComplete ?? 0,
      completedLessons: prog?.completedLessons?.length ?? 0,
      totalLessons: 0,
    };
  });

  const recentActivity = progresses.slice(0, 5).map((p) => ({
    courseId: p.courseId,
    lastAccessed: p.lastAccessed,
    percentComplete: p.percentComplete,
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
  const user = await User.findById(req.user?.userId).populate(
    "enrollments",
    "title slug instructor duration level status",
  );
  res.json({ courses: user?.enrollments ?? [] });
});

// Course Player
export const getCoursePlayer = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { courseId } = req.params;

  const user = await User.findById(req.user?.userId);
  const enrolled = user?.enrollments?.some((entry: any) => String(entry) === String(courseId)) ?? false;
  if (!enrolled) return res.status(403).json({ message: "You are not enrolled in this course." });

  const [course, lessons, progress] = await Promise.all([
    Course.findById(courseId),
    Lesson.find({ courseId }).sort({ order: 1 }),
    Progress.findOne({ courseId, userId: req.user?.userId }),
  ]);

  res.json({ course, lessons, progress });
});

// Mark Lesson Complete
export const markLessonComplete = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { courseId, lessonId } = req.params;
  const lessonsCount = await Lesson.countDocuments({ courseId });

  const progress =
    (await Progress.findOne({ courseId, userId: req.user?.userId })) ||
    (await Progress.create({ courseId, userId: req.user?.userId, completedLessons: [] }));

  if (!progress.completedLessons.some((entry: any) => String(entry) === String(lessonId))) {
    progress.completedLessons.push(new mongoose.Types.ObjectId(lessonId as string));
  }

  progress.percentComplete = lessonsCount
    ? Math.round((progress.completedLessons.length / lessonsCount) * 100)
    : 0;
  progress.lastAccessed = new Date();
  await progress.save();

  res.json({ progress });
});

// Lesson Q&A
export const askLessonQuestion = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const question = await LessonQuestion.create({
    lessonId: req.params.lessonId,
    userId: req.user?.userId,
    question: req.body.question,
  });
  res.status(201).json({ question });
});

export const listLessonQuestions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const filter =
    req.user?.role === "admin"
      ? { lessonId: req.params.lessonId }
      : { lessonId: req.params.lessonId, userId: req.user?.userId };
  const questions = await LessonQuestion.find(filter).sort({ createdAt: -1 });
  res.json({ questions });
});

// Testimonials
export const createTestimonial = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user?.userId);
  const { courseId, rating, review } = req.body as { courseId: string; rating: number; review: string };

  if (!user?.enrollments.some((entry: any) => String(entry) === String(courseId))) {
    return res.status(403).json({ message: "Enrollment required to leave a testimonial." });
  }

  const testimonial = await Testimonial.create({
    studentId: user._id,
    studentName: user.name,
    courseId,
    rating,
    review,
  });

  res.status(201).json({ testimonial });
});

// Profile
export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const updateData: Record<string, unknown> = {};
  if (req.body.name) updateData.name = req.body.name;
  if (req.body.phone) updateData.phone = req.body.phone;
  if (req.file) updateData.avatar = `/uploads/images/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user?.userId, updateData, { new: true }).select(
    "_id name email phone avatar enrollments role isBlocked",
  );
  res.json({ user });
});

export const updatePassword = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  const user = await User.findById(req.user?.userId);
  if (!user) return res.status(404).json({ message: "User not found." });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ message: "Current password is incorrect." });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  res.json({ message: "Password updated successfully." });
});

export const deleteProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await User.findByIdAndDelete(req.user?.userId);
  res.json({ message: "Profile deleted successfully" });
});

// Chat Sessions
export const listChatSessions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const sessions = await ChatSession.find({ userId: req.user?.userId })
    .sort({ updatedAt: -1 })
    .select("_id title courseIds createdAt updatedAt");
  res.json({ sessions });
});

export const createChatSession = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const session = await ChatSession.create({
    userId: req.user?.userId,
    courseIds: req.body.courseIds ?? [],
    title: req.body.title ?? "New Chat",
    messages: [],
  });
  res.status(201).json({ session });
});

// RAG Streaming Chat
export const streamChatMessage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { message, courseIds = [] } = req.body as {
    message: string;
    courseIds: string[];
  };

  if (!message?.trim()) {
    return res.status(400).json({ message: "message is required." });
  }

  const user = await User.findById(req.user?.userId).select("enrollments");
  const allowedCourseIds = new Set<string>(
    (user?.enrollments ?? []).map((entry: any) => String(entry)),
  );

  const targetCourseIds: string[] =
    courseIds.length > 0
      ? courseIds.filter((id) => allowedCourseIds.has(id))
      : [...allowedCourseIds];

  if (courseIds.length > 0 && targetCourseIds.length === 0) {
    return res.status(403).json({ message: "You can only ask about courses you are enrolled in." });
  }

  const session =
    req.params.sessionId !== "temp"
      ? await ChatSession.findOne({ _id: req.params.sessionId, userId: req.user?.userId })
      : null;

  if (req.params.sessionId !== "temp" && !session) {
    return res.status(404).json({ message: "Chat session not found." });
  }

  if (session) {
    session.messages.push({ role: "user", content: message, timestamp: new Date() });
    await session.save();
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  let assistantResponse = "";

  try {
    const conversationHistory =
      session?.messages.slice(0, -1).slice(-6).map((entry: any) => ({
        role: entry.role as "user" | "assistant",
        content: entry.content,
      })) ?? [];

    const retrievedSets = await Promise.all(
      targetCourseIds.map(async (courseId) => retrieve(message, courseId, 5)),
    );

    const dedupedChunks: RetrievedChunk[] = [];
    const seen = new Set<string>();

    for (const chunk of retrievedSets.flat().sort((a, b) => (b.score ?? 0) - (a.score ?? 0))) {
      const key = `${chunk._id}-${chunk.metadata.page}-${chunk.metadata.section}`;
      if (seen.has(key)) continue;
      seen.add(key);
      dedupedChunks.push({
        content: chunk.content,
        score: chunk.score,
        metadata: {
          ...chunk.metadata,
          courseId: String(chunk.metadata.courseId),
        },
      });
      if (dedupedChunks.length >= 5) break;
    }

    if (
      (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === "") &&
      (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === "")
    ) {
      const errorMsg = "No supported LLM API key configured for the AI assistant.";
      assistantResponse += errorMsg;
      res.write(errorMsg);
    } else {
      const answer = await runCFAChat(message, dedupedChunks, conversationHistory);
      assistantResponse += answer;
      res.write(answer);
    }
  } catch (error) {
    console.error("Chat Error:", error);
    const errorMsg = "\n\n[An error occurred while generating the response. Please try again.]";
    assistantResponse += errorMsg;
    res.write(errorMsg);
  }

  if (session) {
    session.messages.push({
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date(),
    });
    if (session.title === "New Chat" && message.trim()) {
      session.title = message.trim().slice(0, 60);
    }
    await session.save();
  }

  res.end();
});
