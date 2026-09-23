import User from "../models/User.js";

const startOfDay = (date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

export const CALCULATE_LEVEL = (xp) => {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
};

export const CALCULATE_NEXT_LEVEL_XP = (level) => {
  return 50 * (level * level);
};

export const awardXP = async (userId, amount) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return null;
    }

    user.xp += amount;

    const today = startOfDay(new Date());

    const lastActive = user.lastActiveDate
      ? startOfDay(user.lastActiveDate)
      : null;

    if (!lastActive) {
      user.currentStreak = 1;
    } else if (lastActive.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive.getTime() === yesterday.getTime()) {
        user.currentStreak += 1;
      } else {
        user.currentStreak = 1;
      }
    }

    user.lastActiveDate = today;

    user.longestStreak = Math.max(
      user.longestStreak,
      user.currentStreak
    );

    await user.save();

    return user;
  } catch (error) {
    console.error("XP award error:", error.message);
    return null;
  }
};