
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const flightRoutes = require("./routes/flightRoutes");
const hotelRoutes = require("./routes/hotelRoutes");
const hotelBookingRoutes = require("./routes/hotelBookingRoutes");
const trainRoutes = require("./routes/trainRoutes");
const cabRoutes = require("./routes/cabRoutes");
const aiRoutes = require("./routes/aiRoutes");
const travelEstimateRoutes = require("./routes/travelEstimateRoutes");
app.use("/api/travel-estimate", travelEstimateRoutes);

const flightPriceRoutes = require("./routes/flightPriceRoutes");
app.use("/api/flight-prices", flightPriceRoutes);

const hotelbedsRoutes = require("./routes/hotelbedsRoutes");
app.use("/api/hotelbeds", hotelbedsRoutes);

app.use("/api/cabs", cabRoutes);
app.use("/api/ai", aiRoutes);

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/hotel-bookings", hotelBookingRoutes);
app.use("/api/trains", trainRoutes);
const budgetRoutes = require("./routes/budgetRoutes");
app.use("/api/budget", budgetRoutes);
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));

// Test route
app.get("/", (req, res) => {
  res.send("TravelEase Backend is Running 🚀");
});

// Database + server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully ✅");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} 🚀`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });
