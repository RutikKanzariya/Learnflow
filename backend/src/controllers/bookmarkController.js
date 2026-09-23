import Bookmark from "../models/Bookmark.js";
import Lesson from "../models/Lesson.js";

export const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
    })
      .populate({
        path: "lesson",
        select: "title course",
        populate: { path: "course", select: "title" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookmarks);
  } catch (error) {
    console.error(
      "Get bookmarks error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load bookmarks",
    });
  }
};

export const toggleBookmark = async (req, res) => {
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

    const existing = await Bookmark.findOneAndDelete({
      user: req.user._id,
      lesson: lessonId,
    });

    if (existing) {
      return res.status(200).json({
        bookmarked: false,
        message: "Bookmark removed",
      });
    }

    await Bookmark.create({
      user: req.user._id,
      lesson: lessonId,
    });

    res.status(201).json({
      bookmarked: true,
      message: "Lesson bookmarked",
    });
  } catch (error) {
    console.error(
      "Toggle bookmark error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to update bookmark",
    });
  }
};

export const isBookmarked = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      lesson: lessonId,
    });

    res.status(200).json({
      bookmarked: Boolean(bookmark),
    });
  } catch (error) {
    console.error(
      "Check bookmark error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to check bookmark",
    });
  }
};