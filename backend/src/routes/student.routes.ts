import { Router } from "express";

import {
  askLessonQuestion,
  createChatSession,
  createTestimonial,
  getCoursePlayer,
  getDashboard,
  getMyCourses,
  listChatSessions,
  listLessonQuestions,
  markLessonComplete,
  streamChatMessage,
  updatePassword,
  updateProfile,
  deleteProfile,
} from "../controllers/student.controller";
import { authMiddleware, studentOnly } from "../middleware/auth.middleware";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();
router.use(authMiddleware, studentOnly);

// ─── Dashboard ──────────────────────────────────────────────────────
router.get("/dashboard", getDashboard);

// ─── Courses ────────────────────────────────────────────────────────
router.get("/courses", getMyCourses);
router.get("/courses/:courseId", getCoursePlayer);
router.post("/courses/:courseId/lessons/:lessonId/complete", markLessonComplete);

// ─── Lesson Q&A ─────────────────────────────────────────────────────
router.get("/lessons/:lessonId/questions", listLessonQuestions);
router.post("/lessons/:lessonId/questions", askLessonQuestion);

// ─── Testimonials ────────────────────────────────────────────────────
router.post("/testimonials", createTestimonial);

// ─── Profile ────────────────────────────────────────────────────────
router.put("/profile", uploadImage, updateProfile);
router.put("/profile/password", updatePassword);
router.delete("/profile", deleteProfile);

// ─── RAG Chat ───────────────────────────────────────────────────────
router.get("/chat/sessions", listChatSessions);
router.post("/chat/sessions", createChatSession);
router.post("/chat/:sessionId/message", streamChatMessage);

export default router;
