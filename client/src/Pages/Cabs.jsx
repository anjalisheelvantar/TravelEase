
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Cabs.css";
const cabVideo = "/videos/cab.mp4";


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const API = "http://localhost:5000/api/cabs";

const cabOptions = [
  {
    id: "bike",
    name: "Bike",
    cabType: "Bike",
    description: "Quick and affordable solo rides",
    seats: 1,
    luggage: "Small bag",
    price: 6,
    icon: "🏍️",
    tag: "Solo travel",
  },
  {
    id: "auto",
    name: "Auto",
    cabType: "Auto",
    description: "Convenient rides around the city",
    seats: 3,
    luggage: "Small bags",
    price: 9,
    icon: "🛺",
    tag: "City favourite",
  },
  {
    id: "mini",
    name: "Mini",
    cabType: "Mini",
    description: "Affordable everyday car rides",
    seats: 4,
    luggage: "2 bags",
    price: 12,
    icon: "🚕",
    tag: "Budget friendly",
  },
  {
    id: "sedan",
    name: "Sedan",
    cabType: "Sedan",
    description: "Comfortable rides for families",
    seats: 4,
    luggage: "3 bags",
    price: 16,
    icon: "🚘",
    tag: "Extra comfort",
  },
  {
    id: "suv",
    name: "Big Car / SUV",
    cabType: "SUV",
    description: "More room for groups and luggage",
    seats: 6,
    luggage: "4 bags",
    price: 22,
    icon: "🚙",
    tag: "Group travel",
  },
];

function FitRoute({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 2) {
      map.fitBounds(points, { padding: [35, 35] });
    }
  }, [map, points]);

  return null;
}

function LocationInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || value.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            value.trim()
          )}&limit=5&lang=en`
        );

        if (!response.ok) {
          throw new Error("Place search unavailable");
        }

        const data = await response.json();

        if (!cancelled) {
          const results = (data.features || []).map((feature) => {
            const p = feature.properties || {};
            const parts = [
              p.name,
              p.street,
              p.city,
              p.state,
              p.country,
            ].filter(Boolean);

            return {
              label: [...new Set(parts)].join(", "),
            };
          });

          setSuggestions(
            results.filter((item) => item.label.trim().length > 0)
          );
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, open]);

  return (
    <div className="cab-field cab-location-field">
      <label htmlFor={id}>{label}</label>

      <div className="cab-input-wrap">
        <span className="cab-input-icon" aria-hidden="true">
          {icon}
        </span>

        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          required
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 180);
          }}
        />
      </div>

      {open && value.trim().length >= 3 && (
        <div className="cab-suggestions">
          {loading && (
            <div className="cab-suggestion-status">
              Searching places...
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="cab-suggestion-status">
              No suggestions found. You can enter a full address.
            </div>
          )}

          {!loading &&
            suggestions.map((item, index) => (
              <button
                type="button"
                className="cab-suggestion"
                key={`${item.label}-${index}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(item.label);
                  setSuggestions([]);
                  setOpen(false);
                }}
              >
                <span aria-hidden="true">📍</span>
                <span>{item.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function Cabs() {
  const navigate = useNavigate();

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);
  const [message, setMessage] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const today = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  function getFare(cab) {
    if (!route) return null;
    return Math.round(Number(route.distanceKm) * cab.price + 150);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support GPS location.");
      return;
    }

    setLocating(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://photon.komoot.io/reverse?lat=${coords.latitude}&lon=${coords.longitude}&lang=en`
          );

          if (!response.ok) {
            throw new Error("Could not find your address.");
          }

          const data = await response.json();
          const p = data.features?.[0]?.properties;

          const address = p
            ? [
                p.name,
                p.street,
                p.city,
                p.state,
                p.country,
              ]
                .filter(Boolean)
                .filter(
                  (item, index, arr) => arr.indexOf(item) === index
                )
                .join(", ")
            : "";

          if (!address) {
            throw new Error(
              "Address not found. Please enter your pickup manually."
            );
          }

          setPickup(address);
        } catch (error) {
          setMessage(error.message);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        setMessage(
          error.code === 1
            ? "Location permission was denied. Allow location access or enter your pickup manually."
            : "Unable to get your current location. Please enter your pickup manually."
        );
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function handleSearch(event) {
    event.preventDefault();

    setMessage("");
    setSelectedCab(null);
    setRoute(null);
    setSearched(false);

    if (!pickup.trim() || !drop.trim()) {
      setMessage("Please enter both pickup and drop points.");
      return;
    }

    if (pickup.trim().toLowerCase() === drop.trim().toLowerCase()) {
      setMessage("Pickup and drop points must be different.");
      return;
    }

    if (!travelDate || !travelTime) {
      setMessage("Please select your travel date and pickup time.");
      return;
    }

    if (travelDate < today) {
      setMessage("Please select today or a future travel date.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: pickup.trim(),
          drop: drop.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to calculate the route."
        );
      }

      if (
        !Number.isFinite(Number(result.distanceKm)) ||
        Number(result.distanceKm) <= 0 ||
        !result.pickupCoords ||
        !result.dropCoords ||
        !Array.isArray(result.routeCoordinates) ||
        result.routeCoordinates.length < 2
      ) {
        throw new Error(
          "Route details are incomplete. Check that cabRoutes.js returns pickupCoords, dropCoords, and routeCoordinates."
        );
      }

      setRoute(result);
      setPickup(result.pickup || pickup.trim());
      setDrop(result.drop || drop.trim());
      setSearched(true);
    } catch (error) {
      setMessage(
        error.message || "Unable to get the route. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBooking(cab) {
    const fare = getFare(cab);

    if (!route || fare === null || !Number.isFinite(fare)) {
      setMessage("Please search for a valid route first.");
      return;
    }

    setSelectedCab(cab);

    navigate("/book-cab", {
      state: {
        cab,
        pickup,
        drop,
        travelDate,
        travelTime,
        route,
        fare,
      },
    });
  }

  const toLatLng = (coords) => {
  if (Array.isArray(coords) && coords.length >= 2) {
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);

    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat, lng]
      : null;
  }

  if (coords && typeof coords === "object") {
    const lat = Number(coords.latitude ?? coords.lat);
    const lng = Number(coords.longitude ?? coords.lng ?? coords.lon);

    return Number.isFinite(lat) && Number.isFinite(lng)
      ? [lat, lng]
      : null;
  }

  return null;
};

const pickupPoint = toLatLng(route?.pickupCoords);
const dropPoint = toLatLng(route?.dropCoords);

const mapPoints =
  pickupPoint && dropPoint
    ? [pickupPoint, dropPoint]
    : [];

const routeLine = Array.isArray(route?.routeCoordinates)
  ? route.routeCoordinates
      .map(toLatLng)
      .filter(Boolean)
  : [];

  const cheapestCab = route
    ? cabOptions.reduce((cheapest, cab) =>
        getFare(cab) < getFare(cheapest) ? cab : cheapest
      )
    : null;

  return (
    <main className="cab-page">
            <section className="cab-hero">
        <video
  className="cab-hero-video"
  autoPlay
  muted
  loop
  playsInline
>
  <source src={cabVideo} type="video/mp4" />
</video>

<div className="cab-hero-overlay" />

        <div className="cab-hero-heading">
          <span className="cab-hero-eyebrow">
            🚘 EXPLORE THE ROAD
          </span>

          <h1>
            Find Your Perfect Cab <span>🚘</span>
          </h1>

          <p>
            Search and book your next journey with TravelEase
          </p>
        </div>
      </section>

      <div className="cab-content">
        <section className="cab-search-panel">
          <div className="cab-search-heading">
            <div>
            </div>

            <div className="cab-search-icon" aria-hidden="true">
              ↗
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div className="cab-form-grid">
              <LocationInput
                id="cab-pickup"
                label="PICKUP LOCATION"
                placeholder="Enter pickup place or address"
                value={pickup}
                onChange={setPickup}
                icon="◎"
              />

              <LocationInput
                id="cab-drop"
                label="DROP LOCATION"
                placeholder="Where would you like to go?"
                value={drop}
                onChange={setDrop}
                icon="⌖"
              />

              <div className="cab-field">
                <label htmlFor="cab-date">TRAVEL DATE</label>
                <div className="cab-input-wrap">
                  <span className="cab-input-icon" aria-hidden="true">
                    ▦
                  </span>
                  <input
                    id="cab-date"
                    type="date"
                    min={today}
                    value={travelDate}
                    onChange={(event) =>
                      setTravelDate(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="cab-field">
                <label htmlFor="cab-time">PICKUP TIME</label>
                <div className="cab-input-wrap">
                  <span className="cab-input-icon" aria-hidden="true">
                    ◷
                  </span>
                  <input
                    id="cab-time"
                    type="time"
                    value={travelTime}
                    onChange={(event) =>
                      setTravelTime(event.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="cab-search-footer">
              <button
                type="button"
                className="cab-location-button"
                onClick={useCurrentLocation}
                disabled={locating}
              >
                <span aria-hidden="true">◎</span>
                {locating
                  ? "Finding your location..."
                  : "Use my current location"}
              </button>

              <button
                className="cab-search-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Calculating route..." : "Search Cabs"}
                <span aria-hidden="true">
                  {loading ? "…" : "→"}
                </span>
              </button>
            </div>

            {message && (
              <p className="cab-message" role="status">
                {message}
              </p>
            )}
          </form>
        </section>

        {searched && route && (
          <section className="cab-results">
            <div className="cab-results-title">
              <div>
                <span className="cab-section-kicker">
                  YOUR TRIP OVERVIEW
                </span>
                <h2>Choose your ride</h2>
                <p>
                  Review your route and compare TravelEase estimates.
                </p>
              </div>

              <span className="cab-route-badge">
                <span /> Route calculated
              </span>
            </div>

            <div className="cab-journey-summary">
              <div className="cab-journey-stops">
                <div className="cab-stop-dot cab-stop-start" />

                <div className="cab-stop-details">
                  <small>PICKUP</small>
                  <strong>{route.pickup || pickup}</strong>
                </div>

                <div className="cab-stop-line" />

                <div className="cab-stop-dot cab-stop-end" />

                <div className="cab-stop-details">
                  <small>DESTINATION</small>
                  <strong>{route.drop || drop}</strong>
                </div>
              </div>

              <div className="cab-journey-stats">
                <div>
                  <span className="cab-stat-icon">↗</span>
                  <small>ROAD DISTANCE</small>
                  <strong>
                    {Number(route.distanceKm).toFixed(1)} km
                  </strong>
                </div>

                <div>
                  <span className="cab-stat-icon">◷</span>
                  <small>EST. DRIVE TIME</small>
                  <strong>
                    {route.durationText ||
                      `${route.durationMinutes || "—"} min`}
                  </strong>
                </div>

                <div>
                  <span className="cab-stat-icon">▦</span>
                  <small>TRAVEL DATE</small>
                  <strong>{travelDate}</strong>
                </div>
              </div>
            </div>

            <div className="cab-map-heading">
              <div>
                <h3>Your route on the map</h3>
                <p>
                  Pickup and destination connected by the calculated
                  road route.
                </p>
              </div>
              <span className="cab-map-source">
                OpenStreetMap · OSRM
              </span>
            </div>

            
<div className="cab-map">
  {mapPoints.length === 2 && routeLine.length >= 2 ? (
    <MapContainer
      key={`${mapPoints[0].join(",")}-${mapPoints[1].join(",")}`}
      bounds={mapPoints}
      boundsOptions={{ padding: [35, 35] }}
      scrollWheelZoom
      style={{ height: "390px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitRoute points={mapPoints} />

      <Marker position={mapPoints[0]}>
        <Popup>Pickup: {route.pickup || pickup}</Popup>
      </Marker>

      <Marker position={mapPoints[1]}>
        <Popup>Destination: {route.drop || drop}</Popup>
      </Marker>

      <Polyline
        positions={routeLine}
        pathOptions={{
          color: "#285bc7",
          weight: 5,
          opacity: 0.9,
        }}
      />
    </MapContainer>
  ) : (
    <p className="cab-message" role="status">
      The route was calculated, but its map coordinates are invalid.
      Please search again.
    </p>
  )}
</div>


            <div className="cab-options-heading">
              <div>
                <span className="cab-section-kicker">
                  FIND YOUR FIT
                </span>
                <h3>Ride options</h3>
              </div>
              <span>{cabOptions.length} categories</span>
            </div>

            <div className="cab-options-grid">
              {cabOptions.map((cab) => {
                const fare = getFare(cab);
                const isSelected = selectedCab?.id === cab.id;
                const isCheapest = cab.id === cheapestCab?.id;

                return (
                  <article
                    className={`cab-option-card ${
                      isSelected ? "cab-option-selected" : ""
                    }`}
                    key={cab.id}
                  >
                    <div className="cab-card-topline">
                      <span className="cab-option-tag">
                        {isCheapest ? "LOWEST ESTIMATE" : cab.tag}
                      </span>
                      <span className="cab-option-emoji">
                        {cab.icon}
                      </span>
                    </div>

                    <h3>{cab.name}</h3>
                    <p>{cab.description}</p>

                    <div className="cab-details">
                      <span>♙ {cab.seats} seats</span>
                      <span>▱ {cab.luggage}</span>
                    </div>

                    <div className="cab-fare">
                      <div>
                        <strong>
                          ₹{fare.toLocaleString("en-IN")}
                        </strong>
                        <span>Estimated total</span>
                      </div>
                      <span className="cab-fare-arrow">↗</span>
                    </div>

                    <div className="cab-rate-note">
                      ₹{cab.price}/km + ₹150 base estimate
                    </div>

                    <button
                      className={
                        isSelected
                          ? "cab-select-button cab-select-button-active"
                          : "cab-select-button"
                      }
                      type="button"
                      onClick={() => handleBooking(cab)}
                    >
                      Choose this ride <span>→</span>
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="cab-disclaimer">
              <span>ⓘ</span>
              <p>
                Route distance and duration come from road-network
                data. Prices are TravelEase estimates, not live
                Uber/Ola quotes. Provider availability and direct
                commercial booking are not connected.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default Cabs;
