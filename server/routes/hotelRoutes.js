const express = require("express");
const axios = require("axios");

const router = express.Router();

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

console.log(
  "Geoapify API:",
  GEOAPIFY_API_KEY ? "Loaded" : "Missing"
);

// ======================================================
// SEARCH HOTELS
// ======================================================

router.get("/search", async (req, res) => {
  try {
    const city = (
      req.query.city ||
      req.query.location ||
      ""
    ).trim();

    // ----------------------------------------------
    // CHECK CITY
    // ----------------------------------------------

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Please enter a destination",
      });
    }

    if (!GEOAPIFY_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Geoapify API key is missing",
      });
    }

    console.log("====================================");
    console.log("Searching hotels for:", city);
    console.log("====================================");

    // ==================================================
    // STEP 1: GET LOCATION FROM GEOAPIFY
    // ==================================================

    const geoUrl =
      "https://api.geoapify.com/v1/geocode/search";

    
const geoResponse = await axios.get(geoUrl, {
  params: {
    text: city,
    type: "city",
    filter: "countrycode:in",
    limit: 5,
    format: "json",
    apiKey: GEOAPIFY_API_KEY,
  },
});


    console.log(
      "Geo API response:",
      geoResponse.data
    );

    const locations =
      geoResponse.data?.results || [];

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location "${city}" was not found`,
      });
    }

    // Take the first India result returned by API
    const location =
      locations.find(
        (item) => item.country_code === "in"
      ) || locations[0];

    // IMPORTANT:
    // These coordinates come directly from API response
    const latitude = location.lat;
    const longitude = location.lon;

    console.log(
      "API selected location:",
      location.formatted
    );

    console.log(
      "Latitude:",
      latitude
    );

    console.log(
      "Longitude:",
      longitude
    );

    // ==================================================
    // STEP 2: GET HOTELS USING API COORDINATES
    // ==================================================

    const hotelsUrl =
      "https://api.geoapify.com/v2/places";

    const hotelResponse = await axios.get(
      hotelsUrl,
      {
        params: {
          categories:
            "accommodation.hotel,accommodation.guest_house,accommodation.hostel,accommodation.motel",

          // Uses longitude + latitude returned by API
          filter:
            `circle:${longitude},${latitude},20000`,

          bias:
            `proximity:${longitude},${latitude}`,

          limit: 50,

          apiKey: GEOAPIFY_API_KEY,
        },
      }
    );

    const features =
      hotelResponse.data?.features || [];

    console.log(
      "Hotels returned by API:",
      features.length
    );

    // ==================================================
    // STEP 3: CONVERT API RESPONSE INTO CLEAN FORMAT
    // ==================================================

    const hotels = features.map(
      (feature, index) => {
        const p =
          feature.properties || {};

        const coordinates =
          feature.geometry?.coordinates || [];

        return {
          // API DATA
          id:
            p.place_id ||
            `hotel-${index}`,

          name:
            p.name ||
            "Unnamed Hotel",

          address:
            p.formatted ||
            p.address_line1 ||
            "Address not available",

          city:
            p.city ||
            location.city ||
            city,

          state:
            p.state ||
            location.state ||
            "",

          country:
            p.country ||
            location.country ||
            "India",

          latitude:
            coordinates[1] || null,

          longitude:
            coordinates[0] || null,

          phone:
            p.phone ||
            "",

          website:
            p.website ||
            "",

          // Geoapify may not provide rating
          rating:
            p.rating || null,

          distance:
            p.distance || null,

          categories:
            p.categories || [],
        };
      }
    );

    // ==================================================
    // STEP 4: SEND API DATA TO FRONTEND
    // ==================================================

    return res.json({
      success: true,

      searchedCity: city,

      location: {
        name:
          location.formatted,

        latitude,

        longitude,
      },

      count: hotels.length,

      hotels,
    });

  } catch (error) {
    console.error(
      "HOTEL API ERROR:",
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to fetch hotels from API",

      error:
        error.response?.data ||
        error.message,
    });
  }
});

module.exports = router;