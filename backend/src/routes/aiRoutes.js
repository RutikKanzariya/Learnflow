// // import express from "express";
// // import protect from "../middleware/authMiddleware.js";
// // import { createRoadmap,tutorQuestion,createAIQuiz } from "../controllers/aiController.js";

// // const router = express.Router();

// // router.post("/roadmap", protect, createRoadmap);
// // router.post("/tutor",protect,tutorQuestion);
// // router.post("/quiz", protect, createAIQuiz);
// // export default router;

// import express from "express";

// import protect from "../middleware/authMiddleware.js";

// import {
//   aiLimiter,
// } from "../middleware/rateLimitMiddleware.js";

// import {
//   createRoadmap,
//   tutorQuestion,
//   createAIQuiz,
// } from "../controllers/aiController.js";

// const router = express.Router();

// /*
//   All AI endpoints require:
//   1. Valid JWT
//   2. AI-specific rate limit
// */

// router.post(
//   "/roadmap",
//   protect,
//   aiLimiter,
//   createRoadmap
// );

// router.post(
//   "/tutor",
//   protect,
//   aiLimiter,
//   tutorQuestion
// );

// router.post(
//   "/quiz",
//   protect,
//   aiLimiter,
//   createAIQuiz
// );

// export default router;

import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  aiLimiter,
} from "../middleware/rateLimitMiddleware.js";

import validate from "../middleware/validateMiddleware.js";

import {
  tutorSchema,
  roadmapSchema,
  aiQuizSchema,
} from "../validators/aiValidator.js";

import {
  createRoadmap,
  tutorQuestion,
  createAIQuiz,
  uploadDocument,
} from "../controllers/aiController.js";

const router = express.Router();

router.post(
  "/roadmap",
  protect,
  aiLimiter,
  validate(roadmapSchema),
  createRoadmap
);

router.post(
  "/tutor",
  protect,
  aiLimiter,
  validate(tutorSchema),
  tutorQuestion
);

router.post(
  "/quiz",
  protect,
  aiLimiter,
  validate(aiQuizSchema),
  createAIQuiz
);

router.post(
  "/upload",
  protect,
  aiLimiter,
  express.raw({
    type: "application/pdf",
    limit: "10mb",
  }),
  uploadDocument
);

export default router;