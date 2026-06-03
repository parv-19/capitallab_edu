import { Router } from "express";

import { Testimonial } from "../models/Testimonial.model";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/public",
  asyncHandler(async (req, res) => {
    const {
      studentName,
      designation,
      rating,
      review,
      courseId,
    } = req.body as {
      studentName?: string;
      designation?: string;
      rating?: number;
      review?: string;
      courseId?: string;
    };

    if (!studentName?.trim()) {
      return res.status(400).json({ message: "Student name is required." });
    }

    if (!designation?.trim()) {
      return res.status(400).json({ message: "Designation is required." });
    }

    if (!review?.trim()) {
      return res.status(400).json({ message: "Review is required." });
    }

    const normalizedRating = Number(rating);
    if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const testimonial = await Testimonial.create({
      studentName: studentName.trim(),
      designation: designation.trim(),
      courseId: courseId?.trim() || null,
      rating: normalizedRating,
      review: review.trim(),
      status: "pending",
      featured: false,
    });

    res.status(201).json({ testimonial });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.courseId) {
      filter.courseId = req.query.courseId;
    }

    if (req.query.featured) {
      filter.featured = req.query.featured === "true";
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;
    const query = Testimonial.find(filter).sort({ createdAt: -1 });
    if (limit > 0) {
      query.limit(limit);
    }

    const testimonials = await query;
    res.json(testimonials);
  }),
);

export default router;
