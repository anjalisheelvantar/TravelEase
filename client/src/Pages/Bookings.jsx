
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bookings.css";
const travelVideo = "/videos/travel-video.mp4";

function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const getCabIcon = (cabType) => {
    const icons = {
      Bike: "🏍️",
      Auto: "🛺",
      Mini: "🚕",
      Sedan: "🚘",
      SUV: "🚙",
    };

    return icons[cabType] || "🚕";
  };

  const getCabName = (cabType) => {
    const names = {
      Bike: "Bike Ride",
      Auto: "Auto Ride",
      Mini: "Mini Cab",
      Sedan: "Sedan Ride",
      SUV: "SUV Ride",
    };

    return names[cabType] || "Cab Ride";
  };

  const formatDuration = (value) => {
    if (value === undefined || value === null || value === "") {
      return "N/A";
    }

    const minutes = Number(value);

    if (!Number.isFinite(minutes) || minutes < 0) {
      return "N/A";
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;

    return `${hours}h ${mins}m`;
  };

  const formatDate = (value) => {
    if (!value) return "Not specified";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      const userId =
        currentUser._id ||
        currentUser.id ||
        currentUser.userId;

      if (!userId) {
        setError("Your account information is incomplete. Please log in again.");
        setLoading(false);
        return;
      }

      fetchBookings(userId);
    } catch (err) {
      console.error("User data error:", err);
      setError("Unable to read your account information. Please log in again.");
      setLoading(false);
    }
  }, [navigate]);

  const fetchBookings = async (userId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/bookings/user/${userId}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch bookings.");
      }

      if (Array.isArray(result)) {
        setBookings(result);
      } else if (Array.isArray(result.bookings)) {
        setBookings(result.bookings);
      } else if (Array.isArray(result.data)) {
        setBookings(result.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Fetch bookings error:", err);
      setError("Unable to load your bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    const isCab = booking.bookingType === "Cab";
    const itemName = isCab ? "ride" : "ticket";

    const confirmed = window.confirm(
      `Are you sure you want to cancel this ${itemName}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${booking._id}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Unable to cancel ${itemName}.`);
      }

      setBookings((previous) =>
        previous.map((item) =>
          item._id === booking._id
            ? { ...item, status: "Cancelled" }
            : item
        )
      );

      window.alert(
        isCab
          ? "Cab booking cancelled successfully!"
          : "Ticket cancelled successfully!"
      );
    } catch (err) {
      console.error("Cancel booking error:", err);
      window.alert(err.message || "Unable to cancel your booking.");
    }
  };

  const isCancelled = (booking) =>
    String(booking.status || "").toLowerCase() === "cancelled";

  const confirmedCount = bookings.filter(
    (booking) => !isCancelled(booking)
  ).length;

  const cancelledCount = bookings.filter(isCancelled).length;

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "Confirmed") return !isCancelled(booking);
    if (filter === "Cancelled") return isCancelled(booking);
    return true;
  });

  if (loading) {
    return (
      <main className="bookings-page">
        <div className="bookings-loading">
          <div className="loading-icon">✈</div>
          <h2>Loading your journeys...</h2>
          <p>Getting your travel details ready.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bookings-page">
      <div className="bookings-video-background">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source
  src="https://res.cloudinary.com/gffv994z/video/upload/v1792825440/travel-video.mp4"
  type="video/mp4"
/>
      </video>
      <div className="bookings-video-overlay"></div>
    </div>
      <section className="bookings-hero">
        <div className="bookings-hero-content">
          <span className="bookings-eyebrow">YOUR TRAVEL SPACE</span>

          <div className="bookings-hero-row">
            <div>
              <h1>My Bookings<span>.</span></h1>
              <p>
                All your journeys, tickets and rides in one place.
                Your next adventure is always within reach.
              </p>
            </div>

            <div className="bookings-hero-symbol" aria-hidden="true">
              ✈
            </div>
          </div>

          <button
            type="button"
            className="bookings-explore-btn"
            onClick={() => navigate("/")}
          >
            Explore TravelEase <span>→</span>
          </button>
        </div>
      </section>

      <section className="bookings-container">
        {error ? (
          <div className="booking-error">
            <span className="booking-error-icon">!</span>
            <div>
              <strong>We couldn't load your bookings</strong>
              <p>{error}</p>
              <button
                type="button"
                className="bookings-retry-btn"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="booking-summary-grid">
              <div className="booking-summary-card">
                <div className="booking-summary-icon">▤</div>
                <div>
                  <span>Total bookings</span>
                  <strong>{bookings.length}</strong>
                </div>
              </div>

              <div className="booking-summary-card">
                <div className="booking-summary-icon summary-confirmed">✓</div>
                <div>
                  <span>Active bookings</span>
                  <strong>{confirmedCount}</strong>
                </div>
              </div>

              <div className="booking-summary-card">
                <div className="booking-summary-icon summary-cancelled">↶</div>
                <div>
                  <span>Cancelled</span>
                  <strong>{cancelledCount}</strong>
                </div>
              </div>
            </div>

            <div className="bookings-list-header">
              <div>
                <span className="bookings-section-label">YOUR JOURNEYS</span>
                <h2>Travel overview</h2>
                <p>Review your reservations and manage your tickets.</p>
              </div>

              <div className="booking-filters" aria-label="Filter bookings">
                {["All", "Confirmed", "Cancelled"].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={`booking-filter ${
                      filter === option ? "active" : ""
                    }`}
                    onClick={() => setFilter(option)}
                    aria-pressed={filter === option}
                  >
                    {option}
                    {option === "All" && (
                      <span>{bookings.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="no-bookings">
                <div className="no-bookings-icon">✈</div>
                <span className="bookings-section-label">
                  YOUR NEXT ADVENTURE AWAITS
                </span>
                <h2>Your travel story starts here</h2>
                <p>
                  You don't have any bookings yet. Find a destination,
                  choose your ride, and let TravelEase handle the journey.
                </p>

                <div className="no-bookings-actions">
                  <button onClick={() => navigate("/flights")}>
                    ✈ Explore Flights
                  </button>
                  <button onClick={() => navigate("/trains")}>
                    🚆 Find Trains
                  </button>
                  <button onClick={() => navigate("/cabs")}>
                    🚕 Book a Cab
                  </button>
                </div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bookings-filter-empty">
                <span>⌕</span>
                <h3>No {filter.toLowerCase()} bookings</h3>
                <p>Try another filter to see your other bookings.</p>
                <button onClick={() => setFilter("All")}>
                  Show all bookings
                </button>
              </div>
            ) : (
              <div className="bookings-list">
                {filteredBookings.map((booking) => {
                  const isCab = booking.bookingType === "Cab";
                  const isFlight = booking.bookingType === "Flight";
                  const cancelled = isCancelled(booking);

                  const icon = isCab
                    ? getCabIcon(booking.cabType)
                    : isFlight
                      ? "✈"
                      : "🚆";

                  const heading = isCab
                    ? getCabName(booking.cabType)
                    : isFlight
                      ? booking.airline || "Flight booking"
                      : booking.trainName || "Train booking";

                  const travelDate = formatDate(booking.travelDate);

                  return (
                    <article
                      className={`booking-card ${
                        cancelled ? "booking-cancelled" : ""
                      }`}
                      key={booking._id}
                    >
                      <div className="booking-card-top">
                        <div className="booking-title-group">
                          <div className="booking-type-icon">{icon}</div>
                          <div>
                            <span className="booking-type">
                              {isCab ? "CAB RIDE" : isFlight ? "FLIGHT" : "TRAIN"}
                            </span>
                            <h2>{heading}</h2>
                            <p>
                              {isCab
                                ? `Vehicle: ${booking.cabType || "Cab"}`
                                : isFlight
                                  ? `Flight ${[booking.airlineCode, booking.flightNumber].filter(Boolean).join(" ") || "details unavailable"}`
                                  : `Train No. ${booking.trainNumber || "Not specified"}`}
                              {booking.pnr ? ` · Ref: ${booking.pnr}` : ""}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`booking-status ${
                            cancelled ? "status-cancelled" : "status-confirmed"
                          }`}
                        >
                          <span className="status-dot" />
                          {cancelled ? "Cancelled" : "Confirmed"}
                        </span>
                      </div>

                      <div className="booking-route">
                        <div className="booking-station">
                          <small>{isCab ? "PICKUP POINT" : "DEPARTURE"}</small>
                          <strong>
                            {isCab
                              ? booking.from || "Not specified"
                              : booking.departureTime || "--:--"}
                          </strong>
                          <span>
                            {isCab
                              ? `Pickup: ${booking.pickupTime || booking.departureTime || "Not specified"}`
                              : booking.from || "Origin not specified"}
                          </span>
                        </div>

                        <div className="booking-route-connector" aria-hidden="true">
                          <span className="route-dot" />
                          <span className="route-line" />
                          <span className="route-plane">{isCab ? "↗" : "✈"}</span>
                          <span className="route-line" />
                          <span className="route-dot" />
                        </div>

                        <div className="booking-station booking-station-arrival">
                          <small>{isCab ? "DROP POINT" : "ARRIVAL"}</small>
                          <strong>
                            {isCab
                              ? booking.to || "Not specified"
                              : booking.arrivalTime || "--:--"}
                          </strong>
                          <span>
                            {isCab
                              ? "Destination"
                              : booking.to || "Destination not specified"}
                          </span>
                        </div>
                      </div>

                      <div className="booking-details">
                        <div>
                          <span className="booking-detail-icon">▦</span>
                          <div>
                            <small>TRAVEL DATE</small>
                            <strong>{travelDate}</strong>
                          </div>
                        </div>

                        <div>
                          <span className="booking-detail-icon">◷</span>
                          <div>
                            <small>DURATION</small>
                            <strong>{formatDuration(booking.duration)}</strong>
                          </div>
                        </div>

                        <div>
                          <span className="booking-detail-icon">↗</span>
                          <div>
                            <small>DISTANCE</small>
                            <strong>
                              {booking.distance
                                ? `${booking.distance} km`
                                : isCab && booking.estimatedDistance
                                  ? `${booking.estimatedDistance} km`
                                  : "N/A"}
                            </strong>
                          </div>
                        </div>

                        {isCab && (
                          <div>
                            <span className="booking-detail-icon">₹</span>
                            <div>
                              <small>ESTIMATED FARE</small>
                              <strong>
                                ₹
                                {Number(booking.totalAmount || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </strong>
                            </div>
                          </div>
                        )}

                        {isFlight && (
                          <div>
                            <span className="booking-detail-icon">♧</span>
                            <div>
                              <small>CABIN CLASS</small>
                              <strong>{booking.cabinClass || "Economy"}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="booking-actions">
                        <span className="booking-reference">
                          {booking.pnr
                            ? `Booking reference: ${booking.pnr}`
                            : `Booking ID: ${booking._id || "Unavailable"}`}
                        </span>

                        {cancelled ? (
                          <span className="cancelled-message">
                            This booking has been cancelled.
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            Cancel {isCab ? "ride" : "ticket"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="bookings-bottom-note">
              <span>✦</span>
              Your next memorable journey is just around the corner.
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Bookings;
