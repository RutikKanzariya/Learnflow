import { FormEvent, KeyboardEvent, useState } from "react";
import api from "../services/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: number;
};

function AITutor() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/ai/tutor", {
        question: trimmedQuestion,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources,
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error: any) {
      console.error("AI Tutor error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to get an answer from the AI Tutor."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!loading && question.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
  };

  return (
    <div className="dashboard">
      <div className="ai-tutor-header">
        <div>
          <p className="eyebrow">LEARNFLOW AI</p>
          <h1>🤖 AI Tutor</h1>
          <p>
            Ask questions about your learning material and get
            grounded explanations.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="secondary-button"
            onClick={clearChat}
          >
            Clear chat
          </button>
        )}
      </div>

      <section className="ai-chat-card">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <div className="empty-icon">🧠</div>

              <h2>What would you like to learn?</h2>

              <p>
                Ask the AI Tutor anything related to your course
                material.
              </p>

              <div className="suggestion-list">
                <button
                  type="button"
                  onClick={() =>
                    setQuestion("Explain the main concept in this lesson.")
                  }
                >
                  Explain the main concept
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("Give me an example of this concept.")
                  }
                >
                  Give me an example
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("What should I remember from this topic?")
                  }
                >
                  What should I remember?
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${
                message.role === "user"
                  ? "chat-message-user"
                  : "chat-message-assistant"
              }`}
            >
              <div className="chat-avatar">
                {message.role === "user" ? "👤" : "🤖"}
              </div>

              <div className="chat-bubble">
                <p>{message.content}</p>

                {message.role === "assistant" &&
                  message.sources !== undefined && (
                    <small>
                      Grounded in {message.sources} document
                      {message.sources !== 1 ? "s" : ""}.
                    </small>
                  )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-avatar">🤖</div>

              <div className="chat-bubble typing-bubble">
                <span>Thinking</span>
                <span className="typing-dots">...</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="ai-error">
            {error}
          </div>
        )}

        <form className="chat-input-area" onSubmit={handleAsk}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Tutor..."
            rows={2}
            maxLength={1000}
          />

          <div className="chat-input-footer">
            <span>
              {question.length}/1000 · Enter to send
            </span>

            <button
              type="submit"
              disabled={loading || !question.trim()}
            >
              {loading ? "Thinking..." : "Send →"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AITutor;