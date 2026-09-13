import mongoose from "mongoose";

const skillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    topic: {
      type: String,
      required: true,
      trim: true,
    },

    mastery: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    questionsAttempted: {
      type: Number,
      default: 0,
    },

    questionsCorrect: {
      type: Number,
      default: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

skillProfileSchema.index(
  { user: 1, topic: 1 },
  { unique: true }
);

const SkillProfile = mongoose.model(
  "SkillProfile",
  skillProfileSchema
);

export default SkillProfile;