import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

type Flashcard = {
  _id: string;
  front: string;
  back: string;
};

type FlashcardSet = {
  _id: string;
  title: string;
  source: string;
  lesson?: { _id: string; title: string } | null;
  cards: Flashcard[];
  createdAt: string;
};

type PracticeState =
  | { view: "list" }
  | { view: "practice"; setId: string };

function Flashcards() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [activeSet, setActiveSet] = useState<FlashcardSet | null>(null);
  const [view, setView] = useState<PracticeState>({ view: "list" });
  const [topic, setTopic] = useState("");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSets = useCallback(async () => {
    try {
      const response = await api.get("/flashcards");
      setSets(response.data);
    } catch (error: any) {
      console.error("Flashcards error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load flashcards"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const openPractice = async (setId: string) => {
    try {
      setError("");

      const response = await api.get(`/flashcards/${setId}`);
      setActiveSet(response.data);
      setIndex(0);
      setFlipped(false);
      setView({ view: "practice", setId });
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to open flashcard set"
      );
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() || generating) return;

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/flashcards/generate/topic", {
        topic: topic.trim(),
      });

      const set = response.data.set;
      setSets((prev) => [set, ...prev]);
      setTopic("");
      setMessage("Flashcards generated!");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to generate flashcards"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (setId: string) => {
    try {
      await api.delete(`/flashcards/${setId}`);
      setSets((prev) => prev.filter((s) => s._id !== setId));
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to delete flashcard set"
      );
    }
  };

  const cards = activeSet?.cards || [];

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading flashcards...</p>
      </div>
    );
  }

  if (view.view === "practice" && activeSet) {
    const card = cards[index];

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">FLASHCARDS</p>
            <h1>{activeSet.title}</h1>
            <p>
              Card {index + 1} of {cards.length}
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setView({ view: "list" })}
          >
            ← Back
          </button>
        </header>

        <section
          className={`flashcard ${flipped ? "flashcard-flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-face">
              <div className="flashcard-faces">FRONT</div>
              <p>{flipped ? card.back : card.front}</p>
              <small>Click to flip</small>
            </div>
          </div>
        </section>

        <div className="flashcard-nav">
          <button
            type="button"
            className="secondary-button"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1);
              setFlipped(false);
            }}
          >
            ← Previous
          </button>

          <button
            type="button"
            disabled={index >= cards.length - 1}
            onClick={() => {
              setIndex(index + 1);
              setFlipped(false);
            }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">FLASHCARDS</p>
          <h1>🗂️ Flashcards</h1>
          <p>Generate flashcards from any topic and practice anywhere.</p>
        </div>
      </header>

      {message && <div className="ai-success">{message}</div>}
      {error && <div className="ai-error">{error}</div>}

      <section className="flashcard-create-card">
        <h2>Generate from a topic</h2>
        <p>The AI creates flashcards based on your topic.</p>

        <div className="review-form-row">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Neural Networks"
            maxLength={200}
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!topic.trim() || generating}
          >
            {generating ? "Generating..." : "🤖 Generate"}
          </button>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR DECKS</p>
            <h2>Flashcard sets</h2>
          </div>
        </div>

        <div className="stats-grid">
          {sets.map((set) => (
            <div className="stat-card" key={set._id}>
              <h3>{set.title}</h3>
              <p>
                {set.cards.length} cards
                {set.lesson?.title ? ` · ${set.lesson.title}` : ""}
              </p>

              <div className="flashcard-set-actions">
                <button
                  type="button"
                  onClick={() => openPractice(set._id)}
                >
                  Practice
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleDelete(set._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {sets.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🗂️</div>
            <h3>No flashcard sets yet</h3>
            <p>Generate a deck from a topic above to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Flashcards;