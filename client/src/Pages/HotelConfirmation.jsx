
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./HotelConfirmation.css";

const API_URL = "https://travelease-backend-qbth.onrender.com/api";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function HotelConfirmation() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBooking() {
      try {
        const response = await axios.get(
          `${API_URL}/hotel-bookings/${encodeURIComponent(bookingId)}`
        );

        if (active && response.data.success) {
          setBooking(response.data.booking);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Could not load this booking. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBooking();

    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <main className="hotel-confirmation-page">
        <section className="hotel-confirmation-card">
          <p>Loading your booking confirmation...</p>
        </section>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="hotel-confirmation-page">
        <section className="hotel-confirmation-card">
          <h1>Booking not found</h1>
          <p>{error || "We could not find this booking."}</p>
          <Link className="confirmation-home-btn" to="/hotels">
            Back to Hotels
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="hotel-confirmation-page">
      <section className="hotel-confirmation-card">
        <div className="confirmation-check">✓</div>

        <p className="confirmation-eyebrow">TRAVELEASE · DEMO BOOKING</p>
        <h1>Booking Confirmed!</h1>
        <p className="confirmation-intro">
          Your demo booking has been saved successfully in MongoDB.
        </p>

        <div className="confirmation-reference">
          <span>Booking reference</span>
          <strong>{booking.bookingReference}</strong>
        </div>

        <div className="confirmation-section">
          <h2>Hotel Details</h2>
          <p><strong>Hotel:</strong> {booking.hotel?.name}</p>
          <p>
            <strong>Address:</strong> {booking.hotel?.address || "Not provided"}
          </p>
          <p><strong>City:</strong> {booking.hotel?.city || "Not provided"}</p>
        </div>

        <div className="confirmation-section">
          <h2>Guest Details</h2>
          <p><strong>Name:</strong> {booking.guest?.fullName}</p>
          <p><strong>Email:</strong> {booking.guest?.email}</p>
          <p><strong>Phone:</strong> {booking.guest?.phone}</p>
        </div>

        <div className="confirmation-section">
          <h2>Stay Details</h2>
          <p><strong>Check-in:</strong> {formatDate(booking.checkIn)}</p>
          <p><strong>Check-out:</strong> {formatDate(booking.checkOut)}</p>
          <p><strong>Nights:</strong> {booking.nights}</p>
          <p><strong>Adults:</strong> {booking.adults}</p>
          <p><strong>Rooms:</strong> {booking.rooms}</p>
        </div>

        <div className="confirmation-status">
          <p><strong>Status:</strong> {booking.status}</p>
          <p><strong>Payment:</strong> Not required — demo only</p>
        </div>

        <p className="confirmation-disclaimer">
          This confirmation is for your TravelEase project demo. It is not a
          hotel-issued reservation or proof of payment.
        </p>

        <Link to="/hotels" className="confirmation-home-btn">
          Search More Hotels
        </Link>
      </section>
    </main>
  );
}
