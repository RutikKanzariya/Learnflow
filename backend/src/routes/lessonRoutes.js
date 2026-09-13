import express from "express";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createLesson,
  getCourseLessons,
  getLesson,
  completeLesson,
  getCourseProgress
} from "../controllers/lessonController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// router.post("/course/:courseId", protect, createLesson);
router.post(
  "/course/:courseId",
  protect,
  requireRole("admin"),
  createLesson
);

router.get("/course/:courseId", protect, getCourseLessons);
router.get("/course/:courseId/progress", protect, getCourseProgress);
router.get("/:lessonId", protect, getLesson);
router.post("/:lessonId/complete", protect, completeLesson);
export default router;