
// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import api from "../api";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
   const API_URL = import.meta.env.VITE_API_URL;
    // ── fetch current user info ──────────────────────────────────────
    const fetchMe = async () => {
        try {
            const res = await api.get(`http://localhost:8081/auth/me`);
            setUser(res.data);
            setIsAuthenticated(true);
              return res.data;
        } catch {
            setUser(null);
            setIsAuthenticated(false);
             throw err;
        }
      
    };

    // ── login ────────────────────────────────────────────────────────
    const login = async (email, password) => {
        // throws on failure so the login page can catch and show error
        const res = await api.post(`http://localhost:8081/auth/login`, { email, password });
        localStorage.setItem("accessToken", res.data.AccessToken);
       return await fetchMe();
    };

    // ── logout ───────────────────────────────────────────────────────
    const logout = async () => {
        try {
            await api.post(`${API_URL}/auth/logout`);
        } catch {
         console.error("logout error ")
        } finally {
            localStorage.removeItem("accessToken");
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    // ── on app startup, try to restore session via refresh cookie ────

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem("accessToken");

            // ── No token = never logged in, stop immediately ──
            if (!token) {
                setLoading(false);
                return;
            }

            // ── Has token → try to fetch user ─────────────────
            try {
                await fetchMe();
            } catch {
                // Access token expired → try one silent refresh
                try {
                    const res = await api.post("/auth/refresh");
                    localStorage.setItem("accessToken", res.data.accessToken);
                    await fetchMe();
                } catch {
                    // Refresh also failed → full logout
                    localStorage.removeItem("accessToken");
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }

            setLoading(false);
        };

        restoreSession();
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated, login, logout, loading }}
        >
            {children}
        </AuthContext.Provider>
    );

}