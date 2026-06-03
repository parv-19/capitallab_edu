import { Router } from "express";

import {
  createCourse,
  createLesson,
  deleteCourse,
  deleteDocument,
  deleteLesson,
  exportLeads,
  getAdminCourses,
  getCourseDocuments,
  getCourseLessons,
  getLeads,
  getStats,
  getStudents,
  getTestimonials,
  manualEnroll,
  processDocument,
  reorderLessons,
  toggleStudentBlock,
  updateCourse,
  updateLead,
  updateLeadNote,
  updateLeadStatus,
  updateLesson,
  updateTestimonial,
  uploadCourseDocument,
} from "../controllers/admin.controller";
import { adminOnly, authMiddleware } from "../middleware/auth.middleware";
import { uploadDocument } from "../middleware/upload.middleware";

const router = Router();
router.use(authMiddleware, adminOnly);

// ─── Stats ──────────────────────────────────────────────────────────
router.get("/stats", getStats);

// ─── Courses ────────────────────────────────────────────────────────
router.get("/courses", getAdminCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// ─── Lessons ────────────────────────────────────────────────────────
router.get("/courses/:courseId/lessons", getCourseLessons);
router.post("/courses/:courseId/lessons", createLesson);
router.put("/courses/:courseId/lessons/:id", updateLesson);
router.delete("/courses/:courseId/lessons/:id", deleteLesson);
router.patch("/courses/:courseId/lessons/reorder", reorderLessons);

// ─── Documents ──────────────────────────────────────────────────────
router.get("/courses/:courseId/documents", getCourseDocuments);
router.post("/courses/:courseId/documents/upload", uploadDocument, uploadCourseDocument);
router.delete("/courses/:courseId/documents/:id", deleteDocument);
router.post("/documents/:id/process", processDocument);
router.post("/documents/:id/reindex", processDocument);

// ─── Leads ──────────────────────────────────────────────────────────
router.get("/leads", getLeads);
router.get("/leads/export", exportLeads);
router.put("/leads/:id", updateLead);
router.patch("/leads/:id/status", updateLeadStatus);
router.post("/leads/:id/notes", updateLeadNote);
router.delete("/leads/:id", async (req, res) => {
  const { Lead } = await import("../models/Lead.model");
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ message: "Lead deleted" });
});

// ─── Students ───────────────────────────────────────────────────────
router.get("/students", getStudents);
router.get("/students/:id", async (req, res) => {
  const { User } = await import("../models/User.model");
  const student = await User.findById(String(req.params.id ?? ""));
  res.json(student);
});
router.patch("/students/:id/toggle-block", toggleStudentBlock);
router.patch("/students/:id/block", async (req, res) => {
  const { User } = await import("../models/User.model");
  const student = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
  res.json(student);
});
router.patch("/students/:id/unblock", async (req, res) => {
  const { User } = await import("../models/User.model");
  const student = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
  res.json(student);
});
router.post("/students/:id/enroll", manualEnroll);

// ─── Testimonials ────────────────────────────────────────────────────
router.get("/testimonials", getTestimonials);
router.put("/testimonials/:id", updateTestimonial);
router.patch("/testimonials/:id/approve", async (req, res) => {
  const { Testimonial } = await import("../models/Testimonial.model");
  const t = await Testimonial.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
  res.json(t);
});
router.patch("/testimonials/:id/reject", async (req, res) => {
  const { Testimonial } = await import("../models/Testimonial.model");
  const t = await Testimonial.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  res.json(t);
});
router.patch("/testimonials/:id/featured", async (req, res) => {
  const { Testimonial } = await import("../models/Testimonial.model");
  const t = await Testimonial.findById(req.params.id);
  if (!t) return res.status(404).json({ message: "Not found" });
  t.featured = !t.featured;
  await t.save();
  res.json(t);
});
router.delete("/testimonials/:id", async (req, res) => {
  const { Testimonial } = await import("../models/Testimonial.model");
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ message: "Testimonial deleted" });
});

export default router;
