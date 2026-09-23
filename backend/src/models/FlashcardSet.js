import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  front: {
    type: String,
    required: true,
    trim: true,
  },

  back: {
    type: String,
    required: true,
    trim: true,
  },
});

const flashcardSetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    source: {
      type: String,
      enum: ["lesson", "manual", "topic"],
      default: "lesson",
    },

    cards: {
      type: [cardSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FlashcardSet = mongoose.model(
  "FlashcardSet",
  flashcardSetSchema
);

export default FlashcardSet;