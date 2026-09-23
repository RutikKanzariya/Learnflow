import FlashcardSet from "../models/FlashcardSet.js";
import Lesson from "../models/Lesson.js";
import { generateFlashcards } from "../services/aiService.js";

export const getFlashcardSets = async (req, res) => {
  try {
    const sets = await FlashcardSet.find({
      user: req.user._id,
    })
      .populate("lesson", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(sets);
  } catch (error) {
    console.error(
      "Get flashcard sets error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load flashcards",
    });
  }
};

export const getFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;

    const set = await FlashcardSet.findOne({
      _id: id,
      user: req.user._id,
    }).populate("lesson", "title");

    if (!set) {
      return res.status(404).json({
        message: "Flashcard set not found",
      });
    }

    res.status(200).json(set);
  } catch (error) {
    console.error(
      "Get flashcard set error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load flashcard set",
    });
  }
};

export const generateSetFromLesson = async (req, res) => {
  try {
    const { lessonId } = req.body || {};

    if (!lessonId) {
      return res.status(400).json({
        message: "lessonId is required",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const result = await generateFlashcards(
      lesson.title,
      lesson.content
    );

    if (
      !Array.isArray(result.cards) ||
      result.cards.length === 0
    ) {
      return res.status(502).json({
        message:
          "AI returned invalid flashcards structure",
      });
    }

    const set = await FlashcardSet.create({
      user: req.user._id,
      lesson: lesson._id,
      title: `${lesson.title} Flashcards`,
      source: "lesson",
      cards: result.cards,
    });

    res.status(201).json({
      message: "Flashcards generated successfully",
      set,
    });
  } catch (error) {
    console.error(
      "Generate flashcards error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to generate flashcards",
    });
  }
};

export const generateSetFromTopic = async (req, res) => {
  try {
    const { topic } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    const result = await generateFlashcards(
      topic.trim(),
      ""
    );

    if (
      !Array.isArray(result.cards) ||
      result.cards.length === 0
    ) {
      return res.status(502).json({
        message:
          "AI returned invalid flashcards structure",
      });
    }

    const set = await FlashcardSet.create({
      user: req.user._id,
      title: `${topic.trim()} Flashcards`,
      source: "topic",
      cards: result.cards,
    });

    res.status(201).json({
      message: "Flashcards generated successfully",
      set,
    });
  } catch (error) {
    console.error(
      "Generate topic flashcards error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to generate flashcards",
    });
  }
};

export const createManualSet = async (req, res) => {
  try {
    const { title, cards } = req.body || {};

    if (
      !title ||
      !title.trim() ||
      !Array.isArray(cards) ||
      cards.length === 0
    ) {
      return res.status(400).json({
        message:
          "Title and cards are required",
      });
    }

    const cleanCards = cards.map((card) => ({
      front:
        (card.front || "").toString().trim(),
      back:
        (card.back || "").toString().trim(),
    }));

    if (cleanCards.some((card) => !card.front || !card.back)) {
      return res.status(400).json({
        message:
          "Every card needs a front and back",
      });
    }

    const set = await FlashcardSet.create({
      user: req.user._id,
      title: title.trim(),
      source: "manual",
      cards: cleanCards,
    });

    res.status(201).json({
      message: "Flashcard set created",
      set,
    });
  } catch (error) {
    console.error(
      "Create manual flashcards error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create flashcards",
    });
  }
};

export const deleteFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;

    const set = await FlashcardSet.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!set) {
      return res.status(404).json({
        message: "Flashcard set not found",
      });
    }

    res.status(200).json({
      message: "Flashcard set removed",
    });
  } catch (error) {
    console.error(
      "Delete flashcards error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to remove flashcards",
    });
  }
};