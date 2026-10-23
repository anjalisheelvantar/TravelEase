
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExploreIndia.css";

const API_BASE_URL = "http://localhost:5000/api/ai";

const destinations = [
  {
    name: "Goa",
    state: "Goa",
    category: "Beaches",
    description:
      "Golden beaches, Portuguese heritage and unforgettable sunsets.",
    places: ["Baga Beach", "Fort Aguada", "Basilica of Bom Jesus"],
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=85",
    duration: "3–5 days",
    bestTime: "November–February",
    search: "Goa, India",
  },
  {
    name: "Hampi",
    state: "Karnataka",
    category: "Heritage",
    description:
      "Ancient ruins, enormous boulders and a landscape full of history.",
    places: [
      "Virupaksha Temple",
      "Vijaya Vittala Temple",
      "Hemakuta Hill",
    ],
    image:
  "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Stone_Chariot_View%2C_Hampi.jpg/1280px-Stone_Chariot_View%2C_Hampi.jpg",
    duration: "2–3 days",
    bestTime: "October–February",
    search: "Hampi, Karnataka, India",
  },
  {
    name: "Jaipur",
    state: "Rajasthan",
    category: "Heritage",
    description:
      "Pink-hued streets, royal forts and colourful local markets.",
    places: ["Hawa Mahal", "Amber Fort", "City Palace"],
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&q=85",
    duration: "2–4 days",
    bestTime: "October–March",
    search: "Jaipur, Rajasthan, India",
  },
  {
    name: "Munnar",
    state: "Kerala",
    category: "Mountains",
    description:
      "Rolling tea plantations, misty hills and peaceful viewpoints.",
    places: [
      "Eravikulam National Park",
      "Mattupetty Dam",
      "Top Station",
    ],
    image:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=85",
    duration: "2–4 days",
    bestTime: "September–March",
    search: "Munnar, Kerala, India",
  },
  {
    name: "Mysuru",
    state: "Karnataka",
    category: "Culture",
    description:
      "Grand palace architecture, gardens and rich cultural traditions.",
    places: ["Mysore Palace", "Chamundi Hill", "Brindavan Gardens"],
    image:
      "https://images.unsplash.com/photo-1600112356915-089abb8fc71a?auto=format&fit=crop&w=1000&q=85",
    duration: "1–2 days",
    bestTime: "October–March",
    search: "Mysuru, Karnataka, India",
  },
  {
    name: "Manali",
    state: "Himachal Pradesh",
    category: "Mountains",
    description:
      "Mountain scenery, pine forests and adventures in the Himalayas.",
    places: ["Solang Valley", "Hadimba Devi Temple", "Old Manali"],
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=85",
    duration: "3–5 days",
    bestTime: "March–June",
    search: "Manali, Himachal Pradesh, India",
  },
  {
    name: "Udaipur",
    state: "Rajasthan",
    category: "Culture",
    description:
      "Romantic lake views, historic palaces and beautiful old streets.",
    places: ["City Palace", "Lake Pichola", "Saheliyon-ki-Bari"],
    image:
      "https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1000&q=85",
    duration: "2–3 days",
    bestTime: "September–March",
    search: "Udaipur, Rajasthan, India",
  },
  {
    name: "Pondicherry",
    state: "Puducherry",
    category: "Beaches",
    description:
      "Colourful French Quarter streets, cafés and seaside promenades.",
    places: ["White Town", "Rock Beach", "Sri Aurobindo Ashram"],
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=85",
    duration: "2–3 days",
    bestTime: "October–March",
    search: "Puducherry, India",
  },
  {
    name: "Rishikesh",
    state: "Uttarakhand",
    category: "Adventure",
    description:
      "Riverfront sunsets, Himalayan foothills and outdoor adventures.",
    places: [
      "Lakshman Jhula area",
      "Triveni Ghat",
      "Neer Garh Waterfall",
    ],
    image:
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1000&q=85",
    duration: "2–3 days",
    bestTime: "September–November, February–April",
    search: "Rishikesh, Uttarakhand, India",
  },
];

const categories = [
  "All",
  "Beaches",
  "Mountains",
  "Heritage",
  "Culture",
  "Adventure",
];

function ExploreIndia() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  // Live attraction states
  const [livePlaces, setLivePlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState("");

  // Live destination search states
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // ======================================================
  // LIVE DESTINATION SEARCH
  // ======================================================

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/search?query=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          const text = await response.text();

          throw new Error(
            `Search API returned non-JSON (HTTP ${response.status}). ` +
              `Response: ${text.slice(0, 150)}`
          );
        }

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message || "Unable to search destinations."
          );
        }

        setSearchResults(
          Array.isArray(data.places) ? data.places : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setSearchResults([]);
          setSearchError(
            error.message || "Unable to search destinations."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // ======================================================
  // FETCH ATTRACTIONS FOR THE SELECTED DESTINATION
  // ======================================================

  useEffect(() => {
    if (!selected) {
      setLivePlaces([]);
      setPlacesError("");
      setPlacesLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadPlaces() {
      setPlacesLoading(true);
      setLivePlaces([]);
      setPlacesError("");

      try {
        const destinationSearch =
          selected.search || selected.name;

        const params = new URLSearchParams({
          destination: destinationSearch,
        });

        // Use coordinates from the selected live search result.
        // Featured destinations without coordinates keep the
        // original backend geocoding behavior.
        const hasCoordinates =
          selected.lat !== null &&
          selected.lat !== undefined &&
          selected.lon !== null &&
          selected.lon !== undefined &&
          String(selected.lat).trim() !== "" &&
          String(selected.lon).trim() !== "" &&
          Number.isFinite(Number(selected.lat)) &&
          Number.isFinite(Number(selected.lon)) &&
          Number(selected.lat) >= -90 &&
          Number(selected.lat) <= 90 &&
          Number(selected.lon) >= -180 &&
          Number(selected.lon) <= 180;

        if (hasCoordinates) {
          params.set("lat", String(selected.lat));
          params.set("lon", String(selected.lon));
        }

        const response = await fetch(
          `${API_BASE_URL}/places?${params.toString()}`,
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load nearby places."
          );
        }

        setLivePlaces(
          Array.isArray(data.places) ? data.places : []
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setPlacesError(
            error.message || "Unable to load nearby places."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPlacesLoading(false);
        }
      }
    }

    loadPlaces();

    return () => controller.abort();
  }, [selected]);

  // ======================================================
  // FEATURED DESTINATION FILTERING
  // ======================================================

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return destinations.filter((destination) => {
      const matchesCategory =
        category === "All" ||
        destination.category === category;

      const searchable = [
        destination.name,
        destination.state,
        destination.category,
        ...destination.places,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchable.includes(term);
    });
  }, [query, category]);

  // ======================================================
  // SELECT A LIVE SEARCH RESULT
  // ======================================================

  function selectSearchPlace(place) {
    const fullDestination =
      place.search ||
      place.address ||
      `${place.name}, India`;

    const destination = {
      name: place.name,
      state: place.state || place.district || "India",
      category: "Destination",
      description: `Explore ${
        place.address || place.name
      } and discover nearby places.`,
      places: [],
      image:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85",
      duration: "Choose based on your itinerary",
      bestTime: "Check local weather and seasonal conditions",
      search: fullDestination,

      // Added: preserve the exact selected search coordinates.
      lat: place.lat,
      lon: place.lon,
    };

    setSelected(destination);
    setShowPlanOptions(false);
    setQuery("");
    setSearchResults([]);
    setSearchError("");
    setSearchFocused(false);
    setCategory("All");
  }

  // ======================================================
  // TRIP PLANNING NAVIGATION
  // ======================================================

  function planTrip(destination) {
    setSelected(destination);
    setShowPlanOptions(true);
  }

  function choosePlanOption(option) {
    const destination = selected;

    setShowPlanOptions(false);

    if (!destination) return;

    const destinationState = {
      destination: destination.search || destination.name,
    };

    if (option === "train") {
      navigate("/trains", { state: destinationState });
    } else if (option === "cab") {
      navigate("/cabs", { state: destinationState });
    } else if (option === "flight") {
      navigate("/flights", { state: destinationState });
    } else if (option === "ai") {
      navigate("/ai-planner", { state: destinationState });
    }
  }

  const showSearchDropdown =
    searchFocused && query.trim().length >= 2;

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <div className="explore-hero-content">
          <span className="explore-eyebrow">
            YOUR NEXT STORY STARTS HERE
          </span>

          <h1>
            Find your kind
            <br />
            of <span>India.</span>
          </h1>

          <p>
            From quiet mountain escapes to centuries-old wonders,
            discover places worth travelling for.
          </p>

          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "650px",
            }}
          >
            <form
              className="explore-search"
              onSubmit={(event) => {
                event.preventDefault();

                if (searchResults.length > 0) {
                  selectSearchPlace(searchResults[0]);
                }
              }}
            >
              <span aria-hidden="true">⌕</span>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setSearchFocused(false);
                  }, 150);
                }}
                placeholder="Search Indian cities, villages or tourist places..."
                aria-label="Search destinations"
                aria-autocomplete="list"
                aria-expanded={showSearchDropdown}
              />

              {query && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setQuery("");
                    setSearchResults([]);
                    setSearchError("");
                  }}
                >
                  Clear
                </button>
              )}
            </form>

            {showSearchDropdown && (
              <div
                role="listbox"
                aria-label="Destination search results"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  background: "#ffffff",
                  border: "1px solid #e4e8ef",
                  borderRadius: "14px",
                  boxShadow: "0 14px 35px rgba(20, 35, 60, 0.18)",
                  overflow: "hidden",
                  color: "#1d2939",
                  maxHeight: "320px",
                  overflowY: "auto",
                }}
              >
                {searchLoading && (
                  <div
                    style={{
                      padding: "16px",
                      fontSize: "14px",
                      color: "#667085",
                    }}
                  >
                    Searching Indian destinations...
                  </div>
                )}

                {!searchLoading && searchError && (
                  <div
                    style={{
                      padding: "16px",
                      fontSize: "14px",
                      color: "#b42318",
                    }}
                  >
                    {searchError}
                  </div>
                )}

                {!searchLoading &&
                  !searchError &&
                  searchResults.length === 0 && (
                    <div
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: "#667085",
                      }}
                    >
                      No matching places found. Try another spelling.
                    </div>
                  )}

                {!searchLoading &&
                  searchResults.map((place, index) => (
                    <button
                      key={place.id || `${place.name}-${index}`}
                      type="button"
                      role="option"
                      aria-selected="false"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSearchPlace(place)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        width: "100%",
                        padding: "13px 16px",
                        border: "none",
                        borderBottom:
                          index === searchResults.length - 1
                            ? "none"
                            : "1px solid #eef0f4",
                        background: "#ffffff",
                        textAlign: "left",
                        cursor: "pointer",
                        color: "#1d2939",
                        font: "inherit",
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background =
                          "#f5f8ff";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background =
                          "#ffffff";
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          fontSize: "18px",
                          lineHeight: "1.3",
                        }}
                      >
                        📍
                      </span>

                      <span
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          minWidth: 0,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                          }}
                        >
                          {place.name}
                        </strong>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#667085",
                            lineHeight: 1.4,
                          }}
                        >
                          {place.address || place.state || "India"}
                        </span>
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="explore-hero-note">
            <span>✦</span> Find your next favourite place
          </div>
        </div>

        <div className="explore-hero-caption">
          <span>EXPLORE INDIA</span>
          <span>One country. A thousand stories.</span>
        </div>
      </section>

      <section className="explore-discover">
        <div className="explore-section-heading">
          <div>
            <span className="explore-eyebrow">
              MADE FOR YOUR WANDERLUST
            </span>

            <h2>Where will you go next?</h2>
            <p>Explore destinations for every kind of traveller.</p>
          </div>

          <span className="explore-result-count">
            {filtered.length} destinations
          </span>
        </div>

        <div
          className="explore-filters"
          aria-label="Filter destinations"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="explore-grid">
          {filtered.map((destination) => (
            <article
              className="destination-card"
              key={destination.name}
            >
              <button
                className="destination-image-button"
                type="button"
                onClick={() => setSelected(destination)}
                aria-label={`View ${destination.name} details`}
              >
                <img
                  src={destination.image}
                  alt={`${destination.name}, ${destination.state}`}
                  loading="lazy"
                />

                <span className="destination-category">
                  {destination.category}
                </span>

                <span className="destination-image-arrow">
                  ↗
                </span>
              </button>

              <div className="destination-card-body">
                <span className="destination-state">
                  {destination.state}
                </span>

                <h3>{destination.name}</h3>
                <p>{destination.description}</p>

                <div className="destination-meta">
                  <span>◷ {destination.duration}</span>
                  <span>☀ {destination.bestTime}</span>
                </div>

                <div className="destination-card-actions">
                  <button
                    className="destination-details-button"
                    type="button"
                    onClick={() => setSelected(destination)}
                  >
                    Discover <span>↗</span>
                  </button>

                  <button
                    className="destination-plan-button"
                    type="button"
                    onClick={() => planTrip(destination)}
                  >
                    Plan trip
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="explore-empty">
            <span>⌕</span>
            <h3>No destinations found</h3>
            <p>
              Try another destination, attraction or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setSearchResults([]);
                setSearchError("");
              }}
            >
              Show all destinations
            </button>
          </div>
        )}

        <p className="explore-data-note">
          Destination and attraction names are curated starting
          points. Verify current opening hours, access and local
          conditions before travelling. Attraction listings may
          not cover every place in a region.
        </p>
      </section>

      {/* DESTINATION DETAILS MODAL */}
      {selected && (
        <div
          className={`destination-modal-backdrop ${
            showPlanOptions ? "plan-layout-open" : ""
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (showPlanOptions) {
                setShowPlanOptions(false);
              } else {
                setSelected(null);
              }
            }
          }}
        >
          <section
            className="destination-modal destination-details-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="destination-modal-title"
          >
            <button
              className="destination-modal-close"
              type="button"
              onClick={() => {
                if (showPlanOptions) {
                  setShowPlanOptions(false);
                } else {
                  setSelected(null);
                }
              }}
              aria-label="Close destination details"
            >
              ×
            </button>

            <img
              className="destination-modal-image"
              src={selected.image}
              alt={selected.name}
            />

            <div className="destination-modal-content">
              <span className="explore-eyebrow">
                {selected.state} · {selected.category}
              </span>

              <h2 id="destination-modal-title">{selected.name}</h2>
              <p>{selected.description}</p>

              <h3>Popular places to explore</h3>

              {placesLoading && (
                <p>Finding popular places...</p>
              )}

              {placesError && (
                <p className="explore-places-error">
                  Popular places could not be loaded. Showing
                  suggested places instead.
                </p>
              )}

              {!placesLoading &&
                !placesError &&
                livePlaces.length === 0 && (
                  <p>
                    Showing suggested places for this destination.
                  </p>
                )}

              <ul className="explore-live-places">
                {(livePlaces.length > 0
                  ? livePlaces
                  : selected.places.map((name) => ({ name }))
                ).map((place, index) => (
                  <li key={place.id || `${place.name}-${index}`}>
                    <strong>{place.name}</strong>

                    {place.address && (
                      <p className="explore-place-address">
                        {place.address}
                      </p>
                    )}

                    {place.lat != null && place.lon != null && (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on map ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>

              <p>
                <strong>Suggested duration:</strong>{" "}
                {selected.duration}
              </p>

              <p>
                <strong>Popular travel season:</strong>{" "}
                {selected.bestTime}
              </p>

              <div className="destination-modal-actions">
                <button
                  className="destination-plan-button"
                  type="button"
                  onClick={() => setShowPlanOptions(true)}
                >
                  Plan this trip
                </button>

                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(
                    selected.search || selected.name
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View destination map ↗
                </a>
              </div>
            </div>
          </section>

          {/* EXISTING TRAVEL OPTIONS */}
          {showPlanOptions && (
            <section
              className="destination-modal plan-options-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plan-options-title"
            >
              <button
                className="destination-modal-close"
                type="button"
                onClick={() => setShowPlanOptions(false)}
                aria-label="Close plan options"
              >
                ×
              </button>

              <div className="destination-modal-content">
                <span className="explore-eyebrow">
                  YOUR JOURNEY STARTS HERE
                </span>

                <h2 id="plan-options-title">
                  Plan your {selected.name} trip
                </h2>

                <p>
                  How would you like to organise your journey?
                </p>

                <div className="plan-options-grid">
                  <button
                    type="button"
                    onClick={() => choosePlanOption("train")}
                  >
                    <span>🚆</span>
                    <strong>Book a train</strong>
                    <small>Explore train journeys</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => choosePlanOption("cab")}
                  >
                    <span>🚕</span>
                    <strong>Book a cab</strong>
                    <small>Arrange your ride</small>
                  </button>

                  <button
                    type="button"
                    onClick={() => choosePlanOption("flight")}
                  >
                    <span>✈️</span>
                    <strong>Book a flight</strong>
                    <small>Search flight options</small>
                  </button>

                  <button
                    type="button"
                    className="plan-option-ai"
                    onClick={() => choosePlanOption("ai")}
                  >
                    <span>✨</span>
                    <strong>Generate my plan</strong>
                    <small>Get an AI-generated itinerary</small>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default ExploreIndia;
