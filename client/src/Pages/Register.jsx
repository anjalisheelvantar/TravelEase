
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import travelVideo from "../assets/travel-video.mp4";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please log in.");
        navigate("/login");
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <video
        className="register-background-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src={travelVideo} type="video/mp4" />
      </video>

      <div className="register-video-overlay" />

      <div className="register-layout">
        {/* LEFT: Welcome content */}
        <section className="register-welcome">
          <Link to="/" className="register-brand">
            <span className="register-brand-icon">✈</span>
            <span>
              Travel<span>Ease</span>
            </span>
          </Link>

          <div className="register-welcome-content">
            <span className="register-eyebrow">
              YOUR JOURNEY BEGINS HERE
            </span>

            <h1>
              The world is waiting.
              <span> Let's explore it.</span>
            </h1>

            <p className="register-welcome-description">
              Discover new destinations, plan smarter journeys,
              and bring every travel idea to life with TravelEase.
            </p>

            <div className="register-benefits">
              <div className="register-benefit">
                <span className="register-benefit-icon">✦</span>
                <div>
                  <h3>One account. Endless journeys.</h3>
                  <p>Keep your travel plans together in one place.</p>
                </div>
              </div>

              <div className="register-benefit">
                <span className="register-benefit-icon">⌁</span>
                <div>
                  <h3>Travel made simpler</h3>
                  <p>Explore transport, stays, and smart trip planning.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="register-welcome-footer">
            ✧ Explore more. Worry less. Travel better.
          </p>
        </section>

        {/* RIGHT: Registration form */}
        <section className="register-card">
          <div className="register-card-heading">
            <span className="register-card-label">JOIN TRAVELEASE</span>
            <h2>Create your account</h2>
            <p>Enter your details to get started.</p>
          </div>

          {error && (
            <div className="register-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="register-form">
            <div className="register-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="register-password">Password</label>
              <div className="register-password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className="register-show-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              className="register-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="register-login-prompt">
            <span>Already have an account?</span>
            <Link to="/login">Log in</Link>
          </div>

          <div className="register-card-footer">
            Secure your next adventure with TravelEase ✦
          </div>
        </section>
      </div>

      <div className="register-copyright">
        © {new Date().getFullYear()} TravelEase · Your journey, made simpler.
      </div>
    </main>
  );
}

export default Register;
