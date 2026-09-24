import {
  generateRoadmap,
  generateQuiz,
  askTutor,
} from "../services/aiService.js";

import Lesson from "../models/Lesson.js";
import Quiz from "../models/Quiz.js";

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export const uploadDocument = async (req, res) => {
  try {
    let fileBuffer;
    let fileName;

    if (req.file && req.file.buffer && req.file.buffer.length) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname || "upload.pdf";
    } else if (
      req.body &&
      Buffer.isBuffer(req.body) &&
      req.body.length > 0
    ) {
      fileBuffer = req.body;
      fileName = decodeURIComponent(
        req.headers["x-file-name"] || "upload.pdf"
      );
    } else {
      return res.status(400).json({
        message: "PDF file is required",
      });
    }

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([fileBuffer], { type: "application/pdf" }),
      fileName
    );

    const response = await fetch(`${AI_SERVICE_URL}/upload`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(180000),
    });

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      data = { message: responseText };
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error("PDF upload error:", error.message);

    res.status(502).json({
      message:
        "Failed to upload PDF. Make sure the AI (RAG) service is running.",
      detail: error.message,
    });
  }
};

export const createRoadmap = async (req, res) => {
  try {
    const { goal } = req.body || {};

    if (!goal || !goal.trim()) {
      return res.status(400).json({
        message: "Learning goal is required",
      });
    }

    const roadmap = await generateRoadmap(goal.trim());

    res.status(200).json(roadmap);
  } catch (error) {
    console.error("Roadmap generation error:", error.message);

    res.status(502).json({
      message: "Failed to generate roadmap",
      detail: error.message,
    });
  }
};

export const tutorQuestion = async (req, res) => {
  try {
    const { question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    const result = await askTutor(question.trim());

    res.status(200).json({
      question: question.trim(),
      answer: result.answer,
      sources: result.sources,
      type: result.type,
    });
  } catch (error) {
    console.error("Tutor error:", error.message);

    res.status(502).json({
      message: "Failed to answer question",
      detail: error.message,
    });
  }
};

export const createAIQuiz = async (req, res) => {
  try {
    const { lessonId, topic } = req.body || {};

    if (!lessonId || !topic || !topic.trim()) {
      return res.status(400).json({
        message: "lessonId and topic are required",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const result = await generateQuiz(topic.trim(), lesson.content);

    let parsedQuiz = result.quiz;

    // The RAG service returns a parsed JSON object,
    // but handle a raw JSON string as a fallback.
    if (typeof parsedQuiz === "string") {
      try {
        parsedQuiz = JSON.parse(parsedQuiz);
      } catch (error) {
        return res.status(502).json({
          message: "AI returned invalid quiz JSON",
        });
      }
    }

    if (
      !parsedQuiz ||
      !parsedQuiz.questions ||
      !Array.isArray(parsedQuiz.questions) ||
      parsedQuiz.questions.length === 0
    ) {
      return res.status(502).json({
        message: "AI returned an invalid quiz structure",
      });
    }

    const quiz = await Quiz.create({
      course: lesson.course,
      lesson: lesson._id,
      title: `${topic.trim()} AI Quiz`,
      questions: parsedQuiz.questions,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "AI quiz created successfully",
      quiz,
      sources: result.sources,
    });
  } catch (error) {
    console.error("AI quiz creation error:", error.message);

    res.status(502).json({
      message: "Failed to create AI quiz",
      detail: error.message,
    });
  }
};