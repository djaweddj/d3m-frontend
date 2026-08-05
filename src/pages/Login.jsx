// src/pages/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

import backImage from "../assets/numeria_login_background.png";
import platformLogo from "../assets/num3 (2).png";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";

// ── Brand palette ──
const PRIMARY = "#0F5A46";   // Deep Emerald
const SECONDARY = "#C8A24B"; // Royal Gold
const ACCENT = "#C53030";    // Algerian Red
const BG = "#FAFAF7";        // Warm Off White

export default function Login() {
  const { t, dir } = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (user?.role === "SCHOOL_ADMIN") {
      navigate("/dashboard");
    } else if (user?.role === "STUDENT") {
      navigate("/studentdashboard");
    } else if (user?.role === "TEACHER") {
      navigate("/teacherDashboard");
    } else if (user?.role === "SUPER_ADMIN") {
      navigate("/superadmindashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 429) {
        const retryAfter =
          err?.response?.data?.retryAfter ??
          parseInt(err?.response?.headers?.["retry-after"]) ??
          60;

        setError("too_many");
        startCooldown(retryAfter);
      } else if (status === 403 || status === 401) {
        setError(t("login.errors.invalidCredentials"));
      } else {
        setError(t("login.errors.connectionError"));
      }
    }
  };

  return (
    <div style={styles.container} className="login-container" dir={dir}>
      {/* Alert */}
      {error && (
        <div style={styles.alert} className="login-alert">
          <span>
            {error === "too_many" ? (
              <>
                {t("login.errors.tooManyPrefix")}{" "}
                {cooldown > 0 && (
                  <strong>{t("login.errors.waitBeforeRetry", { seconds: cooldown })}</strong>
                )}
              </>
            ) : (
              error
            )}
          </span>
          {cooldown === 0 && (
            <button onClick={() => setError("")} style={styles.alertClose}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Left Side */}
      <div style={styles.leftSide} className="login-left">
        <div style={styles.formWrapper}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>📚</div>
            <p style={styles.logoSubtext}>{t("login.logoSubtext")}</p>
          </div>

          {/* Welcome */}
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle} className="login-welcome-title">
              {t("login.welcomeTitle")}
            </h1>
            <p style={styles.welcomeSubtitle}>{t("login.welcomeSubtitle")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Email */}
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>
                {t("login.emailLabel")}
              </label>

              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <MailOutlinedIcon style={styles.icon} />
                </div>

                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  style={styles.input}
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>
                {t("login.passwordLabel")}
              </label>

              <div style={styles.inputWrapper}>
                <div style={styles.inputIcon}>
                  <LockOutlinedIcon style={styles.icon} />
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  style={styles.input}
                  className="login-input"
                />

                <button
                  type="button"
                  style={styles.passwordToggle}
                  className="login-visibility-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <VisibilityOffOutlinedIcon style={styles.icon} />
                  ) : (
                    <VisibilityOutlinedIcon style={styles.icon} />
                  )}
                </button>
              </div>
            </div>

            <Link to="/forgot-password" style={styles.forgotPasswordLink}>
              {t("login.forgotPassword")}
            </Link>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              style={{
                ...styles.submitButton,
                backgroundColor: cooldown > 0 ? "#A9B5B1" : PRIMARY,
                cursor: cooldown > 0 ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  {t("login.signingIn")}
                </>
              ) : cooldown > 0 ? (
                t("login.waitSeconds", { seconds: cooldown })
              ) : (
                <>
                  {t("login.signIn")}
                  <ArrowForwardOutlinedIcon style={styles.buttonIcon} />
                </>
              )}
            </button>

            {/* Signup */}
            <div style={styles.signupContainer}>
              <p style={styles.signupText}>
                {t("login.noAccount")}{" "}
                <Link to="/signup" style={styles.signupLink}>
                  {t("login.signUp")}
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side */}
      <div style={styles.rightSide} className="right-side">
        <div style={styles.rightSideOverlay}></div>

        <Link to="/" className="home-btn" style={styles.homeButton} aria-label="Home">
          <img src={platformLogo} alt="" style={styles.homeLogo} />
        </Link>

        <div style={styles.rightSideContent}>
          <div style={styles.rightSideInner}>
            <h2 style={styles.rightSideTitle}>{t("login.rightTitle")}</h2>

            <p style={styles.rightSideDescription}>{t("login.rightDescription")}</p>

            <div style={styles.featuresList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>✓</div>
                <div>
                  <h3 style={styles.featureTitle}>{t("login.features.analytics.title")}</h3>
                  <p style={styles.featureDescription}>{t("login.features.analytics.desc")}</p>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>✓</div>
                <div>
                  <h3 style={styles.featureTitle}>{t("login.features.management.title")}</h3>
                  <p style={styles.featureDescription}>{t("login.features.management.desc")}</p>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>✓</div>
                <div>
                  <h3 style={styles.featureTitle}>{t("login.features.security.title")}</h3>
                  <p style={styles.featureDescription}>{t("login.features.security.desc")}</p>
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
    backgroundColor: BG,
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
    backgroundColor: "#ffffff",
    overflowY: "auto",
  },

  formWrapper: {
    width: "100%",
    maxWidth: "420px",
  },

  logoSection: {
    marginBottom: "18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

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

  logoSubtext: {
    color: "#5B6B66",
    fontSize: "14px",
    margin: 0,
  },

  welcomeSection: {
    marginBottom: "20px",
  },

  welcomeTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#132420",
    marginBottom: "5px",
  },

  welcomeSubtitle: {
    color: "#5B6B66",
    lineHeight: "1.5",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334740",
  },

  inputWrapper: {
    position: "relative",
  },

  inputIcon: {
    position: "absolute",
    top: "50%",
    insetInlineStart: "14px",
    transform: "translateY(-50%)",
  },

  icon: {
    color: "#8FA39C",
    fontSize: "19px",
  },

  input: {
    width: "100%",
    height: "48px",
    padding: "0 44px",
    border: "1px solid #E2DFD5",
    borderRadius: "12px",
    fontSize: "16px", // 16px prevents iOS Safari auto-zoom on focus
    backgroundColor: "#fff",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
  },

  passwordToggle: {
    position: "absolute",
    top: "50%",
    insetInlineEnd: "10px",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  forgotPasswordLink: {
    color: PRIMARY,
    textDecoration: "underline",
    fontSize: "13px",
    fontWeight: "600",
    alignSelf: "flex-start",
  },

  submitButton: {
    width: "100%",
    height: "48px",
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
  },

  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid white",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  buttonIcon: {
    fontSize: "18px",
  },

  signupContainer: {
    textAlign: "center",
  },

  signupText: {
    color: "#5B6B66",
    fontSize: "13px",
  },

  signupLink: {
    color: PRIMARY,
    fontWeight: "700",
    textDecoration: "none",
  },

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
      linear-gradient(
        rgba(15,45,37,0.86),
        rgba(15,45,37,0.86)
      ),
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

  rightSideInner: {
    maxWidth: "520px",
    color: "white",
  },

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

  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  featureItem: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  // "Bloom" treatment: brighter gold ring, near-black bold glyph with a soft
  // glow so the checkmark reads clearly against the dark green background.
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

  featureTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "3px",
    color: "#FFFFFF",
  },

  featureDescription: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    lineHeight: "1.6",
  },
};

const styleSheet = document.createElement("style");

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
  border-color: ${PRIMARY} !important;

  box-shadow:
    0 0 0 4px ${PRIMARY}1A;
}

button:hover {
  opacity: 0.95;
}

.home-btn:hover {
  background-color: rgba(255,255,255,0.22) !important;
  transform: translateY(-1px);
}

/* ── Responsive: below this width the promotional right panel
   (and the home button that lives inside it) is dropped, and the
   login form becomes the full-width, single-column experience. ── */
@media (max-width: 1024px) {
  .right-side {
    display: none !important;
  }
}

/* ── Tablet / large phone: tighten the form's outer padding
   now that it owns the full viewport width. ── */
@media (max-width: 640px) {
  .login-left {
    padding: 24px 20px !important;
    align-items: flex-start !important;
  }

  .login-welcome-title {
    font-size: 24px !important;
  }

  .login-alert {
    top: 12px !important;
    left: 12px !important;
    right: 12px !important;
    width: auto !important;
    align-items: flex-start !important;
  }
}

/* ── Small phone: reclaim a bit more space and shrink type
   further so the form never requires horizontal scrolling. ── */
@media (max-width: 380px) {
  .login-left {
    padding: 18px 14px !important;
  }

  .login-welcome-title {
    font-size: 21px !important;
  }
}

/* ── Comfortable tap targets on touch devices. ── */
@media (hover: none) and (pointer: coarse) {
  .login-visibility-toggle {
    width: 40px;
    height: 40px;
  }
}
`;

document.head.appendChild(styleSheet);