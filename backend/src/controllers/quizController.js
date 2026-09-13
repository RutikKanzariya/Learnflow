import Quiz from "../models/Quiz.js";
import Lesson from "../models/Lesson.js";
import QuizAttempt from "../models/QuizAttempt.js";
import SkillProfile from "../models/SkillProfile.js";

export const createQuiz = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, questions } = req.body || {};

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        message: "Title and questions are required",
      });
    }

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const quiz = await Quiz.create({
      course: lesson.course,
      lesson: lessonId,
      title,
      questions,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz,
    });
  } catch (error) {
    console.error("Create quiz error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).lean();

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Remove correct answers before sending quiz to the student
    quiz.questions = quiz.questions.map((question) => {
      const { correctAnswer, ...safeQuestion } = question;
      return safeQuestion;
    });

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Get quiz error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
/*
export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body || {};

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers are required",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    let correctCount = 0;

    const evaluatedAnswers = quiz.questions.map((question) => {
      const submittedAnswer = answers.find(
        (answer) => answer.questionId === question._id.toString()
      );

      const answer = submittedAnswer?.answer || "";

      const correct =
        answer === question.correctAnswer;

      if (correct) {
        correctCount++;
      }

      return {
        questionId: question._id.toString(),
        answer,
        correct,
      };
    });

    const totalQuestions = quiz.questions.length;

    const score = Math.round(
      (correctCount / totalQuestions) * 100
    );

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quizId,
      answers: evaluatedAnswers,
      score,
      totalQuestions,
    });

    res.status(200).json({
      message: "Quiz submitted successfully",
      result: {
        score,
        correctAnswers: correctCount,
        totalQuestions,
        attemptId: attempt._id,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
*/

export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body || {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: "Answers are required",
      });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    let score = 0;

    const topicStats = {};

    const evaluatedAnswers = quiz.questions.map((question) => {
      const submitted = answers.find(
        (answer) => answer.questionId === question._id.toString()
      );

      const selectedAnswer = submitted?.answer || "";

      const isCorrect =
        selectedAnswer.trim() === question.correctAnswer.trim();

      if (isCorrect) {
        score++;
      }

      if (!topicStats[question.topic]) {
        topicStats[question.topic] = {
          attempted: 0,
          correct: 0,
        };
      }

      topicStats[question.topic].attempted++;

      if (isCorrect) {
        topicStats[question.topic].correct++;
      }

      return {
        questionId: question._id.toString(),
        answer: selectedAnswer,
        correct: isCorrect,
      };
    });

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: evaluatedAnswers,
      score,
      totalQuestions: quiz.questions.length,
    });

    // Update topic-level mastery
    for (const [topic, stats] of Object.entries(topicStats)) {
      const profile = await SkillProfile.findOne({
        user: req.user._id,
        topic,
      });

      if (profile) {
        profile.questionsAttempted += stats.attempted;
        profile.questionsCorrect += stats.correct;

        profile.mastery =
          (profile.questionsCorrect / profile.questionsAttempted) * 100;

        profile.lastUpdated = new Date();

        await profile.save();
      } else {
        await SkillProfile.create({
          user: req.user._id,
          topic,
          questionsAttempted: stats.attempted,
          questionsCorrect: stats.correct,
          mastery:
            (stats.correct / stats.attempted) * 100,
        });
      }
    }

    res.status(201).json({
      message: "Quiz submitted successfully",
      score,
      totalQuestions: quiz.questions.length,
      percentage: Math.round(
        (score / quiz.questions.length) * 100
      ),
      attempt,
    });
  } catch (error) {
    console.error("Submit quiz error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};