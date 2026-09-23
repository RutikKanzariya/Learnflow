import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

type ReviewItem = {
  _id: string;
  topic: string;
  interval: number;
  ease: number;
  reviews: number;
  lapses: number;
  nextReviewAt: string;
};

function SpacedRepetition() {
  const [due, setDue] = useState<ReviewItem[]>([]);
  const [upcoming, setUpcoming] = useState<ReviewItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const [dueResponse, upcomingResponse] = await Promise.all([
        api.get("/reviews"),
        api.get("/reviews/upcoming"),
      ]);

      setDue(dueResponse.data);
      setUpcoming(upcomingResponse.data);
    } catch (error: any) {
      console.error("Reviews error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleGrade = async (grade: number) => {
    const item = due[current];

    if (!item || submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      await api.post(`/reviews/${item._id}/review`, {
        grade,
      });

      const nextList = [...due];
      nextList.splice(current, 1);
      setDue(nextList);

      if (current >= nextList.length) {
        setCurrent(0);
      }

      setRevealed(false);

      fetchReviews();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to save review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReview = async () => {
    if (!newTopic.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      await api.post("/reviews", {
        topic: newTopic.trim(),
      });

      setNewTopic("");
      setShowForm(false);
      setMessage("Review scheduled for today.");
      fetchReviews();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to schedule review"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    const item = due[current];

    if (!item) return;

    try {
      await api.delete(`/reviews/${item._id}`);

      const nextList = [...due];
      nextList.splice(current, 1);
      setDue(nextList);

      if (current >= nextList.length) {
        setCurrent(0);
      }

      fetchReviews();
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to remove review"
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading reviews...</p>
      </div>
    );
  }

  const activeItem = due[current];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">SPACED REPETITION</p>
          <h1>🔁 Review Queue</h1>
          <p>
            Reinforce what you learn right before you forget it.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
        >
          {showForm ? "Cancel" : "+ Add Topic"}
        </button>
      </header>

      {message && (
        <div className="ai-success">{message}</div>
      )}

      {error && <div className="ai-error">{error}</div>}

      {showForm && (
        <section className="review-add-card">
          <h2>Schedule a new review</h2>
          <p>Enter a topic you want to revise regularly.</p>

          <div className="review-form-row">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. Linear Regression"
              maxLength={200}
            />

            <button
              type="button"
              onClick={handleCreateReview}
              disabled={!newTopic.trim() || submitting}
            >
              Schedule
            </button>
          </div>
        </section>
      )}

      {activeItem ? (
        <section className="review-card">
          <div className="review-progress">
            <span>
              Card {current + 1} of {due.length}
            </span>

            <span>
              Reviews: {activeItem.reviews} · Interval:{" "}
              {activeItem.interval}d
            </span>
          </div>

          <div className="review-question">
            <h2>{activeItem.topic}</h2>
          </div>

          {!revealed ? (
            <div className="review-actions">
              <button type="button" onClick={() => setRevealed(true)}>
                Show Answer
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleRemove}
              >
                Stop Reviewing
              </button>
            </div>
          ) : (
            <>
              <div className="review-hint">
                Rate how well you remembered this topic.
              </div>

              <div className="grade-row">
                <button
                  type="button"
                  className="grade-again"
                  onClick={() => handleGrade(0)}
                  disabled={submitting}
                >
                  Again 😖
                </button>

                <button
                  type="button"
                  className="grade-hard"
                  onClick={() => handleGrade(1)}
                  disabled={submitting}
                >
                  Hard 😅
                </button>

                <button
                  type="button"
                  className="grade-good"
                  onClick={() => handleGrade(2)}
                  disabled={submitting}
                >
                  Good 🙂
                </button>

                <button
                  type="button"
                  className="grade-easy"
                  onClick={() => handleGrade(3)}
                  disabled={submitting}
                >
                  Easy 😎
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="review-empty">
          <div className="empty-icon">🐣</div>
          <h3>No reviews due today</h3>
          <p>
            You are all caught up. Schedule new topics to keep
            your knowledge fresh.
          </p>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SCHEDULE</p>
              <h2>Upcoming reviews</h2>
            </div>
          </div>

          <div className="review-list">
            {upcoming
              .filter((item) => item.nextReviewAt)
              .map((item) => (
                <div className="review-row" key={item._id}>
                  <div>
                    <strong>{item.topic}</strong>
                    <p>
                      {item.reviews} reviews · interval {item.interval}d
                    </p>
                  </div>

                  <div className="attempt-score">
                    <strong>
                      {new Date(item.nextReviewAt).toLocaleDateString()}
                    </strong>
                    <span>next</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SpacedRepetition;