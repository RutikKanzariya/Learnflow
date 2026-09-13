import Course from "../models/Course.js";

export const createCourse = async (req, res) => {
  try {
    const { title, description, topics } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    const course = await Course.create({
      title,
      description,
      topics: topics || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      courses,
    });
  } catch (error) {
    console.error("Get courses error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};