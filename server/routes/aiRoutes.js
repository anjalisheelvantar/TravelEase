const express = require("express");
const axios = require("axios");

const router = express.Router();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:1.5b";

const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";
const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";


const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

async function findPopularPlaces(destination) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("GOOGLE_PLACES_API_KEY is missing from server/.env.");
  }

  const queries = [
    `popular tourist attractions in ${destination}, India`,
    `famous temples, parks and gardens in ${destination}, India`,
    `popular shopping malls and sightseeing places in ${destination}, India`,
  ];

  const responses = await Promise.all(
    queries.map((textQuery) =>
      axios.post(
        GOOGLE_PLACES_SEARCH_URL,
        {
          textQuery,
          languageCode: "en",
          regionCode: "IN",
          pageSize: 20,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.googleMapsUri",
          },
          timeout: 20000,
        }
      )
    )
  );

  const unique = new Map();

  for (const response of responses) {
    for (const place of response.data?.places || []) {
      const name = place.displayName?.text?.trim();
      if (!name || !place.id || !place.location) continue;

      const types = place.types || [];

      // Keep visitor-relevant places, not ordinary businesses or services.
      const allowedTypes = [
        "tourist_attraction",
        "historical_landmark",
        "historical_place",
        "museum",
        "park",
        "national_park",
        "place_of_worship",
        "hindu_temple",
        "shopping_mall",
        "zoo",
        "amusement_park",
        "art_gallery",
        "church",
        "hindu_temple",
      ];

      const relevant = types.some((type) => allowedTypes.includes(type));
      if (!relevant) continue;

      const id = place.id;
      if (unique.has(id)) continue;

      unique.set(id, {
        id,
        name,
        category: types.join(", ") || "tourist attraction",
        lat: place.location.latitude ?? null,
        lon: place.location.longitude ?? null,
        address: place.formattedAddress || "",
        categories: types,
        rating: place.rating ?? null,
        userRatingCount: place.userRatingCount ?? 0,
        googleMapsUri: place.googleMapsUri || "",
      });
    }
  }

  const places = [...unique.values()];

  // Prefer places with strong ratings and a substantial review history.
  places.sort((a, b) => {
    const scoreA =
      (a.rating || 0) * Math.log10((a.userRatingCount || 0) + 1);
    const scoreB =
      (b.rating || 0) * Math.log10((b.userRatingCount || 0) + 1);

    return scoreB - scoreA;
  });

  if (places.length === 0) {
    const error = new Error(
      `No suitable popular places were found for "${destination}".`
    );
    error.statusCode = 404;
    throw error;
  }

  return places.slice(0, 20);
}

console.log("Geoapify API:", GEOAPIFY_API_KEY ? "Loaded" : "Missing");
console.log("Ollama itinerary model:", OLLAMA_MODEL);
console.log("Ollama URL:", OLLAMA_URL);

// ======================================================
// CACHE
// ======================================================

const cache = new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.time < CACHE_DURATION) {
    return item.data;
  }
  cache.delete(key);
  return null;
}

function saveCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  if (cache.size > 200) {
    cache.delete(cache.keys().next().value);
  }
}

function cleanText(value) {
  return String(value || "").trim().slice(0, 100);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// ======================================================
// CURATED POPULAR TOURIST ATTRACTIONS
// Ollama may ONLY choose IDs from this approved list.
// Coordinates are not fabricated.
// /places continues to use Geoapify.
// ======================================================

const POPULAR_ATTRACTIONS = {
  goa: [
    "Basilica of Bom Jesus",
    "Fort Aguada",
    "Calangute Beach",
    "Baga Beach",
    "Anjuna Beach",
    "Palolem Beach",
    "Se Cathedral",
    "Dudhsagar Falls",
  ],
  hampi: [
    "Virupaksha Temple",
    "Vijaya Vittala Temple",
    "Stone Chariot",
    "Lotus Mahal",
    "Elephant Stables",
    "Hemakuta Hill",
    "Hampi Bazaar",
    "Matanga Hill",
  ],
  mysuru: [
    "Mysore Palace",
    "Chamundeshwari Temple",
    "Brindavan Gardens",
    "St. Philomena's Church",
    "Mysuru Zoo",
    "Devaraja Market",
  ],
  jaipur: [
    "Hawa Mahal",
    "Amber Fort",
    "City Palace",
    "Jantar Mantar",
    "Jal Mahal",
    "Nahargarh Fort",
    "Albert Hall Museum",
  ],
  manali: [
    "Hadimba Devi Temple",
    "Solang Valley",
    "Old Manali",
    "Vashisht Temple",
    "Manu Temple",
    "Jogini Waterfall",
  ],
  munnar: [
    "Eravikulam National Park",
    "Mattupetty Dam",
    "Top Station",
    "Tea Museum",
    "Echo Point",
    "Kundala Lake",
  ],
  udaipur: [
    "City Palace",
    "Lake Pichola",
    "Jag Mandir",
    "Jagdish Temple",
    "Saheliyon Ki Bari",
    "Fateh Sagar Lake",
    "Monsoon Palace",
  ],
  pondicherry: [
    "Promenade Beach",
    "Sri Aurobindo Ashram",
    "White Town",
    "Paradise Beach",
    "Auroville",
    "Basilica of the Sacred Heart of Jesus",
  ],
  rishikesh: [
    "Laxman Jhula",
    "Ram Jhula",
    "Triveni Ghat",
    "Neer Garh Waterfall",
    "The Beatles Ashram",
    "Parmarth Niketan",
  ],
  ballari: [
    "Bellary Fort",
    "Anjanadri Hill",
    "Sanganakallu Archaeological Site",
  ],
  delhi: [
    "India Gate",
    "Red Fort",
    "Qutub Minar",
    "Humayun's Tomb",
    "Lotus Temple",
    "Akshardham Temple",
  ],
  agra: [
    "Taj Mahal",
    "Agra Fort",
    "Mehtab Bagh",
    "Itimad-ud-Daulah's Tomb",
  ],
  mumbai: [
    "Gateway of India",
    "Marine Drive",
    "Elephanta Caves",
    "Chhatrapati Shivaji Maharaj Terminus",
    "Siddhivinayak Temple",
  ],
  varanasi: [
    "Dashashwamedh Ghat",
    "Kashi Vishwanath Temple",
    "Assi Ghat",
    "Sarnath",
    "Manikarnika Ghat",
  ],
  bengaluru: [
    "Lalbagh Botanical Garden",
    "Bengaluru Palace",
    "Cubbon Park",
    "ISKCON Temple Bengaluru",
    "Vidhana Soudha",
    "Bannerghatta Biological Park",
  ],
  hyderabad: [
    "Charminar",
    "Golconda Fort",
    "Salar Jung Museum",
    "Chowmahalla Palace",
    "Hussain Sagar",
    "Ramoji Film City",
  ],
  kolkata: [
    "Victoria Memorial",
    "Howrah Bridge",
    "Dakshineswar Kali Temple",
    "Indian Museum",
    "Marble Palace",
    "Kalighat Temple",
  ],
  shimla: [
    "The Ridge",
    "Mall Road",
    "Jakhoo Temple",
    "Christ Church Shimla",
    "Kufri",
    "Viceregal Lodge",
  ],
  darjeeling: [
    "Tiger Hill",
    "Batasia Loop",
    "Darjeeling Himalayan Railway",
    "Padmaja Naidu Himalayan Zoological Park",
    "Peace Pagoda",
    "Tea Garden",
  ],
  kanyakumari: [
    "Vivekananda Rock Memorial",
    "Thiruvalluvar Statue",
    "Kanyakumari Beach",
    "Bhagavathy Amman Temple",
    "Sunset Point",
  ],
  amritsar: [
    "Golden Temple",
    "Jallianwala Bagh",
    "Wagah Border",
    "Partition Museum",
    "Durgiana Temple",
  ],
  kochi: [
    "Fort Kochi",
    "Chinese Fishing Nets",
    "Mattancherry Palace",
    "Jew Town",
    "Kerala Folklore Museum",
    "Marine Drive Kochi",
  ],
  srinagar: [
    "Dal Lake",
    "Mughal Gardens",
    "Shankaracharya Temple",
    "Hazratbal Shrine",
    "Pari Mahal",
    "Nishat Bagh",
  ],
  leh: [
    "Shanti Stupa",
    "Leh Palace",
    "Thiksey Monastery",
    "Hall of Fame",
    "Magnetic Hill",
    "Khardung La",
  ],
  ayodhya: [
    "Shri Ram Janmabhoomi Mandir",
    "Hanuman Garhi",
    "Kanak Bhawan",
    "Saryu Ghat",
    "Dashrath Mahal",
  ],
  tirupati: [
    "Sri Venkateswara Temple",
    "Sri Padmavathi Ammavari Temple",
    "Kapila Theertham",
    "Sri Govindarajaswami Temple",
    "Silathoranam",
  ],
  madurai: [
    "Meenakshi Amman Temple",
    "Thirumalai Nayakkar Palace",
    "Gandhi Memorial Museum",
    "Alagar Kovil",
    "Vandiyur Mariamman Teppakulam",
  ],
  ooty: [
    "Government Botanical Garden",
    "Ooty Lake",
    "Doddabetta Peak",
    "Rose Garden",
    "Nilgiri Mountain Railway",
    "Pykara Falls",
  ],
  coorg: [
    "Abbey Falls",
    "Raja's Seat",
    "Dubare Elephant Camp",
    "Talakaveri",
    "Namdroling Monastery",
    "Mandalpatti",
  ],
  pondy: [
    "Promenade Beach",
    "Sri Aurobindo Ashram",
    "White Town",
    "Paradise Beach",
    "Auroville",
    "Basilica of the Sacred Heart of Jesus",
  ],
  puducherry: [
    "Promenade Beach",
    "Sri Aurobindo Ashram",
    "White Town",
    "Paradise Beach",
    "Auroville",
    "Basilica of the Sacred Heart of Jesus",
  ],
  mysore: [
    "Mysore Palace",
    "Chamundeshwari Temple",
    "Brindavan Gardens",
    "St. Philomena's Church",
    "Mysuru Zoo",
    "Devaraja Market",
  ],
  bellary: [
    "Bellary Fort",
    "Anjanadri Hill",
    "Sanganakallu Archaeological Site",
  ],
};

function getDestinationKey(destination) {
  const raw = String(destination || "")
    .toLowerCase()
    .split(",")[0]
    .trim();

  const aliases = {
    puducherry: "pondicherry",
    pondy: "pondicherry",
    mysore: "mysuru",
    bellary: "ballari",
    bangalore: "bengaluru",
    coorg: "coorg",
    madras: "chennai",
  };

  return aliases[raw] || raw;
}

function getCuratedPlaces(destination) {
  const key = getDestinationKey(destination);
  const names = POPULAR_ATTRACTIONS[key];

  if (!names) return null;

  return names.map((name, index) => ({
    id: `curated-${key}-${index + 1}`,
    name,
    category: "popular attraction",
    lat: null,
    lon: null,
    address: "",
    categories: ["curated.popular_attraction"],
  }));
}

// ======================================================
// LIVE DESTINATION SEARCH
// GET /api/ai/search?query=Hampi
// ======================================================

router.get("/search", async (req, res) => {
  try {
    const query = cleanText(req.query.query);

    if (query.length < 2) {
      return res.json({ success: true, places: [] });
    }

    if (!GEOAPIFY_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "Place search is not configured. Check GEOAPIFY_API_KEY.",
      });
    }

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = getCached(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        places: cached,
        source: "Geoapify",
      });
    }
        const cityResponse = await axios.get(GEOAPIFY_GEOCODE_URL, {
      params: {
        text: query,
        type: "city",
        filter: "countrycode:in",
        limit: 8,
        format: "json",
        lang: "en",
        apiKey: GEOAPIFY_API_KEY,
      },
      timeout: 15000,
    });

    const broadResponse = await axios.get(GEOAPIFY_GEOCODE_URL, {
      params: {
        text: query,
        filter: "countrycode:in",
        limit: 8,
        format: "json",
        lang: "en",
        apiKey: GEOAPIFY_API_KEY,
      },
      timeout: 15000,
    });

    const cityResults = cityResponse.data?.results || [];
    const broadResults = broadResponse.data?.results || [];
    const uniquePlaces = new Map();

    for (const item of [...cityResults, ...broadResults]) {
      if (
        item.country_code &&
        item.country_code.toLowerCase() !== "in"
      ) {
        continue;
      }

      const name =
        item.name ||
        item.city ||
        item.county ||
        item.address_line1 ||
        item.formatted;

      if (!name) continue;

      const address = item.formatted || name;
      const state = item.state || "";
      const district = item.county || item.city || "";
      const id =
        item.place_id ||
        `${name}-${state}-${item.lat}-${item.lon}`;

      if (uniquePlaces.has(id)) continue;

      uniquePlaces.set(id, {
        id,
        name,
        state,
        district,
        address,
        lat:
          item.lat !== null &&
          item.lat !== undefined &&
          Number.isFinite(Number(item.lat))
            ? Number(item.lat)
            : null,
        lon:
          item.lon !== null &&
          item.lon !== undefined &&
          Number.isFinite(Number(item.lon))
            ? Number(item.lon)
            : null,
        search: `${address}, India`,
      });
    }

    const places = [...uniquePlaces.values()].slice(0, 8);
    saveCache(cacheKey, places);

    return res.json({
      success: true,
      places,
      source: "Geoapify",
    });
  } catch (error) {
    console.error("Destination search error:", {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data,
    });

    return res.status(502).json({
      success: false,
      message:
        "Unable to search destinations right now. Please try again.",
    });
  }
});

// ======================================================
// FIND DESTINATION USING GEOAPIFY
// ======================================================

async function findDestination(destination) {
  const key = `geo:${destination.toLowerCase()}`;
  const cached = getCached(key);

  if (cached) return cached;

  if (!GEOAPIFY_API_KEY) {
    throw new Error(
      "GEOAPIFY_API_KEY is missing from the server .env file."
    );
  }

  const response = await axios.get(GEOAPIFY_GEOCODE_URL, {
    params: {
      text: destination,
      limit: 5,
      format: "json",
      apiKey: GEOAPIFY_API_KEY,
    },
    timeout: 15000,
  });

  const locations = response.data?.results || [];
  const location =
    locations.find((item) => item.country_code === "in") ||
    locations[0];

  if (!location) {
    const error = new Error(
      `We couldn't find "${destination}" in India. Try another spelling or a nearby major city.`
    );
    error.statusCode = 404;
    throw error;
  }

  const result = {
    lat: Number(location.lat),
    lon: Number(location.lon),
    name: location.formatted || destination,
  };

  saveCache(key, result);
  return result;
}

// ======================================================
// FETCH REAL PLACES USING GEOAPIFY
// ======================================================

async function findAttractions(
  destination,
  selectedCoordinates = null
) {
  const hasCoordinates =
    selectedCoordinates != null &&
    selectedCoordinates.lat !== null &&
    selectedCoordinates.lat !== undefined &&
    selectedCoordinates.lon !== null &&
    selectedCoordinates.lon !== undefined &&
    String(selectedCoordinates.lat).trim() !== "" &&
    String(selectedCoordinates.lon).trim() !== "" &&
    Number.isFinite(Number(selectedCoordinates.lat)) &&
    Number.isFinite(Number(selectedCoordinates.lon)) &&
    Number(selectedCoordinates.lat) >= -90 &&
    Number(selectedCoordinates.lat) <= 90 &&
    Number(selectedCoordinates.lon) >= -180 &&
    Number(selectedCoordinates.lon) <= 180;

  const lat = hasCoordinates
    ? Number(selectedCoordinates.lat)
    : null;

  const lon = hasCoordinates
    ? Number(selectedCoordinates.lon)
    : null;

  const key = hasCoordinates
    ? `places:coords:${lat}:${lon}`
    : `places:${destination.toLowerCase()}`;

  const cached = getCached(key);
  if (cached) return cached;

  if (!GEOAPIFY_API_KEY) {
    throw new Error(
      "GEOAPIFY_API_KEY is missing from the server .env file."
    );
  }

  const location = hasCoordinates
    ? { lat, lon, name: destination }
    : await findDestination(destination);

  const response = await axios.get(GEOAPIFY_PLACES_URL, {
    params: {
      categories:
        "tourism.attraction,tourism.sights,entertainment.museum,heritage,leisure.park,religion.place_of_worship",
      filter: `circle:${location.lon},${location.lat},20000`,
      bias: `proximity:${location.lon},${location.lat}`,
      limit: 100,
      lang: "en",
      apiKey: GEOAPIFY_API_KEY,
    },
    timeout: 20000,
  });

  const features = response.data?.features || [];
  const unique = new Map();

  for (const feature of features) {
    const p = feature.properties || {};
    const coords = feature.geometry?.coordinates || [];
    const name = String(p.name || "").trim();

    if (!name || name.length < 3) continue;

    const categories = p.categories || [];

    const isTourism =
      categories.some((c) => c.startsWith("tourism.attraction")) ||
      categories.some((c) => c.startsWith("tourism.sights")) ||
      categories.some((c) => c.includes("museum")) ||
      categories.some((c) => c.startsWith("heritage"));

    const id = String(p.place_id || name.toLowerCase());

    if (!unique.has(id)) {
      unique.set(id, {
        id,
        name,
        category: isTourism ? "attraction" : "landmark",
        lat: coords[1] ?? null,
        lon: coords[0] ?? null,
        address: p.formatted || "",
        categories,
      });
    }
  }

  const places = [...unique.values()];

  places.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category === "attraction" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  const resultPlaces = places.slice(0, 20);

  if (resultPlaces.length === 0) {
    const error = new Error(
      `No mapped tourist attractions were found near "${destination}".`
    );
    error.statusCode = 404;
    throw error;
  }

  const result = { location, places: resultPlaces };

  saveCache(key, result);
  return result;
}

// ======================================================
// FORMAT CURRENCY
// ======================================================

function formatRupees(value) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

// ======================================================
// OLLAMA ITINERARY GENERATION
// Model returns IDs only; backend validates each ID.
// ======================================================

async function generateAIItinerary({
  destination,
  days,
  preference,
  places,
}) {
  const allowedPlaces = places.map((place, index) => ({
    id: index + 1,
    name: place.name,
  }));

  const prompt = `
Create a practical day-by-day sightseeing order for a trip to ${destination}.
Trip duration: ${days} days.
Travel style: ${preference}.
Use only the attraction IDs in the supplied list. Do not invent attractions.
Do not output attraction names. Output JSON only, with this exact shape:
{"days":[{"day":1,"morning":1,"afternoon":2,"evening":3}]}
Each morning/afternoon/evening value must be an integer ID from the list or null.
Do not repeat an ID across the whole trip. Use as many suitable approved attractions as possible.
If there are fewer attractions than itinerary slots, use null.
Approved attraction IDs:
${JSON.stringify(allowedPlaces)}
`.trim();

  const response = await axios.post(
    OLLAMA_URL,
    {
      model: OLLAMA_MODEL,
      prompt,
      format: "json",
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 700,
      },
    },
    { timeout: 120000 }
  );

  const raw = response.data?.response;

  if (!raw || typeof raw !== "string") {
    throw new Error("Ollama returned an empty itinerary.");
  }

  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.days)) {
    throw new Error("Ollama returned an invalid itinerary format.");
  }

  const placeById = new Map(
    allowedPlaces.map((place) => [place.id, place])
  );

  const used = new Set();
  const validatedDays = [];

  for (let index = 0; index < days; index++) {
    const modelDay =
      parsed.days.find(
        (item) => Number(item.day) === index + 1
      ) || {};

    const slots = ["morning", "afternoon", "evening"];

    const day = {
      day: index + 1,
      morning: null,
      afternoon: null,
      evening: null,
    };

    for (const slot of slots) {
      const id =
        modelDay[slot] === null ||
        modelDay[slot] === undefined
          ? null
          : Number(modelDay[slot]);
                if (
        !Number.isInteger(id) ||
        !placeById.has(id) ||
        used.has(id)
      ) {
        day[slot] = null;
        continue;
      }

      used.add(id);
      day[slot] = placeById.get(id).name;
    }

    validatedDays.push(day);
  }

  if (
    !validatedDays.some(
      (day) => day.morning || day.afternoon || day.evening
    )
  ) {
    throw new Error(
      "Ollama did not choose any valid approved attractions."
    );
  }

  return validatedDays;
}

// Fallback itinerary uses the same approved attractions.
function buildFallbackItinerary(days, places) {
  const result = [];
  let index = 0;

  for (let day = 1; day <= days; day++) {
    result.push({
      day,
      morning: places[index++]?.name || null,
      afternoon: places[index++]?.name || null,
      evening: places[index++]?.name || null,
    });
  }

  return result;
}

// ======================================================
// BUILD TRIP PLAN
// ======================================================

function buildPlan({
  destination,
  days,
  budget,
  travelers,
  preference,
  places,
  locationName,
  itinerary,
}) {
  const totalBudget = budget;
  const perPerson = totalBudget / travelers;
  const perDay = totalBudget / days;

  const shares = {
    budget: {
      accommodation: 0.25,
      food: 0.25,
      transport: 0.2,
      activities: 0.15,
    },
    balanced: {
      accommodation: 0.3,
      food: 0.25,
      transport: 0.15,
      activities: 0.2,
    },
    comfort: {
      accommodation: 0.4,
      food: 0.25,
      transport: 0.15,
      activities: 0.15,
    },
    adventure: {
      accommodation: 0.2,
      food: 0.2,
      transport: 0.15,
      activities: 0.35,
    },
  };

  const allocation = shares[preference] || shares.balanced;

  const costs = {
    accommodation: Math.round(
      totalBudget * allocation.accommodation
    ),
    food: Math.round(totalBudget * allocation.food),
    transport: Math.round(totalBudget * allocation.transport),
    activities: Math.round(totalBudget * allocation.activities),
  };

  costs.buffer =
    totalBudget -
    costs.accommodation -
    costs.food -
    costs.transport -
    costs.activities;

  const lines = [
    "TRAVELEASE — YOUR INDIA TRIP PLAN",
    "",
    `Destination: ${destination}`,
    `Mapped location: ${locationName}`,
    `Duration: ${days} day(s)`,
    `Travellers: ${travelers}`,
    `Travel style: ${preference}`,
    "",
    "BUDGET BREAKDOWN",
    `Total group budget: ${formatRupees(totalBudget)}`,
    `Budget per traveller: ${formatRupees(perPerson)}`,
    `Average daily group budget: ${formatRupees(perDay)}`,
    `Accommodation allowance: ${formatRupees(costs.accommodation)}`,
    `Food allowance: ${formatRupees(costs.food)}`,
    `Transport allowance: ${formatRupees(costs.transport)}`,
    `Activities allowance: ${formatRupees(costs.activities)}`,
    `Extra / emergency buffer: ${formatRupees(costs.buffer)}`,
    "",
    "APPROVED POPULAR TOURIST PLACES",
    ...places.map(
      (place, index) =>
        `${index + 1}. ${place.name} (${place.category})`
    ),
    "",
    "DAY-BY-DAY ITINERARY",
  ];

  for (const day of itinerary) {
    lines.push("", `DAY ${day.day}`);

    if (day.morning) {
      lines.push(`Morning: Visit ${day.morning}.`);
    } else {
      lines.push(
        "Morning: Enjoy breakfast and start sightseeing at a relaxed pace."
      );
    }

    if (day.afternoon) {
      lines.push(`Afternoon: Explore ${day.afternoon}.`);
    } else {
      lines.push(
        "Afternoon: Take a relaxed lunch break and explore the local area."
      );
    }

    if (day.evening) {
      lines.push(`Evening: Visit ${day.evening}.`);
    } else {
      lines.push(
        "Evening: Leave time for local food, shopping, or rest."
      );
    }

    lines.push(
      "Tip: Check opening hours, entry fees, distance, and local transport before setting out."
    );
  }

  lines.push(
    "",
    "TRANSPORT",
    "Use your starting city and dates to compare trains, buses, flights, or cabs. Group nearby sightseeing places together to reduce travel time.",
    "",
    "ACCOMMODATION",
    `Use your ${formatRupees(costs.accommodation)} accommodation allowance as a planning target. Compare actual hotel prices and availability before booking.`,
    "",
    "IMPORTANT",
    "The itinerary uses a curated list of popular attractions for supported destinations. Budget figures are estimates, not live prices. Travel distances, opening times, ticket fees, hotel availability, and transport fares have not been verified live.",
    "",
    "Attraction names are from TravelEase's curated list. Geoapify continues to provide mapped places in the Explore Places feature."
  );

  return lines.join("\n");
}
// ======================================================
// POST /api/ai/trip-plan
// ======================================================

router.post("/trip-plan", async (req, res) => {
  try {
    const destination = cleanText(req.body.destination);
    const days = Number(req.body.days);
    const budget = Number(req.body.budget);
    const travelers = Number(req.body.travelers);
    const preference = req.body.preference || "balanced";

    if (!destination) {
      return res.status(400).json({
        message: "Please enter a destination in India.",
      });
    }

    if (!Number.isInteger(days) || days < 1 || days > 30) {
      return res.status(400).json({
        message: "Trip duration must be between 1 and 30 days.",
      });
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return res.status(400).json({
        message: "Please enter a valid total budget.",
      });
    }

    if (
      !Number.isInteger(travelers) ||
      travelers < 1 ||
      travelers > 50
    ) {
      return res.status(400).json({
        message: "Travellers must be between 1 and 50.",
      });
    }

    if (
      !["budget", "balanced", "comfort", "adventure"].includes(
        preference
      )
    ) {
      return res.status(400).json({
        message: "Please select a valid travel style.",
      });
    }

    // Only curated attractions are used for trip planning.

// Find popular visitor places using Google Places.
const availablePlaces = await findPopularPlaces(destination);

    let itinerary;
    let itinerarySource = "Ollama";

    try {
      itinerary = await generateAIItinerary({
        destination,
        days,
        preference,
        places: availablePlaces,
      });
    } catch (aiError) {
      console.error(
        "Ollama itinerary generation failed; using fallback:",
        aiError.message
      );

      itinerary = buildFallbackItinerary(days, availablePlaces);
      itinerarySource = "TravelEase fallback (Ollama unavailable)";
    }

   const locationName = destination;

    const plan = buildPlan({
      destination,
      days,
      budget,
      travelers,
      preference,
      places: availablePlaces,
      locationName,
      itinerary,
    });

    return res.json({
      plan,
      destination,
      places: availablePlaces,
      source: itinerarySource,
      note:
        "Attractions are fetched dynamically for your destination. " +
        "Results depend on available Geoapify data. " +
        "Budget figures are estimates.",
    });
  } catch (error) {
    console.error("TravelEase trip planner error:", {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data,
      code: error.code,
    });

    return res.status(error.statusCode || 502).json({
      message:
        error.statusCode === 404
          ? error.message
          : "The trip planner is temporarily unavailable. Please try again shortly.",
    });
  }
});

// ======================================================
// GET /api/ai/places?destination=Hampi
// Optional coordinates:
// GET /api/ai/places?destination=Ballari&lat=15.1430224&lon=76.9173277
// ======================================================


router.get("/places", async (req, res) => {
  try {
    const destination = cleanText(req.query.destination);

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: "Please enter a destination.",
      });
    }

    const places = await findPopularPlaces(destination);

    return res.json({
      success: true,
      destination,
      places,
      source: "Google Places",
      attribution: "Place data provided by Google Maps Platform",
    });
  } catch (error) {
    console.error("Explore popular places error:", {
      message: error.message,
      status: error.response?.status,
      details: error.response?.data,
    });

    return res.status(error.statusCode || 502).json({
      success: false,
      message:
        error.response?.data?.error?.message ||
        error.message ||
        "Could not load popular places. Please try again.",
    });
  }
});


module.exports = router;