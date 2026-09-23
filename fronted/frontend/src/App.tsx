import "./index.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import AITutor from "./pages/AITutor";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Quiz from "./pages/Quiz";
import DocumentChat from "./pages/DocumentChat";
import Leaderboard from "./pages/Leaderboard";
import SpacedRepetition from "./pages/SpacedRepetition";
import Flashcards from "./pages/Flashcards";
import StudyRooms from "./pages/StudyRooms";
import Notes from "./pages/Notes";

import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Protected routes */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-tutor"
          element={
            <ProtectedRoute>
              <AITutor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/document-chat"
          element={
            <ProtectedRoute>
              <DocumentChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quizzes/:quizId"
          element={
            <ProtectedRoute>
              <Quiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <SpacedRepetition />
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <Flashcards />
            </ProtectedRoute>
          }
        />

        <Route
          path="/study-rooms"
          element={
            <ProtectedRoute>
              <StudyRooms />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />

        {/* Unknown route */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;