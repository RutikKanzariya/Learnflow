import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | null
  >(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setMessageType(null);

      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        adminKey: adminKey.trim() || undefined,
      });

      const { user } = response.data;

      setMessage(
        `Account created. Welcome, ${user.name}!`
      );

      setMessageType("success");

      setTimeout(() => {
        navigate("/login", {
          state: {
            message: `Account created. Welcome, ${user.name}! Please log in.`,
          },
        });
      }, 1500);
    } catch (error: any) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>LearnFlow</h1>
        <p>Create your student account</p>

        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={6}
            required
          />

          <input
            type="text"
            placeholder="Admin key (optional — for admin accounts)"
            value={adminKey}
            onChange={(event) =>
              setAdminKey(event.target.value)
            }
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={
              messageType === "error"
                ? "auth-error"
                : "auth-success"
            }
          >
            {message}
          </p>
        )}

        <p>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;