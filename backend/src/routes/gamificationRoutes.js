import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMyStats,
  getLeaderboard,
} from "../controllers/gamificationController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getMyStats
);

router.get(
  "/leaderboard",
  protect,
  getLeaderboard
);

export default router;