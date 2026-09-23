import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getMyNotes,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getMyNotes
);

router.post(
  "/",
  protect,
  createNote
);

router.put(
  "/:id",
  protect,
  updateNote
);

router.delete(
  "/:id",
  protect,
  deleteNote
);

export default router;