import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type DashboardData = {
  overview: {
    totalLessons: number;
    completedLessons: number;
    lessonProgress: number;
    totalQuizAttempts: number;
    averageQuizScore: number;
  };

  skills: {
    topic: string;
    mastery: number;
    questionsAttempted: number;
    questionsCorrect: number;
  }[];

  weakestSkill: {
    topic: string;
    mastery: number;
  } | null;

  strongestSkill: {
    topic: string;
    mastery: number;
  } | null;

  recentAttempts: {
    quizTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    completedAt: string;
  }[];
};

type Recommendation = {
  topic: string;
  mastery: number;
  priority: string;
  message: string;
};

function Dashboard() {
  const { user } = useAuth();

  const [data, setData] =
    useState<DashboardData | null>(null);

  const [recommendation, setRecommendation] =
    useState<Recommendation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const [
          dashboardResponse,
          recommendationResponse,
        ] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/recommendations"),
        ]);

        setData(dashboardResponse.data);

        setRecommendation(
          recommendationResponse.data
            .recommendation || null
        );
      } catch (error: any) {
        console.error(
          "Dashboard error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard">
        <p>No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* Header */}

      <header className="dashboard-header">
        <div>
          <p className="eyebrow">
            YOUR LEARNING SPACE
          </p>

          <h1>
            Welcome back, {user?.name}! 👋
          </h1>

          <p>
            Here's how you're progressing
            toward your learning goals.
          </p>
        </div>
      </header>


      {/* Recommendation */}

      {recommendation && (
        <section className="recommendation-card">
          <div>
            <p className="eyebrow">
              RECOMMENDED NEXT
            </p>

            <h2>
              Focus on {recommendation.topic}
            </h2>

            <p>
              {recommendation.message}
            </p>
          </div>

          <div className="recommendation-score">
            <strong>
              {recommendation.mastery}%
            </strong>

            <span>
              mastery
            </span>
          </div>
        </section>
      )}


      {/* Overview */}

      <section className="stats-grid">

        <div className="stat-card">
          <h3>Lesson Progress</h3>

          <strong>
            {data.overview.lessonProgress}%
          </strong>

          <p>
            {data.overview.completedLessons} /{" "}
            {data.overview.totalLessons} lessons
          </p>
        </div>


        <div className="stat-card">
          <h3>Average Quiz Score</h3>

          <strong>
            {data.overview.averageQuizScore}%
          </strong>

          <p>
            {data.overview.totalQuizAttempts}{" "}
            quiz attempts
          </p>
        </div>


        <div className="stat-card">
          <h3>Strongest Skill</h3>

          <strong>
            {data.strongestSkill?.topic ||
              "No data"}
          </strong>

          {data.strongestSkill && (
            <p>
              {data.strongestSkill.mastery}%
              mastery
            </p>
          )}
        </div>


        <div className="stat-card">
          <h3>Needs Practice</h3>

          <strong>
            {data.weakestSkill?.topic ||
              "No data"}
          </strong>

          {data.weakestSkill && (
            <p>
              {data.weakestSkill.mastery}%
              mastery
            </p>
          )}
        </div>

      </section>


      {/* Overall Progress */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">
              PROGRESS
            </p>

            <h2>
              Course completion
            </h2>
          </div>

          <strong>
            {data.overview.lessonProgress}%
          </strong>
        </div>

        <div className="progress-bar large">
          <div
            className="progress-fill"
            style={{
              width: `${data.overview.lessonProgress}%`,
            }}
          />
        </div>

        <p>
          Keep going — consistency is the key
          to learning.
        </p>

      </section>


      {/* Skill Mastery */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">
              SKILLS
            </p>

            <h2>
              Your skill mastery
            </h2>
          </div>
        </div>


        {data.skills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              🧠
            </div>

            <h3>
              Build your skill profile
            </h3>

            <p>
              Complete a quiz to start
              tracking your topic mastery.
            </p>
          </div>
        ) : (
          <div className="skills-list">

            {data.skills.map((skill) => (
              <div
                className="skill-row"
                key={skill.topic}
              >

                <div className="skill-header">

                  <div>
                    <span>
                      {skill.topic}
                    </span>

                    <small>
                      {skill.questionsCorrect} /{" "}
                      {skill.questionsAttempted}{" "}
                      correct
                    </small>
                  </div>

                  <strong>
                    {skill.mastery}%
                  </strong>

                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${skill.mastery}%`,
                    }}
                  />
                </div>

              </div>
            ))}

          </div>
        )}

      </section>


      {/* Recent Attempts */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="eyebrow">
              ACTIVITY
            </p>

            <h2>
              Recent quiz attempts
            </h2>
          </div>
        </div>


        {data.recentAttempts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              📝
            </div>

            <h3>
              No quiz attempts yet
            </h3>

            <p>
              Take your first quiz to start
              measuring your progress.
            </p>
          </div>
        ) : (
          <div className="attempt-list">

            {data.recentAttempts.map(
              (attempt, index) => (
                <div
                  className="attempt-row"
                  key={`${attempt.quizTitle}-${index}`}
                >

                  <div>
                    <strong>
                      {attempt.quizTitle}
                    </strong>

                    <p>
                      {attempt.score} /{" "}
                      {attempt.totalQuestions}{" "}
                      correct
                    </p>
                  </div>

                  <div className="attempt-score">
                    <strong>
                      {attempt.percentage}%
                    </strong>

                    <span>
                      Score
                    </span>
                  </div>

                </div>
              )
            )}

          </div>
        )}

      </section>

    </div>
  );
}

export default Dashboard;