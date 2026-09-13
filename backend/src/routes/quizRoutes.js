import express from "express";

import {
  createQuiz,
  getQuiz,
  submitQuiz
} from "../controllers/quizController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/lesson/:lessonId",
  protect,
  createQuiz
);

router.get(
  "/:quizId",
  protect,
  getQuiz
);


router.post(
  "/:quizId/submit",
  protect,
  submitQuiz
);

export default router;