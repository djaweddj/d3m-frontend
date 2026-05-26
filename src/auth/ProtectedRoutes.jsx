
import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const { admin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!admin) return <Navigate to="/login" />;

  if (role && admin.role !== role) {
    return <Navigate to="/login" />; // or unauthorized page
  }

  return children;
}