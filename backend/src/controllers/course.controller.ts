import type { Request, Response } from "express";

import { Course } from "../models/Course.model";
import { Lesson } from "../models/Lesson.model";
import { Testimonial } from "../models/Testimonial.model";
import { asyncHandler } from "../utils/asyncHandler";

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const courses = await Course.find(filter).sort({ createdAt: -1 });
  res.json(courses);
});

export const getCourseBySlug = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ slug: req.params.slug });
  if (!course) return res.status(404).json({ message: "Course not found" });

  const [lessons, testimonials] = await Promise.all([
    Lesson.find({ courseId: course.id }).sort({ order: 1 }),
    Testimonial.find({ courseId: course.id, status: "approved" }).sort({ createdAt: -1 }),
  ]);

  res.json({ ...course.toObject(), lessons, testimonials });
});
