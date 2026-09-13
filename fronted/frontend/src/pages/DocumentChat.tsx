import { useState } from "react";
import axios from "axios";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function DocumentChat() {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        "http://localhost:8000/upload",
        formData
      );

      setUploaded(true);
    } catch (error) {
      console.error(error);
      setError("Failed to upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    const userQuestion = question.trim();

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: userQuestion,
      },
    ]);

    setQuestion("");
    setAsking(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:8000/ask",
        {
          question: userQuestion,
        }
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.data.answer,
        },
      ]);
    } catch (error) {
      console.error(error);
      setError("Failed to get an answer.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="document-chat-page">
      <div className="document-chat-header">
        <h1>Chat with your PDF</h1>

        <p>
          Upload a document and ask questions about it.
        </p>
      </div>

      <div className="document-upload-card">
        <h2>Upload Document</h2>

        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(event) => {
            const selectedFile =
              event.target.files?.[0] || null;

            setFile(selectedFile);
            setUploaded(false);
            setError("");
          }}
        />

        {file && (
          <p>
            Selected: <strong>{file.name}</strong>
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>

        {uploaded && (
          <p className="upload-success">
            ✓ PDF uploaded successfully
          </p>
        )}
      </div>

      {uploaded && (
        <div className="document-chat-card">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <h3>Ask something about your document</h3>

                <p>
                  For example:
                </p>

                <p>
                  "Summarize the main points of this document."
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`chat-message ${message.role}`}
              >
                <div className="chat-bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {asking && (
              <div className="chat-message assistant">
                <div className="chat-bubble">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              placeholder="Ask a question about your PDF..."
              rows={3}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleAsk();
                }
              }}
            />

            <button
              type="button"
              onClick={handleAsk}
              disabled={!question.trim() || asking}
            >
              {asking ? "Asking..." : "Ask"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default DocumentChat;