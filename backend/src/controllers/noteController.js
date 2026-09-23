import Note from "../models/Note.js";
import Lesson from "../models/Lesson.js";

export const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.user._id,
    })
      .populate({
        path: "lesson",
        select: "title course",
        populate: { path: "course", select: "title" },
      })
      .sort({ updatedAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    console.error("Get notes error:", error.message);

    res.status(500).json({
      message: "Failed to load notes",
    });
  }
};

export const createNote = async (req, res) => {
  try {
    const { lessonId, title, content } =
      req.body || {};

    if (!lessonId) {
      return res.status(400).json({
        message: "lessonId is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Note content is required",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const note = await Note.create({
      user: req.user._id,
      lesson: lessonId,
      title: (title || "").trim(),
      content: content.trim(),
    });

    res.status(201).json({
      message: "Note saved",
      note,
    });
  } catch (error) {
    console.error(
      "Create note error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to save note",
    });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({
        message: "Note content is required",
      });
    }

    const note = await Note.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      {
        title: (title || "").trim(),
        content: content.trim(),
      },
      {
        new: true,
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json({
      message: "Note updated",
      note,
    });
  } catch (error) {
    console.error(
      "Update note error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to update note",
    });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json({
      message: "Note removed",
    });
  } catch (error) {
    console.error(
      "Delete note error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to remove note",
    });
  }
};