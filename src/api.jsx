// src/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // sends refreshToken cookie automatically
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-refresh when token expires
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // ── Don't retry refresh/login endpoints ──────────────
        const isAuthEndpoint = originalRequest.url.includes("/auth/");
        if (isAuthEndpoint) return Promise.reject(error);

        if (
            (error.response?.status === 401 || error.response?.status === 403) &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const res = await api.post("/auth/refresh");
                const newToken = res.data.accessToken;
                localStorage.setItem("accessToken", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch {
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default api;