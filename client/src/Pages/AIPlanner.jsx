import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./AIPlanner.css";
import aiTravelVideo from "../assets/ai-travel.mp4";

function AIPlanner() {
  const location = useLocation();

  const [form, setForm] = useState({
    destination: "",
    days: "",
    budget: "",
    travelers: "1",
    preference: "balanced",
  });

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const destination = location.state?.destination;

    if (destination) {
      setForm((previous) => ({
        ...previous,
        destination,
      }));
    }
  }, [location.state]);

  // Keep the rest of your existing code unchanged.
  

  function handleChange(e) {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  async function generatePlan(e) {
    e.preventDefault();

    setLoading(true);
    setResult("");
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/ai/trip-plan",
        {
          ...form,
          days: Number(form.days),
          budget: Number(form.budget),
          travelers: Number(form.travelers),
        }
      );

      const plan = response.data.plan;

      if (!plan) {
        throw new Error("The server returned an empty travel plan.");
      }

      setResult(
        typeof plan === "string" ? plan : JSON.stringify(plan, null, 2)
      );
    } catch (err) {
      console.error("AI Planner error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to generate your trip plan. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  const preferenceLabels = {
    budget: "Budget friendly",
    balanced: "Balanced",
    comfort: "Comfort",
    adventure: "Adventure",
  };

  return (
    <main className="ai-planner-page">
      <section className="ai-planner-hero">
        <div className="ai-hero-glow ai-hero-glow-one" />
        <div className="ai-hero-glow ai-hero-glow-two" />

        <div className="ai-hero-content">
<video
  className="ai-planner-hero-video"
  autoPlay
  muted
  loop
  playsInline
>
  <source src={aiTravelVideo} type="video/mp4" />
</video>

          <span className="ai-eyebrow">
            ✦ YOUR PERSONAL TRAVEL ASSISTANT
          </span>

          <h1>
            Your next adventure,
            <br />
            <span>planned beautifully.</span>
          </h1>

          <p>
            Tell us what you love, set your budget, and create a trip
            tailored to you with TravelEase.
          </p>

          <div className="ai-hero-highlights">
            <span>✦ Personalised itineraries</span>
            <span>✦ Budget-aware planning</span>
            <span>✦ Places worth exploring</span>
          </div>
        </div>
      </section>

      <div className="ai-planner-container">
        <section className="ai-planner-card">
          <div className="ai-section-heading">
            <div className="ai-section-icon">✈</div>
            <div>
              <span className="ai-section-kicker">LET'S PLAN</span>
              <h2>Design your perfect trip</h2>
              <p>Share a few details to get your personalised travel plan.</p>
            </div>
          </div>

          <form className="ai-planner-form" onSubmit={generatePlan}>
            <div className="ai-form-group ai-destination-field">
              <label htmlFor="ai-destination">Where do you want to go?</label>
              <input
                id="ai-destination"
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="e.g. Goa, Coorg, Jaipur"
                required
              />
            </div>

            <div className="ai-form-group">
              <label htmlFor="ai-days">Trip duration</label>
              <div className="ai-input-with-icon">
                <span>◷</span>
                <input
                  id="ai-days"
                  type="number"
                  name="days"
                  value={form.days}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  placeholder="3 days"
                  required
                />
              </div>
            </div>

            <div className="ai-form-group">
              <label htmlFor="ai-travelers">Travellers</label>
              <div className="ai-input-with-icon">
                <span>♙</span>
                <input
                  id="ai-travelers"
                  type="number"
                  name="travelers"
                  value={form.travelers}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  required
                />
              </div>
            </div>

            <div className="ai-form-group">
              <label htmlFor="ai-budget">Total budget (₹)</label>
              <div className="ai-input-with-icon">
                <span>₹</span>
                <input
                  id="ai-budget"
                  type="number"
                  name="budget"
                  value={form.budget}
                  onChange={handleChange}
                  min="1"
                  placeholder="10000"
                  required
                />
              </div>
            </div>

            <div className="ai-form-group ai-preference-field">
              <label htmlFor="ai-preference">Your travel style</label>
              <select
                id="ai-preference"
                name="preference"
                value={form.preference}
                onChange={handleChange}
              >
                <option value="budget">💰 Budget friendly</option>
                <option value="balanced">⚖️ Balanced</option>
                <option value="comfort">🛏️ Comfort</option>
                <option value="adventure">🏞️ Adventure</option>
              </select>
            </div>

            <div className="ai-form-footer">
              <p>✦ Your plan is tailored to your selected budget and style.</p>
              <button
                className="ai-generate-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="ai-spinner" />
                    Creating your plan...
                  </>
                ) : (
                  <>Generate my trip <span>→</span></>
                )}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <section className="ai-status-message ai-error-message" role="alert">
            <span className="ai-status-icon">!</span>
            <div>
              <strong>We couldn't create your plan</strong>
              <p>{error}</p>
            </div>
          </section>
        )}

        {loading && (
          <section className="ai-loading-card" aria-live="polite">
            <div className="ai-loading-symbol">✦</div>
            <h2>Putting your adventure together...</h2>
            <p>Preparing ideas for your destination and travel budget.</p>
          </section>
        )}

        {result && !loading && (
          <section className="ai-results-section">
            <div className="ai-results-heading">
              <div>
                <span className="ai-section-kicker">MADE FOR YOU</span>
                <h2>Your travel blueprint</h2>
                <p>Review your plan and start shaping your adventure.</p>
              </div>
              <button
                type="button"
                className="ai-secondary-button"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>
            </div>

            <div className="ai-trip-summary">
              <div className="ai-summary-item">
                <span>DESTINATION</span>
                <strong>📍 {form.destination}</strong>
              </div>
              <div className="ai-summary-item">
                <span>DURATION</span>
                <strong>◷ {form.days} days</strong>
              </div>
              <div className="ai-summary-item">
                <span>TRAVELLERS</span>
                <strong>♙ {form.travelers}</strong>
              </div>
              <div className="ai-summary-item">
                <span>BUDGET</span>
                <strong>₹{Number(form.budget).toLocaleString("en-IN")}</strong>
              </div>
              <div className="ai-summary-item">
                <span>TRAVEL STYLE</span>
                <strong>{preferenceLabels[form.preference]}</strong>
              </div>
            </div>

            <article className="ai-generated-plan">
              <div className="ai-generated-plan-heading">
                <span className="ai-plan-sparkle">✦</span>
                <div>
                  <h3>Your personalised itinerary</h3>
                  <p>Generated by your TravelEase planner</p>
                </div>
              </div>

              <div className="ai-plan-text">{result}</div>
            </article>

            <p className="ai-results-note">
              Budget and travel suggestions are estimates. Confirm current
              prices, opening hours, and availability before booking.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default AIPlanner;
