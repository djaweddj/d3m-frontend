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
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";
import backImage from "../assets/numeria_login_background.png";
import platformLogo from "../assets/num3 (2).png";
import { useLanguage } from "../context/LanguageContext";

// ── Brand palette ──
const PRIMARY = "#0F5A46";   // Deep Emerald
const SECONDARY = "#C8A24B"; // Royal Gold
const ACCENT = "#C53030";    // Algerian Red
const BG = "#FAFAF7";        // Warm Off White

function TextInput({ value, onChange, placeholder, type = "text", min, disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "9px 12px",
        borderRadius: 10,
        border: "1.5px solid #E2DFD5",
        fontSize: 13,
        color: "#1C2B27",
        fontFamily: "'Cairo',sans-serif",
        background: disabled ? "#F1EFE7" : "#FFFFFF",
        outline: "none",
        boxSizing: "border-box",
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={(e) => !disabled && (e.target.style.borderColor = PRIMARY)}
      onBlur={(e) => (e.target.style.borderColor = "#E2DFD5")}
    />
  );
}

export default function Signup() {
  const { t, dir } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    Password: "",
    parentName: "",
    parentPhone: "",
    birthDate: "",
  });
  const [level, setLevel] = useState("");
  const [customLevel, setCustomLevel] = useState("");

  // Reuses the shared study-level list from createModule so labels stay in sync
  // across the app and automatically follow the active language.
  const levelKeys = [
    "preparatory",
    "primary1",
    "primary2",
    "primary3",
    "primary4",
    "primary5",
    "middle1",
    "middle2",
    "middle3",
    "middle4",
    "secondary1",
    "secondary2",
    "secondary3",
    "other",
  ];
  const levels = levelKeys.map((key) => t(`createModule.levels.${key}`));
  const otherLevelLabel = t("createModule.levels.other");

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
      !level ||
      !form.parentName ||
      !form.parentPhone ||
      !form.birthDate
    ) {
      return t("signup.errors.fillAll");
    }
    if (form.Password.length < 6) {
      return t("signup.errors.passwordLength");
    }
    const phoneRegex = /^[0-9+\s\-()]{7,15}$/;
    if (!phoneRegex.test(form.parentPhone)) {
      return t("signup.errors.invalidPhone");
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
        level: level === otherLevelLabel ? customLevel : level,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        birthDate: form.birthDate, // "YYYY-MM-DD" – matches LocalDate
      });
      navigate("/login");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message || err?.response?.data || t("signup.errors.generic");
      setError(typeof serverMessage === "string" ? serverMessage : t("signup.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} dir={dir}>
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
            <p style={styles.logoSubtext}>{t("signup.logoSubtext")}</p>
          </div>

          {/* Welcome */}
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle}>{t("signup.title")}</h1>
            <p style={styles.welcomeSubtitle}>{t("signup.subtitle")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Full Name */}
            <Field label={t("signup.fullName")}>
              <InputRow icon={<PersonOutlinedIcon style={styles.icon} />}>
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder={t("signup.fullNamePlaceholder")}
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Email */}
            <Field label={t("signup.email")}>
              <InputRow icon={<MailOutlinedIcon style={styles.icon} />}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("signup.emailPlaceholder")}
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Password */}
            <Field label={t("signup.password")}>
              <InputRow icon={<LockOutlinedIcon style={styles.icon} />}>
                <input
                  name="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.Password}
                  onChange={handleChange}
                  placeholder={t("signup.passwordPlaceholder")}
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
            <Field label={t("signup.level")}>
              <select
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  if (e.target.value !== otherLevelLabel) {
                    setCustomLevel("");
                  }
                }}
                style={styles.input}
              >
                <option value="">{t("signup.selectLevel")}</option>
                {levels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {level === otherLevelLabel && (
                <div style={{ marginTop: 10 }}>
                  <TextInput
                    value={customLevel}
                    onChange={setCustomLevel}
                    placeholder={t("signup.customLevelPlaceholder")}
                  />
                </div>
              )}
            </Field>

            {/* Birth Date */}
            <Field label={t("signup.birthDate")}>
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
            <Field label={t("signup.parentName")}>
              <InputRow icon={<FamilyRestroomOutlinedIcon style={styles.icon} />}>
                <input
                  name="parentName"
                  type="text"
                  value={form.parentName}
                  onChange={handleChange}
                  placeholder={t("signup.parentNamePlaceholder")}
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Parent Phone */}
            <Field label={t("signup.parentPhone")}>
              <InputRow icon={<PhoneOutlinedIcon style={styles.icon} />}>
                <input
                  name="parentPhone"
                  type="tel"
                  value={form.parentPhone}
                  onChange={handleChange}
                  placeholder={t("signup.parentPhonePlaceholder")}
                  style={styles.input}
                />
              </InputRow>
            </Field>

            {/* Submit */}
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {t("signup.submitting")}
                </>
              ) : (
                <>
                  {t("signup.submit")}
                  <ArrowForwardOutlinedIcon style={styles.buttonIcon} />
                </>
              )}
            </button>

            {/* Login link */}
            <div style={styles.loginContainer}>
              <p style={styles.loginText}>
                {t("signup.haveAccount")}{" "}
                <Link to="/login" style={styles.loginLink}>
                  {t("signup.signIn")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* ── Right (decorative) ── */}
      <div style={styles.rightSide}>
        <div style={styles.rightSideOverlay}></div>

        <Link to="/" className="home-btn" style={styles.homeButton} aria-label="Home">
          <img src={platformLogo} alt="" style={styles.homeLogo} />
        </Link>

        <div style={styles.rightSideContent}>
          <div style={styles.rightSideInner}>
            <h2 style={styles.rightSideTitle}>{t("signup.rightTitle")}</h2>
            <p style={styles.rightSideDescription}>{t("signup.rightDescription")}</p>
            <div style={styles.featuresList}>
              {t("signup.features").map((f) => (
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

/* ── Styles (rebranded palette, tightened + higher-contrast) ── */
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    backgroundColor: BG,
    overflow: "hidden",
  },

  alert: {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "#FBE4E4",
    color: "#7A1F1F",
    padding: "12px 18px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    zIndex: 1000,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: `1px solid ${ACCENT}33`,
  },

  alertClose: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#7A1F1F",
  },

  leftSide: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 40px",
    backgroundColor: "#FFFFFF",
    overflowY: "auto",
  },

  formWrapper: {
    width: "100%",
    maxWidth: "420px",
    paddingTop: "12px",
    paddingBottom: "12px",
  },

  logoSection: { marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" },

  logoCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "14px",
    backgroundColor: PRIMARY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    color: "white",
    flexShrink: 0,
  },

  logoSubtext: { color: "#5B6B66", fontSize: "14px", margin: 0 },

  welcomeSection: { marginBottom: "18px" },

  welcomeTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#132420",
    marginBottom: "4px",
  },

  welcomeSubtitle: {
    color: "#5B6B66",
    lineHeight: "1.5",
    fontSize: "14px",
  },

  form: { display: "flex", flexDirection: "column", gap: "13px" },

  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },

  label: { fontSize: "13px", fontWeight: "600", color: "#334740" },

  inputWrapper: { position: "relative" },

  inputIcon: {
    position: "absolute",
    top: "50%",
    left: "14px",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 1,
  },

  icon: { color: "#8FA39C", fontSize: "19px" },

  input: {
    width: "100%",
    height: "44px",
    padding: "0 44px",
    border: "1px solid #E2DFD5",
    borderRadius: "12px",
    fontSize: "14px",
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
    height: "46px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: PRIMARY,
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    marginTop: "4px",
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

  loginContainer: { textAlign: "center", marginTop: "2px" },

  loginText: { color: "#5B6B66", fontSize: "13px" },

  loginLink: { color: PRIMARY, fontWeight: "700", textDecoration: "none" },

  rightSide: {
    flex: 1,
    position: "relative",
    display: "flex",
    overflow: "hidden",
    backgroundColor: PRIMARY,
  },

  rightSideOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(15,45,37,0.86), rgba(15,45,37,0.86)),
      url(${backImage})
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  homeButton: {
    position: "absolute",
    top: "22px",
    insetInlineEnd: "22px",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "105px",
    height: "105px",
    borderRadius: "24px",
    backgroundColor: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.28)",
    backdropFilter: "blur(6px)",
    textDecoration: "none",
    boxShadow: `0 0 0 4px ${SECONDARY}1F, 0 4px 14px rgba(0,0,0,0.25)`,
  },

  homeLogo: {
    width: "105px",
    height: "105px",
    objectFit: "contain",
    borderRadius: "6px",
  },

  rightSideContent: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    padding: "40px 56px",
    width: "100%",
  },

  rightSideInner: { maxWidth: "520px", color: "white" },

  rightSideTitle: {
    fontSize: "34px",
    fontWeight: "800",
    lineHeight: "1.15",
    marginBottom: "14px",
    color: "#FFFFFF",
  },

  rightSideDescription: {
    fontSize: "15px",
    lineHeight: "1.65",
    color: "rgba(255,255,255,0.85)",
    marginBottom: "26px",
  },

  featuresList: { display: "flex", flexDirection: "column", gap: "16px" },

  featureItem: { display: "flex", gap: "14px", alignItems: "flex-start" },

  // "Bloom" treatment: brighter gold, near-black bold glyph with a soft glow
  // so the checkmark reads clearly against the dark green background.
  featureIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: SECONDARY,
    color: "#0B140F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontWeight: "900",
    fontSize: "14px",
    boxShadow: `0 0 0 4px ${SECONDARY}26, 0 0 14px ${SECONDARY}80`,
  },

  featureTitle: { fontSize: "16px", fontWeight: "700", marginBottom: "3px", color: "#FFFFFF" },

  featureDescription: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.6",
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
  border-color: ${PRIMARY} !important;
  box-shadow: 0 0 0 4px ${PRIMARY}1A;
}
button:hover { opacity: 0.95; }
.home-btn:hover { background-color: rgba(255,255,255,0.22) !important; transform: translateY(-1px); }
`;
document.head.appendChild(styleSheet);