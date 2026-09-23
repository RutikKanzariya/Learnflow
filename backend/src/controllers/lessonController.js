// import Lesson from "../models/Lesson.js";
// import Course from "../models/Course.js";
// import LessonProgress from "../models/LessonProgress.js";

// export const createLesson = async (req, res) => {
//   try {
//     const { courseId } = req.params;
//     const { title, content, order } = req.body || {};

//     if (!title || !content || order === undefined) {
//       return res.status(400).json({
//         message: "Title, content and order are required",
//       });
//     }

//     const course = await Course.findById(courseId);

//     if (!course) {
//       return res.status(404).json({
//         message: "Course not found",
//       });
//     }

//     const lesson = await Lesson.create({
//       course: courseId,
//       title,
//       content,
//       order,
//     });

//     res.status(201).json({
//       message: "Lesson created successfully",
//       lesson,
//     });
//   } catch (error) {
//     console.error("Create lesson error:", error.message);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// export const getCourseLessons = async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     const lessons = await Lesson.find({
//       course: courseId,
//     }).sort({ order: 1 });

//     res.status(200).json({
//       lessons,
//     });
//   } catch (error) {
//     console.error("Get lessons error:", error.message);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// export const getLesson = async (req, res) => {
//   try {
//     const { lessonId } = req.params;

//     const lesson = await Lesson.findById(lessonId);

//     if (!lesson) {
//       return res.status(404).json({
//         message: "Lesson not found",
//       });
//     }

//     res.status(200).json({
//       lesson,
//     });
//   } catch (error) {
//     console.error("Get lesson error:", error.message);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };


// export const completeLesson = async (req, res) => {
//   try {
//     const { lessonId } = req.params;

//     const lesson = await Lesson.findById(lessonId);

//     if (!lesson) {
//       return res.status(404).json({
//         message: "Lesson not found",
//       });
//     }

//     const progress = await LessonProgress.findOneAndUpdate(
//       {
//         user: req.user._id,
//         lesson: lessonId,
//       },
//       {
//         completed: true,
//         completedAt: new Date(),
//       },
//       {
//         new: true,
//         upsert: true,
//       }
//     );

//     res.status(200).json({
//       message: "Lesson completed successfully",
//       progress,
//     });
//   } catch (error) {
//     console.error("Complete lesson error:", error.message);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

// export const getCourseProgress = async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     const lessons = await Lesson.find({
//       course: courseId,
//     });

//     const totalLessons = lessons.length;

//     if (totalLessons === 0) {
//       return res.status(200).json({
//         courseId,
//         totalLessons: 0,
//         completedLessons: 0,
//         progressPercentage: 0,
//       });
//     }

//     const lessonIds = lessons.map((lesson) => lesson._id);

//     const completedProgress = await LessonProgress.countDocuments({
//       user: req.user._id,
//       lesson: { $in: lessonIds },
//       completed: true,
//     });

//     const progressPercentage = Math.round(
//       (completedProgress / totalLessons) * 100
//     );

//     res.status(200).json({
//       courseId,
//       totalLessons,
//       completedLessons: completedProgress,
//       progressPercentage,
//     });
//   } catch (error) {
//     console.error("Course progress error:", error.message);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };

import Lesson from "../models/Lesson.js";
import Course from "../models/Course.js";
import LessonProgress from "../models/LessonProgress.js";
import { awardXP } from "../services/gamificationService.js";

// Create a lesson
export const createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content, order } = req.body || {};

    if (!title || !content || order === undefined) {
      return res.status(400).json({
        message: "Title, content and order are required",
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const lesson = await Lesson.create({
      course: courseId,
      title: title.trim(),
      content,
      order,
    });

    res.status(201).json({
      message: "Lesson created successfully",
      lesson,
    });
  } catch (error) {
    console.error("Create lesson error:", error.message);

    res.status(500).json({
      message: "Failed to create lesson",
    });
  }
};

// Get all lessons for a course
export const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lessons = await Lesson.find({
      course: courseId,
    }).sort({ order: 1 });

    res.status(200).json({
      lessons,
    });
  } catch (error) {
    console.error(
      "Get course lessons error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get lessons",
    });
  }
};

// Get one lesson
export const getLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error("Get lesson error:", error.message);

    res.status(500).json({
      message: "Failed to get lesson",
    });
  }
};

// Complete a lesson
export const completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const progress = await LessonProgress.findOneAndUpdate(
      {
        user: req.user._id,
        lesson: lessonId,
      },
      {
        completed: true,
        completedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Award XP for completing a lesson
    await awardXP(req.user._id, 15);

    res.status(200).json({
      message: "Lesson completed successfully",
      progress,
    });
  } catch (error) {
    console.error(
      "Complete lesson error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to complete lesson",
    });
  }
};

// Get course progress
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const lessons = await Lesson.find({
      course: courseId,
    }).sort({ order: 1 });

    const lessonIds = lessons.map(
      (lesson) => lesson._id
    );

    const completedProgress = await LessonProgress.find({
      user: req.user._id,
      lesson: { $in: lessonIds },
      completed: true,
    });

    const completedLessonIds = completedProgress.map(
      (progress) => progress.lesson.toString()
    );

    const totalLessons = lessons.length;

    const completedLessons =
      completedLessonIds.length;

    const progressPercentage =
      totalLessons > 0
        ? Math.round(
            (completedLessons / totalLessons) * 100
          )
        : 0;

    res.status(200).json({
      totalLessons,
      completedLessons,
      progressPercentage,
      completedLessonIds,
    });
  } catch (error) {
    console.error(
      "Course progress error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to get course progress",
    });
  }
};