const mongoose = require("mongoose");

// ==========================================
// PASSENGER SCHEMA
// ==========================================

const passengerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// BOOKING SCHEMA
// ==========================================

const bookingSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // BOOKING TYPE
    // ==========================================

   bookingType: {
  type: String,
  enum: ["Train", "Flight", "Cab"],
  default: "Train",
},

    // ==========================================
    // PNR
    // ==========================================

    pnr: {
      type: String,
      required: true,
      unique: true,
    },

    // ==========================================
    // TRAIN DETAILS
    // ==========================================

    trainNumber: {
      type: String,
      default: "",
    },

    trainName: {
      type: String,
      default: "",
    },

    trainType: {
      type: String,
      default: "",
    },

    // ==========================================
// FLIGHT DETAILS
// ==========================================

airline: {
  type: String,
  default: ""
},

airlineCode: {
  type: String,
  default: ""
},

flightNumber: {
  type: String,
  default: ""
},

cabinClass: {
  type: String,
  default: "Economy"
},

stops: {
  type: Number,
  default: 0
},

// ==========================================
// CAB DETAILS
// ==========================================

cabType: {
  type: String,
  enum: ["", "Bike", "Auto", "Mini", "Sedan", "SUV"],
  default: "",
},

pickupTime: {
  type: String,
  default: "",
},

estimatedDistance: {
  type: Number,
  default: 0,
},

    // ==========================================
    // JOURNEY DETAILS
    // ==========================================

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
      default: "",
    },

    arrivalTime: {
      type: String,
      default: "",
    },

    travelDate: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    distance: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // PASSENGERS
    // ==========================================

    passengers: {
      type: [passengerSchema],
      required: true,

      validate: {
        validator: function (value) {
          return value && value.length > 0;
        },

        message: "At least one passenger is required",
      },
    },

    // ==========================================
    // PAYMENT
    // ==========================================

    farePerPassenger: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "Net Banking"],
      default: "UPI",
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Paid",
    },

    // ==========================================
    // BOOKING STATUS
    // ==========================================

    status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);