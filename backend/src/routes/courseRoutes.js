import express from "express";
import requireRole from "../middleware/roleMiddleware.js";
import {
  createCourse,
  getCourses,
} from "../controllers/courseController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireRole("admin"),
  createCourse
);router.get("/", protect, getCourses);

export default router;