import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getDueReviews,
  getUpcomingReviews,
  createReview,
  reviewItem,
  deleteReview,
} from "../controllers/spacedRepetitionController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getDueReviews
);

router.get(
  "/upcoming",
  protect,
  getUpcomingReviews
);

router.post(
  "/",
  protect,
  createReview
);

router.post(
  "/:id/review",
  protect,
  reviewItem
);

router.delete(
  "/:id",
  protect,
  deleteReview
);

export default router;