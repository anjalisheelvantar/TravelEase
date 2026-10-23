import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TrainSearch.css";

function TrainSearch() {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!from || !to) {
      setError("Please enter both departure and destination.");
      return;
    }

    if (from.toLowerCase() === to.toLowerCase()) {
      setError("Departure and destination cannot be the same.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/trains/search?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to search trains");
      }

      setTrains(data);

    } catch (error) {
      console.error(error);
      setError("Unable to connect to TravelEase server.");
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (train) => {
    navigate("/train-booking", {
      state: {
        train,
        passengers,
        date
      }
    });
  };

  return (
    <div className="train-page">

      {/* NAVBAR */}

      <nav className="train-navbar">

        <div
          className="train-logo"
          onClick={() => navigate("/dashboard")}
        >
          ✈️ TravelEase
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </nav>


      {/* HERO */}

      <section className="train-hero">

        <div className="train-hero-content">

          <div className="train-hero-icon">
            🚆
          </div>

          <h1>
            Find Your Perfect Train
          </h1>

          <p>
            Search available trains and plan your
            journey with TravelEase.
          </p>

        </div>

      </section>


      {/* SEARCH BOX */}

      <main className="train-container">

        <div className="search-card">

          <div className="search-title">
            <h2>Search Trains</h2>

            <p>
              Enter your journey details
            </p>
          </div>


          <form onSubmit={handleSearch}>

            <div className="search-fields">

              {/* FROM */}

              <div className="input-group">

                <label>
                  From
                </label>

                <div className="input-wrapper">
                  <span>📍</span>

                  <input
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={from}
                    onChange={(e) =>
                      setFrom(e.target.value)
                    }
                    required
                  />
                </div>

              </div>


              {/* TO */}

              <div className="input-group">

                <label>
                  To
                </label>

                <div className="input-wrapper">
                  <span>🎯</span>

                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={to}
                    onChange={(e) =>
                      setTo(e.target.value)
                    }
                    required
                  />
                </div>

              </div>


              {/* DATE */}

              <div className="input-group">

                <label>
                  Travel Date
                </label>

                <div className="input-wrapper">
                  <span>📅</span>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                  />
                </div>

              </div>


              {/* PASSENGERS */}

              <div className="input-group">

                <label>
                  Passengers
                </label>

                <div className="input-wrapper">
                  <span>👥</span>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={passengers}
                    onChange={(e) =>
                      setPassengers(e.target.value)
                    }
                  />
                </div>

              </div>

            </div>


            {error && (
              <div className="train-error">
                ⚠️ {error}
              </div>
            )}


            <button
              className="search-train-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Searching..."
                : "🔍 Search Trains"}
            </button>

          </form>

        </div>


        {/* RESULTS */}

        {loading && (
          <div className="loading-box">
            <div className="loading-icon">
              🚆
            </div>

            <h3>Finding trains...</h3>

            <p>
              Please wait while we search TravelEase.
            </p>
          </div>
        )}


        {!loading && searched && trains.length === 0 && !error && (
          <div className="no-results">

            <div>
              🚆
            </div>

            <h2>
              No trains found
            </h2>

            <p>
              Try another departure or destination.
            </p>

          </div>
        )}


        {!loading && trains.length > 0 && (

          <section className="results-section">

            <div className="results-header">

              <div>
                <h2>
                  Available Trains
                </h2>

                <p>
                  {from} → {to}
                </p>
              </div>

              <span className="result-count">
                {trains.length} trains found
              </span>

            </div>


            <div className="train-results">

              {trains.map((train) => (

                <div
                  className="train-result-card"
                  key={train._id}
                >

                  <div className="train-main">

                    <div className="train-name-section">

                      <div className="train-circle">
                        🚆
                      </div>

                      <div>
                        <h3>
                          {train.trainName}
                        </h3>

                        <span>
                          Train No. {train.trainNumber}
                        </span>
                      </div>

                    </div>


                    <div className="train-route">

                      <div className="time-location">

                        <strong>
                          {train.departureTime}
                        </strong>

                        <span>
                          {train.from}
                        </span>

                      </div>


                      <div className="route-line">

                        <span>
                          {train.duration}
                        </span>

                        <div className="line">
                          ─────────→
                        </div>

                      </div>


                      <div className="time-location">

                        <strong>
                          {train.arrivalTime}
                        </strong>

                        <span>
                          {train.to}
                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="train-details">

                    <div className="detail">

                      <span>
                        Class
                      </span>

                      <strong>
                        {train.classType}
                      </strong>

                    </div>


                    <div className="detail">

                      <span>
                        Available
                      </span>

                      <strong>
                        {train.availableSeats} seats
                      </strong>

                    </div>


                    <div className="price">

                      <span>
                        Starting from
                      </span>

                      <strong>
                        ₹{train.price}
                      </strong>

                      <small>
                        per passenger
                      </small>

                    </div>


                    <button
                      className="book-train-button"
                      onClick={() =>
                        handleBook(train)
                      }
                    >
                      Book Now →
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </section>

        )}

      </main>


      {/* FOOTER */}

      <footer className="train-footer">

        <strong>
          ✈️ TravelEase
        </strong>

        <span>
          Your journey, made easy.
        </span>

      </footer>

    </div>
  );
}

export default TrainSearch;