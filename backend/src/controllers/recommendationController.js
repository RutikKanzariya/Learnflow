import SkillProfile from "../models/SkillProfile.js";

export const getRecommendation = async (req, res) => {
  try {
    const profiles = await SkillProfile.find({
      user: req.user._id,
    }).sort({ mastery: 1 });

    if (profiles.length === 0) {
      return res.status(200).json({
        message: "Complete a quiz to get personalized recommendations.",
        recommendation: null,
      });
    }

    const weakestTopic = profiles[0];

    let recommendation;

    if (weakestTopic.mastery < 40) {
      recommendation = {
        topic: weakestTopic.topic,
        mastery: Math.round(weakestTopic.mastery),
        priority: "high",
        message: `You should focus on ${weakestTopic.topic}. Your current mastery is low.`,
      };
    } else if (weakestTopic.mastery < 70) {
      recommendation = {
        topic: weakestTopic.topic,
        mastery: Math.round(weakestTopic.mastery),
        priority: "medium",
        message: `You should practice ${weakestTopic.topic} to improve your mastery.`,
      };
    } else {
      recommendation = {
        topic: weakestTopic.topic,
        mastery: Math.round(weakestTopic.mastery),
        priority: "low",
        message: `Review ${weakestTopic.topic} to strengthen your understanding.`,
      };
    }

    res.status(200).json({
      recommendation,
      allSkills: profiles.map((profile) => ({
        topic: profile.topic,
        mastery: Math.round(profile.mastery),
        questionsAttempted: profile.questionsAttempted,
        questionsCorrect: profile.questionsCorrect,
      })),
    });
  } catch (error) {
    console.error("Recommendation error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};