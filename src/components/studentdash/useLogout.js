import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";

export default function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth() || {};
  return () => {
    if (typeof logout === "function") logout();
    navigate("/");
  };
}
