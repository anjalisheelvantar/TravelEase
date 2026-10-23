
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HotelBooking.css";

const API_URL = "http://localhost:5000/api";

function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function HotelBooking() {
  const location = useLocation();
  const navigate = useNavigate();

  const selection = location.state || {};
  const hotel = selection.hotel;

  const [guest, setGuest] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [checkIn, setCheckIn] = useState(
    selection.checkIn || todayString()
  );
  const [checkOut, setCheckOut] = useState(
    selection.checkOut || ""
  );
  const [adults, setAdults] = useState(Number(selection.adults) || 2);
  const [rooms, setRooms] = useState(Number(selection.rooms) || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!hotel) {
    return (
      <main className="hotel-booking-page">
        <section className="hotel-booking-card">
          <h2>No hotel selected</h2>
          <p>Go back to hotel search and choose a hotel first.</p>
          <button
            type="button"
            onClick={() => navigate("/hotels")}
            className="hotel-primary-btn"
          >
            Back to Hotels
          </button>
        </section>
      </main>
    );
  }

  function updateGuest(event) {
    setGuest({ ...guest, [event.target.name]: event.target.value });
  }

  async function submitBooking(event) {
    event.preventDefault();
    setError("");

    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError("Check-out must be at least one day after check-in.");
      return;
    }

    if (!guest.fullName.trim() || !guest.email.trim() || !guest.phone.trim()) {
      setError("Please fill in all guest details.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/hotel-bookings`, {
        hotel: {
          id: hotel.id || hotel.code || hotel.place_id || "",
          name: hotel.name || "Selected hotel",
          address: hotel.address || "",
          city: hotel.city || hotel.destination || "",
          website: hotel.website || "",
        },
        guest: {
          fullName: guest.fullName,
          email: guest.email,
          phone: guest.phone,
        },
        checkIn,
        checkOut,
        adults: Number(adults),
        rooms: Number(rooms),
      });

      if (!response.data.success || !response.data.booking?.id) {
        throw new Error("The booking could not be confirmed.");
      }

      navigate(`/hotel-confirmation/${response.data.booking.id}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not save your booking. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hotel-booking-page">
      <section className="hotel-booking-card">
        <button
          type="button"
          className="hotel-back-btn"
          onClick={() => navigate("/hotels")}
        >
          ← Back to Hotels
        </button>

        <p className="hotel-demo-label">DEMO BOOKING · NO PAYMENT</p>
        <h1>Complete Your Booking</h1>
        <p className="hotel-booking-subtitle">
          Enter the guest details to save your reservation in TravelEase.
        </p>

        <div className="selected-hotel">
          <h2>{hotel.name || "Selected hotel"}</h2>
          <p>
            {hotel.address || hotel.city || hotel.destination ||
              "Hotel location"}
          </p>
          <p className="hotel-demo-note">
            This is a demo reservation. It does not reserve a room with the
            hotel itself.
          </p>
          {hotel.price != null && Number.isFinite(Number(hotel.price)) && (
  <p className="hotel-booking-price">
    Estimated stay cost:{" "}
    {new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: hotel.currency || "INR",
      maximumFractionDigits: 2,
    }).format(Number(hotel.price))}
  </p>
)}
        </div>

        <form onSubmit={submitBooking} className="hotel-booking-form">
          <h2>Guest Details</h2>

          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            value={guest.fullName}
            onChange={updateGuest}
            placeholder="Enter guest's full name"
            autoComplete="name"
            maxLength={100}
            required
          />

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            value={guest.email}
            onChange={updateGuest}
            placeholder="guest@example.com"
            autoComplete="email"
            maxLength={254}
            required
          />

          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={guest.phone}
            onChange={updateGuest}
            placeholder="Enter phone number"
            autoComplete="tel"
            maxLength={20}
            required
          />

          <h2>Stay Details</h2>

          <div className="hotel-booking-fields">
            <div>
              <label htmlFor="checkIn">Check-in</label>
              <input
                id="checkIn"
                type="date"
                value={checkIn}
                min={todayString()}
                onChange={(event) => setCheckIn(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="checkOut">Check-out</label>
              <input
                id="checkOut"
                type="date"
                value={checkOut}
                min={checkIn || todayString()}
                onChange={(event) => setCheckOut(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="adults">Adults</label>
              <input
                id="adults"
                type="number"
                min="1"
                max="20"
                value={adults}
                onChange={(event) => setAdults(event.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="rooms">Rooms</label>
              <input
                id="rooms"
                type="number"
                min="1"
                max="10"
                value={rooms}
                onChange={(event) => setRooms(event.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="hotel-booking-error">{error}</p>}

          <button
            type="submit"
            className="hotel-primary-btn"
            disabled={loading}
          >
            {loading ? "Saving Booking..." : "Confirm Demo Booking"}
          </button>

          <p className="hotel-demo-note">
            No payment is required. Your demo booking details will be saved
            to MongoDB.
          </p>
        </form>
      </section>
    </main>
  );
}
