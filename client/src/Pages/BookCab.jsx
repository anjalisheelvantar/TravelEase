
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./BookCab.css";

function BookCab() {
  const location = useLocation();
  const navigate = useNavigate();

  const ride = location.state;

  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState([
    { name: "", age: "", gender: "" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (
    !ride ||
    !ride.cab ||
    !ride.pickup ||
    !ride.drop ||
    !ride.route
  ) {
    return (
      <div className="bookcab-page">
        <div className="bookcab-card">
          <h2>No cab selected</h2>
          <p>Please search for a route and select a ride first.</p>
          <button onClick={() => navigate("/cabs")}>
            Back to Cabs
          </button>
        </div>
      </div>
    );
  }

  const {
    cab,
    pickup,
    drop,
    travelDate,
    travelTime,
    route,
    fare,
  } = ride;

  function updatePassenger(index, field, value) {
    setPassengers((current) =>
      current.map((passenger, i) =>
        i === index
          ? { ...passenger, [field]: value }
          : passenger
      )
    );
  }

  function addPassenger() {
    setPassengers((current) => [
      ...current,
      { name: "", age: "", gender: "" },
    ]);
  }

  function removePassenger(index) {
    setPassengers((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function validatePassengers() {
    for (const passenger of passengers) {
      const age = Number(passenger.age);

      if (!passenger.name.trim()) {
        setMessage("Please enter every passenger's name.");
        return false;
      }

      if (
        !passenger.age ||
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120
      ) {
        setMessage("Please enter a valid passenger age.");
        return false;
      }

      if (!["Male", "Female", "Other"].includes(passenger.gender)) {
        setMessage("Please select every passenger's gender.");
        return false;
      }
    }

    setMessage("");
    return true;
  }

  function continueToSummary(event) {
    event.preventDefault();

    if (!validatePassengers()) return;

    setStep(2);
    window.scrollTo(0, 0);
  }

  async function confirmBooking() {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      setMessage("Please log in again to continue.");
      return;
    }

    const userId = user?._id || user?.id || user?.userId;

    if (!userId) {
      setMessage("User ID was not found. Please log in again.");
      return;
    }

    if (!validatePassengers()) {
      setStep(1);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "https://travelease-backend-qbth.onrender.com/api/bookings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            bookingType: "Cab",

            cabType: cab.cabType,
            pickupTime: travelTime,
            estimatedDistance: Number(route.distanceKm),

            from: pickup,
            to: drop,
            travelDate,
            departureTime: travelTime,
            duration: Number(route.durationMinutes) || 0,
            distance: Number(route.distanceKm) || 0,

            passengers: passengers.map((passenger) => ({
              name: passenger.name.trim(),
              age: Number(passenger.age),
              gender: passenger.gender,
            })),

            farePerPassenger: Number(fare),
            totalAmount: Number(fare),
            paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create cab booking.");
      }

      setBooking(data.booking);
      setStep(4);
      window.scrollTo(0, 0);
    } catch (error) {
      setMessage(error.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bookcab-page">
      <div className="bookcab-container">
        <button
          className="bookcab-back"
          onClick={() => navigate("/cabs")}
        >
          ← Back to Cabs
        </button>

        <h1>Complete Your Cab Booking</h1>
        <p className="bookcab-subtitle">
          Review your ride details and complete your booking.
        </p>

        <div className="bookcab-steps">
          <span className={step >= 1 ? "active" : ""}>1. Passengers</span>
          <span className={step >= 2 ? "active" : ""}>2. Summary</span>
          <span className={step >= 3 ? "active" : ""}>3. Payment</span>
          <span className={step >= 4 ? "active" : ""}>4. Confirmation</span>
        </div>

        {step !== 4 && (
          <div className="bookcab-ride-card">
            <div className="bookcab-ride-heading">
              <span className="bookcab-ride-icon">{cab.icon}</span>
              <div>
                <h2>{cab.name}</h2>
                <p>{cab.description}</p>
              </div>
              <strong>₹{Number(fare).toLocaleString("en-IN")}</strong>
            </div>

            <div className="bookcab-route">
              <p><strong>Pickup:</strong> {pickup}</p>
              <p><strong>Drop:</strong> {drop}</p>
              <p><strong>Date:</strong> {travelDate}</p>
              <p><strong>Pickup time:</strong> {travelTime}</p>
              <p>
                <strong>Distance:</strong> {route.distanceKm} km
              </p>
              <p>
                <strong>Estimated duration:</strong>{" "}
                {route.durationText || `${route.durationMinutes} minutes`}
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <form className="bookcab-card" onSubmit={continueToSummary}>
            <h2>Passenger Details</h2>

            {passengers.map((passenger, index) => (
              <div className="bookcab-passenger" key={index}>
                <h3>Passenger {index + 1}</h3>

                <label>
                  Full name
                  <input
                    type="text"
                    value={passenger.name}
                    onChange={(event) =>
                      updatePassenger(index, "name", event.target.value)
                    }
                    placeholder="Enter passenger name"
                    required
                  />
                </label>

                <label>
                  Age
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={passenger.age}
                    onChange={(event) =>
                      updatePassenger(index, "age", event.target.value)
                    }
                    placeholder="Enter age"
                    required
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={passenger.gender}
                    onChange={(event) =>
                      updatePassenger(index, "gender", event.target.value)
                    }
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                {passengers.length > 1 && (
                  <button
                    type="button"
                    className="bookcab-remove"
                    onClick={() => removePassenger(index)}
                  >
                    Remove passenger
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="bookcab-secondary"
              onClick={addPassenger}
            >
              + Add Passenger
            </button>

            {message && <p className="bookcab-error">{message}</p>}

            <button className="bookcab-primary" type="submit">
              Continue to Summary
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="bookcab-card">
            <h2>Booking Summary</h2>
            <p><strong>Ride:</strong> {cab.name}</p>
            <p><strong>Pickup:</strong> {pickup}</p>
            <p><strong>Drop:</strong> {drop}</p>
            <p><strong>Travel date:</strong> {travelDate}</p>
            <p><strong>Pickup time:</strong> {travelTime}</p>
            <p><strong>Passengers:</strong> {passengers.length}</p>

            <div className="bookcab-total">
              Estimated total: ₹{Number(fare).toLocaleString("en-IN")}
            </div>

            <p className="bookcab-note">
              This is a TravelEase fare estimate, not a live provider quote.
            </p>

            <button
              className="bookcab-secondary"
              onClick={() => setStep(1)}
            >
              Back to Passenger Details
            </button>

            <button
              className="bookcab-primary"
              onClick={() => {
                setMessage("");
                setStep(3);
              }}
            >
              Continue to Payment
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="bookcab-card">
            <h2>Payment</h2>
            <p>Select a payment method for this demo booking.</p>

            <label className="bookcab-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="UPI"
                checked={paymentMethod === "UPI"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              UPI
            </label>

            <label className="bookcab-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="Card"
                checked={paymentMethod === "Card"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              Credit / Debit Card
            </label>

            <label className="bookcab-payment-option">
              <input
                type="radio"
                name="paymentMethod"
                value="Net Banking"
                checked={paymentMethod === "Net Banking"}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              Net Banking
            </label>

            <div className="bookcab-total">
              Total: ₹{Number(fare).toLocaleString("en-IN")}
            </div>

            <p className="bookcab-note">
              Demo only: this step does not process a real payment.
              Your current backend marks saved bookings as Paid.
            </p>

            {message && <p className="bookcab-error">{message}</p>}

            <button
              className="bookcab-secondary"
              disabled={loading}
              onClick={() => setStep(2)}
            >
              Back to Summary
            </button>

            <button
              className="bookcab-primary"
              disabled={loading}
              onClick={confirmBooking}
            >
              {loading ? "Confirming..." : "Confirm Demo Booking"}
            </button>
          </div>
        )}

        {step === 4 && booking && (
          <div className="bookcab-card bookcab-confirmation">
            <div className="bookcab-success-icon">✓</div>
            <h2>Cab Booking Confirmed!</h2>
            <p>Your booking has been saved successfully.</p>

            <div className="bookcab-ticket">
              <p><strong>PNR:</strong> {booking.pnr}</p>
              <p><strong>Ride:</strong> {cab.name}</p>
              <p><strong>Pickup:</strong> {pickup}</p>
              <p><strong>Drop:</strong> {drop}</p>
              <p><strong>Date:</strong> {travelDate}</p>
              <p><strong>Pickup time:</strong> {travelTime}</p>
              <p>
                <strong>Total:</strong>{" "}
                ₹{Number(booking.totalAmount).toLocaleString("en-IN")}
              </p>
              <p><strong>Status:</strong> {booking.status}</p>
            </div>

            <p className="bookcab-note">
              This confirms a TravelEase demo booking, not a confirmed
              ride with an external cab provider.
            </p>

            <button
              className="bookcab-primary"
              onClick={() => navigate("/bookings")}
            >
              View My Bookings
            </button>

            <button
              className="bookcab-secondary"
              onClick={() => navigate("/cabs")}
            >
              Book Another Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookCab;
