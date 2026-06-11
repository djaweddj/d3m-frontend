// src/pages/Signup.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";

import backImage from "../assets/back.jpg";

const LEVELS = [
  "1ère année",
  "2ème année",
  "3ème année",
  "4ème année",
  "5ème année",
];

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    Password: "",
    level: "",
    parentName: "",
    parentPhone: "",
    birthDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (
      !form.fullName ||
      !form.email ||
      !form.Password ||
      !form.level ||
      !form.parentName ||
      !form.parentPhone ||
      !form.birthDate
    ) {
      return "Please fill in all fields.";
    }
    if (form.Password.length < 6) {
      return "Password must be at least 6 characters.";
    }
    const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
    if (!phoneRegex.test(form.parentPhone)) {
      return "Enter a valid parent phone number.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/api/students/register`, {
        fullName: form.fullName,
        email: form.email,
        password: form.Password,
        level: form.level,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        birthDate: form.birthDate, // "YYYY-MM-DD" – matches LocalDate
      });
      navigate("/login");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Registration failed. Please try again.";
      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Error toast */}
      {error && (
        <div style={styles.alert}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={styles.alertClose}>
            ×
          </button>
        </div>
      )}

      {/* ── Left (form) ── */}
      <div style={styles.leftSide}>
        <div style={styles.formWrapper}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>📚</div>
            <p style={styles.logoSubtext}>Student Registration</p>
          </div>

          {/* Welcome */}
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle}>Get Started</h1>
            <p style={styles.welcomeSubtitle}>
              Fill in your details to create a student account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Full Name */}
            <Field label="Full Name">
              <InputRow icon={<PersonOutlinedIcon style={styles.icon} />}>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Email */}
            <Field label="Email Address">
              <InputRow icon={<MailOutlinedIcon style={styles.icon} />}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Password */}
            <Field label="Password">
              <InputRow icon={<LockOutlinedIcon style={styles.icon} />}>
                <input
                  name="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.Password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  style={styles.input}
                />
                <button
                  type="button"
                  style={styles.passwordToggle}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon style={styles.icon} />
                  ) : (
                    <VisibilityOutlinedIcon style={styles.icon} />
                  )}
                </button>
              </InputRow>
            </Field>

            {/* Level */}
            <Field label="Level">
              <InputRow icon={<SchoolOutlinedIcon style={styles.icon} />}>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingRight: "16px" }}
                >
                  <option value="" disabled>
                    Select your level
                  </option>
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </InputRow>
            </Field>

            {/* Birth Date */}
            <Field label="Date of Birth">
              <InputRow icon={<CakeOutlinedIcon style={styles.icon} />}>
                <input
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Parent Name */}
            <Field label="Parent / Guardian Name">
              <InputRow icon={<FamilyRestroomOutlinedIcon style={styles.icon} />}>
                <input
                  name="parentName"
                  type="text"
                  value={form.parentName}
                  onChange={handleChange}
                  placeholder="Parent full name"
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Parent Phone */}
            <Field label="Parent / Guardian Phone">
              <InputRow icon={<PhoneOutlinedIcon style={styles.icon} />}>
                <input
                  name="parentPhone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={handleChange}
                  placeholder="+213 6XX XXX XXX"
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Creating account…
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowForwardOutlinedIcon style={styles.buttonIcon} />
                </>
              )}
            </button>

            {/* Login link */}
            <div style={styles.loginContainer}>
              <p style={styles.loginText}>
                Already have an account?{" "}
                <Link to="/login" style={styles.loginLink}>
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right (decorative) ── */}
      <div style={styles.rightSide}>
        <div style={styles.rightSideOverlay}></div>
        <div style={styles.rightSideContent}>
          <div style={styles.rightSideInner}>
            <h2 style={styles.rightSideTitle}>Join Our Platform</h2>
            <p style={styles.rightSideDescription}>
              Create your account and start managing your school journey with a
              modern and secure dashboard.
            </p>
            <div style={styles.featuresList}>
              {[
                {
                  title: "Fast Registration",
                  desc: "Create your account in seconds with a simple signup process.",
                },
                {
                  title: "Secure Platform",
                  desc: "Your data is protected using modern security standards.",
                },
                {
                  title: "Smart Dashboard",
                  desc: "Access schedules, grades, and manage everything easily.",
                },
              ].map((f) => (
                <div key={f.title} style={styles.featureItem}>
                  <div style={styles.featureIcon}>✓</div>
                  <div>
                    <h3 style={styles.featureTitle}>{f.title}</h3>
                    <p style={styles.featureDescription}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small layout helpers ── */
function Field({ label, children }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function InputRow({ icon, children }) {
  return (
    <div style={styles.inputWrapper}>
      <div style={styles.inputIcon}>{icon}</div>
      {children}
    </div>
  );
}

/* ── Styles (unchanged palette) ── */
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
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
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
    overflowY: "auto",
  },

  formWrapper: {
    width: "100%",
    maxWidth: "420px",
    paddingTop: "40px",
    paddingBottom: "40px",
  },

  logoSection: { marginBottom: "32px" },

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

  logoSubtext: { color: "#64748b", fontSize: "15px" },

  welcomeSection: { marginBottom: "32px" },

  welcomeTitle: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "10px",
  },

  welcomeSubtitle: {
    color: "#64748b",
    lineHeight: "1.7",
    fontSize: "16px",
  },

  form: { display: "flex", flexDirection: "column", gap: "20px" },

  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },

  label: { fontSize: "14px", fontWeight: "600", color: "#334155" },

  inputWrapper: { position: "relative" },

  inputIcon: {
    position: "absolute",
    top: "50%",
    left: "14px",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  },

  icon: { color: "#94a3b8", fontSize: "20px" },

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
    appearance: "none",
    WebkitAppearance: "none",
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
    animation: "spin 1s linear infinite",
  },

  buttonIcon: { fontSize: "18px" },

  loginContainer: { textAlign: "center" },

  loginText: { color: "#64748b", fontSize: "14px" },

  loginLink: { color: "#2563eb", fontWeight: "700", textDecoration: "none" },

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
      linear-gradient(rgba(15,23,42,0.75), rgba(15,23,42,0.75)),
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

  rightSideInner: { maxWidth: "520px", color: "white" },

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

  featuresList: { display: "flex", flexDirection: "column", gap: "24px" },

  featureItem: { display: "flex", gap: "16px" },

  featureIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  featureTitle: { fontSize: "17px", fontWeight: "700", marginBottom: "4px" },

  featureDescription: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    lineHeight: "1.7",
  },
};

/* ── Global keyframes + focus styles ── */
const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
input:focus, select:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
}
button:hover { opacity: 0.95; }
`;
document.head.appendChild(styleSheet);