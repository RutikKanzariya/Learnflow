import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

type MyStats = {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  nextLevelXp: number;
  badges: {
    name: string;
    description: string;
    icon: string;
  }[];
};

type LeaderboardUser = {
  rank: number;
  name: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
};

function Leaderboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<MyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, leaderboardResponse] =
          await Promise.all([
            api.get("/gamification"),
            api.get("/gamification/leaderboard"),
          ]);

        setStats(statsResponse.data);
        setLeaderboard(leaderboardResponse.data);
      } catch (error: any) {
        console.error("Leaderboard error:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load leaderboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading leaderboard...</p>
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

  const levelProgress =
    stats && stats.nextLevelXp > 0
      ? Math.min(
          100,
          Math.round(
            ((stats.xp % stats.nextLevelXp) / stats.nextLevelXp) * 100
          )
        )
      : 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">GAMIFICATION</p>
          <h1>🏆 Leaderboard</h1>
          <p>Complete lessons and quizzes to earn XP and beat your streak.</p>
        </div>
      </header>

      {stats && (
        <section className="stats-grid">
          <div className="stat-card">
            <h3>Total XP</h3>
            <strong>{stats.xp}</strong>
            <p>Level {stats.level}</p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${levelProgress}%` }}
              />
            </div>

            <p>{stats.nextLevelXp - (stats.xp % stats.nextLevelXp)} XP to next level</p>
          </div>

          <div className="stat-card">
            <h3>Current Streak</h3>
            <strong>🔥 {stats.currentStreak} day{stats.currentStreak !== 1 ? "s" : ""}</strong>
            <p>Longest: {stats.longestStreak} day{stats.longestStreak !== 1 ? "s" : ""}</p>
          </div>

          <div className="stat-card">
            <h3>Badges Earned</h3>
            <strong>{stats.badges.length}</strong>
            <p>Keep learning to unlock more</p>
          </div>
        </section>
      )}

      {stats && stats.badges.length > 0 && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACHIEVEMENTS</p>
              <h2>Your badges</h2>
            </div>
          </div>

          <div className="badge-grid">
            {stats.badges.map((badge) => (
              <div className="badge-card" key={badge.name}>
                <div className="badge-icon">{badge.icon}</div>
                <strong>{badge.name}</strong>
                <p>{badge.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TOP LEARNERS</p>
            <h2>Rankings</h2>
          </div>
        </div>

        <div className="leaderboard-list">
          {leaderboard.map((entry) => {
            const isMe = user?.name === entry.name;

            return (
              <div
                className={`leaderboard-row ${isMe ? "leaderboard-row-me" : ""}`}
                key={`${entry.rank}-${entry.name}`}
              >
                <span className="leaderboard-rank">
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                </span>

                <span className="leaderboard-name">
                  {entry.name}
                  {isMe && <small> (you)</small>}
                </span>

                <span className="leaderboard-level">Lv {entry.level}</span>

                <span className="leaderboard-streak">🔥 {entry.currentStreak}</span>

                <span className="leaderboard-xp">
                  <strong>{entry.xp}</strong> XP
                </span>
              </div>
            );
          })}
        </div>

        {leaderboard.length === 0 && (
          <p>No learners on the leaderboard yet.</p>
        )}
      </section>
    </div>
  );
}

export default Leaderboard;