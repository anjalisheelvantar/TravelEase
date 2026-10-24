
import { Link } from "react-router-dom";
import "./Dashboard.css";
const travelVideo = "/videos/travel-video.mp4";


function getUserName() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    return (
      user?.name ||
      user?.fullName ||
      user?.username ||
      user?.user?.name ||
      "Traveler"
    );
  } catch {
    return "Traveler";
  }
}

const shortcuts = [
  {
    icon: "🇮🇳",
    title: "Explore India",
    description: "Discover beautiful destinations, culture and hidden gems.",
    link: "/explore-india",
    color: "explore",
  },
  {
    icon: "✈️",
    title: "Book a Flight",
    description: "Find flights for your next adventure.",
    link: "/flights",
    color: "flight",
  },
  {
    icon: "🚆",
    title: "Book a Train",
    description: "Explore train routes and plan your journey.",
    link: "/trains",
    color: "train",
  },
  {
    icon: "🚕",
    title: "Book a Cab",
    description: "Get to your destination comfortably.",
    link: "/cabs",
    color: "cab",
  },
  {
    icon: "🏨",
    title: "Find Hotels",
    description: "Discover your perfect place to stay.",
    link: "/hotels",
    color: "hotel",
  },
  {
    icon: "✨",
    title: "AI Trip Planner",
    description: "Get help planning your next trip.",
    link: "/ai-planner",
    color: "ai",
  },
{
  icon: "🎫",
  title: "My Bookings",
  description: "View your tickets, travel details and booking status.",
  link: "/bookings",
  color: "flight",
},
{
  icon: "👤",
  title: "My Profile",
  description: "View your personal information and account details.",
  link: "/profile",
  color: "explore",
},

];

function Dashboard() {
  const name = getUserName();

  return (
    <div className="dashboard-page">
      {/* Full dashboard background video */}
     <video
  className="dashboard-background-video"
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  aria-hidden="true"
>
  <source src="/videos/travel-video.mp4" type="video/mp4" />
</video>

      <div className="dashboard-video-overlay" />

      {/* All dashboard content appears above the video */}
      <div className="dashboard-content">
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-content">
            <span className="dashboard-eyebrow">
              YOUR JOURNEY STARTS HERE
            </span>

            <h1>
              Welcome back,
              <br />
              <span>{name}!</span>
            </h1>

            <p>
              The world is waiting for you.
              Discover new places, plan unforgettable journeys,
              and make every trip count.
            </p>

            <div className="dashboard-welcome-actions">
              <Link
                to="/ai-planner"
                className="dashboard-video-secondary-btn"
              >
                ✨ Plan your trip with AI <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-kicker">
                YOUR TRAVEL DASHBOARD
              </span>
              <h2>Where would you like to go?</h2>
              <p>
                Your next adventure is just a click away.
              </p>
            </div>

            <Link
              to="/explore-india"
              className="dashboard-view-all"
            >
              Explore destinations →
            </Link>
          </div>

          <div className="dashboard-shortcuts">
            {shortcuts.map((item) => (
              <Link
                to={item.link}
                className="dashboard-shortcut"
                key={item.title}
              >
                <div
                  className={`dashboard-shortcut-icon ${item.color}`}
                >
                  {item.icon}
                </div>

                <h3>{item.title}</h3>
                <p>{item.description}</p>

                <span className="dashboard-card-link">
                  Explore <span>↗</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-bottom">
          <div>
            <span className="dashboard-kicker">
              MAKE IT PERSONAL
            </span>
            <h2>Your next trip, your way.</h2>
            <p>
              Need ideas for your next getaway?
              Let your AI travel planner help you get started.
            </p>

            <Link
              to="/ai-planner"
              className="dashboard-ai-btn"
            >
              ✨ Plan my trip
            </Link>
          </div>

          <div
            className="dashboard-bottom-art"
            aria-hidden="true"
          >
            🧭
          </div>
        </section>

        
<footer className="dashboard-footer">
  <div className="dashboard-footer-top">
    <div className="dashboard-footer-brand">
      <h2>✈️ TravelEase</h2>
      <p>
        Your journey, made simpler. Discover destinations,
        plan smarter trips, and make every journey memorable.
      </p>
    </div>

    <div className="dashboard-footer-links">
      <h3>Quick Links</h3>
      <a href="/dashboard">Dashboard</a>
      <a href="/flights">Flights</a>
      <a href="/trains">Trains</a>
      <a href="/hotels">Hotels</a>
    </div>

    <div className="dashboard-footer-links">
      <h3>Explore</h3>
      <a href="/cabs">Book a Cab</a>
      <a href="/ai-planner">AI Trip Planner</a>
      <a href="/explore-india">Explore India</a>
    </div>

    <div className="dashboard-footer-contact">
      <h3>Travel Inspiration</h3>
      <p>New places. New memories. Endless possibilities.</p>
      <a href="/explore-india" className="dashboard-footer-cta">
        Start Exploring <span>→</span>
      </a>
    </div>
  </div>

  <div className="dashboard-footer-bottom">
    <p>© {new Date().getFullYear()} TravelEase. All rights reserved.</p>
    <p>Made for journeys worth remembering <span>♥</span></p>
  </div>
</footer>

    </div>
    </div>
  );
}

export default Dashboard;
