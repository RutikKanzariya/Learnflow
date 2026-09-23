import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

type Room = {
  _id: string;
  name: string;
  topic: string;
  description: string;
  createdBy: { _id: string; name: string } | null;
  memberCount: number;
  messageCount: number;
  createdAt: string;
};

type Message = {
  _id: string;
  user: { _id: string; name: string } | null;
  text: string;
  createdAt: string;
};

type View =
  | { name: "list" }
  | { name: "room"; roomId: string };

function StudyRooms() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [view, setView] = useState<View>({ name: "list" });
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    topic: "",
    description: "",
  });
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.get("/study-rooms");
      setRooms(response.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to load study rooms"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openRoom = async (roomId: string) => {
    try {
      setError("");

      const response = await api.get(`/study-rooms/${roomId}/messages`);

      setActiveRoom(response.data.room);
      setMessages(response.data.messages);
      setView({ name: "room", roomId });
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to open study room"
      );
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await api.post("/study-rooms", {
        name: form.name.trim(),
        topic: form.topic.trim(),
        description: form.description.trim(),
      });

      const room = response.data.room;

      setRooms((prev) => [
        { ...room, createdBy: user || null, memberCount: 1, messageCount: 0 },
        ...prev,
      ]);

      setShowCreate(false);
      setForm({ name: "", topic: "", description: "" });
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to create study room"
      );
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await api.post(
        `/study-rooms/${activeRoom._id}/messages`,
        {
          text: newMessage.trim(),
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          _id: response.data.msg._id,
          user: { _id: user?._id || "", name: user?.name || "" },
          text: newMessage.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);

      setNewMessage("");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading study rooms...</p>
      </div>
    );
  }

  if (view.name === "room" && activeRoom) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">STUDY ROOM</p>
            <h1>{activeRoom.name}</h1>
            <p>
              {activeRoom.topic
                ? `Topic: ${activeRoom.topic}`
                : "Ask questions and discuss with fellow learners."}
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setView({ name: "list" })}
          >
            ← Back
          </button>
        </header>

        {error && <div className="ai-error">{error}</div>}

        <section className="room-chat-card">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <h3>Say hello! 👋</h3>
                <p>Start the discussion with your first question.</p>
              </div>
            )}

            {messages.map((message) => {
              const isMe = message.user?._id === user?._id;

              return (
                <div
                  key={message._id}
                  className={`chat-message ${
                    isMe
                      ? "chat-message-user"
                      : "chat-message-assistant"
                  }`}
                >
                  <div className="chat-avatar">
                    {isMe ? "👤" : "🧑‍🎓"}
                  </div>

                  <div className="chat-bubble">
                    <strong>
                      {isMe ? "You" : message.user?.name || "User"}
                    </strong>
                    <p>{message.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-input-area">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? "Sending..." : "Send →"}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">COLLABORATION</p>
          <h1>👥 Study Rooms</h1>
          <p>Join a room to discuss topics and clear doubts together.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowCreate(!showCreate);
            setError("");
          }}
        >
          {showCreate ? "Cancel" : "+ New Room"}
        </button>
      </header>

      {error && <div className="ai-error">{error}</div>}

      {showCreate && (
        <section className="review-add-card">
          <h2>Create a study room</h2>

          <input
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            placeholder="Room name (required)"
            maxLength={100}
          />

          <input
            type="text"
            value={form.topic}
            onChange={(e) =>
              setForm({ ...form, topic: e.target.value })
            }
            placeholder="Topic (optional)"
            maxLength={100}
          />

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Description (optional)"
            rows={2}
            maxLength={300}
          />

          <button
            type="button"
            onClick={handleCreate}
            disabled={!form.name.trim() || sending}
          >
            Create Room
          </button>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ALL ROOMS</p>
            <h2>Discussion rooms</h2>
          </div>
        </div>

        <div className="stats-grid">
          {rooms.map((room) => (
            <div className="stat-card" key={room._id}>
              <h3>{room.name}</h3>

              {room.topic && <p>Topic: {room.topic}</p>}
              {room.description && <p>{room.description}</p>}

              <p className="room-meta">
                👥 {room.memberCount} members · 💬 {room.messageCount}{" "}
                messages
              </p>

              <div className="flashcard-set-actions">
                <button type="button" onClick={() => openRoom(room._id)}>
                  Join Room
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No study rooms yet</h3>
            <p>Create the first room and invite your classmates.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default StudyRooms;