import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

type Course = {
  _id: string;
  title: string;
  description: string;
  topics: string[];
};

type Lesson = {
  _id: string;
  title: string;
  content: string;
  order: number;
};

function Admin() {
  const { user } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Create course
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseTopics, setCourseTopics] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Add lesson
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [addingLesson, setAddingLesson] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | null
  >(null);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await api.get("/courses");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.courses || [];

      setCourses(data);

      if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0]._id);
      }
    } catch (error: any) {
      console.error("Admin courses error:", error);
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Failed to load courses"
      );
    }
  }, [selectedCourseId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchCourses();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchCourses]);

  const fetchLessons = useCallback(
    async (courseId: string) => {
      if (!courseId) return;

      try {
        const response = await api.get(`/lessons/course/${courseId}`);
        const data = response.data.lessons || response.data || [];
        setLessons(data);

        const nextOrder =
          data.length > 0
            ? Math.max(...data.map((l: Lesson) => l.order || 0)) + 1
            : 1;

        setLessonOrder(nextOrder);
      } catch (error: any) {
        console.error("Admin lessons error:", error);
        setLessons([]);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons(selectedCourseId);
      setLessonTitle("");
      setLessonContent("");
    }
  }, [selectedCourseId, fetchLessons]);

  const handleCourseSelect = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCourseId(event.target.value);
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || !courseDescription.trim()) {
      setMessageType("error");
      setMessage("Title and description are required.");
      return;
    }

    setCreatingCourse(true);
    setMessage("");
    setMessageType(null);

    try {
      const topics = courseTopics
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);

      await api.post("/courses", {
        title: courseTitle.trim(),
        description: courseDescription.trim(),
        topics,
      });

      setCourseTitle("");
      setCourseDescription("");
      setCourseTopics("");

      setMessageType("success");
      setMessage("Course created successfully!");

      await fetchCourses();
    } catch (error: any) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Failed to create course"
      );
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleAddLesson = async () => {
    if (
      !selectedCourseId ||
      !lessonTitle.trim() ||
      !lessonContent.trim()
    ) {
      setMessageType("error");
      setMessage(
        "Select a course and provide a lesson title and content."
      );
      return;
    }

    setAddingLesson(true);
    setMessage("");
    setMessageType(null);

    try {
      await api.post(`/lessons/course/${selectedCourseId}`, {
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
        order: Number(lessonOrder) || 1,
      });

      setLessonTitle("");
      setLessonContent("");

      setMessageType("success");
      setMessage("Lesson added successfully!");

      await fetchLessons(selectedCourseId);
    } catch (error: any) {
      console.error("Add lesson error:", error);

      setMessageType("error");
      setMessage(
        error.response?.data?.message || "Failed to add lesson"
      );
    } finally {
      setAddingLesson(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="dashboard">
        <div className="ai-error">
          You do not have permission to access the admin panel.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">ADMIN</p>
          <h1>🛠️ Admin Panel</h1>
          <p>
            Create courses and add lessons to make them available to
            students.
          </p>
        </div>
      </header>

      {messageType && (
        <div className={messageType === "error" ? "ai-error" : "ai-success"}>
          {message}
        </div>
      )}

      <div className="admin-grid">
        {/* Create course */}
        <section className="admin-card">
          <h2>Create a Course</h2>

          <label>Course title</label>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="e.g. Python for Beginners"
            maxLength={150}
          />

          <label>Description</label>
          <textarea
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            placeholder="What will students learn?"
            rows={3}
            maxLength={1000}
          />

          <label>Topics (comma separated)</label>
          <input
            type="text"
            value={courseTopics}
            onChange={(e) => setCourseTopics(e.target.value)}
            placeholder="e.g. Python basics, Data types, Functions"
          />

          <button
            type="button"
            onClick={handleCreateCourse}
            disabled={creatingCourse}
          >
            {creatingCourse ? "Creating..." : "+ Create Course"}
          </button>
        </section>

        {/* Add lesson */}
        <section className="admin-card">
          <h2>Add a Lesson</h2>

          <label>Course</label>
          <select
            value={selectedCourseId}
            onChange={handleCourseSelect}
          >
            {courses.length === 0 && (
              <option value="">No courses yet</option>
            )}

            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>

          <label>Lesson title</label>
          <input
            type="text"
            value={lessonTitle}
            onChange={(e) => setLessonTitle(e.target.value)}
            placeholder="e.g. Introduction to Python"
            maxLength={150}
          />

          <label>Lesson content</label>
          <textarea
            value={lessonContent}
            onChange={(e) => setLessonContent(e.target.value)}
            placeholder="Write the full lesson content here..."
            rows={6}
            maxLength={20000}
          />

          <label>Order (position in course)</label>
          <input
            type="number"
            value={lessonOrder}
            onChange={(e) => setLessonOrder(Number(e.target.value))}
            min={1}
          />

          <button
            type="button"
            onClick={handleAddLesson}
            disabled={addingLesson || courses.length === 0}
          >
            {addingLesson ? "Adding..." : "+ Add Lesson"}
          </button>
        </section>
      </div>

      {/* Lessons in selected course */}
      {selectedCourseId && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LESSONS</p>
              <h2>
                Lessons in{" "}
                {courses.find((c) => c._id === selectedCourseId)?.title ||
                  "selected course"}
              </h2>
            </div>

            <strong>{lessons.length} lessons</strong>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No lessons yet</h3>
              <p>Use the form above to add the first lesson.</p>
            </div>
          ) : (
            <div className="admin-lesson-list">
              {lessons.map((lesson) => (
                <div className="admin-lesson-row" key={lesson._id}>
                  <strong>
                    {lesson.order}. {lesson.title}
                  </strong>
                  <span>
                    {lesson.content.length} characters
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Admin;