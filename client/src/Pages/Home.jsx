
import { Link } from "react-router-dom";
import "./Home.css";
import travelVideo from "../assets/travel-video.mp4";
import ExploreIndia from "./ExploreIndia.jsx";

const services = [
  { icon: "✈️", title: "Flights", path: "/flights" },
  { icon: "🚆", title: "Trains", path: "/trains" },
  { icon: "🚕", title: "Cabs", path: "/cabs" },
  { icon: "🏨", title: "Hotels", path: "/hotels" },
];

function Home() {
  return (
    <div className="home-page">
      {/* HERO WITH VIDEO BACKGROUND */}
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src={travelVideo} type="video/mp4" />
        </video>

        <div className="hero-overlay"></div>

        <div className="container hero-content">
          <div className="hero-badge">🌍 Explore • Discover • Travel</div>

          <h1>
            Travel Smarter with
            <span> TravelEase</span>
          </h1>

          <p>
            Plan, compare and manage your complete journey from one beautiful
            platform.
          </p>

          <div className="hero-buttons">
            <Link to="/ai-planner" className="hero-btn primary-btn">
              ✨ Plan My Trip with AI
            </Link>

            <Link to="/explore-india" className="hero-btn secondary-btn">
              🗺️ Explore India
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section services-section">
        <div className="container">
          <div className="section-title">
            <span className="section-tag">TRAVEL SERVICES</span>

            <h2>Everything You Need for Your Journey</h2>

            <p>Book every part of your journey in one place.</p>
          </div>

          <div className="transport-grid">
            {services.map((service) => (
              <Link
                to={service.path}
                key={service.title}
                className="service-link"
              >
                <div className="transport-card">
                  <div className="transport-icon">{service.icon}</div>

                  <h3>{service.title}</h3>

                  <p>Explore and book your journey</p>

                  <span className="card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}

<section className="ai-planning-section">
  <div className="ai-planning-orb ai-orb-one" />
  <div className="ai-planning-orb ai-orb-two" />

  <div className="ai-planning-heading">
    <span className="ai-planning-eyebrow">
      ✦ YOUR JOURNEY, REIMAGINED
    </span>

    <h2>
      Travel smarter with <span>AI</span>
    </h2>

    <p>
      Thoughtful recommendations. Smarter budgets. Journeys made for you.
    </p>
  </div>

  <div className="ai-glass-grid">
    <article className="ai-glass-card">
      <div className="ai-glass-icon ai-icon-purple">🧠</div>
      <span className="ai-card-number">01 / DISCOVER</span>
      <h3>Smart Recommendations</h3>
      <p>
        Discover routes and travel options tailored to your budget,
        preferences and available time.
      </p>
      <span className="ai-card-decoration">↗</span>
    </article>

    <article className="ai-glass-card ai-glass-card-featured">
      <div className="ai-glass-icon ai-icon-blue">✧</div>
      <span className="ai-card-number">02 / OPTIMIZE</span>
      <h3>Budget Optimization</h3>
      <p>
        Make every rupee count with a thoughtful split for stays,
        transport and experiences.
      </p>
      <span className="ai-card-decoration">↗</span>
    </article>

    <article className="ai-glass-card">
      <div className="ai-glass-icon ai-icon-coral">🗺️</div>
      <span className="ai-card-number">03 / EXPLORE</span>
      <h3>AI Itinerary</h3>
      <p>
        Turn your destination and travel style into a personalized
        day-by-day adventure.
      </p>
      <span className="ai-card-decoration">↗</span>
    </article>
  </div>

  <div className="ai-planning-cta">
    <div className="ai-cta-copy">
      <span className="ai-cta-label">YOUR NEXT CHAPTER STARTS HERE</span>
      <h3>Somewhere amazing is waiting.</h3>
      <p>Let's make your next trip one to remember.</p>
    </div>

    <Link to="/ai-planner" className="ai-glass-cta-button">
      <span>✦</span> Start Planning <span className="ai-cta-arrow">→</span>
    </Link>
  </div>

  <div className="ai-planning-footer">
    <span>✦ MADE FOR YOUR KIND OF TRAVEL</span>
    <span>EXPLORE MORE. WORRY LESS.</span>
  </div>
</section>

      <ExploreIndia />
    </div>
  );
}

export default Home;
