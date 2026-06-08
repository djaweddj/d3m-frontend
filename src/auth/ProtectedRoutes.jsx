
import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to="/login" />; // or unauthorized page
  }

  return children;
}