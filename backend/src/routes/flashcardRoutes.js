import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getFlashcardSets,
  getFlashcardSet,
  generateSetFromLesson,
  generateSetFromTopic,
  createManualSet,
  deleteFlashcardSet,
} from "../controllers/flashcardController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getFlashcardSets
);

router.get(
  "/:id",
  protect,
  getFlashcardSet
);

router.post(
  "/generate/lesson",
  protect,
  generateSetFromLesson
);

router.post(
  "/generate/topic",
  protect,
  generateSetFromTopic
);

router.post(
  "/",
  protect,
  createManualSet
);

router.delete(
  "/:id",
  protect,
  deleteFlashcardSet
);

export default router;