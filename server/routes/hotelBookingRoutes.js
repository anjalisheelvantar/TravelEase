
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const HotelBooking = require("../models/HotelBooking");

const router = express.Router();

function validDate(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

// POST /api/hotel-bookings
router.post("/", async (req, res) => {
  try {
    const {
      hotel,
      guest,
      checkIn,
      checkOut,
      adults,
      rooms,
    } = req.body;

    if (!hotel || !hotel.name) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid hotel.",
      });
    }

    if (
      !guest ||
      !guest.fullName?.trim() ||
      !guest.email?.trim() ||
      !guest.phone?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide the guest's name, email and phone number.",
      });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(guest.email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!validDate(checkIn) || !validDate(checkOut)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid check-in and check-out dates.",
      });
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Compare calendar dates, not the time of day.
    const startDay = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate()
    );
    const endDay = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate()
    );

    const nights = Math.round((endDay - startDay) / 86400000);

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    const adultCount = Number(adults);
    const roomCount = Number(rooms);

    if (
      !Number.isInteger(adultCount) ||
      adultCount < 1 ||
      adultCount > 20 ||
      !Number.isInteger(roomCount) ||
      roomCount < 1 ||
      roomCount > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid guest and room counts.",
      });
    }

    const bookingReference =
      "TEH-" + crypto.randomBytes(5).toString("hex").toUpperCase();

    const booking = await HotelBooking.create({
      bookingReference,
      hotel: {
        id: String(hotel.id || ""),
        name: String(hotel.name).trim(),
        address: String(hotel.address || ""),
        city: String(hotel.city || ""),
        website: String(hotel.website || ""),
      },
      guest: {
        fullName: guest.fullName.trim(),
        email: guest.email.trim().toLowerCase(),
        phone: guest.phone.trim(),
      },
      checkIn: start,
      checkOut: end,
      adults: adultCount,
      rooms: roomCount,
      nights,
      status: "CONFIRMED",
      paymentStatus: "NOT_REQUIRED_DEMO",
    });

    return res.status(201).json({
      success: true,
      message: "Demo hotel booking created successfully.",
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Hotel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save the hotel booking. Please try again.",
    });
  }
});

// GET /api/hotel-bookings/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Accept either MongoDB ID or booking reference.
    let booking;

    if (mongoose.isValidObjectId(id)) {
      booking = await HotelBooking.findById(id).lean();
    }

    if (!booking) {
      booking = await HotelBooking.findOne({
        bookingReference: id,
      }).lean();
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    return res.json({ success: true, booking });
  } catch (error) {
    console.error("Get hotel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load the booking.",
    });
  }
});

module.exports = router;
