// src/pages/Login.jsx

import { useState,useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

import backImage from "../assets/back.jpg";
import { useAuth } from "../context/authContext";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");



  const [error, setError] = useState("");

  const navigate = useNavigate();
  const {login,user,loading}=useAuth();

useEffect(() => {
   console.log("🔥 useEffect fired, user:", user);
  if (user?.role === "SCHOOL_ADMIN") {
    navigate("/dashboard");
  } else if (user?.role === "STUDENT") {
    navigate("/studentdashboard");
  }else if(user?.role === "TEACHER"){
        navigate("/teachers");
  }
}, [user, navigate]);

    const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await login(email, password);
     console.log("user :", user);
  } catch (err) {
     setError("login failed email or password are incorrect");
  }
};

  return (
    <div style={styles.container}>
      {/* Alert */}
      {error && (
        <div style={styles.alert}>
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            style={styles.alertClose}
          >
            ×
          </button>
        </div>
      )}

      {/* Left Side */}
      <div style={styles.leftSide}>
        <div style={styles.formWrapper}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>
              📚
            </div>

            <p style={styles.logoSubtext}>
              Dashboard Login
            </p>
          </div>

          {/* Welcome */}
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle}>
              Welcome back
            </h1>

            <p style={styles.welcomeSubtitle}>
              Please enter your credentials
              to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            {/* Email */}
            <div style={styles.inputGroup}>
              <label
                htmlFor="email"
                style={styles.label}
              >
                Email Address
              </label>

              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <MailOutlinedIcon
                    style={styles.icon}
                  />
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label
                htmlFor="password"
                style={styles.label}
              >
                Password
              </label>

              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <LockOutlinedIcon
                    style={styles.icon}
                  />
                </div>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter your password"
                  style={styles.input}
                />

                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon
                      style={styles.icon}
                    />
                  ) : (
                    <VisibilityOutlinedIcon
                      style={styles.icon}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowForwardOutlinedIcon
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </button>

            {/* Signup */}
            <div style={styles.signupContainer}>
              <p style={styles.signupText}>
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  style={styles.signupLink}
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side */}
      <div style={styles.rightSide}>
        <div style={styles.rightSideOverlay}></div>

        <div style={styles.rightSideContent}>
          <div style={styles.rightSideInner}>
            <h2 style={styles.rightSideTitle}>
              Manage Your Dashboard
            </h2>

            <p
              style={
                styles.rightSideDescription
              }
            >
              Access analytics, manage your
              content, and monitor your
              platform from one place.
            </p>

            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ✓
                </div>

                <div>
                  <h3
                    style={
                      styles.featureTitle
                    }
                  >
                    Real-time Analytics
                  </h3>

                  <p
                    style={
                      styles.featureDescription
                    }
                  >
                    Monitor activity and
                    performance instantly.
                  </p>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ✓
                </div>

                <div>
                  <h3
                    style={
                      styles.featureTitle
                    }
                  >
                    Easy Management
                  </h3>

                  <p
                    style={
                      styles.featureDescription
                    }
                  >
                    Organize categories and
                    dashboard data easily.
                  </p>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  ✓
                </div>

                <div>
                  <h3
                    style={
                      styles.featureTitle
                    }
                  >
                    Secure Access
                  </h3>

                  <p
                    style={
                      styles.featureDescription
                    }
                  >
                    Your data is protected and
                    encrypted securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    backgroundColor: "#fafafa",
  },

  alert: {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "12px 18px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 1000,
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.08)",
  },

  alertClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#991b1b",
  },

  leftSide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    backgroundColor: "#ffffff",
  },

  formWrapper: {
    width: "100%",
    maxWidth: "420px",
  },

  logoSection: {
    marginBottom: "40px",
  },

  logoCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "18px",
    backgroundColor: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    marginBottom: "14px",
    color: "white",
  },

  logoSubtext: {
    color: "#64748b",
    fontSize: "15px",
  },

  welcomeSection: {
    marginBottom: "36px",
  },

  welcomeTitle: {
    fontSize: "40px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "10px",
  },

  welcomeSubtitle: {
    color: "#64748b",
    lineHeight: "1.7",
    fontSize: "16px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },

  inputWrapper: {
    position: "relative",
  },

  inputIcon: {
    position: "absolute",
    top: "50%",
    left: "14px",
    transform: "translateY(-50%)",
  },

  icon: {
    color: "#94a3b8",
    fontSize: "20px",
  },

  input: {
    width: "100%",
    height: "52px",
    padding: "0 44px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    fontSize: "15px",
    backgroundColor: "#fff",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },

  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: "14px",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
  },

  submitButton: {
    width: "100%",
    height: "52px",
    border: "none",
    borderRadius: "14px",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
  },

  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid white",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation:
      "spin 1s linear infinite",
  },

  buttonIcon: {
    fontSize: "18px",
  },

  signupContainer: {
    textAlign: "center",
  },

  signupText: {
    color: "#64748b",
    fontSize: "14px",
  },

  signupLink: {
    color: "#2563eb",
    fontWeight: "700",
    textDecoration: "none",
  },

  rightSide: {
    flex: 1,
    position: "relative",
    display: "flex",
    overflow: "hidden",
    backgroundColor: "#0f172a",
  },

  rightSideOverlay: {
    position: "absolute",
    inset: 0,

    backgroundImage: `
      linear-gradient(
        rgba(15,23,42,0.75),
        rgba(15,23,42,0.75)
      ),
      url(${backImage})
    `,

    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  rightSideContent: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    padding: "64px",
  },

  rightSideInner: {
    maxWidth: "520px",
    color: "white",
  },

  rightSideTitle: {
    fontSize: "48px",
    fontWeight: "800",
    lineHeight: "1.1",
    marginBottom: "24px",
  },

  rightSideDescription: {
    fontSize: "18px",
    lineHeight: "1.8",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "40px",
  },

  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  featureItem: {
    display: "flex",
    gap: "16px",
  },

  featureIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor:
      "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  featureTitle: {
    fontSize: "17px",
    fontWeight: "700",
    marginBottom: "4px",
  },

  featureDescription: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    lineHeight: "1.7",
  },
};

const styleSheet =
  document.createElement("style");

styleSheet.textContent = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

input:focus {
  border-color: #2563eb !important;

  box-shadow:
    0 0 0 4px rgba(37,99,235,0.1);
}

button:hover {
  opacity: 0.95;
}

@media (max-width: 1024px) {
  .right-side {
    display: none;
  }
}
`;

document.head.appendChild(styleSheet);