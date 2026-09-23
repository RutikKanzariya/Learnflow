import User from "../models/User.js";
import LessonProgress from "../models/LessonProgress.js";
import QuizAttempt from "../models/QuizAttempt.js";
import {
  CALCULATE_LEVEL,
  CALCULATE_NEXT_LEVEL_XP,
} from "../services/gamificationService.js";

const buildBadges = async (user) => {
  const badges = [];

  const completedLessons = await LessonProgress.countDocuments({
    user: user._id,
    completed: true,
  });

  const attempts = await QuizAttempt.find({
    user: user._id,
  });

  const totalQuestions = attempts.reduce(
    (sum, attempt) => sum + attempt.totalQuestions,
    0
  );

  const totalCorrect = attempts.reduce(
    (sum, attempt) => sum + attempt.score,
    0
  );

  const averageScore =
    totalQuestions === 0
      ? 0
      : Math.round(
          (totalCorrect / totalQuestions) * 100
        );

  if (user.xp >= 100) {
    badges.push({
      name: "XP Collector",
      description: "Earn 100 total XP",
      icon: "⭐",
    });
  }

  if (user.xp >= 500) {
    badges.push({
      name: "Dedicated Learner",
      description: "Earn 500 total XP",
      icon: "🏅",
    });
  }

  if (user.xp >= 1000) {
    badges.push({
      name: "Master Student",
      description: "Earn 1000 total XP",
      icon: "👑",
    });
  }

  if (completedLessons >= 1) {
    badges.push({
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "🚀",
    });
  }

  if (completedLessons >= 10) {
    badges.push({
      name: "Course Crusher",
      description: "Complete 10 lessons",
      icon: "📚",
    });
  }

  if (attempts.length >= 1) {
    badges.push({
      name: "Quiz Taker",
      description: "Attempt your first quiz",
      icon: "📝",
    });
  }

  if (attempts.length >= 10) {
    badges.push({
      name: "Quiz Champion",
      description: "Attempt 10 quizzes",
      icon: "🏆",
    });
  }

  if (averageScore >= 80) {
    badges.push({
      name: "Sharp Mind",
      description: "Maintain an 80% quiz average",
      icon: "🧠",
    });
  }

  if (user.currentStreak >= 3) {
    badges.push({
      name: "On Fire",
      description: "Reach a 3-day learning streak",
      icon: "🔥",
    });
  }

  if (user.longestStreak >= 7) {
    badges.push({
      name: "Unstoppable",
      description: "Reach a 7-day learning streak",
      icon: "⚡",
    });
  }

  return badges;
};

export const getMyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const level = CALCULATE_LEVEL(user.xp);

    const badges = await buildBadges(user);

    res.status(200).json({
      xp: user.xp,
      level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      nextLevelXp: CALCULATE_NEXT_LEVEL_XP(level),
      badges,
    });
  } catch (error) {
    console.error(
      "Gamification stats error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load gamification stats",
    });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 })
      .limit(20)
      .select(
        "name xp currentStreak longestStreak role"
      );

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      xp: user.xp,
      level: CALCULATE_LEVEL(user.xp),
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    }));

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error(
      "Leaderboard error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load leaderboard",
    });
  }
};