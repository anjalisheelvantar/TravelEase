const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    airline: {
      type: String,
      required: true,
    },

    flightNumber: {
      type: String,
      required: true,
    },

    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    departureTime: {
      type: String,
      required: true,
    },

    arrivalTime: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    seatsAvailable: {
      type: Number,
      default: 0,
    },

    date: {
      type: String,
      required: true,
    },

    stops: {
      type: Number,
      default: 0,
    },

    classType: {
      type: String,
      default: "Economy",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Flight", flightSchema);