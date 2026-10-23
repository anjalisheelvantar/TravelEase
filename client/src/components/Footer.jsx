function Footer() {
  return (
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
  );
}

export default Footer;