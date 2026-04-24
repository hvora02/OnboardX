import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  // ❌ Not logged in → go back to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ✅ Logged in → allow access
  return children;
}
