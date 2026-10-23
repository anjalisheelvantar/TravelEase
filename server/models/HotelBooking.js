
const mongoose = require("mongoose");

const hotelBookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    hotel: {
      id: { type: String, default: "" },
      name: { type: String, required: true, trim: true },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    guest: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    adults: { type: Number, required: true, min: 1 },
    rooms: { type: Number, required: true, min: 1 },

    nights: { type: Number, required: true, min: 1 },

    status: {
      type: String,
      enum: ["CONFIRMED"],
      default: "CONFIRMED",
    },

    paymentStatus: {
      type: String,
      enum: ["NOT_REQUIRED_DEMO"],
      default: "NOT_REQUIRED_DEMO",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HotelBooking", hotelBookingSchema);
