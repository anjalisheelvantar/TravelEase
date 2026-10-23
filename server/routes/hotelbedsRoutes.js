
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");

const router = express.Router();

const API_KEY = process.env.HOTELBEDS_API_KEY;
const API_SECRET = process.env.HOTELBEDS_API_SECRET;

const BASE_URL =
  process.env.HOTELBEDS_BASE_URL ||
  "https://api.test.hotelbeds.com";

const CONTENT_URL =
  process.env.HOTELBEDS_CONTENT_URL ||
  "https://api.test.hotelbeds.com";

// Normalize city names for matching.
function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(city|district|town|india)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Known alternative spellings. These are search aliases,
// not a guarantee that Hotelbeds sells hotels in that location.
const DESTINATION_ALIASES = {
  hospet: ["hospet", "hosapete"],
  hosapete: ["hosapete", "hospet"],
  bengaluru: ["bengaluru", "bangalore"],
  bangalore: ["bangalore", "bengaluru"],
  mumbai: ["mumbai", "bombay"],
  chennai: ["chennai", "madras"],
  kolkata: ["kolkata", "calcutta"],
  mysuru: ["mysuru", "mysore"],
  puducherry: ["puducherry", "pondicherry"],
};

function getDestinationNames(input) {
  const normalized = normalizeName(input);

  const aliasKey = Object.keys(DESTINATION_ALIASES).find(
    (key) =>
      normalizeName(key) === normalized ||
      DESTINATION_ALIASES[key].some(
        (alias) => normalizeName(alias) === normalized
      )
  );

  return aliasKey
    ? DESTINATION_ALIASES[aliasKey]
    : [String(input || "").trim()];
}

function signature() {
  const timestamp = Math.floor(Date.now() / 1000);

  return crypto
    .createHash("sha256")
    .update(`${API_KEY}${API_SECRET}${timestamp}`)
    .digest("hex");
}

function authHeaders() {
  if (!API_KEY || !API_SECRET) {
    throw new Error(
      "Hotelbeds credentials are missing. Check HOTELBEDS_API_KEY and HOTELBEDS_API_SECRET."
    );
  }

  return {
    "Api-key": API_KEY,
    "X-Signature": signature(),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function mtlsAgent() {
  const certPath = process.env.HOTELBEDS_CERT_PATH;
  const keyPath = process.env.HOTELBEDS_KEY_PATH;

  if (!certPath || !keyPath) {
    throw new Error(
      "Live Hotelbeds availability requires HOTELBEDS_CERT_PATH and HOTELBEDS_KEY_PATH."
    );
  }

  const resolveFile = (file) => path.resolve(process.cwd(), file);

  const resolvedCert = resolveFile(certPath);
  const resolvedKey = resolveFile(keyPath);

  if (
    !fs.existsSync(resolvedCert) ||
    !fs.existsSync(resolvedKey)
  ) {
    throw new Error(
      "Hotelbeds certificate or private key file was not found. Check the configured paths."
    );
  }

  return new https.Agent({
    cert: fs.readFileSync(resolvedCert),
    key: fs.readFileSync(resolvedKey),
    rejectUnauthorized: true,
  });
}

function handleError(res, error) {
  const status = error.response?.status || 502;
  const details = error.response?.data || error.message;

  console.error(
    "Hotelbeds error:",
    status,
    typeof details === "string"
      ? details
      : JSON.stringify(details)
  );

  return res.status(status).json({
    success: false,
    message: "Hotelbeds request failed.",
    details,
  });
}

// 1. Get Hotelbeds destinations.
// GET /api/hotelbeds/destinations?countryCode=IN
router.get("/destinations", async (req, res) => {
  try {
    const countryCode = String(
      req.query.countryCode || "IN"
    )
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return res.status(400).json({
        success: false,
        message: "Use a valid two-letter country code.",
      });
    }

    const response = await axios.get(
      `${CONTENT_URL}/hotel-content-api/1.0/locations/destinations`,
      {
        params: { countryCode },
        headers: authHeaders(),
        timeout: 30000,
      }
    );

    const data = response.data;

    // Support either an object containing destinations
    // or an API response that directly contains an array.
    const destinations = Array.isArray(data)
      ? data
      : data?.destinations || [];

    res.json({
      success: true,
      count: destinations.length,
      destinations,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 2. Search Hotelbeds hotel content by destination code.
// GET /api/hotelbeds/content/hotels?destinationCode=GOI
router.get("/content/hotels", async (req, res) => {
  try {
    const destinationCode = String(
      req.query.destinationCode || ""
    )
      .trim()
      .toUpperCase();

    if (!/^[A-Z0-9]{2,10}$/.test(destinationCode)) {
      return res.status(400).json({
        success: false,
        message: "A valid Hotelbeds destination code is required.",
      });
    }

    const response = await axios.get(
      `${CONTENT_URL}/hotel-content-api/1.0/hotels`,
      {
        params: { destinationCode },
        headers: authHeaders(),
        timeout: 30000,
      }
    );

    res.json({
      success: true,
      hotels: response.data?.hotels || [],
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 3. Search real room availability and prices.
// Requires valid Hotelbeds access and mTLS configuration.
// POST /api/hotelbeds/availability
router.post("/availability", async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      adults = 2,
      rooms = 1,
      hotelCodes = [],
    } = req.body;

    const validDate = (value) => {
      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
      ) {
        return false;
      }

      const date = new Date(`${value}T00:00:00Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    };

    if (
      !validDate(checkIn) ||
      !validDate(checkOut) ||
      checkOut <= checkIn
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide valid check-in and check-out dates.",
      });
    }

    if (
      !Number.isInteger(adults) ||
      adults < 1 ||
      adults > 9 ||
      !Number.isInteger(rooms) ||
      rooms < 1 ||
      rooms > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid guest or room count.",
      });
    }

    if (
      !Array.isArray(hotelCodes) ||
      hotelCodes.length === 0 ||
      hotelCodes.length > 100 ||
      hotelCodes.some(
        (code) =>
          !Number.isSafeInteger(Number(code)) ||
          Number(code) <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide Hotelbeds hotel codes from the content endpoint.",
      });
    }

    const response = await axios.post(
      `${BASE_URL}/hotel-api/1.0/hotels`,
      {
        stay: { checkIn, checkOut },
        occupancies: Array.from(
          { length: rooms },
          () => ({
            rooms: 1,
            adults,
            children: 0,
          })
        ),
        hotels: {
          hotel: hotelCodes.map(Number),
        },
      },
      {
        headers: authHeaders(),
        httpsAgent: mtlsAgent(),
        timeout: 60000,
      }
    );

    const hotels =
      response.data?.hotels?.hotels || [];

    const offers = hotels.flatMap((hotel) =>
      (hotel.rooms || []).flatMap((room) =>
        (room.rates || []).map((rate) => ({
          hotelCode: hotel.code,
          hotelName: hotel.name,
          categoryName: hotel.categoryName,
          roomName: room.name,
          boardName: rate.boardName,
          rateKey: rate.rateKey,
          rateType: rate.rateType,
          net: rate.net,
          currency: rate.currency,
          paymentType: rate.paymentType,
          cancellationPolicies:
            rate.cancellationPolicies || [],
        }))
      )
    );

    res.json({
      success: true,
      source: "Hotelbeds",
      count: offers.length,
      message:
        offers.length > 0
          ? "Live offers returned by Hotelbeds."
          : "No available rates were returned for these hotels and dates.",
      currencyNote:
        "Display prices in the currency returned by Hotelbeds. Confirm the price before booking.",
      offers,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 4. Recheck a rate before booking.
router.post("/checkrates", async (req, res) => {
  try {
    const { rateKey } = req.body;

    if (
      typeof rateKey !== "string" ||
      !rateKey.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid rateKey is required.",
      });
    }

    const response = await axios.post(
      `${BASE_URL}/hotel-api/1.0/checkrates`,
      { rooms: [{ rateKey: rateKey.trim() }] },
      {
        headers: authHeaders(),
        httpsAgent: mtlsAgent(),
        timeout: 60000,
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 5. Confirm a Hotelbeds test booking.
router.post("/bookings", async (req, res) => {
  try {
    const { holder, rateKey, guests } = req.body;

    if (
      !holder?.name?.trim() ||
      !holder?.surname?.trim() ||
      typeof rateKey !== "string" ||
      !rateKey.trim() ||
      !Array.isArray(guests) ||
      guests.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide the booking holder, rateKey and guest details.",
      });
    }

    const paxes = guests.map((guest) => {
      if (
        !guest?.name?.trim() ||
        !guest?.surname?.trim()
      ) {
        throw new Error(
          "Every guest needs a name and surname."
        );
      }

      return {
        roomId: guest.roomId || 1,
        type: "AD",
        name: guest.name.trim(),
        surname: guest.surname.trim(),
      };
    });

    const response = await axios.post(
      `${BASE_URL}/hotel-api/1.0/bookings`,
      {
        holder: {
          name: holder.name.trim(),
          surname: holder.surname.trim(),
        },
        rooms: [
          {
            rateKey: rateKey.trim(),
            paxes,
          },
        ],
        clientReference: `TravelEase-${Date.now()}`,
        remark: "TravelEase test booking",
      },
      {
        headers: authHeaders(),
        httpsAgent: mtlsAgent(),
        timeout: 60000,
      }
    );

    res.status(201).json({
      success: true,
      booking: response.data,
      environment: "test",
    });
  } catch (error) {
    handleError(res, error);
  }
});

// 6. Find a matching destination by name.
// GET /api/hotelbeds/find-destination?name=Hospet
router.get("/find-destination", async (req, res) => {
  try {
    const input = String(req.query.name || "").trim();

    if (!input) {
      return res.status(400).json({
        success: false,
        message: "Provide a destination name, e.g. Hospet.",
      });
    }

    const response = await axios.get(
      `${CONTENT_URL}/hotel-content-api/1.0/locations/destinations`,
      {
        params: { countryCode: "IN" },
        headers: authHeaders(),
        timeout: 30000,
      }
    );

   const data = response.data;

const allDestinations = Array.isArray(data)
  ? data
  : data?.destinations || [];

const destinations = allDestinations.filter(
  (destination) =>
    String(destination.countryCode || "").toUpperCase() === countryCode
);

res.json({
  success: true,
  requestedCountry: countryCode,
  count: destinations.length,
  totalReturnedByHotelbeds: allDestinations.length,
  destinations,
});

    const aliases = getDestinationNames(input).map(normalizeName);

    const matches = destinations
      .map((destination) => {
        const name =
          typeof destination.name === "string"
            ? destination.name
            : destination.name?.content ||
              destination.name?.name ||
              "";

        const normalizedDestination = normalizeName(name);

        const exact = aliases.includes(normalizedDestination);
        const partial =
          normalizedDestination.length > 0 &&
          aliases.some(
            (alias) =>
              alias.length >= 4 &&
              (normalizedDestination.includes(alias) ||
                alias.includes(normalizedDestination))
          );

        return {
          ...destination,
          name,
          matchType: exact
            ? "exact"
            : partial
              ? "partial"
              : null,
          _matchScore: exact ? 2 : partial ? 1 : 0,
        };
      })
      .filter((destination) => destination._matchScore > 0)
      .sort((a, b) => b._matchScore - a._matchScore)
      .map(({ _matchScore, ...destination }) => destination);

    res.json({
      success: true,
      input,
      aliases: getDestinationNames(input),
      count: matches.length,
      destination: matches[0] || null,
      matches,
      message:
        matches.length > 0
          ? "Matching Hotelbeds destination found."
          : "No matching Hotelbeds destination exists in the returned destination list.",
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
