  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import "./Trains.css";
  import trainVideo from "../assets/train.mp4";

  function Trains() {

    const navigate = useNavigate();


    // ==========================================
    // INPUT STATES
    // ==========================================

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [fromCode, setFromCode] = useState("");
    const [toCode, setToCode] = useState("");

    const [date, setDate] = useState("");


    // ==========================================
    // STATION DROPDOWNS
    // ==========================================

    const [fromStations, setFromStations] = useState([]);
    const [toStations, setToStations] = useState([]);

    const [showFromDropdown, setShowFromDropdown] =
      useState(false);

    const [showToDropdown, setShowToDropdown] =
      useState(false);


    // ==========================================
    // TRAIN STATES
    // ==========================================

    const [trains, setTrains] = useState([]);

    const [loading, setLoading] =
      useState(false);

    const [searched, setSearched] =
      useState(false);

    const [error, setError] =
      useState("");


    // ==========================================
    // SEARCH STATIONS
    // ==========================================

    const searchStations = async (
      value,
      type
    ) => {

      if (value.length < 2) {

        if (type === "from") {
          setFromStations([]);
        } else {
          setToStations([]);
        }

        return;
      }


      try {

        const response = await fetch(

          `http://localhost:5000/api/trains/stations?q=${encodeURIComponent(
            value
          )}`

        );


        const result =
          await response.json();


        console.log(
          "STATION RESULTS:",
          result
        );


        let stations = [];


        if (
          result.success &&
          Array.isArray(result.data)
        ) {

          stations = result.data;

        }


        if (type === "from") {

          setFromStations(stations);
          setShowFromDropdown(true);

        } else {

          setToStations(stations);
          setShowToDropdown(true);

        }


      } catch (error) {

        console.error(
          "Station search error:",
          error
        );

      }

    };


    // ==========================================
    // HANDLE FROM INPUT
    // ==========================================

    const handleFromChange = (e) => {

      const value = e.target.value;

      setFrom(value);

      setFromCode("");

      searchStations(
        value,
        "from"
      );

    };


    // ==========================================
    // HANDLE TO INPUT
    // ==========================================

    const handleToChange = (e) => {

      const value = e.target.value;

      setTo(value);

      setToCode("");

      searchStations(
        value,
        "to"
      );

    };


    // ==========================================
    // SELECT STATION
    // ==========================================

    const selectFromStation = (
      station
    ) => {

      setFrom(
        station.name || station.code
      );

      setFromCode(
        station.code
      );

      setShowFromDropdown(false);

    };


    const selectToStation = (
      station
    ) => {

      setTo(
        station.name || station.code
      );

      setToCode(
        station.code
      );

      setShowToDropdown(false);

    };


    // ==========================================
    // SEARCH TRAINS
    // ==========================================

    const searchTrains = async (e) => {

      e.preventDefault();


      if (!fromCode || !toCode) {

        setError(
          "Please select stations from the dropdown."
        );

        return;

      }


      if (fromCode === toCode) {

        setError(
          "From and To stations cannot be the same."
        );

        return;

      }


      setLoading(true);

      setSearched(true);

      setError("");

      setTrains([]);


      try {

        const url =
          `http://localhost:5000/api/trains/search` +
          `?from=${encodeURIComponent(fromCode)}` +
          `&to=${encodeURIComponent(toCode)}` +
          (date
            ? `&date=${date}`
            : "");


        console.log(
          "REQUEST:",
          url
        );


        const response =
          await fetch(url);


        const result =
          await response.json();


        console.log(
          "API RESPONSE:",
          result
        );


        if (!response.ok) {

          throw new Error(
            result.message ||
            "Failed to fetch trains"
          );

        }


        const extractedTrains =
          result?.data?.trains || [];


        console.log(
          "EXTRACTED TRAINS:",
          extractedTrains
        );


        setTrains(
          extractedTrains
        );


      } catch (error) {


        console.error(
          "SEARCH ERROR:",
          error
        );


        setError(
          error.message ||
          "Unable to fetch trains. Please try again."
        );


      } finally {

        setLoading(false);

      }

    };


    // ==========================================
    // FORMAT DURATION
    // ==========================================

    const formatDuration = (
      minutes
    ) => {

      if (
        minutes === undefined ||
        minutes === null
      ) {
        return "N/A";
      }


      const hours =
        Math.floor(minutes / 60);


      const mins =
        minutes % 60;


      if (mins === 0) {
        return `${hours}h`;
      }


      return `${hours}h ${mins}m`;

    };


    // ==========================================
    // BOOK TRAIN
    // ==========================================

    const handleBookTrain = (
      item
    ) => {


      const token =
        localStorage.getItem("token");


      const user =
        localStorage.getItem("user");


      const trainData = {

        train: item.train,

        trainFrom: item.from,

        trainTo: item.to,

        duration: item.duration,

        distance: item.distance,

        totalHaltsBetween:
          item.totalHaltsBetween,

        travelDate: date

      };


      if (!token || !user) {

        alert(
          "Please login before booking your train ticket."
        );


        navigate("/login", {

          state: {

            from: "/book-train",

            trainData

          }

        });


        return;

      }


      navigate(
        "/book-train",
        {
          state: trainData
        }
      );

    };


    // ==========================================
    // UI
    // ==========================================

    return (

      <div className="trains-page">


        {/* HERO */}

        <section className="trains-hero">

    <video
      className="trains-hero-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
    >
      <source src={trainVideo} type="video/mp4" />
    </video>

    <div className="trains-hero-content">
    <div className="trains-hero-eyebrow">
       EXPLORE INDIA BY RAIL
    </div>
    <h1>
      Find Your Perfect Train <span>🚆</span>
    </h1>
    <p>Search and book trains for your next journey</p>
  </div>

    <div className="trains-hero-overlay"></div>

    <div className="trains-hero-content">

            <div className="train-icon">
              🚆
            </div> 

          </div>

          <div className="train-search-card">

            <h2>
              Search Trains
            </h2>

            <p>
              Search railway stations across India
            </p>


            <form
              onSubmit={searchTrains}
            >


              <div className="train-search-grid">


                {/* FROM */}

                <div className="train-form-group station-group">

                  <label>
                    From
                  </label>


                  <input

                    type="text"

                    placeholder="Type city or station"

                    value={from}

                    onChange={
                      handleFromChange
                    }

                    onFocus={() => {

                      if (
                        fromStations.length > 0
                      ) {

                        setShowFromDropdown(true);

                      }

                    }}

                  />


                  {showFromDropdown &&
                    fromStations.length > 0 && (

                      <div className="station-dropdown">

                        {fromStations.map(
                          (
                            station,
                            index
                          ) => (

                            <div

                              key={
                                station.code ||
                                index
                              }

                              className="station-option"

                              onClick={() =>
                                selectFromStation(
                                  station
                                )
                              }

                            >

                              <strong>

                                {
                                  station.name ||
                                  station.code
                                }

                              </strong>


                              <span>

                                {station.code}

                              </span>

                            </div>

                          )
                        )}

                      </div>

                    )}

                </div>



                {/* TO */}

                <div className="train-form-group station-group">

                  <label>
                    To
                  </label>


                  <input

                    type="text"

                    placeholder="Type city or station"

                    value={to}

                    onChange={
                      handleToChange
                    }

                    onFocus={() => {

                      if (
                        toStations.length > 0
                      ) {

                        setShowToDropdown(true);

                      }

                    }}

                  />


                  {showToDropdown &&
                    toStations.length > 0 && (

                      <div className="station-dropdown">

                        {toStations.map(
                          (
                            station,
                            index
                          ) => (

                            <div

                              key={
                                station.code ||
                                index
                              }

                              className="station-option"

                              onClick={() =>
                                selectToStation(
                                  station
                                )
                              }

                            >

                              <strong>

                                {
                                  station.name ||
                                  station.code
                                }

                              </strong>


                              <span>

                                {station.code}

                              </span>

                            </div>

                          )
                        )}

                      </div>

                    )}

                </div>



                {/* DATE */}

                <div className="train-form-group">

                  <label>
                    Travel Date
                  </label>


                  <input

                    type="date"

                    value={date}

                    onChange={(e) =>
                      setDate(
                        e.target.value
                      )
                    }

                  />

                </div>


              </div>



              {/* ERROR */}

              {error && (

                <div className="train-error">

                  ⚠️ {error}

                </div>

              )}



              {/* SEARCH BUTTON */}

              <button

                type="submit"

                className="train-search-button"

                disabled={loading}

              >

                {loading
                  ? "🔄 Searching..."
                  : "🔍 Search Trains"}

              </button>


            </form>

          </div>

        </section>



        {/* MAIN */}

        <main className="trains-container">


          {/* SEARCH CARD */}


          {/* NO RESULTS */}

          {!loading &&
            searched &&
            trains.length === 0 &&
            !error && (

              <div className="train-message">

                <div>
                  🔍
                </div>

                <h3>
                  No trains found
                </h3>

                <p>
                  No trains were found for
                </p>

                <strong>
                  {from} → {to}
                </strong>

              </div>

            )}



          {/* RESULTS */}

          {!loading &&
            trains.length > 0 && (

              <section className="train-results">


                <div className="results-heading">

                  <div>

                    <h2>
                      Available Trains
                    </h2>

                    <p>

                      {from} → {to}

                      {date &&
                        ` • ${date}`}

                    </p>

                  </div>


                  <div className="train-count">

                    {trains.length}{" "}

                    {trains.length === 1
                      ? "train"
                      : "trains"}{" "}

                    found

                  </div>

                </div>



                {/* TRAIN CARDS */}

                {trains.map(
                  (item, index) => {

                    const train =
                      item.train;

                    const trainFrom =
                      item.from;

                    const trainTo =
                      item.to;


                    return (

                      <div

                        className="train-card"

                        key={`${train.number}-${index}`}

                      >


                        {/* HEADER */}

                        <div className="train-card-header">

                          <div>

                            <h3>

                              🚆 {train.name}

                            </h3>


                            <p>

                              Train No.{" "}

                              <strong>

                                {train.number}

                              </strong>

                            </p>

                          </div>


                          <span className="train-type">

                            {train.type}

                          </span>

                        </div>



                        {/* ROUTE */}

                        <div className="train-route">


                          <div className="station">

                            <small>
                              DEPARTURE
                            </small>

                            <strong>

                              {trainFrom.departure}

                            </strong>

                            <span>

                              {from}

                            </span>

                            <small>

                              {fromCode}

                            </small>

                          </div>



                          <div className="route-middle">

                            <span>

                              {formatDuration(
                                item.duration
                              )}

                            </span>

                            <div>
                              ─────────→
                            </div>

                            <small>

                              {item.distance} km

                            </small>

                          </div>



                          <div className="station">

                            <small>
                              ARRIVAL
                            </small>

                            <strong>

                              {trainTo.arrival}

                            </strong>

                            <span>

                              {to}

                            </span>

                            <small>

                              {toCode}

                            </small>

                          </div>


                        </div>



                        {/* RUNNING DAYS */}

                        {Array.isArray(
                          train.runDays
                        ) &&
                          train.runDays.length > 0 && (

                            <div className="running-days">

                              <strong>
                                Runs:
                              </strong>


                              {train.runDays.map(
                                (day) => (

                                  <span

                                    key={day}

                                    className="day-badge"

                                  >

                                    {day.toUpperCase()}

                                  </span>

                                )
                              )}

                            </div>

                          )}



                        {/* BOTTOM */}

                        <div className="train-card-bottom">


                          <div className="train-info">


                            <div>

                              <small>
                                Duration
                              </small>

                              <strong>

                                {formatDuration(
                                  item.duration
                                )}

                              </strong>

                            </div>



                            <div>

                              <small>
                                Distance
                              </small>

                              <strong>

                                {item.distance} km

                              </strong>

                            </div>



                            <div>

                              <small>
                                Stops
                              </small>

                              <strong>

                                {
                                  item.totalHaltsBetween
                                }

                              </strong>

                            </div>


                          </div>



                          <button

                            className="book-button"

                            onClick={() =>
                              handleBookTrain(item)
                            }

                          >

                            Book Now →

                          </button>


                        </div>


                      </div>

                    );

                  }
                )}

              </section>

            )}


        </main>

      </div>

    );

  }

  export default Trains;