
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const closeMenus = () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileMenuOpen(false);
      }
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
    closeMenus();
    navigate("/login", { replace: true });
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">

        <Link to="/" className="logo" onClick={closeMenus}>
          <span className="logo-icon">✈️</span>
          <span>TravelEase</span>
        </Link>

        <button
          type="button"
          className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`nav-links ${mobileMenuOpen ? "mobile-open" : ""}`}>

          <Link to="/" onClick={closeMenus}>Home</Link>
          <Link to="/flights" onClick={closeMenus}>Flights</Link>
          <Link to="/trains" onClick={closeMenus}>Trains</Link>
          <Link to="/cabs" onClick={closeMenus}>Cabs</Link>
          <Link to="/hotels" onClick={closeMenus}>Hotels</Link>

          <Link
            to="/ai-planner"
            className="ai-planner-link"
            onClick={closeMenus}
          >
            ✨ AI Planner
          </Link>

          <Link
            to="/budget-tracker"
            className="budget-tracker-link"
            onClick={closeMenus}
          >
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

                  <Link to="/profile" onClick={closeMenus}>
                    <span>👤</span> My Profile
                  </Link>

                  <Link to="/dashboard" onClick={closeMenus}>
                    <span>▦</span> Dashboard
                  </Link>

                  <Link to="/bookings" onClick={closeMenus}>
                    <span>▤</span> My Bookings
                  </Link>

                  <button type="button" onClick={logout}>
                    <span>↪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="login-btn" onClick={closeMenus}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
