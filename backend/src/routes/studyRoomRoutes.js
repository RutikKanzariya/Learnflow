import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getStudyRooms,
  createStudyRoom,
  joinStudyRoom,
  getRoomMessages,
  sendMessage,
} from "../controllers/studyRoomController.js";

const router = express.Router();

router.get(
  "/",
  protect,
  getStudyRooms
);

router.post(
  "/",
  protect,
  createStudyRoom
);

router.post(
  "/:id/join",
  protect,
  joinStudyRoom
);

router.get(
  "/:id/messages",
  protect,
  getRoomMessages
);

router.post(
  "/:id/messages",
  protect,
  sendMessage
);

export default router;