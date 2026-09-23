import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMyBookmarks,
  toggleBookmark,
  isBookmarked,
} from "../controllers/bookmarkController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getMyBookmarks
);

router.post(
  "/",
  protect,
  toggleBookmark
);

router.get(
  "/lesson/:lessonId",
  protect,
  isBookmarked
);

export default router;