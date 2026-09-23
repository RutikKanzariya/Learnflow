import ReviewItem from "../models/ReviewItem.js";
import Lesson from "../models/Lesson.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const scheduleNextReview = (item, grade) => {
  const now = Date.now();

  const easeDelta =
    grade === 0
      ? -0.2
      : grade === 3
      ? 0.15
      : 0;

  item.ease = Math.min(
    3.5,
    Math.max(1.3, item.ease + easeDelta)
  );

  if (grade === 0) {
    item.interval = 1;
    item.lapses += 1;
  } else if (grade === 1) {
    item.interval =
      item.reviews === 0
        ? 1
        : Math.max(1, Math.round(item.interval * 1.2));
  } else if (grade === 2) {
    if (item.reviews === 0) {
      item.interval = 1;
    } else if (item.reviews === 1) {
      item.interval = 3;
    } else {
      item.interval = Math.max(
        1,
        Math.round(item.interval * item.ease)
      );
    }
  } else {
    if (item.reviews === 0) {
      item.interval = 4;
    } else if (item.reviews === 1) {
      item.interval = 7;
    } else {
      item.interval = Math.max(
        1,
        Math.round(item.interval * item.ease * 1.3)
      );
    }
  }

  item.reviews += 1;
  item.lastReviewedAt = new Date(now);
  item.nextReviewAt = new Date(
    now + item.interval * DAY_IN_MS
  );
};

export const getDueReviews = async (req, res) => {
  try {
    const items = await ReviewItem.find({
      user: req.user._id,
      nextReviewAt: { $lte: new Date() },
    }).sort({ nextReviewAt: 1 });

    res.status(200).json(items);
  } catch (error) {
    console.error(
      "Get due reviews error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get due reviews",
    });
  }
};

export const getUpcomingReviews = async (req, res) => {
  try {
    const items = await ReviewItem.find({
      user: req.user._id,
    })
      .sort({ nextReviewAt: 1 })
      .limit(50);

    res.status(200).json(items);
  } catch (error) {
    console.error(
      "Get upcoming reviews error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get upcoming reviews",
    });
  }
};

export const createReview = async (req, res) => {
  try {
    const { topic, lessonId } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    let lesson = null;

    if (lessonId) {
      lesson = await Lesson.findById(lessonId);

      if (!lesson) {
        return res.status(404).json({
          message: "Lesson not found",
        });
      }
    }

    const item = await ReviewItem.findOneAndUpdate(
      {
        user: req.user._id,
        topic: topic.trim(),
      },
      {
        lesson: lessonId || null,
        topic: topic.trim(),
        interval: 0,
        ease: 2.5,
        reviews: 0,
        lapses: 0,
        nextReviewAt: new Date(),
        lastReviewedAt: null,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.status(201).json({
      message: "Review scheduled",
      item,
    });
  } catch (error) {
    console.error(
      "Create review error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create review",
    });
  }
};

export const reviewItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { grade } = req.body || {};

    if (![0, 1, 2, 3].includes(grade)) {
      return res.status(400).json({
        message: "Grade must be 0, 1, 2 or 3",
      });
    }

    const item = await ReviewItem.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    scheduleNextReview(item, grade);

    await item.save();

    res.status(200).json({
      message: "Review updated",
      item,
    });
  } catch (error) {
    console.error(
      "Review item error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to update review",
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ReviewItem.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Review not found",
      });
    }

    res.status(200).json({
      message: "Review removed",
    });
  } catch (error) {
    console.error(
      "Delete review error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to remove review",
    });
  }
};