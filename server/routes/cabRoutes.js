
const express = require("express");
const axios = require("axios");

const router = express.Router();

async function geocodePlace(place) {
  const response = await axios.get(
    "https://photon.komoot.io/api/",
    {
      params: {
        q: place,
        limit: 1,
        lang: "en",
      },
      timeout: 15000,
    }
  );

  const feature = response.data.features?.[0];

  if (!feature || !feature.geometry?.coordinates) {
    throw new Error(`Location not found: ${place}`);
  }

  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    latitude,
    longitude,
    label:
      feature.properties.name ||
      feature.properties.street ||
      place,
  };
}

router.post("/route", async (req, res) => {
  try {
    const { pickup, drop } = req.body;

    if (
      typeof pickup !== "string" ||
      typeof drop !== "string" ||
      !pickup.trim() ||
      !drop.trim()
    ) {
      return res.status(400).json({
        message: "Please enter valid pickup and drop locations.",
      });
    }

    const pickupText = pickup.trim();
    const dropText = drop.trim();

    const [pickupLocation, dropLocation] = await Promise.all([
      geocodePlace(pickupText),
      geocodePlace(dropText),
    ]);

    const coordinates = [
      `${pickupLocation.longitude},${pickupLocation.latitude}`,
      `${dropLocation.longitude},${dropLocation.latitude}`,
    ].join(";");

    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}`,
      {
        params: {
          overview: "full",
          geometries: "geojson",
          steps: false,
        },
        timeout: 20000,
      }
    );

    const route = response.data.routes?.[0];

    if (!route) {
      return res.status(404).json({
        message: "No driving route was found for these locations.",
      });
    }

    const distanceKm = route.distance / 1000;
    const durationSeconds = route.duration;
    const durationMinutes = Math.ceil(durationSeconds / 60);

    const geometryCoordinates = route.geometry?.coordinates;

    if (
      !Number.isFinite(distanceKm) ||
      distanceKm <= 0 ||
      !Number.isFinite(durationSeconds) ||
      !Array.isArray(geometryCoordinates) ||
      geometryCoordinates.length === 0
    ) {
      return res.status(502).json({
        message: "The routing service returned invalid route details.",
      });
    }

    // OSRM gives [longitude, latitude].
    // React Leaflet polylines commonly use [latitude, longitude].
    const routeCoordinates = geometryCoordinates.map(
      ([longitude, latitude]) => [latitude, longitude]
    );

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return res.json({
      pickup: pickupText,
      drop: dropText,

      distanceKm: Math.round(distanceKm * 10) / 10,
      durationSeconds,
      durationMinutes,
      durationText: hours
        ? `${hours}h ${minutes}m`
        : `${minutes}m`,

      pickupCoords: pickupLocation,
      dropCoords: dropLocation,

      // Keep original GeoJSON geometry for compatibility.
      geometry: route.geometry,

      // Frontend route/map data.
      routeCoordinates,

      source: "OpenStreetMap + Photon + OSRM",
    });
  } catch (error) {
    console.error(
      "Cab route error:",
      error.response?.data || error.message
    );

    return res.status(502).json({
      message:
        error.message ||
        "Unable to calculate the route. Please try again.",
    });
  }
});

module.exports = router;
