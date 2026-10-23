
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const loggedIn = Boolean(token && userString);

  let user = {};

  try {
    user = JSON.parse(userString || "{}");
  } catch {
    user = {};
  }

  const name =
    user.name ||
    user.fullName ||
    user.username ||
    user.email?.split("@")[0] ||
    "Traveler";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-icon">✈️</span>
          <span>TravelEase</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/flights">Flights</Link>
          <Link to="/trains">Trains</Link>
          <Link to="/cabs">Cabs</Link>
          <Link to="/hotels">Hotels</Link>
          <Link to="/ai-planner" className="ai-planner-link">
            ✨ AI Planner
          </Link>
          <Link to="/budget-tracker" className="budget-tracker-link">
  ₹ Budget Tracker
</Link>

          {loggedIn ? (
            <div className="profile-dropdown" ref={menuRef}>
              <button
                type="button"
                className="profile-dropdown-toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="profile-avatar">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span>Profile</span>
                <span className={`profile-chevron ${menuOpen ? "open" : ""}`}>
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown-menu">
                  <div className="profile-menu-header">
                    <strong>{name}</strong>
                    {user.email && <span>{user.email}</span>}
                  </div>

                  <Link to="/profile" onClick={() => setMenuOpen(false)}>
                    <span>👤</span> My Profile
                  </Link>

                  <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
                    <span>▦</span> Dashboard
                  </Link>

                  <Link to="/bookings" onClick={() => setMenuOpen(false)}>
                    <span>▤</span> My Bookings
                  </Link>

                  <button type="button" onClick={logout}>
                    <span>↪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
