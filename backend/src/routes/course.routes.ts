import { Router } from "express";

import { getCourseBySlug, listCourses } from "../controllers/course.controller";

const router = Router();

router.get("/", listCourses);
router.get("/:slug", getCourseBySlug);

export default router;
