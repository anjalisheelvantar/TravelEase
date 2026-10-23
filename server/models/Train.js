const mongoose = require("mongoose");

const trainSchema = new mongoose.Schema(
  {
    trainNumber: {
      type: String,
      required: true
    },

    trainName: {
      type: String,
      required: true
    },

    from: {
      type: String,
      required: true
    },

    to: {
      type: String,
      required: true
    },

    departureTime: {
      type: String,
      required: true
    },

    arrivalTime: {
      type: String,
      required: true
    },

    duration: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    availableSeats: {
      type: Number,
      default: 0
    },

    classType: {
      type: String,
      default: "Sleeper"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Train", trainSchema);