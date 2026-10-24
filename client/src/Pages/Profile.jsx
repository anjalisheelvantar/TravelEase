
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";
const travelVideo = "/videos/travel-video.mp4";

function Profile() {
  const navigate = useNavigate();

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const name =
    user.name ||
    user.fullName ||
    user.username ||
    user.user?.name ||
    "Traveler";

  const email = user.email || user.user?.email || "Not provided";

  const userId =
    user._id || user.id || user.userId || "Not available";

  const initial = name.charAt(0).toUpperCase();

  return (
    <main className="profile-page">
      <video
        className="profile-background-video"
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

      <div className="profile-video-overlay" />

      <div className="profile-container">
        {/* Welcome banner */}
        <section className="profile-hero">
          <div className="profile-hero-content">
            <span className="profile-hero-tag">
              ✦ YOUR TRAVEL SPACE
            </span>

            <h1>
              Hello, {name.split(" ")[0]}!
              <br />
              <span>Your next journey starts here.</span>
            </h1>

            <p>
              Manage your account, keep track of your bookings,
              and get ready for your next adventure.
            </p>
          </div>

          <div className="profile-hero-mark" aria-hidden="true">
            <span>✈</span>
            <small>TRAVEL MORE. WORRY LESS.</small>
          </div>
        </section>

        {/* Main profile layout */}
        <section className="profile-layout">
          {/* Left profile card */}
          <aside className="profile-sidebar">
            <div className="profile-avatar-large">{initial}</div>

            <span className="profile-member-label">
              TRAVELEASE MEMBER
            </span>

            <h2>{name}</h2>
            <p className="profile-sidebar-email">{email}</p>

            <div className="profile-status">
              <span className="profile-status-dot" />
              Account information
            </div>

            <div className="profile-sidebar-divider" />

            <p className="profile-sidebar-note">
              Every journey becomes a memory. Make your next
              one unforgettable.
            </p>

            <Link to="/bookings" className="profile-sidebar-link">
              <span>▤</span>
              View my bookings
              <span className="profile-link-arrow">→</span>
            </Link>
          </aside>

          {/* Right content */}
          <div className="profile-main">
            <div className="profile-section-heading">
              <div>
                <span className="profile-section-eyebrow">
                  ACCOUNT SETTINGS
                </span>
                <h2>Personal information</h2>
                <p>Your account details in one place.</p>
              </div>

              <div className="profile-info-icon">♙</div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="profile-info-symbol">♙</div>
                <div>
                  <span>FULL NAME</span>
                  <strong>{name}</strong>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-symbol">✉</div>
                <div>
                  <span>EMAIL ADDRESS</span>
                  <strong>{email}</strong>
                </div>
              </div>

              <div className="profile-info-item profile-info-full">
                <div className="profile-info-symbol">⌑</div>
                <div>
                  <span>ACCOUNT ID</span>
                  <strong>{userId}</strong>
                </div>
              </div>
            </div>

            <div className="profile-travel-heading">
              <div>
                <span className="profile-section-eyebrow">
                  YOUR TRAVELEASE
                </span>
                <h2>Where to next?</h2>
              </div>
              <span className="profile-sparkle">✦</span>
            </div>

            <div className="profile-shortcuts">
              <Link to="/bookings" className="profile-shortcut">
                <span className="profile-shortcut-icon">🎫</span>
                <span className="profile-shortcut-text">
                  <strong>My Bookings</strong>
                  <small>View your travel plans</small>
                </span>
                <span className="profile-shortcut-arrow">↗</span>
              </Link>

              <Link to="/dashboard" className="profile-shortcut">
                <span className="profile-shortcut-icon">▦</span>
                <span className="profile-shortcut-text">
                  <strong>Dashboard</strong>
                  <small>Your travel overview</small>
                </span>
                <span className="profile-shortcut-arrow">↗</span>
              </Link>

              <Link to="/flights" className="profile-shortcut">
                <span className="profile-shortcut-icon">✈</span>
                <span className="profile-shortcut-text">
                  <strong>Explore Flights</strong>
                  <small>Find your next destination</small>
                </span>
                <span className="profile-shortcut-arrow">↗</span>
              </Link>
            </div>

            <button
              type="button"
              className="profile-back-home"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>
        </section>

        <footer className="profile-page-footer">
          <span>TRAVELEASE</span>
          <span>✦ Made for journeys you'll always remember</span>
        </footer>
      </div>
    </main>
  );
}

export default Profile;
