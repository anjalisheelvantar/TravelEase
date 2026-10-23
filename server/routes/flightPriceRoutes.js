
const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/search", async (req, res) => {
  try {
    const token = process.env.DUFFEL_ACCESS_TOKEN;

    if (!token) {
      return res.status(503).json({
        message: "Duffel API token is not configured.",
      });
    }

    const {
      origin,
      destination,
      departureDate,
      passengers = 1,
    } = req.body;

    const validCode = (code) =>
      typeof code === "string" && /^[A-Z]{3}$/.test(code);

    if (!validCode(origin) || !validCode(destination)) {
      return res.status(400).json({
        message:
          "Enter valid 3-letter airport codes, such as BLR and DEL.",
      });
    }

    if (origin === destination) {
      return res.status(400).json({
        message: "Origin and destination must be different.",
      });
    }

    if (
      typeof departureDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(departureDate) ||
      !Number.isInteger(passengers) ||
      passengers < 1 ||
      passengers > 9
    ) {
      return res.status(400).json({
        message: "Enter a valid departure date and 1–9 passengers.",
      });
    }

    const date = new Date(`${departureDate}T00:00:00Z`);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== departureDate ||
      date < today
    ) {
      return res.status(400).json({
        message: "Departure date must be today or a future date.",
      });
    }

    const response = await axios.post(
      "https://api.duffel.com/air/offer_requests",
      {
        data: {
          slices: [
            {
              origin,
              destination,
              departure_date: departureDate,
            },
          ],
          passengers: Array.from(
            { length: passengers },
            () => ({ type: "adult" })
          ),
          cabin_class: "economy",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Duffel-Version": "v2",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const request = response.data.data;
    const offers = request.offers || [];

    const results = offers
      .filter(
        (offer) =>
          offer.total_amount != null &&
          offer.total_currency != null
      )
      .map((offer) => ({
        id: offer.id,
        totalAmount: offer.total_amount,
        currency: offer.total_currency,
        airline:
          offer.owner?.name || "Airline not specified",
        departureDate,
        passengers,
        source: "Duffel flight offer",
        liveMode: request.live_mode === true,
      }))
      .sort(
        (a, b) =>
          Number(a.totalAmount) - Number(b.totalAmount)
      )
      .slice(0, 10);

    return res.json({
      source: "Duffel",
      liveMode: request.live_mode === true,
      status:
        results.length > 0
          ? "offers_found"
          : "no_offers",
      offers: results,
      message:
        results.length > 0
          ? "Flight offers returned by Duffel. Confirm the fare before booking."
          : "No priced offers were returned for this search. Try another date or route.",
    });
  } catch (error) {
    console.error(
      "Duffel flight search error:",
      error.response?.data || error.message
    );

    return res.status(error.response?.status || 502).json({
      message:
        error.response?.data?.errors?.[0]?.message ||
        "Flight prices could not be retrieved. Check your Duffel access and search details.",
    });
  }
});

module.exports = router;
