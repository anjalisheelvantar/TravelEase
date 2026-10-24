import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Flights.css";
const flightVideo = "/videos/flight-video.mp4";


function Flights() {
  const navigate = useNavigate();

  // =====================================================
  // AIRPORTS
  // =====================================================

  const [airports, setAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);

  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // =====================================================
  // SEARCH
  // =====================================================

  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("Economy");

  const [flights, setFlights] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ALL INDIAN AIRPORTS
  // =====================================================

  useEffect(() => {
    const loadAirports = async () => {
      try {
        setAirportsLoading(true);

        const response = await fetch(
          "http://localhost:5000/api/flights/airports"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load airports"
          );
        }

        setAirports(data.airports || []);
      } catch (error) {
        console.error("Airport loading error:", error);

        setError(
          "Unable to load Indian airports. Please make sure the backend is running."
        );
      } finally {
        setAirportsLoading(false);
      }
    };

    loadAirports();
  }, []);

  // =====================================================
  // FILTER AIRPORTS
  // =====================================================

  const filteredFromAirports = airports
    .filter((airport) => {
      const search = from.trim().toLowerCase();

      if (!search) return true;

      return (
        airport.city?.toLowerCase().includes(search) ||
        airport.name?.toLowerCase().includes(search) ||
        airport.code?.toLowerCase().includes(search) ||
        airport.cityCode?.toLowerCase().includes(search)
      );
    })
    .slice(0, 20);

  const filteredToAirports = airports
    .filter((airport) => {
      const search = to.trim().toLowerCase();

      if (!search) return true;

      return (
        airport.city?.toLowerCase().includes(search) ||
        airport.name?.toLowerCase().includes(search) ||
        airport.code?.toLowerCase().includes(search) ||
        airport.cityCode?.toLowerCase().includes(search)
      );
    })
    .slice(0, 20);

  // =====================================================
  // SELECT FROM AIRPORT
  // =====================================================

  const selectFromAirport = (airport) => {
    setSelectedFrom(airport);

    setFrom(`${airport.city} (${airport.code})`);

    setShowFromDropdown(false);
  };

  // =====================================================
  // SELECT TO AIRPORT
  // =====================================================

  const selectToAirport = (airport) => {
    setSelectedTo(airport);

    setTo(`${airport.city} (${airport.code})`);

    setShowToDropdown(false);
  };

  // =====================================================
  // SWAP
  // =====================================================

  const handleSwap = () => {
    const oldFrom = selectedFrom;
    const oldFromText = from;

    setSelectedFrom(selectedTo);
    setFrom(to);

    setSelectedTo(oldFrom);
    setTo(oldFromText);
  };

  // =====================================================
  // PASSENGERS
  // =====================================================

  const increasePassengers = () => {
    setPassengers((current) => current + 1);
  };

  const decreasePassengers = () => {
    setPassengers((current) =>
      current > 1 ? current - 1 : 1
    );
  };

  // =====================================================
  // INDIAN CURRENCY
  // =====================================================

  const formatPrice = (amount, currency = "INR") => {
    const value = Number(amount || 0);

    let inrValue = value;

    /*
      Duffel may return different currencies depending
      on the offer.

      INR → use directly.
      USD → convert to INR for display.

      If your backend starts returning INR directly,
      no conversion will happen.
    */

    if (currency === "USD") {
      const USD_TO_INR_RATE = 88;
      inrValue = value * USD_TO_INR_RATE;
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(inrValue);
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (dateTime) => {
    if (!dateTime) return "--:--";

    try {
      return new Date(dateTime).toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "--:--";
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateTime) => {
    if (!dateTime) return "";

    try {
      return new Date(dateTime).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  };

  // =====================================================
  // FORMAT DURATION
  // =====================================================

  const formatDuration = (duration) => {
    if (!duration) {
      return "Duration unavailable";
    }

    const match = duration.match(
      /PT(?:(\d+)H)?(?:(\d+)M)?/
    );

    if (!match) {
      return duration;
    }

    const hours = match[1]
      ? `${match[1]}h`
      : "";

    const minutes = match[2]
      ? `${match[2]}m`
      : "";

    return `${hours} ${minutes}`.trim();
  };

  // =====================================================
  // SEARCH FLIGHTS
  // =====================================================

  const handleSearch = async () => {
    setError("");
    setFlights([]);

    if (!selectedFrom) {
      setError(
        "Please select your departure airport."
      );
      return;
    }

    if (!selectedTo) {
      setError(
        "Please select your destination airport."
      );
      return;
    }

    if (
      selectedFrom.code === selectedTo.code
    ) {
      setError(
        "Departure and destination cannot be the same."
      );
      return;
    }

    if (!departureDate) {
      setError(
        "Please select a departure date."
      );
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        from: selectedFrom.code,
        to: selectedTo.code,
        departureDate,
        passengers: String(passengers),
        cabinClass,
      });

      const response = await fetch(
        `http://localhost:5000/api/flights/search?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to search flights"
        );
      }

      const results = data.flights || [];

      setFlights(results);

      if (results.length === 0) {
        setError(
          "No flights were found for this route and date."
        );
      }
    } catch (error) {
      console.error(
        "Flight search error:",
        error
      );

      setError(
        error.message ||
          "Unable to search flights. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // BOOK FLIGHT
  // =====================================================

  const handleBookFlight = (flight) => {
    navigate("/book-flight", {
      state: {
        flight,
        from: selectedFrom,
        to: selectedTo,
        departureDate,
        passengers,
        cabinClass,
      },
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="flights-page">

      {/* ================================================= */}
      {/* VIDEO */}
      {/* ================================================= */}

      <section className="flight-video-hero">

        <video
          className="flight-background-video"
          autoPlay
          loop
          muted
          playsInline
        >
         <source
  src="https://res.cloudinary.com/gffv994z/video/upload/v1792826121/flight-video.mp4"
  type="video/mp4"
/>

          Your browser does not support video.
        </video>

        <div className="flight-video-overlay"></div>

        {/* ================================================= */}
        {/* HERO CONTENT */}
        {/* ================================================= */}

        <div className="flight-center-content">

          {/* HEADING */}

          <div className="flight-heading">

            <p className="flight-tagline">
              ✈️ EXPLORE THE WORLD
            </p>

            <h1>
              Find Your Perfect
              <span> Flight ✈️</span>
            </h1>

            <p>
              Search and book flights
              for your next adventure
            </p>

          </div>

          {/* ================================================= */}
          {/* SEARCH BOX */}
          {/* ================================================= */}

          <div className="flight-search-box">

            {/* FROM */}

            <div className="airport-autocomplete">

              <label>FROM</label>

              <input
                type="text"
                placeholder={
                  airportsLoading
                    ? "Loading airports..."
                    : "Departure city or airport"
                }
                value={from}
                disabled={airportsLoading}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setSelectedFrom(null);
                  setShowFromDropdown(true);
                }}
                onFocus={() =>
                  setShowFromDropdown(true)
                }
              />

              {showFromDropdown &&
                !airportsLoading && (
                  <div className="airport-dropdown">

                    {filteredFromAirports.length > 0 ? (
                      filteredFromAirports.map(
                        (airport) => (
                          <div
                            className="airport-option"
                            key={airport.code}
                            onMouseDown={() =>
                              selectFromAirport(
                                airport
                              )
                            }
                          >

                            <div className="airport-icon">
                              ✈️
                            </div>

                            <div className="airport-info">

                              <strong>
                                {airport.city}
                              </strong>

                              <span>
                                {airport.name}
                              </span>

                            </div>

                            <div className="airport-code">
                              {airport.code}
                            </div>

                          </div>
                        )
                      )
                    ) : (
                      <div className="no-airport">
                        No Indian airport found
                      </div>
                    )}

                  </div>
                )}

            </div>

            {/* SWAP */}

            <button
              className="swap-button"
              onClick={handleSwap}
              type="button"
              title="Swap airports"
            >
              ⇄
            </button>

            {/* TO */}

            <div className="airport-autocomplete">

              <label>TO</label>

              <input
                type="text"
                placeholder={
                  airportsLoading
                    ? "Loading airports..."
                    : "Destination city or airport"
                }
                value={to}
                disabled={airportsLoading}
                onChange={(e) => {
                  setTo(e.target.value);
                  setSelectedTo(null);
                  setShowToDropdown(true);
                }}
                onFocus={() =>
                  setShowToDropdown(true)
                }
              />

              {showToDropdown &&
                !airportsLoading && (
                  <div className="airport-dropdown">

                    {filteredToAirports.length > 0 ? (
                      filteredToAirports.map(
                        (airport) => (
                          <div
                            className="airport-option"
                            key={airport.code}
                            onMouseDown={() =>
                              selectToAirport(
                                airport
                              )
                            }
                          >

                            <div className="airport-icon">
                              ✈️
                            </div>

                            <div className="airport-info">

                              <strong>
                                {airport.city}
                              </strong>

                              <span>
                                {airport.name}
                              </span>

                            </div>

                            <div className="airport-code">
                              {airport.code}
                            </div>

                          </div>
                        )
                      )
                    ) : (
                      <div className="no-airport">
                        No Indian airport found
                      </div>
                    )}

                  </div>
                )}

            </div>

            {/* DATE */}

            <div className="date-field">

              <label>DEPARTURE</label>

              <input
                type="date"
                value={departureDate}
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) =>
                  setDepartureDate(
                    e.target.value
                  )
                }
              />

            </div>

            {/* PASSENGERS */}

            <div className="passenger-control">

              <label>PASSENGERS</label>

              <div className="passenger-counter">

                <button
                  type="button"
                  onClick={
                    decreasePassengers
                  }
                >
                  −
                </button>

                <span>
                  {passengers}
                </span>

                <button
                  type="button"
                  onClick={
                    increasePassengers
                  }
                >
                  +
                </button>

              </div>

            </div>

            {/* CLASS */}

            <div className="cabin-field">

              <label>CLASS</label>

              <select
                value={cabinClass}
                onChange={(e) =>
                  setCabinClass(
                    e.target.value
                  )
                }
              >

                <option>
                  Economy
                </option>

                <option>
                  Premium Economy
                </option>

                <option>
                  Business
                </option>

                <option>
                  First Class
                </option>

              </select>

            </div>

            {/* SEARCH */}

            <button
              className="search-button"
              onClick={handleSearch}
              disabled={
                loading ||
                airportsLoading
              }
            >
              {loading
                ? "Searching..."
                : "Search Flights 🔍"}
            </button>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="flight-error">
          ⚠️ {error}
        </div>
      )}

      {/* ================================================= */}
      {/* LOADING */}
      {/* ================================================= */}

      {loading && (
        <div className="flight-loading">

          <div className="loader"></div>

          <p>
            Searching live flight offers...
          </p>

        </div>
      )}

      {/* ================================================= */}
      {/* RESULTS */}
      {/* ================================================= */}

      {!loading &&
        flights.length > 0 && (

          <section className="flight-results-section">

            <div className="results-header">

              <h2>
                Available Flights ✈️
              </h2>

              <p>
                Current fares returned by
                the flight provider
              </p>

            </div>

            <div className="flight-results">

              {flights.map(
                (flight, index) => (

                  <div
                    className="flight-card"
                    key={
                      flight.offerId ||
                      flight.id ||
                      index
                    }
                  >

                    {/* AIRLINE */}

                    <div className="flight-airline">

                      <div className="airline-icon">
                        ✈️
                      </div>

                      <div>

                        <h3>
                          {flight.airline ||
                            "Airline"}
                        </h3>

                        <p className="flight-number">

                          {flight.airlineCode &&
                            `${flight.airlineCode} `}

                          {flight.flightNumber ||
                            "Flight"}

                        </p>

                        {flight.liveMode ===
                          false && (
                            <span className="test-fare-badge">
                              Test fare
                            </span>
                          )}

                        {flight.liveMode ===
                          true && (
                            <span className="live-fare-badge">
                              ✓ Live fare
                            </span>
                          )}

                      </div>

                    </div>

                    {/* ROUTE */}

                    <div className="flight-route">

                      {/* DEPARTURE */}

                      <div className="route-airport">

                        <strong>
                          {flight.from ||
                            selectedFrom?.code ||
                            "--"}
                        </strong>

                        <span>
                          {formatTime(
                            flight.departureTime
                          )}
                        </span>

                        <small>
                          {formatDate(
                            flight.departureTime
                          )}
                        </small>

                      </div>

                      {/* MIDDLE */}

                      <div className="route-middle">

                        <span>
                          {flight.stops === 0
                            ? "Non-stop"
                            : `${flight.stops} stop${
                                flight.stops > 1
                                  ? "s"
                                  : ""
                              }`}
                        </span>

                        <div className="route-line">
                          ───────✈───────
                        </div>

                        <small>
                          {formatDuration(
                            flight.duration
                          )}
                        </small>

                      </div>

                      {/* ARRIVAL */}

                      <div className="route-airport">

                        <strong>
                          {flight.to ||
                            selectedTo?.code ||
                            "--"}
                        </strong>

                        <span>
                          {formatTime(
                            flight.arrivalTime
                          )}
                        </span>

                        <small>
                          {formatDate(
                            flight.arrivalTime
                          )}
                        </small>

                      </div>

                    </div>

                    {/* PRICE */}

                    <div className="flight-price">

                      <small>
                        Total fare
                      </small>

                      <h2>
                        {formatPrice(
                          flight.price,
                          flight.currency
                        )}
                      </h2>

                      <span>
                        {passengers} passenger
                        {passengers > 1
                          ? "s"
                          : ""}
                      </span>

                      <button
                        onClick={() =>
                          handleBookFlight(
                            flight
                          )
                        }
                      >
                        Select Flight →
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>

        )}

      </div>
    );
  }

  export default Flights;