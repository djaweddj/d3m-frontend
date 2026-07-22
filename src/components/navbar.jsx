import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogOut, Globe } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import "../Css/Navbar.css";

const LANGUAGES = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const dashboardPath = user?.role === "SCHOOL_ADMIN" ? "/Dashboard" : "/studentdashboard";

  const initials =
    user?.avatar ||
    user?.fullName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2);

  const closeMenu = () => setIsOpen(false);

  const goTo = (path) => {
    closeMenu();
    navigate(path);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang); // LanguageProvider already persists to localStorage + updates <html dir/lang>
    setLangMenuOpen(false);
  };

  const isLoggedIn = user?.role === "STUDENT" || user?.role === "SCHOOL_ADMIN";

  return (
    <header dir={dir} className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo" onClick={closeMenu}>
        <div className="navbar__logo-mark">
          <GraduationCap size={18} strokeWidth={2.4} />
        </div>
        <span className="navbar__logo-text">{t("navbar.platformName")}</span>
      </Link>

      {/* Desktop nav */}
      <nav className="navbar__nav navbar__nav--desktop">
        {isLoggedIn ? (
          <>
            <button className="nav-btn nav-btn--dashboard" onClick={() => navigate(dashboardPath)}>
              <LayoutDashboard size={14} />
              {t("navbar.dashboard")}
            </button>

            <div className="navbar__user" onClick={() => navigate(dashboardPath)}>
              <div className="navbar__avatar">{initials}</div>
              <span className="navbar__user-name">{user.fullName}</span>
            </div>

            <button
              className="nav-icon-btn"
              onClick={logout}
              title={t("navbar.logout")}
              aria-label={t("navbar.logout")}
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn nav-btn--ghost">{t("navbar.login")}</Link>
            <Link to="/signup" className="nav-btn nav-btn--solid">{t("navbar.register")}</Link>
          </>
        )}

        {/* Language switcher */}
        <div className="navbar__lang">
          <button
            className="nav-icon-btn"
            onClick={() => setLangMenuOpen((v) => !v)}
            aria-label={t("navbar.languageAria")}
            title={t("navbar.languageAria")}
          >
            <Globe size={14} />
          </button>
          {langMenuOpen && (
            <div className="navbar__lang-menu">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={`navbar__lang-option${language === l.code ? " is-active" : ""}`}
                  onClick={() => changeLanguage(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile hamburger */}
      <button
        className={`navbar__burger${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t("navbar.menuOpenAria")}
        aria-expanded={isOpen}
      >
        <span className="navbar__burger-line" />
        <span className="navbar__burger-line" />
        <span className="navbar__burger-line" />
      </button>

      {/* Mobile dropdown panel */}
      {isOpen && (
        <div className="navbar__mobile-panel">
          {isLoggedIn ? (
            <>
              <div className="navbar__mobile-user" onClick={() => goTo(dashboardPath)}>
                <div className="navbar__avatar">{initials}</div>
                <span className="navbar__user-name">{user.fullName}</span>
              </div>

              <button className="nav-btn nav-btn--dashboard" onClick={() => goTo(dashboardPath)}>
                <LayoutDashboard size={14} />
                {t("navbar.dashboard")}
              </button>

              <button
                className="nav-btn nav-btn--ghost"
                onClick={() => { closeMenu(); logout(); }}
              >
                <LogOut size={14} />
                {t("navbar.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn--ghost" onClick={closeMenu}>
                {t("navbar.login")}
              </Link>
              <Link to="/signup" className="nav-btn nav-btn--solid" onClick={closeMenu}>
                {t("navbar.register")}
              </Link>
            </>
          )}

          <div className="navbar__mobile-lang">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`nav-btn nav-btn--ghost${language === l.code ? " is-active" : ""}`}
                onClick={() => changeLanguage(l.code)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}