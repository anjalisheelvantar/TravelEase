import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookFlight.css";

const API_URL = "https://travelease-backend-qbth.onrender.com/api";

// ==========================================
// FORMAT PRICE USING THE FLIGHT CURRENCY
// ==========================================

function formatINR(amount, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(dateString) {
  if (!dateString) return "--:--";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {
  if (!dateString) return "Not specified";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// FORMAT DURATION
// ==========================================

function formatDuration(duration) {
  if (!duration) return "--";

  if (typeof duration === "number") {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return `${hours}h ${minutes}m`;
  }

  const match = String(duration).match(
    /PT(?:(\d+)H)?(?:(\d+)M)?/
  );

  if (!match) return duration;

  const hours = match[1] || 0;
  const minutes = match[2] || 0;

  return `${hours}h ${minutes}m`;
}

// ==========================================
// GET AIRLINE NAME
// ==========================================

function getAirlineName(flight) {
  return (
    flight.airline ||
    flight.airlineName ||
    flight.carrier?.name ||
    "Airline"
  );
}

// ==========================================
// GET FLIGHT PRICE
// ==========================================

function getPriceINR(flight) {
  const price =
    flight?.price ??
    flight?.priceINR ??
    flight?.priceInINR ??
    flight?.totalAmount ??
    flight?.total_amount ??
    0;

  return Number(price) || 0;
}

// ==========================================
// BOOK FLIGHT COMPONENT
// ==========================================

function BookFlight() {
  const location = useLocation();
  const navigate = useNavigate();

  const flight = location.state?.flight;

  const travelDate =
    location.state?.travelDate ||
    flight?.travelDate ||
    "";

  const cabinClass =
    location.state?.cabinClass ||
    flight?.cabinClass ||
    "Economy";

  // ==========================================
  // IF FLIGHT DATA IS MISSING
  // ==========================================

  if (!flight) {
    return (
      <div className="booking-error-page">
        <div className="booking-error-box">
          <h2>✈️ Flight information not found</h2>

          <p>
            Please search and select a flight first.
          </p>

          <button
            onClick={() => navigate("/flights")}
          >
            ← Back to Flights
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATES
  // ==========================================

  const [step, setStep] = useState(1);

  const [passengers, setPassengers] = useState([
    {
      name: "",
      age: "",
      gender: "",
    },
  ]);

  const [paymentMethod, setPaymentMethod] =
    useState("UPI");

  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // FLIGHT DETAILS
  // ==========================================

  const airline = getAirlineName(flight);

  const airlineCode =
    flight.airlineCode ||
    flight.carrier?.iata_code ||
    flight.carrierCode ||
    "";

  const flightNumber =
    flight.flightNumber ||
    flight.flight_number ||
    flight.number ||
    "";

  const stops = Number(flight.stops || 0);

  // ==========================================
  // PRICE
  // ==========================================

  const farePerPassenger = getPriceINR(flight);

  const fareCurrency = flight.currency || "INR";

  const totalAmount =
    farePerPassenger * passengers.length;

  // ==========================================
  // ADD PASSENGER
  // ==========================================

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: "",
        age: "",
        gender: "",
      },
    ]);
  };

  // ==========================================
  // REMOVE PASSENGER
  // ==========================================

  const removePassenger = (index) => {
    if (passengers.length === 1) return;

    setPassengers(
      passengers.filter((_, i) => i !== index)
    );
  };

  // ==========================================
  // UPDATE PASSENGER
  // ==========================================

  const updatePassenger = (
    index,
    field,
    value
  ) => {
    const updatedPassengers = [...passengers];

    updatedPassengers[index] = {
      ...updatedPassengers[index],
      [field]: value,
    };

    setPassengers(updatedPassengers);
  };

  // ==========================================
  // VALIDATE PASSENGERS
  // ==========================================

  const continueToSummary = () => {
    setError("");

    for (const passenger of passengers) {
      if (
        !passenger.name.trim() ||
        passenger.age === "" ||
        !passenger.gender
      ) {
        setError(
          "Please fill all passenger details."
        );

        return;
      }

      const age = Number(passenger.age);

      if (Number.isNaN(age)) {
        setError("Please enter a valid age.");
        return;
      }

      if (age < 3 || age > 120) {
        setError(
          "Passenger age must be between 3 and 120."
        );

        return;
      }
    }

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // PAYMENT PAGE
  // ==========================================

  const continueToPayment = () => {
    setError("");

    setStep(3);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // CONFIRM BOOKING
  // ==========================================

  const confirmBooking = async () => {
    setLoading(true);
    setError("");

    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        setError("Please login before booking a flight.");

        setLoading(false);

        navigate("/login");

        return;
      }

      const user = JSON.parse(savedUser);

      const userId =
        user._id ||
        user.id ||
        user.userId;

      if (!userId) {
        setError(
          "User information is missing. Please login again."
        );

        setLoading(false);

        return;
      }

      console.log("Sending booking request...");

      const bookingData = {
        userId,

        bookingType: "Flight",

        airline,
        airlineCode,
        flightNumber,

        cabinClass,

        from: flight.from || "",
        to: flight.to || "",

        departureTime:
          flight.departureTime || "",

        arrivalTime:
          flight.arrivalTime || "",

        travelDate:
          travelDate ||
          flight.departureTime ||
          "",

        duration:
          typeof flight.duration === "number"
            ? flight.duration
            : 0,

        distance: 0,

        passengers: passengers.map((passenger) => ({
          name: passenger.name.trim(),
          age: Number(passenger.age),
          gender: passenger.gender,
        })),

        farePerPassenger:
          Number(farePerPassenger),

        totalAmount:
          Number(totalAmount),

        currency: fareCurrency,

        paymentMethod,
      };

      console.log(
        "BOOKING DATA:",
        bookingData
      );

      const response = await fetch(
        `${API_URL}/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(
            bookingData
          ),
        }
      );

      const result =
        await response.json();

      console.log(
        "BOOKING RESPONSE:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Unable to confirm booking"
        );
      }

      if (!result.success) {
        throw new Error(
          result.message ||
          "Booking failed"
        );
      }

      console.log(
        "BOOKING SUCCESSFUL!"
      );

      setBooking(result.booking);

      setLoading(false);

      setStep(4);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "BOOKING ERROR:",
        error
      );

      setError(
        error.message ||
        "Unable to complete booking."
      );

      setLoading(false);
    }
  };

  // ==========================================
  // STEP INDICATOR
  // ==========================================

  const renderSteps = () => (
    <div className="booking-steps">
      <div
        className={
          step >= 1
            ? "step active"
            : "step"
        }
      >
        <span>1</span>
        Passenger
      </div>

      <div className="step-line"></div>

      <div
        className={
          step >= 2
            ? "step active"
            : "step"
        }
      >
        <span>2</span>
        Summary
      </div>

      <div className="step-line"></div>

      <div
        className={
          step >= 3
            ? "step active"
            : "step"
        }
      >
        <span>3</span>
        Payment
      </div>

      <div className="step-line"></div>

      <div
        className={
          step >= 4
            ? "step active"
            : "step"
        }
      >
        <span>✓</span>
        Confirmed
      </div>
    </div>
  );

  // ==========================================
  // STEP 1 - PASSENGER DETAILS
  // ==========================================

  if (step === 1) {
    return (
      <div className="book-flight-page">
        <div className="booking-container">
          {renderSteps()}

          <div className="booking-header">
            <span className="header-icon">✈️</span>

            <h1>Passenger Details</h1>

            <p>
              Enter details for all passengers
            </p>
          </div>

          {/* FLIGHT MINI CARD */}

          <div className="mini-flight-card">
            <div>
              <h2>{airline}</h2>

              <p>
                {airlineCode} {flightNumber}
              </p>
            </div>

            <div className="mini-route">
              <strong>
                {formatTime(
                  flight.departureTime
                )}
              </strong>

              <span> ✈ </span>

              <strong>
                {formatTime(
                  flight.arrivalTime
                )}
              </strong>
            </div>
          </div>

          {/* PASSENGERS */}

          {passengers.map(
            (passenger, index) => (
              <div
                className="passenger-card"
                key={index}
              >
                <div className="passenger-title">
                  <h2>
                    👤 Passenger {index + 1}
                  </h2>

                  {passengers.length > 1 && (
                    <button
                      type="button"
                      className="remove-passenger"
                      onClick={() =>
                        removePassenger(index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="passenger-grid">
                  <div>
                    <label>Full Name</label>

                    <input
                      type="text"
                      placeholder="Enter passenger name"
                      value={passenger.name}
                      onChange={(e) =>
                        updatePassenger(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>Age</label>

                    <input
                      type="number"
                      min="3"
                      max="120"
                      placeholder="Age"
                      value={passenger.age}
                      onChange={(e) =>
                        updatePassenger(
                          index,
                          "age",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>Gender</label>

                    <select
                      value={passenger.gender}
                      onChange={(e) =>
                        updatePassenger(
                          index,
                          "gender",
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select Gender
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )
          )}

          <button
            className="add-passenger-button"
            onClick={addPassenger}
          >
            + Add Passenger
          </button>

          {error && (
            <div className="booking-error">
              ⚠️ {error}
            </div>
          )}

          <button
            className="continue-button"
            onClick={continueToSummary}
          >
            Continue to Summary →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2 - BOOKING SUMMARY
  // ==========================================

  if (step === 2) {
    return (
      <div className="book-flight-page">
        <div className="booking-container">
          {renderSteps()}

          <div className="booking-header">
            <span className="header-icon">📋</span>

            <h1>Booking Summary</h1>

            <p>
              Review your flight details
            </p>
          </div>

          <div className="summary-card">
            <div className="summary-title">
              <div>
                <h2>✈️ {airline}</h2>

                <p>
                  {airlineCode} {flightNumber}
                </p>
              </div>

              <span className="cabin-badge">
                {cabinClass}
              </span>
            </div>

            <div className="summary-route">
              <div>
                <small>DEPARTURE</small>

                <strong>
                  {formatTime(
                    flight.departureTime
                  )}
                </strong>

                <span>{flight.from}</span>
              </div>

              <div className="summary-arrow">
                ✈️
              </div>

              <div>
                <small>ARRIVAL</small>

                <strong>
                  {formatTime(
                    flight.arrivalTime
                  )}
                </strong>

                <span>{flight.to}</span>
              </div>
            </div>

            <div className="summary-info">
              <div>
                <small>TRAVEL DATE</small>

                <strong>
                  {travelDate ||
                    formatDate(
                      flight.departureTime
                    )}
                </strong>
              </div>

              <div>
                <small>DURATION</small>

                <strong>
                  {formatDuration(
                    flight.duration
                  )}
                </strong>
              </div>

              <div>
                <small>STOPS</small>

                <strong>
                  {stops === 0
                    ? "Non-stop"
                    : `${stops} Stop`}
                </strong>
              </div>
            </div>
          </div>

          {/* PASSENGER SUMMARY */}

          <div className="passenger-summary">
            <h2>👤 Passengers</h2>

            {passengers.map(
              (passenger, index) => (
                <div
                  className="passenger-summary-row"
                  key={index}
                >
                  <strong>
                    {index + 1}. {passenger.name}
                  </strong>

                  <span>
                    {passenger.age} years •{" "}
                    {passenger.gender}
                  </span>
                </div>
              )
            )}
          </div>

          {/* FARE */}

          <div className="fare-card">
            <div className="fare-row">
              <span>
                Fare per passenger
              </span>

              <strong>
                {formatINR(
                  farePerPassenger,
                  fareCurrency
                )}
              </strong>
            </div>

            <div className="fare-row">
              <span>
                Number of passengers
              </span>

              <strong>
                {passengers.length}
              </strong>
            </div>

            <hr />

            <div className="total-row">
              <span>Total Amount</span>

              <strong>
                {formatINR(
                  totalAmount,
                  fareCurrency
                )}
              </strong>
            </div>
          </div>

          <div className="summary-actions">
            <button
              className="back-button"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>

            <button
              className="continue-button"
              onClick={continueToPayment}
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 3 - PAYMENT
  // ==========================================

  if (step === 3) {
    return (
      <div className="book-flight-page">
        <div className="booking-container">
          {renderSteps()}

          <div className="booking-header">
            <span className="header-icon">💳</span>

            <h1>Payment</h1>

            <p>
              Complete your flight booking
            </p>
          </div>

          <div className="payment-card">
            <h2>
              Select Payment Method
            </h2>

            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="UPI"
                checked={
                  paymentMethod === "UPI"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span className="payment-icon">
                📱
              </span>

              <div>
                <strong>UPI</strong>

                <small>
                  Google Pay / PhonePe / Paytm
                </small>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="Card"
                checked={
                  paymentMethod === "Card"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span className="payment-icon">
                💳
              </span>

              <div>
                <strong>
                  Credit / Debit Card
                </strong>

                <small>
                  Visa / Mastercard
                </small>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment"
                value="Net Banking"
                checked={
                  paymentMethod === "Net Banking"
                }
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value
                  )
                }
              />

              <span className="payment-icon">
                🏦
              </span>

              <div>
                <strong>
                  Net Banking
                </strong>

                <small>
                  All major banks
                </small>
              </div>
            </label>

            <div className="payment-total">
              <span>Amount to Pay</span>

              <strong>
                {formatINR(
                  totalAmount,
                  fareCurrency
                )}
              </strong>
            </div>

            {error && (
              <div className="booking-error">
                ⚠️ {error}
              </div>
            )}

            <button
              className="pay-button"
              onClick={confirmBooking}
              disabled={loading}
            >
              {loading
                ? "Processing Payment..."
                : `🔒 Pay ${formatINR(
                    totalAmount,
                    fareCurrency
                  )}`}
            </button>

            <p className="demo-payment-note">
              🔐 Demo payment only — no real money
              will be charged.
            </p>
          </div>

          <button
            className="back-button full-back"
            onClick={() => setStep(2)}
          >
            ← Back to Summary
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 4 - CONFIRMED TICKET
  // ==========================================

  if (step === 4 && booking) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="success-message">
            <div className="success-icon">
              ✓
            </div>

            <h1>
              Flight Booked Successfully!
            </h1>

            <p>
              Your flight booking has been confirmed.
            </p>
          </div>

          <div className="ticket">
            <div className="ticket-header">
              <div>
                <span className="brand">
                  ✈️ TRAVELEASE
                </span>

                <h2>
                  Flight E-Ticket
                </h2>
              </div>

              <div className="pnr">
                <small>PNR</small>

                <strong>
                  {booking.pnr}
                </strong>
              </div>
            </div>

            <div className="ticket-airline">
              <h2>
                {booking.airline}
              </h2>

              <p>
                {booking.airlineCode}{" "}
                {booking.flightNumber}
              </p>
            </div>

            <div className="ticket-route">
              <div>
                <small>FROM</small>

                <strong>
                  {formatTime(
                    booking.departureTime
                  )}
                </strong>

                <span>
                  {booking.from}
                </span>
              </div>

              <div className="ticket-arrow">
                ─── ✈️ ───
              </div>

              <div>
                <small>TO</small>

                <strong>
                  {formatTime(
                    booking.arrivalTime
                  )}
                </strong>

                <span>
                  {booking.to}
                </span>
              </div>
            </div>

            <div className="ticket-details">
              <div>
                <small>TRAVEL DATE</small>

                <strong>
                  {booking.travelDate}
                </strong>
              </div>

              <div>
                <small>CLASS</small>

                <strong>
                  {booking.cabinClass}
                </strong>
              </div>

              <div>
                <small>PASSENGERS</small>

                <strong>
                  {booking.passengers.length}
                </strong>
              </div>

              <div>
                <small>TOTAL PAID</small>

                <strong>
                  {formatINR(
                    booking.totalAmount,
                    booking.currency || fareCurrency
                  )}
                </strong>
              </div>
            </div>

            <div className="ticket-passengers">
              <h3>
                👤 Passenger Details
              </h3>

              {booking.passengers.map(
                (passenger, index) => (
                  <div
                    className="ticket-passenger"
                    key={index}
                  >
                    <span className="passenger-number">
                      {index + 1}
                    </span>

                    <strong>
                      {passenger.name}
                    </strong>

                    <span>
                      {passenger.age} years
                    </span>

                    <span>
                      {passenger.gender}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="ticket-payment">
              <div>
                <span>
                  Payment Method
                </span>

                <strong>
                  {booking.paymentMethod}
                </strong>
              </div>

              <div>
                <span>
                  Payment Status
                </span>

                <strong className="paid-status">
                  ✓ {booking.paymentStatus}
                </strong>
              </div>
            </div>

            <div className="ticket-footer">
              <span>
                Booking ID: {booking._id}
              </span>

              <strong>
                TravelEase ✈️
              </strong>
            </div>
          </div>

          <div className="ticket-actions">
            <button
              className="print-button"
              onClick={() => window.print()}
            >
              🖨️ Print Ticket
            </button>

            <button
              className="bookings-button"
              onClick={() =>
                navigate("/bookings")
              }
            >
              🎫 My Bookings
            </button>

            <button
              className="another-flight-button"
              onClick={() =>
                navigate("/flights")
              }
            >
              ✈️ Book Another Flight
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default BookFlight;