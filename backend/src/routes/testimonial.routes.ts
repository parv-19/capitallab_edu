import { Router } from "express";

import { Testimonial } from "../models/Testimonial.model";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

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
