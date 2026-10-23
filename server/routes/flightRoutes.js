const express = require("express");
const axios = require("axios");

const router = express.Router();


// ======================================================
// DUFFEL CONFIGURATION
// ======================================================

const DUFFEL_BASE_URL = "https://api.duffel.com";


// ======================================================
// DUFFEL HEADERS
// ======================================================

function duffelHeaders() {
  return {
    Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
    "Duffel-Version": "v2",
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}


// ======================================================
// CHECK DUFFEL TOKEN
// ======================================================

function checkDuffelToken(res) {
  if (!process.env.DUFFEL_ACCESS_TOKEN) {
    res.status(500).json({
      success: false,
      message:
        "DUFFEL_ACCESS_TOKEN is missing in server .env",
    });

    return false;
  }

  return true;
}


// ======================================================
// TEST
// ======================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Flight Routes Working ✈️",
  });
});


// ======================================================
// GET INDIAN AIRPORTS
// ======================================================
//
// GET /api/flights/airports
//
// Optional:
// /api/flights/airports?search=bangalore
// /api/flights/airports?search=BLR
//
// ======================================================

router.get("/airports", async (req, res) => {
  try {
    if (!checkDuffelToken(res)) {
      return;
    }

    const search = String(
      req.query.search || ""
    )
      .trim()
      .toLowerCase();


    let allAirports = [];

    let after = null;

    let page = 1;


    do {
      let url =
        `${DUFFEL_BASE_URL}/air/airports` +
        `?limit=200` +
        `&iata_country_code=IN`;


      if (after) {
        url +=
          `&after=${encodeURIComponent(after)}`;
      }


      console.log(
        `✈️ Loading Indian airports - page ${page}`
      );


      const response = await axios.get(
        url,
        {
          headers: duffelHeaders(),
        }
      );


      const airports =
        response.data?.data || [];


      allAirports.push(...airports);


      after =
        response.data?.meta?.after || null;


      page++;


      if (page > 20) {
        break;
      }

    } while (after);


    // ==================================================
    // NORMALIZE
    // ==================================================

    let airports = allAirports.map(
      (airport) => ({
        id: airport.id,

        city:
          airport.city_name ||
          airport.city?.name ||
          "",

        name:
          airport.name ||
          "",

        code:
          airport.iata_code ||
          "",

        icaoCode:
          airport.icao_code ||
          "",

        country:
          airport.iata_country_code ||
          "IN",

        cityCode:
          airport.iata_city_code ||
          "",

        latitude:
          airport.latitude,

        longitude:
          airport.longitude,
      })
    );


    // ==================================================
    // ONLY VALID IATA AIRPORTS
    // ==================================================

    airports =
      airports.filter(
        (airport) =>
          airport.code &&
          airport.city
      );


    // ==================================================
    // REMOVE DUPLICATES
    // ==================================================

    const seen = new Set();

    airports =
      airports.filter(
        (airport) => {

          if (
            seen.has(
              airport.code
            )
          ) {
            return false;
          }

          seen.add(
            airport.code
          );

          return true;
        }
      );


    // ==================================================
    // SEARCH
    // ==================================================

    if (search) {

      airports =
        airports.filter(
          (airport) => {

            const city =
              airport.city
                .toLowerCase();

            const name =
              airport.name
                .toLowerCase();

            const code =
              airport.code
                .toLowerCase();

            const cityCode =
              airport.cityCode
                .toLowerCase();


            return (
              city.includes(search) ||
              name.includes(search) ||
              code.includes(search) ||
              cityCode.includes(search)
            );

          }
        );

    }


    // ==================================================
    // SORT
    // ==================================================

    airports.sort(
      (a, b) =>
        a.city.localeCompare(
          b.city
        )
    );


    console.log(
      `✅ ${airports.length} Indian airports ready`
    );


    return res.json({
      success: true,
      count: airports.length,
      airports,
    });


  } catch (error) {

    console.error(
      "❌ AIRPORT ERROR:"
    );

    console.error(
      error.response?.data ||
      error.message
    );


    return res.status(
      error.response?.status || 500
    ).json({

      success: false,

      message:
        error.response?.data
          ?.errors?.[0]?.message ||
        error.response?.data?.message ||
        error.message ||
        "Unable to load airports",

    });

  }
});


// ======================================================
// SEARCH FLIGHTS
// ======================================================
//
// POST/GET style used by your existing frontend:
// GET /api/flights/search
//
// Example:
//
// /api/flights/search
// ?from=BLR
// &to=DEL
// &departureDate=2026-09-20
// &passengers=1
// &cabinClass=Economy
//
// ======================================================

router.get("/search", async (req, res) => {

  try {

    if (!checkDuffelToken(res)) {
      return;
    }


    const {
      from,
      to,
      date,
      departureDate,
      passengers = 1,
      cabinClass = "Economy",
    } = req.query;


    const travelDate =
      departureDate || date;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !from ||
      !to ||
      !travelDate
    ) {

      return res.status(400).json({

        success: false,

        message:
          "From, To and departure date are required",

      });

    }


    if (
      from.toUpperCase() ===
      to.toUpperCase()
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Departure and destination cannot be the same",

      });

    }


    const passengerCount =
      Math.max(
        1,
        Number(passengers) || 1
      );


    // ==================================================
    // CABIN CLASS
    // ==================================================

    let duffelCabin =
      "economy";


    const cabin =
      String(cabinClass)
        .toLowerCase();


    if (
      cabin.includes(
        "premium"
      )
    ) {

      duffelCabin =
        "premium_economy";

    } else if (
      cabin.includes(
        "business"
      )
    ) {

      duffelCabin =
        "business";

    } else if (
      cabin.includes(
        "first"
      )
    ) {

      duffelCabin =
        "first";

    }


    console.log(
      "\n======================================"
    );

    console.log(
      "✈️ LIVE FLIGHT SEARCH"
    );

    console.log(
      "FROM:",
      from.toUpperCase()
    );

    console.log(
      "TO:",
      to.toUpperCase()
    );

    console.log(
      "DATE:",
      travelDate
    );

    console.log(
      "PASSENGERS:",
      passengerCount
    );

    console.log(
      "CABIN:",
      duffelCabin
    );

    console.log(
      "======================================\n"
    );


    // ==================================================
    // DUFFEL OFFER REQUEST
    // ==================================================

    const response =
      await axios.post(

        `${DUFFEL_BASE_URL}/air/offer_requests`,

        {
          data: {

            slices: [
              {
                origin:
                  from.toUpperCase(),

                destination:
                  to.toUpperCase(),

                departure_date:
                  travelDate,
              },
            ],


            passengers:
              Array.from(
                {
                  length:
                    passengerCount,
                },
                () => ({
                  type: "adult",
                })
              ),


            cabin_class:
              duffelCabin,

          },
        },

        {
          headers:
            duffelHeaders(),
        }

      );


    const offers =
      response.data
        ?.data
        ?.offers || [];

        console.log(
  "DUFFEL OFFER PRICES:",
  offers.slice(0, 10).map((offer) => ({
    id: offer.id,
    total_amount: offer.total_amount,
    total_currency: offer.total_currency,
    live_mode: offer.live_mode,
  }))
);

    console.log(
      `✅ Duffel returned ${offers.length} offers`
    );


    // ==================================================
    // NORMALIZE OFFERS
    // ==================================================

    const flights =
      offers.map(
        (offer) => {

          const slice =
            offer.slices?.[0];


          const segments =
            slice?.segments || [];


          const firstSegment =
            segments[0];


          const lastSegment =
            segments[
              segments.length - 1
            ];


          const stops =
            Math.max(
              0,
              segments.length - 1
            );


          const airline =
            firstSegment
              ?.marketing_carrier
              ?.name ||

            firstSegment
              ?.operating_carrier
              ?.name ||

            "Airline";


          const airlineCode =
            firstSegment
              ?.marketing_carrier
              ?.iata_code ||

            firstSegment
              ?.operating_carrier
              ?.iata_code ||

            "";


          const flightNumber =
            firstSegment
              ?.marketing_carrier_flight_number ||

            firstSegment
              ?.flight_number ||

            "";


          return {

            id:
              offer.id,

            offerId:
              offer.id,


            airline,

            airlineCode,

            flightNumber,


            from:
              slice
                ?.origin
                ?.iata_code ||

              from.toUpperCase(),


            to:
              slice
                ?.destination
                ?.iata_code ||

              to.toUpperCase(),


            departureTime:
              firstSegment
                ?.departing_at ||
              "",


            arrivalTime:
              lastSegment
                ?.arriving_at ||
              "",


            duration:
              slice?.duration ||
              "",


            stops,


            // IMPORTANT:
            // This is the Duffel offer price.
            price:
              Number(
                offer.total_amount
              ),


            currency:
              offer.total_currency ||
              "INR",


            expiresAt:
              offer.expires_at ||
              null,


            cabinClass,


            paymentRequirements:
              offer.payment_requirements ||
              null,


            liveMode:
              offer.live_mode ?? null,

          };

        }
      );


    return res.json({

      success: true,

      count:
        flights.length,

      flights,

    });


  } catch (error) {

    console.error(
      "\n❌ FLIGHT SEARCH ERROR:"
    );

    console.error(
      error.response?.data ||
      error.message
    );


    return res.status(
      error.response?.status || 500
    ).json({

      success: false,

      message:
        error.response?.data
          ?.errors?.[0]?.message ||

        error.response?.data?.message ||

        error.message ||

        "Unable to search flights",

    });

  }

});


// ======================================================
// GET / REFRESH SINGLE OFFER
// ======================================================
//
// THIS IS THE IMPORTANT PART.
//
// When user selects a flight, we retrieve the offer again.
// Duffel says this gives the latest total_amount and
// total_currency.
//
// GET /api/flights/offer/:offerId
//
// ======================================================

router.get(
  "/offer/:offerId",
  async (req, res) => {

    try {

      if (!checkDuffelToken(res)) {
        return;
      }


      const {
        offerId
      } = req.params;


      if (!offerId) {

        return res.status(400).json({

          success: false,

          message:
            "Offer ID is required",

        });

      }


      console.log(
        `🔄 Refreshing offer: ${offerId}`
      );


      const response =
        await axios.get(

          `${DUFFEL_BASE_URL}/air/offers/${encodeURIComponent(
            offerId
          )}`,

          {
            headers:
              duffelHeaders(),
          }

        );


      const offer =
        response.data?.data;


      if (!offer) {

        return res.status(404).json({

          success: false,

          message:
            "Offer was not found",

        });

      }


      // ==================================================
      // EXPIRED CHECK
      // ==================================================

      let expired = false;


      if (offer.expires_at) {

        expired =
          new Date(
            offer.expires_at
          ).getTime() <=
          Date.now();

      }


      if (expired) {

        return res.status(409).json({

          success: false,

          expired: true,

          message:
            "This flight offer has expired. Please search again.",

          offerId:
            offer.id,

          expiresAt:
            offer.expires_at,

        });

      }


      // ==================================================
      // CURRENT PRICE
      // ==================================================

      const currentPrice =
        Number(
          offer.total_amount
        );


      const currentCurrency =
        offer.total_currency;


      return res.json({

        success: true,

        expired: false,


        offer: {

          id:
            offer.id,


          price:
            currentPrice,


          currency:
            currentCurrency,


          expiresAt:
            offer.expires_at ||
            null,


          liveMode:
            offer.live_mode ??
            null,


          paymentRequirements:
            offer.payment_requirements ||
            null,


          rawOffer:
            offer,

        },

      });


    } catch (error) {

      console.error(
        "❌ OFFER REFRESH ERROR:"
      );

      console.error(
        error.response?.data ||
        error.message
      );


      return res.status(
        error.response?.status || 500
      ).json({

        success: false,

        message:
          error.response?.data
            ?.errors?.[0]?.message ||

          error.response?.data
            ?.message ||

          error.message ||

          "Unable to refresh flight price",

      });

    }

  }
);


// ======================================================
// CREATE BOOKING / HOLD ORDER
// ======================================================
//
// POST /api/flights/book
//
// This creates the actual Duffel order.
//
// IMPORTANT:
// For an instant paid order, your Duffel account/payment
// setup must support the required payment method.
//
// The safer default below is:
// type = hold
//
// If the offer cannot be held, Duffel will tell us.
// ======================================================

router.post(
  "/book",
  async (req, res) => {

    try {

      if (!checkDuffelToken(res)) {
        return;
      }


      const {
        offerId,
        passengers,
        type = "hold",
      } = req.body;


      // ==================================================
      // VALIDATION
      // ==================================================

      if (!offerId) {

        return res.status(400).json({

          success: false,

          message:
            "Offer ID is required",

        });

      }


      if (
        !Array.isArray(passengers) ||
        passengers.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Passenger information is required",

        });

      }


      // ==================================================
      // REFRESH OFFER BEFORE BOOKING
      // ==================================================

      console.log(
        `🔄 Verifying offer before booking: ${offerId}`
      );


      const offerResponse =
        await axios.get(

          `${DUFFEL_BASE_URL}/air/offers/${encodeURIComponent(
            offerId
          )}`,

          {
            headers:
              duffelHeaders(),
          }

        );


      const offer =
        offerResponse.data?.data;


      if (!offer) {

        return res.status(404).json({

          success: false,

          message:
            "Flight offer no longer exists",

        });

      }


      // ==================================================
      // CHECK EXPIRATION
      // ==================================================

      if (
        offer.expires_at &&
        new Date(
          offer.expires_at
        ).getTime() <= Date.now()
      ) {

        return res.status(409).json({

          success: false,

          expired: true,

          message:
            "Flight price has expired. Please search again.",

        });

      }


      // ==================================================
      // CURRENT VERIFIED PRICE
      // ==================================================

      const verifiedPrice =
        Number(
          offer.total_amount
        );


      const verifiedCurrency =
        offer.total_currency;


      console.log(
        `💰 VERIFIED PRICE: ${verifiedPrice} ${verifiedCurrency}`
      );


      // ==================================================
      // PASSENGER DATA
      // ==================================================

      const formattedPassengers =
        passengers.map(
          (passenger) => ({

            title:
              passenger.title ||
              "mr",

            gender:
              passenger.gender ||
              "m",

            given_name:
              passenger.given_name ||
              passenger.firstName,

            family_name:
              passenger.family_name ||
              passenger.lastName,

            born_on:
              passenger.born_on ||
              passenger.dateOfBirth,

            email:
              passenger.email,

            phone_number:
              passenger.phone_number ||
              passenger.phone,

          })
        );


      // ==================================================
      // VALIDATE PASSENGERS
      // ==================================================

      for (
        const passenger
        of formattedPassengers
      ) {

        if (
          !passenger.given_name ||
          !passenger.family_name ||
          !passenger.born_on ||
          !passenger.email ||
          !passenger.phone_number
        ) {

          return res.status(400).json({

            success: false,

            message:
              "Complete passenger details are required: name, date of birth, email and phone.",

          });

        }

      }


      // ==================================================
      // CREATE ORDER
      // ==================================================

      const orderPayload = {

        data: {

          type:
            type === "instant"
              ? "instant"
              : "hold",


          selected_offers: [
            offer.id,
          ],


          passengers:
            formattedPassengers,

        },

      };


      console.log(
        "🧾 Creating Duffel order..."
      );


      const orderResponse =
        await axios.post(

          `${DUFFEL_BASE_URL}/air/orders`,

          orderPayload,

          {
            headers:
              duffelHeaders(),
          }

        );


      const order =
        orderResponse.data?.data;


      if (!order) {

        return res.status(500).json({

          success: false,

          message:
            "Duffel did not return an order",

        });

      }


      console.log(
        `✅ ORDER CREATED: ${order.id}`
      );


      return res.status(201).json({

        success: true,

        message:
          type === "hold"
            ? "Flight held successfully"
            : "Flight booked successfully",


        order: {

          id:
            order.id,

          bookingReference:
            order.booking_reference ||
            order.booking_reference_number ||
            null,

          status:
            order.booking_status ||
            null,

          type:
            order.type ||
            type,


          totalAmount:
            Number(
              order.total_amount ||
              verifiedPrice
            ),


          totalCurrency:
            order.total_currency ||
            verifiedCurrency,


          expiresAt:
            order.payment_required_by ||
            null,


          liveMode:
            order.live_mode ??
            null,

        },

      });


    } catch (error) {

      console.error(
        "\n❌ BOOKING ERROR:"
      );


      console.error(
        error.response?.data ||
        error.message
      );


      const apiError =
        error.response?.data
          ?.errors?.[0];


      // ==================================================
      // OFFER EXPIRED
      // ==================================================

      if (
        apiError?.code ===
        "offer_expired"
      ) {

        return res.status(409).json({

          success: false,

          expired: true,

          message:
            "This flight price has expired. Please search again.",

        });

      }


      return res.status(
        error.response?.status || 500
      ).json({

        success: false,

        message:
          apiError?.message ||

          error.response?.data
            ?.message ||

          error.message ||

          "Unable to book flight",

      });

    }

  }
);


module.exports = router;