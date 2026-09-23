import mongoose from "mongoose";

const reviewItemSchema = new mongoose.Schema(
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

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    interval: {
      type: Number,
      default: 0,
    },

    ease: {
      type: Number,
      default: 2.5,
      min: 1.3,
      max: 3.5,
    },

    reviews: {
      type: Number,
      default: 0,
    },

    lapses: {
      type: Number,
      default: 0,
    },

    nextReviewAt: {
      type: Date,
      required: true,
    },

    lastReviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewItemSchema.index(
  { user: 1, topic: 1 },
  { unique: true }
);

reviewItemSchema.index(
  { user: 1, nextReviewAt: 1 }
);

const ReviewItem = mongoose.model(
  "ReviewItem",
  reviewItemSchema
);

export default ReviewItem;