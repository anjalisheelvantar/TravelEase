
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const savedUser = localStorage.getItem("user");

  let isLoggedIn = false;

  try {
    const user = JSON.parse(savedUser || "null");
    isLoggedIn = Boolean(user && (user._id || user.id || user.userId));
  } catch {
    isLoggedIn = false;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
