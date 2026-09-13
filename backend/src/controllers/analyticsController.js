import Lesson from "../models/Lesson.js";
import LessonProgress from "../models/LessonProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import SkillProfile from "../models/SkillProfile.js";

export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // -----------------------------
    // Lesson progress
    // -----------------------------

    const totalLessons = await Lesson.countDocuments();

    const completedLessons = await LessonProgress.countDocuments({
      user: userId,
      completed: true,
    });

    const lessonProgress =
      totalLessons === 0
        ? 0
        : Math.round((completedLessons / totalLessons) * 100);

    // -----------------------------
    // Quiz performance
    // -----------------------------

    const attempts = await QuizAttempt.find({
      user: userId,
    })
      .populate("quiz", "title")
      .sort({ createdAt: -1 });

    const totalAttempts = attempts.length;

    const totalQuestions = attempts.reduce(
      (sum, attempt) => sum + attempt.totalQuestions,
      0
    );

    const totalCorrect = attempts.reduce(
      (sum, attempt) => sum + attempt.score,
      0
    );

    const averageQuizScore =
      totalQuestions === 0
        ? 0
        : Math.round((totalCorrect / totalQuestions) * 100);

    // -----------------------------
    // Skill mastery
    // -----------------------------

    const skills = await SkillProfile.find({
      user: userId,
    }).sort({ mastery: 1 });

    const weakestSkill = skills.length > 0 ? skills[0] : null;

    const strongestSkill =
      skills.length > 0
        ? skills[skills.length - 1]
        : null;

    // -----------------------------
    // Recent attempts
    // -----------------------------

    const recentAttempts = attempts.slice(0, 5).map((attempt) => ({
      quizTitle: attempt.quiz?.title || "Quiz",
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage:
        attempt.totalQuestions === 0
          ? 0
          : Math.round(
              (attempt.score / attempt.totalQuestions) * 100
            ),
      completedAt: attempt.createdAt,
    }));

    // -----------------------------
    // Response
    // -----------------------------

    res.status(200).json({
      overview: {
        totalLessons,
        completedLessons,
        lessonProgress,
        totalQuizAttempts: totalAttempts,
        averageQuizScore,
      },

      skills: skills.map((skill) => ({
        topic: skill.topic,
        mastery: Math.round(skill.mastery),
        questionsAttempted: skill.questionsAttempted,
        questionsCorrect: skill.questionsCorrect,
      })),

      weakestSkill: weakestSkill
        ? {
            topic: weakestSkill.topic,
            mastery: Math.round(weakestSkill.mastery),
          }
        : null,

      strongestSkill: strongestSkill
        ? {
            topic: strongestSkill.topic,
            mastery: Math.round(strongestSkill.mastery),
          }
        : null,

      recentAttempts,
    });
  } catch (error) {
    console.error(
      "Dashboard analytics error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};