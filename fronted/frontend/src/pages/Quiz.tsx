import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

type Question = {
  _id: string;
  question: string;
  options: string[];
  topic: string;
};

type Quiz = {
  _id: string;
  title: string;
  questions: Question[];
};

function Quiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quizzes/${quizId}`);
        setQuiz(response.data.quiz || response.data);
      } catch (error: any) {
        console.error("Quiz error:", error);
        setError(
          error.response?.data?.message || "Failed to load quiz"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswer = (
    questionId: string,
    answer: string
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || submitting) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formattedAnswers = quiz.questions.map((question) => ({
        questionId: question._id,
        answer: answers[question._id],
      }));

      const response = await api.post(
        `/quizzes/${quiz._id}/submit`,
        {
          answers: formattedAnswers,
        }
      );

      setResult(response.data);
    } catch (error: any) {
      console.error("Quiz submission error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to submit quiz"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="dashboard">
        <p>{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="dashboard">
        <p>Quiz not found.</p>
      </div>
    );
  }

  if (result) {
    const percentage =
      result.percentage ??
      Math.round(
        (result.score / result.totalQuestions) * 100
      );

    return (
      <div className="dashboard">
        <section className="quiz-result-card">
          <p className="eyebrow">QUIZ COMPLETE</p>

          <h1>🎉 Great job!</h1>

          <div className="quiz-result-score">
            {percentage}%
          </div>

          <p>
            You answered{" "}
            <strong>{result.score}</strong> out of{" "}
            <strong>{result.totalQuestions}</strong> questions
            correctly.
          </p>

          <div className="quiz-result-actions">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/")}
            >
              Back to Courses
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="quiz-header">
        <div>
          <p className="eyebrow">KNOWLEDGE CHECK</p>
          <h1>{quiz.title}</h1>
          <p>
            Test your understanding and improve your skill
            profile.
          </p>
        </div>

        <div className="quiz-progress-summary">
          {Object.keys(answers).length} /{" "}
          {quiz.questions.length} answered
        </div>
      </header>

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      <div className="quiz-list">
        {quiz.questions.map((question, index) => (
          <section
            className="quiz-question-card"
            key={question._id}
          >
            <div className="quiz-question-header">
              <span>Question {index + 1}</span>
              <small>{question.topic}</small>
            </div>

            <h2>{question.question}</h2>

            <div className="quiz-options">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`quiz-option ${
                    answers[question._id] === option
                      ? "quiz-option-selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={option}
                    checked={
                      answers[question._id] === option
                    }
                    onChange={() =>
                      handleAnswer(
                        question._id,
                        option
                      )
                    }
                  />

                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="quiz-submit-area">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? "Submitting..."
            : "Submit Quiz →"}
        </button>
      </div>
    </div>
  );
}

export default Quiz;