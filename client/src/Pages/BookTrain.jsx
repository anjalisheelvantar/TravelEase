import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookTrain.css";

function BookTrain() {
  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================
  // GET DATA FROM TRAINS PAGE
  // ==========================================

  const bookingData = location.state;

  // ==========================================
  // CHECK TRAIN DATA
  // ==========================================

  if (
    !bookingData ||
    !bookingData.train ||
    !bookingData.trainFrom ||
    !bookingData.trainTo
  ) {
    return (
      <div className="booking-error-page">
        <h2>Train information not found</h2>

        <p>
          Please go back and select your train again.
        </p>

        <button onClick={() => navigate("/trains")}>
          ← Back to Trains
        </button>
      </div>
    );
  }

  // ==========================================
  // EXTRACT TRAIN DETAILS
  // ==========================================

  const trainData = bookingData.train;

  const trainFrom = bookingData.trainFrom;

  const trainTo = bookingData.trainTo;

  const travelDate = bookingData.travelDate;

  const duration = bookingData.duration;

  const distance = bookingData.distance;

  const totalHaltsBetween =
    bookingData.totalHaltsBetween;

  // ==========================================
  // STATE
  // ==========================================

  const [step, setStep] = useState(1);

  const [passengers, setPassengers] = useState([
    {
      name: "",
      age: "",
      gender: ""
    }
  ]);

  const [paymentMethod, setPaymentMethod] =
    useState("UPI");

  const [booking, setBooking] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // FARE
  // ==========================================

  const farePerPassenger = 850;

  const totalAmount =
    farePerPassenger * passengers.length;

  // ==========================================
  // FORMAT DURATION
  // ==========================================

  const formatDuration = (minutes) => {
    if (
      minutes === undefined ||
      minutes === null ||
      minutes === ""
    ) {
      return "N/A";
    }

    const totalMinutes =
      Number(minutes);

    if (isNaN(totalMinutes)) {
      return "N/A";
    }

    const hours =
      Math.floor(totalMinutes / 60);

    const mins =
      totalMinutes % 60;

    return `${hours}h ${mins}m`;
  };

  // ==========================================
  // ADD PASSENGER
  // ==========================================

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: "",
        age: "",
        gender: ""
      }
    ]);
  };

  // ==========================================
  // REMOVE PASSENGER
  // ==========================================

  const removePassenger = (index) => {
    if (passengers.length === 1) {
      return;
    }

    setPassengers(
      passengers.filter(
        (_, i) => i !== index
      )
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
    const updatedPassengers =
      [...passengers];

    updatedPassengers[index][field] =
      value;

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

      const age =
        Number(passenger.age);

      if (isNaN(age)) {
        setError(
          "Please enter a valid age."
        );

        return;
      }

      if (age < 3) {
        setError(
          `${passenger.name} is below 3 years old. Children below 3 years cannot be booked.`
        );

        return;
      }

      if (age > 120) {
        setError(
          "Please enter a valid age between 3 and 120."
        );

        return;
      }
    }

    setStep(2);

    window.scrollTo(0, 0);
  };

  // ==========================================
  // GO TO PAYMENT
  // ==========================================

  const continueToPayment = () => {
    setError("");

    setStep(3);

    window.scrollTo(0, 0);
  };

  // ==========================================
  // CONFIRM BOOKING
  // ==========================================

  const confirmBooking = async () => {
    setLoading(true);

    setError("");

    try {

      const savedUser =
        localStorage.getItem("user");

      // CHECK LOGIN

      if (!savedUser) {

        alert(
          "Please login before booking a ticket."
        );

        navigate("/login");

        return;
      }

      const user =
        JSON.parse(savedUser);

      const userId =
        user._id ||
        user.id ||
        user.userId;

      if (!userId) {

        setError(
          "User information is missing. Please login again."
        );

        return;
      }

      // ======================================
      // CREATE BOOKING
      // ======================================

      const response =
        await fetch(
          "http://localhost:5000/api/bookings",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              userId,

              bookingType: "Train",

              // TRAIN DETAILS

              trainNumber:
                trainData.number || "N/A",

              trainName:
                trainData.name || "Unknown Train",

              trainType:
                trainData.type || "Express",

              // JOURNEY DETAILS

              from:
                trainFrom.city ||
                trainFrom.name ||
                trainFrom.code ||
                "N/A",

              to:
                trainTo.city ||
                trainTo.name ||
                trainTo.code ||
                "N/A",

              departureTime:
                trainFrom.departure || "N/A",

              arrivalTime:
                trainTo.arrival || "N/A",

              travelDate:
                travelDate || "",

              duration:
                duration || 0,

              distance:
                distance || 0,

              totalHaltsBetween:
                totalHaltsBetween || 0,

              // PASSENGERS

              passengers,

              // PAYMENT

              farePerPassenger,

              totalAmount,

              paymentMethod
            })
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
          "Unable to book ticket"
        );
      }

      // SAVE BOOKING

      setBooking(
        result.booking
      );

      setStep(4);

      window.scrollTo(0, 0);

    } catch (error) {

      console.error(
        "BOOKING ERROR:",
        error
      );

      setError(
        error.message ||
        "Unable to connect to server."
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================
  // STEP 1 — PASSENGER DETAILS
  // ==========================================

  if (step === 1) {

    return (

      <div className="book-train-page">

        <div className="booking-container">

          <div className="booking-header">

            <span>
              🚆
            </span>

            <h1>
              Passenger Details
            </h1>

            <p>
              Enter details for all passengers
            </p>

          </div>


          {/* TRAIN SUMMARY */}

          <div className="mini-train-card">

            <div>

              <h2>
                {trainData.name}
              </h2>

              <p>
                Train No.{" "}
                {trainData.number}
              </p>

            </div>


            <div>

              <strong>
                {trainFrom.departure || "N/A"}
              </strong>

              {" → "}

              <strong>
                {trainTo.arrival || "N/A"}
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
                    Passenger {index + 1}
                  </h2>


                  {passengers.length > 1 && (

                    <button
                      type="button"
                      onClick={() =>
                        removePassenger(index)
                      }
                      className="remove-passenger"
                    >
                      Remove
                    </button>

                  )}

                </div>


                <div className="passenger-grid">


                  {/* NAME */}

                  <div>

                    <label>
                      Full Name
                    </label>

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


                  {/* AGE */}

                  <div>

                    <label>
                      Age
                    </label>

                    <input
                      type="number"
                      placeholder="Minimum age 3"
                      min="3"
                      max="120"
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


                  {/* GENDER */}

                  <div>

                    <label>
                      Gender
                    </label>

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
  // STEP 2 — BOOKING SUMMARY
  // ==========================================

  if (step === 2) {

    return (

      <div className="book-train-page">

        <div className="booking-container">

          <div className="booking-header">

            <span>
              📋
            </span>

            <h1>
              Booking Summary
            </h1>

            <p>
              Check your journey details
            </p>

          </div>


          <div className="summary-card">


            <div className="summary-title">

              <h2>
                🚆 {trainData.name}
              </h2>

              <span>
                {trainData.type}
              </span>

            </div>


            <p>

              Train No.{" "}

              <strong>
                {trainData.number}
              </strong>

            </p>


            {/* ROUTE */}

            <div className="summary-route">


              <div>

                <small>
                  DEPARTURE
                </small>

                <strong>
                  {trainFrom.departure || "N/A"}
                </strong>

                <span>
                  {trainFrom.city ||
                    trainFrom.name ||
                    trainFrom.code}
                </span>

              </div>


              <div className="summary-arrow">
                ─────────→
              </div>


              <div>

                <small>
                  ARRIVAL
                </small>

                <strong>
                  {trainTo.arrival || "N/A"}
                </strong>

                <span>
                  {trainTo.city ||
                    trainTo.name ||
                    trainTo.code}
                </span>

              </div>

            </div>


            {/* INFO */}

            <div className="summary-info">


              <div>

                <small>
                  Travel Date
                </small>

                <strong>
                  {travelDate ||
                    "Not specified"}
                </strong>

              </div>


              <div>

                <small>
                  Duration
                </small>

                <strong>
                  {formatDuration(duration)}
                </strong>

              </div>


              <div>

                <small>
                  Distance
                </small>

                <strong>
                  {distance || "N/A"} km
                </strong>

              </div>


              <div>

                <small>
                  Stops
                </small>

                <strong>
                  {totalHaltsBetween ?? "N/A"}
                </strong>

              </div>

            </div>

          </div>


          {/* PASSENGERS */}

          <div className="passenger-summary">

            <h2>
              👤 Passengers
            </h2>


            {passengers.map(
              (passenger, index) => (

                <div
                  className="passenger-summary-row"
                  key={index}
                >

                  <strong>

                    {index + 1}.{" "}

                    {passenger.name}

                  </strong>


                  <span>

                    {passenger.age} years

                    {" • "}

                    {passenger.gender}

                  </span>

                </div>

              )
            )}

          </div>


          {/* FARE */}

          <div className="fare-card">


            <div>

              <span>
                Fare per passenger
              </span>

              <strong>
                ₹{farePerPassenger}
              </strong>

            </div>


            <div>

              <span>
                Passengers
              </span>

              <strong>
                {passengers.length}
              </strong>

            </div>


            <hr />


            <div className="total-row">

              <span>
                Total Amount
              </span>

              <strong>
                ₹{totalAmount}
              </strong>

            </div>


            <small className="demo-note">

              * Demo fare for TravelEase project

            </small>

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
  // STEP 3 — PAYMENT
  // ==========================================

  if (step === 3) {

    return (

      <div className="book-train-page">

        <div className="booking-container">

          <div className="booking-header">

            <span>
              💳
            </span>

            <h1>
              Payment
            </h1>

            <p>
              This is a demo payment for TravelEase
            </p>

          </div>


          <div className="payment-card">

            <h2>
              Select Payment Method
            </h2>


            {/* UPI */}

            <label className="payment-option">

              <input
                type="radio"
                name="payment"
                value="UPI"
                checked={
                  paymentMethod === "UPI"
                }
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
              />

              <span>
                📱
              </span>

              <div>

                <strong>
                  UPI
                </strong>

                <small>
                  Google Pay / PhonePe / Paytm
                </small>

              </div>

            </label>


            {/* CARD */}

            <label className="payment-option">

              <input
                type="radio"
                name="payment"
                value="Card"
                checked={
                  paymentMethod === "Card"
                }
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
              />

              <span>
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


            {/* NET BANKING */}

            <label className="payment-option">

              <input
                type="radio"
                name="payment"
                value="Net Banking"
                checked={
                  paymentMethod ===
                  "Net Banking"
                }
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
              />

              <span>
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


            {/* TOTAL */}

            <div className="payment-total">

              <span>
                Amount to Pay
              </span>

              <strong>
                ₹{totalAmount}
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
                ? "🔄 Processing..."
                : `🔒 Pay ₹${totalAmount}`
              }

            </button>


            <p className="demo-payment-note">

              🔐 Demo payment only — no real money
              will be charged.

            </p>

          </div>


          <button
            className="back-button"
            onClick={() => setStep(2)}
          >
            ← Back to Summary
          </button>

        </div>

      </div>

    );
  }

  // ==========================================
  // STEP 4 — CONFIRMED TICKET
  // ==========================================

  if (step === 4 && booking) {

    return (

      <div className="ticket-page">

        <div className="ticket-container">


          {/* SUCCESS */}

          <div className="success-message">

            <div className="success-icon">
              ✓
            </div>

            <h1>
              Booking Confirmed!
            </h1>

            <p>
              Your train ticket has been booked successfully.
            </p>

          </div>


          {/* TICKET */}

          <div className="ticket">


            <div className="ticket-header">

              <div>

                <span>
                  🚆 TRAVELEASE
                </span>

                <h2>
                  Train E-Ticket
                </h2>

              </div>


              <div className="pnr">

                <small>
                  PNR
                </small>

                <strong>
                  {booking.pnr}
                </strong>

              </div>

            </div>


            <div className="ticket-train">

              <h2>
                {booking.trainName}
              </h2>

              <span>
                Train No. {booking.trainNumber}
              </span>

            </div>


            <div className="ticket-route">


              <div>

                <small>
                  FROM
                </small>

                <strong>
                  {booking.departureTime}
                </strong>

                <span>
                  {booking.from}
                </span>

              </div>


              <div className="ticket-arrow">
                ─────────→
              </div>


              <div>

                <small>
                  TO
                </small>

                <strong>
                  {booking.arrivalTime}
                </strong>

                <span>
                  {booking.to}
                </span>

              </div>

            </div>


            <div className="ticket-details">


              <div>

                <small>
                  TRAVEL DATE
                </small>

                <strong>
                  {booking.travelDate}
                </strong>

              </div>


              <div>

                <small>
                  PASSENGERS
                </small>

                <strong>
                  {booking.passengers?.length || 0}
                </strong>

              </div>


              <div>

                <small>
                  TOTAL PAID
                </small>

                <strong>
                  ₹{booking.totalAmount}
                </strong>

              </div>

            </div>


            {/* PASSENGERS */}

            <div className="ticket-passengers">

              <h3>
                Passenger Details
              </h3>


              {booking.passengers?.map(
                (passenger, index) => (

                  <div
                    key={index}
                    className="ticket-passenger"
                  >

                    <span>
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


            {/* PAYMENT */}

            <div className="ticket-payment">

              <span>
                Payment Status
              </span>

              <strong>
                ✓ {booking.paymentStatus}
              </strong>

            </div>


            <div className="ticket-footer">

              <span>
                Booking ID: {booking._id}
              </span>

              <span>
                TravelEase
              </span>

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="ticket-actions">


            <button
              className="print-button"
              onClick={() =>
                window.print()
              }
            >
              🖨️ Download / Print Ticket
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
              className="train-button"
              onClick={() =>
                navigate("/trains")
              }
            >
              🚆 Book Another Train
            </button>

          </div>

        </div>

      </div>

    );
  }

  return null;
}

export default BookTrain;