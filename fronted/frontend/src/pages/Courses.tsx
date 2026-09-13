
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

type Course = {
  _id: string;
  title: string;
  description: string;
  topics: string[];
};

function Courses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses");

        console.log("Courses API response:", response.data);

        const courseData = Array.isArray(response.data)
          ? response.data
          : response.data.courses;

        if (!Array.isArray(courseData)) {
          throw new Error("Invalid courses response");
        }

        setCourses(courseData);
      } catch (error: any) {
        console.error("Courses error:", error);

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load courses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <p>Loading courses...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="dashboard">
      <h1>My Courses</h1>

      <p>Choose a course and start learning.</p>

      <div className="stats-grid">
        {courses.map((course) => (
          <div className="stat-card" key={course._id}>
            <h2>{course.title}</h2>

            <p>{course.description}</p>

            {course.topics?.length > 0 && (
              <div>
                <strong>Topics:</strong>
                <p>{course.topics.join(", ")}</p>
              </div>
            )}

            <button
              onClick={() =>
                navigate(`/courses/${course._id}`)
              }
            >
              View Course
            </button>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <p>No courses available yet.</p>
      )}
    </div>
  );
}

export default Courses;
