
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";
const travelVideo = "/videos/travel-video.mp4";

function Login() {
  const [email, setEmail] = useState(
    localStorage.getItem("rememberedEmail") || ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("rememberedEmail"))
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Save the session and redirect after either login method.
  const finishLogin = (data) => {
    if (!data?.token || !data?.user) {
      throw new Error("Login response is incomplete. Please try again.");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    if (rememberMe) {
      localStorage.setItem(
        "rememberedEmail",
        data.user.email || email.trim()
      );
    } else {
      localStorage.removeItem("rememberedEmail");
    }

navigate("/", { replace: true });
  };

  // Existing manual email/password login.
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      finishLogin(data);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check that your backend is running."
          : err.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in: the backend verifies the Google credential.
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");

    if (!credentialResponse?.credential) {
      setError("Google sign-in did not return a credential. Please try again.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/google",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed.");
      }

      finishLogin(data);
    } catch (err) {
      console.error("Google login error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check that your backend is running."
          : err.message || "Google login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
<video
  className="login-background-video"
  autoPlay
  muted
  loop
  playsInline
  aria-hidden="true"
>
<source
  src="https://res.cloudinary.com/gffv994z/video/upload/v1792825440/travel-video.mp4"
  type="video/mp4"
/>
</video>

<div className="login-video-overlay" />

      {/* LEFT: TRAVEL BRANDING */}
      <section className="login-banner">
        <div className="login-banner-glow login-glow-one" />
        <div className="login-banner-glow login-glow-two" />

        <Link to="/" className="login-logo">
          <span className="login-logo-icon">✈</span>
          <span>TravelEase</span>
        </Link>

        <div className="login-banner-content">
          <span className="login-eyebrow">
            YOUR NEXT ADVENTURE STARTS HERE
          </span>

          <h1>
            Your journey.
            <br />
            <span>Your way.</span>
          </h1>

          <p className="login-banner-description">
            Discover new destinations, plan unforgettable trips,
            and manage every part of your journey in one place.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">✈️</span>
              <div>
                <strong>Easy flight booking</strong>
                <small>Explore your next destination</small>
              </div>
            </div>

            <div className="login-feature">
              <span className="login-feature-icon">🏨</span>
              <div>
                <strong>Find your perfect stay</strong>
                <small>Discover places to stay</small>
              </div>
            </div>
          </div>

          <div className="login-travel-note">
            <span className="login-note-line" />
            <span>LESS PLANNING. MORE EXPLORING.</span>
          </div>
        </div>

        <div className="login-banner-footer">
          <span>✦</span> Travel smarter with TravelEase
        </div>
      </section>

      {/* RIGHT: LOGIN FORM */}
      <section className="login-section">
        <div className="login-card">
          <Link to="/" className="login-mobile-logo">
            ✈ TravelEase
          </Link>

          <div className="login-welcome-icon">👋</div>

          <span className="login-card-eyebrow">WELCOME BACK</span>

          <h2>Let's get you going.</h2>

          <p className="login-subtitle">
            Sign in to continue your travel journey.
          </p>

          {error && (
            <div className="login-error" role="alert">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* MANUAL LOGIN */}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  ✉
                </span>

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  ♙
                </span>

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="login-forgot-link"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              <span>
                {loading ? "Signing you in..." : "Sign in to TravelEase"}
              </span>
              {!loading && (
                <span className="login-button-arrow">→</span>
              )}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="login-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          {/* GOOGLE LOGIN */}
          <div className="login-google-button">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() =>
                setError(
                  "Google sign-in was unsuccessful. Please try again."
                )
              }
              theme="outline"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="340"
            />
          </div>

          {loading && (
            <p className="login-loading">
              Please wait while we securely sign you in...
            </p>
          )}

          <p className="login-register-text">
            New to TravelEase?{" "}
            <Link to="/register">Create an account</Link>
          </p>

          <div className="login-security-note">
            <span>🔒</span>
            <span>Your connection is protected by secure login.</span>
          </div>
        </div>

        <p className="login-bottom-note">
          Made for the journeys you'll always remember <span>✦</span>
        </p>
      </section>

      
    </main>
  );
}

export default Login;
