
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import BookCab from "./Pages/BookCab";
import Home from "./Pages/Home";
import Flights from "./Pages/Flights";
import Trains from "./Pages/Trains";
import Cabs from "./Pages/Cabs";
import Hotels from "./Pages/Hotels";

import Login from "./Pages/Login";
import Register from "./Pages/Register";

import Dashboard from "./Pages/Dashboard";
import Admin from "./Pages/Admin";
import ProtectedRoute from "./Pages/ProtectedRoute";

import AIPlanner from "./Pages/AIPlanner";
import BookTrain from "./Pages/BookTrain";
import BookFlight from "./Pages/BookFlight";
import Bookings from "./Pages/Bookings";

import HotelBooking from "./Pages/HotelBooking";
import HotelConfirmation from "./Pages/HotelConfirmation";

import ExploreIndia from "./Pages/ExploreIndia";
import Profile from "./Pages/Profile";

import BudgetTracker from "./Pages/BudgetTracker";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/explore-india"
            element={<ExploreIndia />}
          />

          {/* Flights */}
          <Route path="/flights" element={<Flights />} />
          <Route path="/book-flight" element={<BookFlight />} />

          {/* Trains */}
          <Route path="/trains" element={<Trains />} />
          <Route path="/book-train" element={<BookTrain />} />

          {/* Cabs */}
          <Route path="/cabs" element={<Cabs />} />
          <Route path="/book-cab" element={<BookCab />} />

          {/* Hotels */}
          <Route path="/hotels" element={<Hotels />} />
          <Route
            path="/hotel-booking"
            element={<HotelBooking />}
          />
          <Route
            path="/hotel-confirmation/:bookingId"
            element={<HotelConfirmation />}
          />

          {/* Bookings */}
          <Route path="/bookings" element={<Bookings />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route path="/admin" element={<Admin />} />

          {/* AI Planner */}
          <Route path="/ai-planner" element={<AIPlanner />} />

          {/* Page not found */}
          <Route path="*" element={<ExploreIndia />} />

<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

<Route path="/profile" element={<Profile />} />

<Route path="/budget-tracker" element={<BudgetTracker />} />


        </Routes>

        
      </main>

      <Footer />
    </div>
  );
}

export default App;
