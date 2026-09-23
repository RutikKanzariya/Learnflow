// // import { useEffect, useState } from "react";
// // import { useParams } from "react-router-dom";
// // import api from "../services/api";

// // type Lesson = {
// //   _id: string;
// //   title: string;
// //   content: string;
// //   order: number;
// // };

// // type ProgressData = {
// //   totalLessons: number;
// //   completedLessons: number;
// //   progressPercentage: number;
// //   completedLessonIds: string[];
// // };

// // function CourseDetails() {
// //   const { courseId } = useParams();

// //   const [lessons, setLessons] = useState<Lesson[]>([]);
// //   const [completedLessons, setCompletedLessons] = useState<string[]>(
// //     []
// //   );

// //   const [progress, setProgress] = useState<ProgressData | null>(
// //     null
// //   );

// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState("");
// //   const [completing, setCompleting] = useState<string | null>(null);

// //   useEffect(() => {
// //     const fetchCourseData = async () => {
// //       try {
// //         console.log("Course ID:", courseId);

// //         const [lessonsResponse, progressResponse] =
// //           await Promise.all([
// //             api.get(`/lessons/course/${courseId}`),
// //             api.get(`/lessons/course/${courseId}/progress`),
// //           ]);

// //         console.log(
// //           "Lessons API response:",
// //           lessonsResponse.data
// //         );

// //         console.log(
// //           "Progress API response:",
// //           progressResponse.data
// //         );

// //         // Backend returns { lessons: [...] }
// //         setLessons(lessonsResponse.data.lessons);

// //         // Save progress information
// //         setProgress(progressResponse.data);

// //         // Save IDs of already completed lessons
// //         setCompletedLessons(
// //           progressResponse.data.completedLessonIds || []
// //         );
// //       } catch (error: any) {
// //         console.error("Course details error:", error);

// //         setError(
// //           error.response?.data?.message ||
// //             "Failed to load course"
// //         );
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchCourseData();
// //   }, [courseId]);

// //   const handleCompleteLesson = async (lessonId: string) => {
// //     try {
// //       setCompleting(lessonId);

// //       await api.post(`/lessons/${lessonId}/complete`);

// //       // Add the lesson to completed lessons
// //       setCompletedLessons((previous) => {
// //         if (previous.includes(lessonId)) {
// //           return previous;
// //         }

// //         return [...previous, lessonId];
// //       });

// //       // Update progress on the screen immediately
// //       setProgress((previous) => {
// //         if (!previous) {
// //           return previous;
// //         }

// //         // Don't increase the count if already completed
// //         if (
// //           previous.completedLessonIds.includes(lessonId)
// //         ) {
// //           return previous;
// //         }

// //         const newCompletedCount =
// //           previous.completedLessons + 1;

// //         const newPercentage =
// //           previous.totalLessons > 0
// //             ? Math.round(
// //                 (newCompletedCount /
// //                   previous.totalLessons) *
// //                   100
// //               )
// //             : 0;

// //         return {
// //           ...previous,
// //           completedLessons: newCompletedCount,
// //           progressPercentage: newPercentage,
// //           completedLessonIds: [
// //             ...previous.completedLessonIds,
// //             lessonId,
// //           ],
// //         };
// //       });
// //     } catch (error: any) {
// //       console.error(
// //         "Complete lesson error:",
// //         error
// //       );

// //       setError(
// //         error.response?.data?.message ||
// //           "Failed to complete lesson"
// //       );
// //     } finally {
// //       setCompleting(null);
// //     }
// //   };

// //   if (loading) {
// //     return <p>Loading course...</p>;
// //   }

// //   if (error) {
// //     return <p>{error}</p>;
// //   }

// //   return (
// //     <div className="dashboard">
// //       <h1>Course Lessons</h1>

// //       <p>
// //         Continue learning from where you left off.
// //       </p>

// //       {/* Course Progress */}
// //       {progress && (
// //         <section className="dashboard-section">
// //           <h2>Course Progress</h2>

// //           <p>
// //             {progress.completedLessons} /{" "}
// //             {progress.totalLessons} lessons completed
// //           </p>

// //           <div className="progress-bar">
// //             <div
// //               className="progress-fill"
// //               style={{
// //                 width: `${progress.progressPercentage}%`,
// //               }}
// //             />
// //           </div>

// //           <p>
// //             {progress.progressPercentage}% complete
// //           </p>
// //         </section>
// //       )}

// //       {/* Lessons */}
// //       {lessons.length === 0 ? (
// //         <p>No lessons available for this course.</p>
// //       ) : (
// //         <div className="stats-grid">
// //           {lessons.map((lesson) => {
// //             const isCompleted =
// //               completedLessons.includes(lesson._id);

// //             return (
// //               <div
// //                 className="stat-card"
// //                 key={lesson._id}
// //               >
// //                 <h2>
// //                   {lesson.order}. {lesson.title}
// //                 </h2>

// //                 <p>{lesson.content}</p>

// //                 <button
// //                   onClick={() =>
// //                     handleCompleteLesson(
// //                       lesson._id
// //                     )
// //                   }
// //                   disabled={
// //                     isCompleted ||
// //                     completing === lesson._id
// //                   }
// //                 >
// //                   {isCompleted
// //                     ? "Completed ✓"
// //                     : completing === lesson._id
// //                     ? "Saving..."
// //                     : "Complete Lesson"}
// //                 </button>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// // export default CourseDetails;

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import api from "../services/api";

// type Lesson = {
//   _id: string;
//   title: string;
//   content: string;
//   order: number;
// };

// type ProgressData = {
//   totalLessons: number;
//   completedLessons: number;
//   progressPercentage: number;
//   completedLessonIds: string[];
// };

// function CourseDetails() {
//   const { courseId } = useParams();

//   const [lessons, setLessons] = useState<Lesson[]>([]);
//   const [completedLessons, setCompletedLessons] =
//     useState<string[]>([]);

//   const [progress, setProgress] =
//     useState<ProgressData | null>(null);

//   const [selectedLesson, setSelectedLesson] =
//     useState<Lesson | null>(null);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [completing, setCompleting] =
//     useState(false);

//   useEffect(() => {
//     const fetchCourseData = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const [
//           lessonsResponse,
//           progressResponse,
//         ] = await Promise.all([
//           api.get(
//             `/lessons/course/${courseId}`
//           ),
//           api.get(
//             `/lessons/course/${courseId}/progress`
//           ),
//         ]);

//         const lessonData =
//           lessonsResponse.data.lessons || [];

//         const progressData =
//           progressResponse.data;

//         setLessons(lessonData);
//         setProgress(progressData);

//         setCompletedLessons(
//           progressData.completedLessonIds || []
//         );

//         if (lessonData.length > 0) {
//           setSelectedLesson(lessonData[0]);
//         }
//       } catch (error: any) {
//         console.error(
//           "Course details error:",
//           error
//         );

//         setError(
//           error.response?.data?.message ||
//             "Failed to load course"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (courseId) {
//       fetchCourseData();
//     }
//   }, [courseId]);

//   const handleCompleteLesson = async () => {
//     if (!selectedLesson) {
//       return;
//     }

//     if (
//       completedLessons.includes(
//         selectedLesson._id
//       )
//     ) {
//       return;
//     }

//     try {
//       setCompleting(true);
//       setError("");

//       await api.post(
//         `/lessons/${selectedLesson._id}/complete`
//       );

//       setCompletedLessons(
//         (previous) => [
//           ...previous,
//           selectedLesson._id,
//         ]
//       );

//       setProgress((previous) => {
//         if (!previous) {
//           return previous;
//         }

//         const newCompletedCount =
//           previous.completedLessons + 1;

//         const newPercentage =
//           previous.totalLessons > 0
//             ? Math.round(
//                 (newCompletedCount /
//                   previous.totalLessons) *
//                   100
//               )
//             : 0;

//         return {
//           ...previous,
//           completedLessons:
//             newCompletedCount,
//           progressPercentage:
//             newPercentage,
//           completedLessonIds: [
//             ...previous.completedLessonIds,
//             selectedLesson._id,
//           ],
//         };
//       });
//     } catch (error: any) {
//       console.error(
//         "Complete lesson error:",
//         error
//       );

//       setError(
//         error.response?.data?.message ||
//           "Failed to complete lesson"
//       );
//     } finally {
//       setCompleting(false);
//     }
//   };

//   const handleNextLesson = () => {
//     if (!selectedLesson) {
//       return;
//     }

//     const currentIndex =
//       lessons.findIndex(
//         (lesson) =>
//           lesson._id === selectedLesson._id
//       );

//     const nextLesson =
//       lessons[currentIndex + 1];

//     if (nextLesson) {
//       setSelectedLesson(nextLesson);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="dashboard">
//         <p>Loading course...</p>
//       </div>
//     );
//   }

//   if (error && lessons.length === 0) {
//     return (
//       <div className="dashboard">
//         <p>{error}</p>
//       </div>
//     );
//   }

//   if (lessons.length === 0) {
//     return (
//       <div className="dashboard">
//         <h1>Course</h1>
//         <p>No lessons available yet.</p>
//       </div>
//     );
//   }

//   const isCompleted =
//     selectedLesson &&
//     completedLessons.includes(
//       selectedLesson._id
//     );

//   return (
//     <div className="dashboard">
//       <header>
//         <h1>Course Learning</h1>

//         <p>
//           Continue learning from where you
//           left off.
//         </p>
//       </header>

//       {/* Progress */}
//       {progress && (
//         <section className="dashboard-section">
//           <div className="skill-header">
//             <strong>
//               Course Progress
//             </strong>

//             <strong>
//               {progress.progressPercentage}%
//             </strong>
//           </div>

//           <div className="progress-bar">
//             <div
//               className="progress-fill"
//               style={{
//                 width: `${progress.progressPercentage}%`,
//               }}
//             />
//           </div>

//           <p>
//             {progress.completedLessons} of{" "}
//             {progress.totalLessons} lessons
//             completed
//           </p>
//         </section>
//       )}

//       {/* Learning Layout */}
//       <div className="learning-layout">
//         {/* Lesson Sidebar */}
//         <aside className="lesson-sidebar">
//           <h2>Lessons</h2>

//           {lessons.map((lesson) => {
//             const completed =
//               completedLessons.includes(
//                 lesson._id
//               );

//             const selected =
//               selectedLesson?._id ===
//               lesson._id;

//             return (
//               <button
//                 key={lesson._id}
//                 type="button"
//                 className={`lesson-item ${
//                   selected
//                     ? "lesson-item-active"
//                     : ""
//                 }`}
//                 onClick={() =>
//                   setSelectedLesson(lesson)
//                 }
//               >
//                 <span>
//                   {completed
//                     ? "✓"
//                     : lesson.order}
//                 </span>

//                 <span>
//                   {lesson.title}
//                 </span>
//               </button>
//             );
//           })}
//         </aside>

//         {/* Lesson Content */}
//         <main className="lesson-content">
//           {selectedLesson && (
//             <>
//               <div className="lesson-content-header">
//                 <span>
//                   Lesson {selectedLesson.order}
//                 </span>

//                 {isCompleted && (
//                   <span className="completed-badge">
//                     ✓ Completed
//                   </span>
//                 )}
//               </div>

//               <h2>
//                 {selectedLesson.title}
//               </h2>

//               <div className="lesson-text">
//                 {selectedLesson.content}
//               </div>

//               {error && (
//                 <p className="error-message">
//                   {error}
//                 </p>
//               )}

//               <div className="lesson-actions">
//                 <button
//                   type="button"
//                   onClick={
//                     handleCompleteLesson
//                   }
//                   disabled={
//                     isCompleted ||
//                     completing
//                   }
//                 >
//                   {isCompleted
//                     ? "Lesson Completed ✓"
//                     : completing
//                     ? "Saving..."
//                     : "Mark as Complete"}
//                 </button>

//                 <button
//                   type="button"
//                   onClick={handleNextLesson}
//                   disabled={
//                     selectedLesson.order >=
//                     lessons.length
//                   }
//                 >
//                   Next Lesson →
//                 </button>
//               </div>
//             </>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default CourseDetails;

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";

type Lesson = {
  _id: string;
  title: string;
  content: string;
  order: number;
};

function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] =
    useState<Lesson | null>(null);

  const [completedLessons, setCompletedLessons] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError("");

        const [lessonsResponse, progressResponse] =
          await Promise.all([
            api.get(`/lessons/course/${courseId}`),
            api.get(`/lessons/course/${courseId}/progress`),
          ]);
          console.log("Lessons response:", lessonsResponse.data);
console.log(
  "Progress response JSON:",
  JSON.stringify(progressResponse.data, null, 2)
);
        const lessonData =
          lessonsResponse.data.lessons ||
          lessonsResponse.data;

        // const progressData =
        //   progressResponse.data.completedLessons ||
        //   progressResponse.data;

        // setLessons(lessonData);
        // setCompletedLessons(progressData);

const progressData =
  progressResponse.data.completedLessonIds || [];

setLessons(lessonData);
setCompletedLessons(progressData);

        if (lessonData.length > 0) {
          setSelectedLesson(lessonData[0]);
        }
      } catch (error: any) {
        console.error("Course details error:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load course"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!selectedLesson) return;

      try {
        const response = await api.get(
          `/bookmarks/lesson/${selectedLesson._id}`
        );

        setBookmarked(response.data.bookmarked);
      } catch (error: any) {
        console.error(
          "Bookmark check error:",
          error
        );
      }
    };

    checkBookmark();
  }, [selectedLesson]);

  const isCompleted = (lessonId: string) => {
    return completedLessons.includes(lessonId);
  };

  const handleComplete = async () => {
    if (!selectedLesson || completing) return;

    try {
      setCompleting(true);
      setError("");

      await api.post(
        `/lessons/${selectedLesson._id}/complete`
      );

      setCompletedLessons((previous) => {
        if (previous.includes(selectedLesson._id)) {
          return previous;
        }

        return [...previous, selectedLesson._id];
      });
    } catch (error: any) {
      console.error("Complete lesson error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to mark lesson complete"
      );
    } finally {
      setCompleting(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedLesson || generatingQuiz) return;

    try {
      setGeneratingQuiz(true);
      setError("");
      setSavedMessage("");

      const response = await api.post("/ai/quiz", {
        lessonId: selectedLesson._id,
        topic: selectedLesson.title,
      });

      const quiz = response.data.quiz;

      if (!quiz?._id) {
        throw new Error("Quiz was created but no quiz ID was returned.");
      }

      navigate(`/quizzes/${quiz._id}`);
    } catch (error: any) {
      console.error("Generate quiz error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to generate AI quiz"
      );
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!selectedLesson || generatingFlashcards) return;

    try {
      setGeneratingFlashcards(true);
      setError("");
      setSavedMessage("");

      await api.post("/flashcards/generate/lesson", {
        lessonId: selectedLesson._id,
      });

      setSavedMessage(
        "Flashcards generated! Redirecting..."
      );

      navigate("/flashcards");
    } catch (error: any) {
      console.error(
        "Generate flashcards error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to generate flashcards"
      );
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!selectedLesson) return;

    try {
      setError("");
      setSavedMessage("");

      const response = await api.post("/bookmarks", {
        lessonId: selectedLesson._id,
      });

      setBookmarked(response.data.bookmarked);

      setSavedMessage(
        response.data.bookmarked
          ? "Lesson bookmarked 🔖"
          : "Bookmark removed"
      );
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to update bookmark"
      );
    }
  };

  const handleSaveNote = async () => {
    if (!selectedLesson || !noteContent.trim() || savingNote) {
      return;
    }

    try {
      setSavingNote(true);
      setError("");
      setSavedMessage("");

      await api.post("/notes", {
        lessonId: selectedLesson._id,
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });

      setNoteTitle("");
      setNoteContent("");
      setSavedMessage("Note saved 📝");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
          "Failed to save note"
      );
    } finally {
      setSavingNote(false);
    }
  };

  const handleNextLesson = () => {
    if (!selectedLesson) return;

    const currentIndex = lessons.findIndex(
      (lesson) => lesson._id === selectedLesson._id
    );

    const nextLesson = lessons[currentIndex + 1];

    if (nextLesson) {
      setSelectedLesson(nextLesson);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p>Loading course...</p>
      </div>
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="dashboard">
        <p>{error}</p>
      </div>
    );
  }

  if (!selectedLesson) {
    return (
      <div className="dashboard">
        <p>No lessons available.</p>
      </div>
    );
  }

  const currentIndex = lessons.findIndex(
    (lesson) => lesson._id === selectedLesson._id
  );

  const progress =
    lessons.length > 0
      ? Math.round(
          (completedLessons.length / lessons.length) * 100
        )
      : 0;

  const completed = isCompleted(selectedLesson._id);

  const hasNextLesson =
    currentIndex >= 0 &&
    currentIndex < lessons.length - 1;

  return (
    <div className="dashboard">
      <div className="course-page-header">
        <div>
          <p className="eyebrow">LEARNING PATH</p>
          <h1>Course Lessons</h1>
          <p>
            Work through each lesson and test your knowledge
            with AI-generated quizzes.
          </p>
        </div>

        <div className="course-progress-summary">
          <strong>{progress}%</strong>
          <span>complete</span>
        </div>
      </div>

      <div className="progress-bar large">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="ai-success">
          {savedMessage}
        </div>
      )}

      <div className="learning-layout">
        <aside className="lesson-sidebar">
          <h2>Lessons</h2>

          {lessons.map((lesson, index) => (
            <button
              type="button"
              key={lesson._id}
              className={`lesson-item ${
                selectedLesson._id === lesson._id
                  ? "lesson-item-active"
                  : ""
              }`}
              onClick={() => setSelectedLesson(lesson)}
            >
              <span>
                {isCompleted(lesson._id) ? "✓" : index + 1}
              </span>

              <span>{lesson.title}</span>
            </button>
          ))}
        </aside>

        <main className="lesson-content">
          <div className="lesson-content-header">
            <span>
              Lesson {currentIndex + 1} of {lessons.length}
            </span>

            {completed && (
              <span className="completed-badge">
                ✓ Completed
              </span>
            )}
          </div>

          <h2>{selectedLesson.title}</h2>

          <div className="lesson-text">
            {selectedLesson.content}
          </div>

          <div className="lesson-toolbar">
            <button
              type="button"
              className={
                bookmarked ? "bookmark-active" : "secondary-button"
              }
              onClick={handleToggleBookmark}
            >
              {bookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"}
            </button>

            <Link
              to="/notes"
              className="secondary-button note-link"
            >
              📒 My Notes
            </Link>
          </div>

          <div className="note-widget">
            <h3>Quick note</h3>

            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title (optional)"
              maxLength={150}
            />

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Jot down a thought about this lesson..."
              rows={3}
              maxLength={2000}
            />

            <button
              type="button"
              onClick={handleSaveNote}
              disabled={!noteContent.trim() || savingNote}
            >
              {savingNote ? "Saving..." : "Save Note"}
            </button>
          </div>

          <div className="lesson-actions">
            {!completed && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing
                  ? "Saving..."
                  : "✓ Mark Complete"}
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={generatingQuiz}
            >
              {generatingQuiz
                ? "Generating Quiz..."
                : "🤖 Generate AI Quiz"}
            </button>

            <button
              type="button"
              onClick={handleGenerateFlashcards}
              disabled={generatingFlashcards}
            >
              {generatingFlashcards
                ? "Generating Flashcards..."
                : "🗂️ Generate Flashcards"}
            </button>

            {hasNextLesson && (
              <button
                type="button"
                onClick={handleNextLesson}
              >
                Next Lesson →
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CourseDetails;