import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">LearnFlow</Link>
      </div>

      <div className="navbar-links">
        <Link to="/">Courses</Link>

        <Link to="/dashboard">
          Dashboard
        </Link>

        <Link to="/ai-tutor">
          AI Tutor
        </Link>
        <Link to="/document-chat">My Documents</Link>

        <span>
          👋 {user?.name}
        </span>

        <button
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;