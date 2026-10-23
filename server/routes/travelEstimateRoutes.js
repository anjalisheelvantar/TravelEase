
const express = require("express");
const axios = require("axios");

const router = express.Router();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

async function geocodePlace(place) {
  const response = await axios.get(
    "https://api.geoapify.com/v1/geocode/search",
    {
      params: {
        text: place,
        filter: "countrycode:in",
        limit: 1,
        format: "json",
        apiKey: GEOAPIFY_API_KEY,
      },
      timeout: 15000,
    }
  );

  const result = response.data.results?.[0];

  if (!result) {
    throw new Error(`Could not find location: ${place}`);
  }

  return {
    lat: result.lat,
    lon: result.lon,
    name: result.formatted || place,
  };
}

router.post("/", async (req, res) => {
  try {
    if (!GEOAPIFY_API_KEY) {
      return res.status(503).json({
        message: "Geoapify is not configured. Add GEOAPIFY_API_KEY to server/.env.",
      });
    }

    const { origin, destination, days, travelers, style } = req.body;

    const tripDays = Number(days);
    const people = Number(travelers);

    if (
      typeof origin !== "string" ||
      typeof destination !== "string" ||
      !origin.trim() ||
      !destination.trim() ||
      origin.length > 120 ||
      destination.length > 120
    ) {
      return res.status(400).json({
        message: "Enter a valid starting city and destination.",
      });
    }

    if (
      !Number.isInteger(tripDays) ||
      tripDays < 1 ||
      tripDays > 30 ||
      !Number.isInteger(people) ||
      people < 1 ||
      people > 20
    ) {
      return res.status(400).json({
        message: "Days must be 1–30 and travelers must be 1–20.",
      });
    }

    const styles = {
      budget: {
        hotel: 1200,
        food: 450,
        local: 250,
        activities: 300,
      },
      standard: {
        hotel: 2800,
        food: 900,
        local: 500,
        activities: 700,
      },
      comfort: {
        hotel: 5500,
        food: 1600,
        local: 1000,
        activities: 1400,
      },
    };

    if (!styles[style]) {
      return res.status(400).json({
        message: "Choose budget, standard, or comfort travel style.",
      });
    }

    const [from, to] = await Promise.all([
      geocodePlace(origin.trim()),
      geocodePlace(destination.trim()),
    ]);

    const routeResponse = await axios.get(
      "https://api.geoapify.com/v1/routing",
      {
        params: {
          waypoints: `${from.lat},${from.lon}|${to.lat},${to.lon}`,
          mode: "drive",
          format: "json",
          apiKey: GEOAPIFY_API_KEY,
        },
        timeout: 20000,
      }
    );

    const route = routeResponse.data.results?.[0];

    if (
      !route ||
      !Number.isFinite(route.distance) ||
      !Number.isFinite(route.time)
    ) {
      return res.status(502).json({
        message: "A road route could not be calculated for these places.",
      });
    }

    const oneWayKm = route.distance / 1000;
    const roundTripKm = oneWayKm * 2;
    const rates = styles[style];

    // These are planning estimates, not live vendor prices.
    const items = [
      {
        category: "Transport",
        title: "Road travel allowance (round trip)",
        amount: Math.round(roundTripKm * 8),
        source: "estimate",
      },
      {
        category: "Hotel",
        title: `Accommodation (${tripDays} night${tripDays === 1 ? "" : "s"})`,
        amount: rates.hotel * tripDays * Math.ceil(people / 2),
        source: "estimate",
      },
      {
        category: "Food",
        title: `Food (${tripDays} days)`,
        amount: rates.food * tripDays * people,
        source: "estimate",
      },
      {
        category: "Transport",
        title: `Local transport (${tripDays} days)`,
        amount: rates.local * tripDays * people,
        source: "estimate",
      },
      {
        category: "Activities",
        title: `Activities and sightseeing (${tripDays} days)`,
        amount: rates.activities * tripDays * people,
        source: "estimate",
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const contingency = Math.round(subtotal * 0.1);

    res.json({
      origin: from.name,
      destination: to.name,
      route: {
        distanceKm: Math.round(oneWayKm),
        roundTripDistanceKm: Math.round(roundTripKm),
        driveHoursOneWay: Math.round((route.time / 3600) * 10) / 10,
        source: "Geoapify live route calculation",
      },
      days: tripDays,
      travelers: people,
      style,
      items,
      contingency,
      total: subtotal + contingency,
      currency: "INR",
      estimateNotice:
        "Accommodation, food, local transport, activities and road running costs are planning estimates, not live quotes. Road distance and driving time are supplied by Geoapify. Actual fares, tolls, room rates and availability may differ.",
    });
  } catch (error) {
    console.error(
      "Travel estimate error:",
      error.response?.data || error.message
    );

    res.status(502).json({
      message:
        "Could not estimate this trip. Check the place names, API key, and internet connection.",
    });
  }
});

module.exports = router;
