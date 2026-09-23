// import express from "express"
// import dotenv from "dotenv"
// import connectDB from "./config/db.js";
import dns from "dns";
// import courseRoutes from "./routes/courseRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import lessonRoutes from "./routes/lessonRoutes.js";
// import quizRoutes from "./routes/quizRoutes.js";
// import aiRoutes from "./routes/aiRoutes.js";
// import recommendationRoutes from "./routes/recommendationRoutes.js";
// import analyticsRoutes from "./routes/analyticsRoutes.js";
// import cors from "cors";


dns.setServers(["8.8.8.8", "8.8.4.4"]);


// dotenv.config();

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//   })
// );

// app.use(express.json());

// // Routes

// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/courses", courseRoutes);
// app.use("/api/v1/lessons", lessonRoutes);
// app.use("/api/v1/quizzes", quizRoutes);
// app.use("/api/v1/ai", aiRoutes);
// app.use(
//   "/api/v1/recommendations",
//   recommendationRoutes
// );
// app.use(
//   "/api/v1/analytics",
//   analyticsRoutes
// );

// app.get("/", (req, res) => {
//   res.json({
//     message: "LearnFlow API is running",
//   });
// });

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();

//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// };

// startServer();
import errorMiddleware from "./middleware/errorMiddleware.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import gamificationRoutes from "./routes/gamificationRoutes.js";
import spacedRepetitionRoutes from "./routes/spacedRepetitionRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import studyRoomRoutes from "./routes/studyRoomRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";

import {
  generalLimiter,
} from "./middleware/rateLimitMiddleware.js";

dotenv.config();

const app = express();

/*
  Security headers
*/
app.use(helmet());

/*
  Allow requests from the frontend.

  FRONTEND_URL (and ALLOWED_ORIGINS) may each be a single origin
  or a comma-separated list (e.g. for local + production).

  Vercel creates a new hostname per branch/PR preview deploy, so any
  subdomain of our vercel.app project (learnflow-*.vercel.app) is
  also allowed.
*/
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || "http://localhost:5173").split(","),
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
]
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) ||
  /^https:\/\/learnflow(-git-[a-z0-9-]+)?\.vercel\.app$/.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  })
);

/*
  Parse JSON requests.

  Limit request body size to prevent
  unnecessarily large payloads.
*/
app.use(
  express.json({
    limit: "100kb",
  })
);

/*
  General API rate limiting
*/
app.use("/api", generalLimiter);

/*
  API routes
*/
app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/courses",
  courseRoutes
);

app.use(
  "/api/v1/lessons",
  lessonRoutes
);

app.use(
  "/api/v1/quizzes",
  quizRoutes
);

app.use(
  "/api/v1/ai",
  aiRoutes
);

app.use(
  "/api/v1/recommendations",
  recommendationRoutes
);

app.use(
  "/api/v1/analytics",
  analyticsRoutes
);

app.use(
  "/api/v1/gamification",
  gamificationRoutes
);

app.use(
  "/api/v1/reviews",
  spacedRepetitionRoutes
);

app.use(
  "/api/v1/flashcards",
  flashcardRoutes
);

app.use(
  "/api/v1/study-rooms",
  studyRoomRoutes
);

app.use(
  "/api/v1/notes",
  noteRoutes
);

app.use(
  "/api/v1/bookmarks",
  bookmarkRoutes
);

/*
  Health check
*/
app.get("/", (req, res) => {
  res.json({
    message: "LearnFlow API is running",
  });
});

/*
  Handle unknown routes
*/
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();