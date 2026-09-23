import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

type Note = {
  _id: string;
  title: string;
  content: string;
  lesson?: {
    _id: string;
    title: string;
    course?: { _id: string; title: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type Bookmark = {
  _id: string;
  lesson?: {
    _id: string;
    title: string;
    course?: { _id: string; title: string } | null;
  } | null;
  createdAt: string;
};

function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [notesResponse, bookmarksResponse] = await Promise.all([
        api.get("/notes"),
        api.get("/bookmarks"),
      ]);

      setNotes(notesResponse.data);
      setBookmarks(bookmarksResponse.data);
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to load your notes"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to delete note"
      );
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">YOUR STUDY MATERIAL</p>
          <h1>📒 Notes & Bookmarks</h1>
          <p>Save lessons and quick ideas for later review.</p>
        </div>
      </header>

      {error && <div className="ai-error">{error}</div>}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BOOKMARKS</p>
            <h2>Bookmarked lessons</h2>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Bookmark lessons from a course page to find them here.</p>
          </div>
        ) : (
          <div className="note-list">
            {bookmarks.map((bookmark) => (
              <div className="note-row" key={bookmark._id}>
                <div>
                  <strong>{bookmark.lesson?.title || "Lesson"}</strong>
                  {bookmark.lesson?.course && (
                    <p>{bookmark.lesson.course.title}</p>
                  )}
                </div>

                {bookmark.lesson?.course && (
                  <Link
                    to={`/courses/${bookmark.lesson.course._id}`}
                    className="note-open-link"
                  >
                    Open →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PERSONAL NOTES</p>
            <h2>Your notes</h2>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No notes yet</h3>
            <p>Take notes on a lesson page and they will appear here.</p>
          </div>
        ) : (
          <div className="note-list">
            {notes.map((note) => (
              <div className="note-row note-row-stack" key={note._id}>
                <div>
                  <strong>{note.title || note.lesson?.title || "Note"}</strong>
                  <p>{note.content}</p>
                  <small>
                    {note.lesson?.title
                      ? `From: ${note.lesson.title} · `
                      : ""}
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </small>
                </div>

                <div className="note-actions">
                  {note.lesson?.course && (
                    <Link to={`/courses/${note.lesson.course._id}`}>
                      Open lesson
                    </Link>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleDeleteNote(note._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notes;