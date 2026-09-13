import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getRecommendation,
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/", protect, getRecommendation);

export default router;