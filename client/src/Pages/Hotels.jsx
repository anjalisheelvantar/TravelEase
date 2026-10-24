
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Hotels.css";
const hotelVideo = "/videos/hotel-background.mp4";


const API_URL = "http://localhost:5000/api";

function Hotels() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [rooms, setRooms] = useState(1);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-CA");

  // Search hotels using the existing backend.
  const searchHotels = async (e) => {
    e?.preventDefault();
    setError("");
    setHotels([]);

    if (!location.trim()) {
      setError("Please enter your destination.");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select your check-in and check-out dates.");
      return;
    }

    if (checkIn < today) {
      setError("Check-in cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(`${API_URL}/hotels/search`, {
        params: {
          city: location.trim(),
          checkIn,
          checkOut,
          adults,
          rooms,
        },
        timeout: 90000,
      });

      if (response.data?.success) {
        const results = response.data.hotels || [];
        setHotels(results);

        if (!results.length) {
          setError(
            `No hotels found in ${location}. Try another destination.`
          );
        }
      } else {
        setError(response.data?.message || "No hotels found.");
      }
    } catch (err) {
      console.error("Hotel search error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load hotels. Please check your server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Open the hotel's own website, or its Google Maps location.
  const viewHotel = (hotel) => {
    if (hotel.website) {
      const website = /^https?:\/\//i.test(hotel.website)
        ? hotel.website
        : `https://${hotel.website}`;

      window.open(website, "_blank", "noopener,noreferrer");
    } else if (
      hotel.latitude != null &&
      hotel.longitude != null
    ) {
      const url = `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;

      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const query = encodeURIComponent(
        `${hotel.name || "Hotel"} ${hotel.address || location}`
      );

      window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // The only external booking platform.
  const openBookingWebsite = (hotel) => {
    const hotelName = hotel.name || "Hotel";

    const destination = [
      hotelName,
      hotel.city,
      location.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    const params = new URLSearchParams({
      ss: destination,
      checkin: checkIn,
      checkout: checkOut,
      group_adults: String(adults),
      group_children: "0",
      no_rooms: String(rooms),
    });

    const url = `https://www.booking.com/searchresults.html?${params.toString()}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Keep TravelEase's existing demo booking flow.
  const bookHotel = (hotel) => {
    navigate("/hotel-booking", {
      state: {
        hotel: {
          ...hotel,
          id: hotel.id || hotel.code || hotel.place_id || "",
          name: hotel.name || "Hotel",
          address: hotel.address || "",
          city: hotel.city || location.trim(),
          website: hotel.website || "",
        },
        checkIn,
        checkOut,
        adults,
        rooms,
      },
    });
  };

  return (
    <main className="hotels-page">
      {/* VIDEO HERO + SEARCH FORM */}
      <section className="hotels-hero">
        <video
          className="hotels-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
    <source
  src="https://res.cloudinary.com/gffv994z/video/upload/v1792825106/hotel-background_1.mp4"
  type="video/mp4"
/>
        </video>

        {/* Keep the video's original colors */}
        <div className="hotels-hero-content">
          <span className="hero-eyebrow">
            ✦ EXPLORE YOUR NEXT GETAWAY ✦
          </span>

          <h1>
            Find Your Perfect Stay <span>🏨</span>
          </h1>

          <p>
            Discover beautiful stays and book your next escape.
          </p>

          {/* Search bar inside the video */}
          <form className="hotel-search-box" onSubmit={searchHotels}>
            <div className="search-field destination-field">
              <label htmlFor="hotel-location">DESTINATION</label>
              <input
                id="hotel-location"
                type="text"
                placeholder="City or destination"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="hotel-checkin">CHECK-IN</label>
              <input
                id="hotel-checkin"
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="hotel-checkout">CHECK-OUT</label>
              <input
                id="hotel-checkout"
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
              />
            </div>

            <div className="search-field">
              <label htmlFor="hotel-adults">GUESTS</label>
              <select
                id="hotel-adults"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Adult" : "Adults"}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label htmlFor="hotel-rooms">ROOMS</label>
              <select
                id="hotel-rooms"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Room" : "Rooms"}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="search-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search Hotels  →"}
            </button>
          </form>

          <div className="hero-trust-line">
            ✦ FIND YOUR STAY &nbsp; • &nbsp; PLAN YOUR ESCAPE &nbsp; •
            &nbsp; TRAVEL MORE
          </div>
        </div>
      </section>

      {/* SEARCH FEEDBACK */}
      {error && (
        <div className="hotel-error" role="alert">
          <span>ⓘ</span> {error}
        </div>
      )}

      {loading && (
        <div className="hotel-loading">
          <div className="loader" />
          <p>Finding beautiful stays for you...</p>
        </div>
      )}

      {/* HOTEL RESULTS */}
      {!loading && hotels.length > 0 && (
        <section className="hotel-results">
          <div className="results-heading">
            <div>
              <span className="section-eyebrow">YOUR DESTINATION</span>
              <h2>Stays in {location}</h2>
            </div>

            <span className="results-count">
              {hotels.length} places found
            </span>
          </div>

          <div className="hotel-grid">
            {hotels.map((hotel, index) => (
              <article
                className="hotel-card"
                key={
                  hotel.id ||
                  hotel.place_id ||
                  `${hotel.name || "hotel"}-${index}`
                }
              >
                <div className="hotel-image-container">
                  <div className="hotel-placeholder">
                    <span>🏨</span>
                    <p>Your next stay awaits</p>
                  </div>

                  <span className="hotel-image-label">
                    {hotel.rating ? `★ ${hotel.rating}` : "HOTEL"}
                  </span>
                </div>

                <div className="hotel-details">
                  <h3>{hotel.name || "Hotel"}</h3>

                  {(hotel.city || hotel.state) && (
                    <p className="hotel-location">
                      📍 {hotel.city || ""}
                      {hotel.city && hotel.state ? ", " : ""}
                      {hotel.state || ""}
                    </p>
                  )}

                  {hotel.address && (
                    <p className="hotel-address">{hotel.address}</p>
                  )}

                  {hotel.distance != null && (
                    <p className="hotel-distance">
                      📏{" "}
                      {(Number(hotel.distance) / 1000).toFixed(1)} km away
                    </p>
                  )}

                  {hotel.categories?.length > 0 && (
                    <p className="hotel-category">
                      {hotel.categories
                        .filter((c) =>
                          c.toLowerCase().includes("accommodation")
                        )
                        .map((c) =>
                          c.replace(/accommodation/gi, "").trim()
                        )
                        .filter(Boolean)
                        .join(", ") || "Accommodation"}
                    </p>
                  )}

                  {hotel.phone && (
                    <p className="hotel-phone">📞 {hotel.phone}</p>
                  )}

                  {/* ONE external booking link only */}
                  <div className="hotel-external-booking">
                    <button
                      type="button"
                      className="booking-website-button"
                      onClick={() => openBookingWebsite(hotel)}
                    >
                      Check Hotel Prices ↗
                    </button>

                    <p className="external-booking-note">
                      Check room prices and availability on Booking.com.
                    </p>
                  </div>

                  {/* Existing hotel actions */}
                  <div className="hotel-card-actions">
                    <button
                      type="button"
                      className="view-hotel-button"
                      onClick={() => viewHotel(hotel)}
                    >
                      {hotel.website
                        ? "Visit Hotel ↗"
                        : "View Location ↗"}
                    </button>

                    <button
                      type="button"
                      className="hotel-book-now-btn"
                      onClick={() => bookHotel(hotel)}
                    >
                      Book Now
                    </button>
                  </div>

                  <p className="hotel-demo-note">
                    Book Now continues to TravelEase's demo booking page.
                    It does not reserve a room on Booking.com.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default Hotels;
