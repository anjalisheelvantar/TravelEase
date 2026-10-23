
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

// ==========================================
// GENERATE PNR
// ==========================================

function generatePNR() {
  return (
    "TE" +
    Date.now().toString().slice(-8) +
    Math.floor(100 + Math.random() * 900)
  );
}

// ==========================================
// CREATE BOOKING
// ==========================================

router.post("/", async (req, res) => {
  try {
    console.log("=================================");
    console.log("BOOKING REQUEST RECEIVED");
    console.log(req.body);
    console.log("=================================");

    const {
      userId,
      bookingType,

      // TRAIN
      trainNumber,
      trainName,
      trainType,

      // FLIGHT
      airline,
      airlineCode,
      flightNumber,
      cabinClass,

      // CAB
      cabType,
      pickupTime,
      estimatedDistance,

      // JOURNEY
      from,
      to,
      departureTime,
      arrivalTime,
      travelDate,
      duration,
      distance,

      // PASSENGERS
      passengers,

      // PAYMENT
      farePerPassenger,
      totalAmount,
      paymentMethod,
    } = req.body;

    // ======================================
    // USER VALIDATION
    // ======================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ======================================
    // BOOKING TYPE
    // Preserve Train / Flight behavior
    // ======================================

    const type =
      bookingType === "Flight"
        ? "Flight"
        : bookingType === "Cab"
          ? "Cab"
          : "Train";

    // ======================================
    // JOURNEY VALIDATION
    // ======================================

    if (
      typeof from !== "string" ||
      !from.trim() ||
      typeof to !== "string" ||
      !to.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Journey location is required",
      });
    }

    // ======================================
    // PASSENGER VALIDATION
    // ======================================

    if (
      !Array.isArray(passengers) ||
      passengers.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Passenger details are required",
      });
    }

    for (const passenger of passengers) {
      if (
        typeof passenger.name !== "string" ||
        !passenger.name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Passenger name is required",
        });
      }

      if (
        passenger.age === undefined ||
        passenger.age === null ||
        passenger.age === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Passenger age is required",
        });
      }

      if (
        !["Male", "Female", "Other"].includes(
          passenger.gender
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid passenger gender",
        });
      }

      const age = Number(passenger.age);

      if (
        !Number.isInteger(age) ||
        age < 1 ||
        age > 120
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid passenger age",
        });
      }
    }

    // ======================================
    // CAB VALIDATION
    // Bike / Auto / Mini / Sedan / SUV
    // ======================================

    const allowedCabTypes = [
      "Bike",
      "Auto",
      "Mini",
      "Sedan",
      "SUV",
    ];

    if (type === "Cab") {
      if (!allowedCabTypes.includes(cabType)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid cab type. Choose Bike, Auto, Mini, Sedan, or SUV.",
        });
      }

      if (
        typeof travelDate !== "string" ||
        !travelDate.trim() ||
        typeof pickupTime !== "string" ||
        !pickupTime.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Travel date and pickup time are required",
        });
      }

      if (
        totalAmount === undefined ||
        totalAmount === null ||
        totalAmount === "" ||
        !Number.isFinite(Number(totalAmount)) ||
        Number(totalAmount) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid positive fare is required",
        });
      }

      if (
        estimatedDistance !== undefined &&
        estimatedDistance !== null &&
        estimatedDistance !== "" &&
        (
          !Number.isFinite(Number(estimatedDistance)) ||
          Number(estimatedDistance) < 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid estimated cab distance",
        });
      }
    }

    // ======================================
    // CREATE BOOKING
    // ======================================

    const booking = new Booking({
      userId,
      bookingType: type,
      pnr: generatePNR(),

      // TRAIN - PRESERVED
      trainNumber: trainNumber || "",
      trainName: trainName || "",
      trainType: trainType || "",

      // FLIGHT - PRESERVED
      airline: airline || "",
      airlineCode: airlineCode || "",
      flightNumber: flightNumber || "",
      cabinClass: cabinClass || "Economy",

      // CAB
      cabType: type === "Cab" ? cabType : "",
      pickupTime: type === "Cab" ? pickupTime : "",
      estimatedDistance:
        type === "Cab"
          ? Number(estimatedDistance) || 0
          : 0,

      // JOURNEY
      from: from.trim(),
      to: to.trim(),
      departureTime: departureTime || "",
      arrivalTime: arrivalTime || "",
      travelDate: travelDate || "",
      duration: Number(duration) || 0,
      distance: Number(distance) || 0,

      // PASSENGERS
      passengers: passengers.map((passenger) => ({
        name: passenger.name.trim(),
        age: Number(passenger.age),
        gender: passenger.gender,
      })),

      // PAYMENT
      farePerPassenger: Number(farePerPassenger) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || "UPI",
      paymentStatus: "Paid",

      // STATUS
      status: "Confirmed",
    });

    // ======================================
    // SAVE BOOKING
    // ======================================

    const savedBooking = await booking.save();

    console.log("BOOKING SAVED SUCCESSFULLY");
    console.log(savedBooking);

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: savedBooking,
      bookingId: savedBooking.pnr,
    });
  } catch (error) {
    console.error("BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to create booking",
    });
  }
});

// ==========================================
// GET USER BOOKINGS - PRESERVED
// ==========================================

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("FETCH BOOKINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch bookings",
    });
  }
});

// ==========================================
// CANCEL BOOKING - PRESERVED
// ==========================================

router.put("/:id/cancel", async (req, res) => {
  try {
    const booking = await Booking.findById(
      req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    return res.json({
      success: true,
      message: "Ticket cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel ticket",
    });
  }
});

module.exports = router;
