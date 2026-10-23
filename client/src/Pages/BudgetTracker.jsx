
import { useEffect, useMemo, useState } from "react";
import "./BudgetTracker.css";

const CATEGORIES = [
  "Transport",
  "Hotel",
  "Food",
  "Activities",
  "Shopping",
  "Other",
];

const STORAGE_KEY = "travelease_budget_tracker";
const API_URL = "http://localhost:5000/api";

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BudgetTracker() {
  const [budget, setBudget] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY))?.budget ?? 10000;
    } catch {
      return 10000;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY))?.expenses ?? [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Transport",
    date: new Date().toISOString().slice(0, 10),
  });

  const [budgetInput, setBudgetInput] = useState(String(budget));
  const [message, setMessage] = useState("");

  const [tripForm, setTripForm] = useState({
    origin: "",
    destination: "",
    days: "3",
    travelers: "1",
    style: "budget",
  });

  const [estimate, setEstimate] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState("");

  
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const [flightForm, setFlightForm] = useState({
  origin: "BLR",
  destination: "GOI",
  departureDate: tomorrow.toISOString().slice(0, 10),
  passengers: "1",
});

const [flightResults, setFlightResults] = useState(null);
const [flightLoading, setFlightLoading] = useState(false);
const [flightError, setFlightError] = useState("");


  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ budget, expenses })
    );
  }, [budget, expenses]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const remaining = budget - totalSpent;
  const progress =
    budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const categoryTotals = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        total: expenses
          .filter((item) => item.category === category)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0),
      })).filter((item) => item.total > 0),
    [expenses]
  );

  function saveBudget(event) {
    event.preventDefault();
    const value = Number(budgetInput);

    if (!Number.isFinite(value) || value <= 0) {
      setMessage("Enter a valid budget greater than zero.");
      return;
    }

    setBudget(value);
    setMessage("Budget updated successfully.");
  }

  function addExpense(event) {
    event.preventDefault();
    const amount = Number(form.amount);

    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter an expense name and a valid amount.");
      return;
    }

    setExpenses((previous) => [
      {
        id: createId(),
        title: form.title.trim(),
        amount,
        category: form.category,
        date: form.date,
      },
      ...previous,
    ]);

    setForm({
      title: "",
      amount: "",
      category: "Transport",
      date: new Date().toISOString().slice(0, 10),
    });

    setMessage("Expense added successfully.");
  }

  function deleteExpense(id) {
    setExpenses((previous) => previous.filter((item) => item.id !== id));
    setMessage("Expense deleted.");
  }

  async function estimateTrip(event) {
    event.preventDefault();
    setEstimating(true);
    setEstimate(null);
    setEstimateError("");

    try {
      const response = await fetch(`${API_URL}/travel-estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: tripForm.origin.trim(),
          destination: tripForm.destination.trim(),
          days: Number(tripForm.days),
          travelers: Number(tripForm.travelers),
          style: tripForm.style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not estimate this trip.");
      }

      setEstimate(data);
    } catch (error) {
      setEstimateError(
        error.message ||
          "Could not connect to TravelEase's backend. Check that your server is running."
      );
    } finally {
      setEstimating(false);
    }
  }

  
async function searchFlights(event) {
  event.preventDefault();
  setFlightLoading(true);
  setFlightResults(null);
  setFlightError("");

  try {
    const response = await fetch(`${API_URL}/flight-prices/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: flightForm.origin.trim().toUpperCase(),
        destination: flightForm.destination.trim().toUpperCase(),
        departureDate: flightForm.departureDate,
        passengers: Number(flightForm.passengers),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Flight search failed.");
    }

    setFlightResults(data);
  } catch (error) {
    setFlightError(
      error.message || "Could not connect to the flight-price service."
    );
  } finally {
    setFlightLoading(false);
  }
}

function addFlightToExpenses(offer) {
  if (offer.currency !== "INR") {
    setMessage(
      `This fare is in ${offer.currency}. It was not added because no currency conversion has been performed.`
    );
    return;
  }

  const amount = Number(offer.totalAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    setMessage("This flight offer does not have a valid price.");
    return;
  }

  setExpenses((previous) => [
    {
      id: createId(),
      title: `Flight ${flightForm.origin.toUpperCase()}–${flightForm.destination.toUpperCase()} · ${offer.airline}`,
      amount,
      category: "Transport",
      date: flightForm.departureDate,
    },
    ...previous,
  ]);

  setMessage("Flight offer added to expenses. Recheck the fare before booking.");
}


  function addEstimateToExpenses() {
    if (!estimate) return;

    const today = new Date().toISOString().slice(0, 10);

    const newExpenses = [
      ...estimate.items.map((item) => ({
        id: createId(),
        title: `${item.title} — ${estimate.destination}`,
        amount: item.amount,
        category: item.category,
        date: today,
      })),
      {
        id: createId(),
        title: `Trip contingency — ${estimate.destination}`,
        amount: estimate.contingency,
        category: "Other",
        date: today,
      },
    ];

    setExpenses((previous) => [...newExpenses, ...previous]);
    setMessage("Estimated trip costs added to your expense history.");
  }

  return (
    <main className="budget-page">
      <header className="budget-heading">
        <span className="budget-eyebrow">TRAVELEASE · SMART SPENDING</span>
        <h1>Travel Budget Tracker</h1>
        <p>
          Estimate your trip costs, plan your budget, and track every expense.
        </p>
      </header>

      <section className="budget-panel budget-estimator">
        <div className="budget-section-heading">
          <div>
            <h2>✦ Smart Travel Expense Estimator</h2>
            <p>
              Enter your starting city and destination to estimate your trip
              costs.
            </p>
          </div>
        </div>

        <form className="budget-estimate-form" onSubmit={estimateTrip}>
          <div className="budget-estimate-fields">
            <div>
              <label htmlFor="trip-origin">Starting city</label>
              <input
                id="trip-origin"
                value={tripForm.origin}
                onChange={(event) =>
                  setTripForm({ ...tripForm, origin: event.target.value })
                }
                placeholder="e.g. Bengaluru"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="trip-destination">Destination</label>
              <input
                id="trip-destination"
                value={tripForm.destination}
                onChange={(event) =>
                  setTripForm({
                    ...tripForm,
                    destination: event.target.value,
                  })
                }
                placeholder="e.g. Goa"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="trip-days">Trip duration (days)</label>
              <input
                id="trip-days"
                type="number"
                min="1"
                max="30"
                value={tripForm.days}
                onChange={(event) =>
                  setTripForm({ ...tripForm, days: event.target.value })
                }
                required
              />
            </div>

            <div>
              <label htmlFor="trip-travelers">Number of travellers</label>
              <input
                id="trip-travelers"
                type="number"
                min="1"
                max="20"
                value={tripForm.travelers}
                onChange={(event) =>
                  setTripForm({ ...tripForm, travelers: event.target.value })
                }
                required
              />
            </div>

            <div>
              <label htmlFor="trip-style">Travel style</label>
              <select
                id="trip-style"
                value={tripForm.style}
                onChange={(event) =>
                  setTripForm({ ...tripForm, style: event.target.value })
                }
              >
                <option value="budget">Budget-friendly</option>
                <option value="standard">Standard</option>
                <option value="comfort">Comfort</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="budget-button"
            disabled={estimating}
          >
            {estimating ? "Estimating trip..." : "✦ Estimate My Trip"}
          </button>
        </form>

        {estimateError && (
          <p className="budget-estimate-error" role="alert">
            {estimateError}
          </p>
        )}

        {estimate && (
          <div className="budget-estimate-results">
            <div className="budget-estimate-route">
              <div>
                <span>FROM</span>
                <strong>{estimate.origin}</strong>
              </div>
              <span className="budget-route-arrow">→</span>
              <div>
                <span>DESTINATION</span>
                <strong>{estimate.destination}</strong>
              </div>
            </div>

            <div className="budget-route-metrics">
              <div>
                <span>One-way road distance</span>
                <strong>{estimate.route.distanceKm.toLocaleString("en-IN")} km</strong>
              </div>
              <div>
                <span>Estimated driving time</span>
                <strong>{estimate.route.driveHoursOneWay} hours</strong>
              </div>
              <div>
                <span>Travellers</span>
                <strong>{estimate.travelers}</strong>
              </div>
            </div>

            <p className="budget-data-source">
              <span>Live route data</span> · Distance and driving time from
              Geoapify. These are road-route figures, not public transport
              schedules or ticket prices.
            </p>

            <h3>Estimated expense breakdown</h3>

            <div className="budget-estimate-list">
              {estimate.items.map((item, index) => (
                <div className="budget-estimate-row" key={`${item.title}-${index}`}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.category} · Planning estimate</span>
                  </div>
                  <strong>{formatINR(item.amount)}</strong>
                </div>
              ))}

              <div className="budget-estimate-row">
                <div>
                  <strong>Emergency / extra expenses</strong>
                  <span>10% contingency estimate</span>
                </div>
                <strong>{formatINR(estimate.contingency)}</strong>
              </div>
            </div>

            <div className="budget-estimate-total">
              <div>
                <span>Estimated trip total</span>
                <p>For {estimate.travelers} traveller(s), {estimate.days} day(s)</p>
              </div>
              <strong>{formatINR(estimate.total)}</strong>
            </div>

            <p className="budget-estimate-disclaimer">
              {estimate.estimateNotice}
            </p>

            <button
              type="button"
              className="budget-button"
              onClick={addEstimateToExpenses}
            >
              + Add estimated costs to expense history
            </button>
          </div>
        )}
      </section>

      <section className="budget-summary">
        <article className="budget-stat budget-stat-primary">
          <span>Total budget</span>
          <h2>{formatINR(budget)}</h2>
          <p>Your planned travel spending</p>
        </article>

        <article className="budget-stat">
          <span>Total spent</span>
          <h2>{formatINR(totalSpent)}</h2>
          <p>{expenses.length} expense{expenses.length === 1 ? "" : "s"} recorded</p>
        </article>

        <article className={`budget-stat ${remaining < 0 ? "over-budget" : ""}`}>
          <span>{remaining < 0 ? "Over budget" : "Remaining balance"}</span>
          <h2>{formatINR(Math.abs(remaining))}</h2>
          <p>{remaining < 0 ? "Review your spending" : "Available to spend"}</p>
        </article>
      </section>

      <section className="budget-panel budget-progress-panel">
        <div className="budget-section-heading">
          <div>
            <h2>Budget overview</h2>
            <p>Monitor how much of your budget you've used.</p>
          </div>
          <strong>{Math.round(progress)}%</strong>
        </div>

        <div
          className="budget-progress-track"
          role="progressbar"
          aria-label="Budget used"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className={`budget-progress-fill ${
              remaining < 0 ? "budget-progress-danger" : ""
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="budget-progress-labels">
          <span>Spent: {formatINR(totalSpent)}</span>
          <span>Budget: {formatINR(budget)}</span>
        </div>

        <form className="budget-set-form" onSubmit={saveBudget}>
          <label htmlFor="travel-budget">Set your travel budget (₹)</label>
          <div>
            <input
              id="travel-budget"
              type="number"
              min="1"
              step="1"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              required
            />
            <button type="submit" className="budget-button budget-button-secondary">
              Update budget
            </button>
          </div>
        </form>
      </section>

      <div className="budget-content-grid">
        <section className="budget-panel">
          <div className="budget-section-heading">
            <div>
              <h2>Add an expense</h2>
              <p>Record your actual travel spending.</p>
            </div>
            <span className="budget-icon">＋</span>
          </div>

          <form className="budget-expense-form" onSubmit={addExpense}>
            <label htmlFor="expense-title">Expense name</label>
            <input
              id="expense-title"
              type="text"
              placeholder="e.g. Hotel booking"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              maxLength={100}
              required
            />

            <label htmlFor="expense-amount">Amount (₹)</label>
            <input
              id="expense-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
              value={form.amount}
              onChange={(event) =>
                setForm({ ...form, amount: event.target.value })
              }
              required
            />

            <label htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label htmlFor="expense-date">Date</label>
            <input
              id="expense-date"
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
              required
            />

            <button type="submit" className="budget-button">
              + Add expense
            </button>
          </form>
        </section>

        <section className="budget-panel">
          <div className="budget-section-heading">
            <div>
              <h2>Spending breakdown</h2>
              <p>Your expenses by category.</p>
            </div>
          </div>

          {categoryTotals.length === 0 ? (
            <div className="budget-empty">
              <span>₹</span>
              <p>Your spending breakdown will appear here.</p>
              <small>Add your first expense to get started.</small>
            </div>
          ) : (
            <div className="budget-category-list">
              {categoryTotals.map(({ category, total }) => (
                <div className="budget-category" key={category}>
                  <div className="budget-category-info">
                    <span>{category}</span>
                    <strong>{formatINR(total)}</strong>
                  </div>
                  <div className="budget-category-track">
                    <div
                      className="budget-category-fill"
                      style={{
                        width: `${totalSpent > 0 ? (total / totalSpent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="budget-panel budget-history">
        <div className="budget-section-heading">
          <div>
            <h2>Recent expenses</h2>
            <p>Keep track of where your travel money goes.</p>
          </div>
          <span className="budget-expense-count">{expenses.length} records</span>
        </div>

        {expenses.length === 0 ? (
          <div className="budget-empty">
            <span>✦</span>
            <p>No expenses yet</p>
            <small>Your added expenses will appear here.</small>
          </div>
        ) : (
          <div className="budget-expense-list">
            {expenses.map((expense) => (
              <article className="budget-expense-row" key={expense.id}>
                <div className="budget-expense-symbol">₹</div>
                <div className="budget-expense-details">
                  <strong>{expense.title}</strong>
                  <span>{expense.category} · {expense.date}</span>
                </div>
                <strong className="budget-expense-amount">
                  {formatINR(expense.amount)}
                </strong>
                <button
                  type="button"
                  className="budget-delete-button"
                  onClick={() => deleteExpense(expense.id)}
                  aria-label={`Delete ${expense.title}`}
                  title="Delete expense"
                >
                  ×
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {message && (
        <div className="budget-message" role="status">
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
