const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      "Transport",
      "Hotel",
      "Food",
      "Activities",
      "Shopping",
      "Other",
    ],
    default: "Other",
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    expenses: [expenseSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Budget", budgetSchema);