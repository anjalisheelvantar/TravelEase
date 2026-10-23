const express = require("express");
const mongoose = require("mongoose");
const Budget = require("../models/Budget");

const router = express.Router();

const categories = [
  "Transport",
  "Hotel",
  "Food",
  "Activities",
  "Shopping",
  "Other",
];

async function getOrCreateBudget(userId) {
  let budget = await Budget.findOne({ userId });

  if (!budget) {
    budget = await Budget.create({
      userId,
      budget: 0,
      expenses: [],
    });
  }

  return budget;
}

// Get budget and expenses
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const budget = await getOrCreateBudget(userId);
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Could not load budget" });
  }
});

// Update total budget
router.put("/:userId/amount", async (req, res) => {
  try {
    const { userId } = req.params;
    const amount = Number(req.body.budget);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Enter a valid budget" });
    }

    const budget = await getOrCreateBudget(userId);
    budget.budget = amount;
    await budget.save();

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Could not update budget" });
  }
});

// Add an expense
router.post("/:userId/expenses", async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, category, amount, date } = req.body;
    const numericAmount = Number(amount);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({ message: "Enter a valid expense name" });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid expense amount" });
    }

    if (!categories.includes(category)) {
      return res.status(400).json({ message: "Invalid expense category" });
    }

    const budget = await getOrCreateBudget(userId);

    budget.expenses.push({
      title: title.trim(),
      category,
      amount: numericAmount,
      ...(date ? { date: new Date(date) } : {}),
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: "Could not add expense" });
  }
});

// Delete an expense
router.delete("/:userId/expenses/:expenseId", async (req, res) => {
  try {
    const { userId, expenseId } = req.params;

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(expenseId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const budget = await Budget.findOne({ userId });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const expense = budget.expenses.id(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    expense.deleteOne();
    await budget.save();

    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Could not delete expense" });
  }
});

module.exports = router;