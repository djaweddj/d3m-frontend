import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogOut, Globe } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import "../Css/Navbar.css";

import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import ReactCountryFlag from "react-country-flag";

const LANGUAGES = [
  {
    code: "ar",
    label: "العربية",
    country: "DZ",
  },
  {
    code: "en",
    label: "English",
    country: "GB",
  },
  {
    code: "fr",
    label: "Français",
    country: "FR",
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
 const [anchorEl, setAnchorEl] = useState(null);

const open = Boolean(anchorEl);

const handleOpen = (event) => {
  setAnchorEl(event.currentTarget);
};

const handleClose = () => {
  setAnchorEl(null);
};
const currentLanguage = LANGUAGES.find(
  (l) => l.code === language
);


const dashboardPath =
  user?.role === "SCHOOL_ADMIN"
    ? "/Dashboard"
    : user?.role === "TEACHER"
    ? "/teacherDashboard"
    : "/studentdashboard";

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
  setLanguage(lang);
  handleClose();
};


  const isLoggedIn = user?.role === "STUDENT" || user?.role === "SCHOOL_ADMIN" || user?.role ==="TEACHER";

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
 <IconButton
    onClick={handleOpen}
    sx={{
     
        borderRadius:3,
        border:"1 solid ",
        width:"50px",
        height:"60px",
        p: 0.8,
    }}
>
    <ReactCountryFlag
        countryCode={currentLanguage.country}
        svg
        style={{
            width: "1.8em",
            height: "1.8em",
        }}
    />
</IconButton>

  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={handleClose}
    PaperProps={{
      sx: {
        mt: 1,
        borderRadius: 3,
        minWidth: 190,
      },
    }}
  >
    {LANGUAGES.map((lang) => (
      <MenuItem
        key={lang.code}
        selected={lang.code === language}
        onClick={() => changeLanguage(lang.code)}
      >
        <ListItemIcon>
          <ReactCountryFlag
            countryCode={lang.country}
            svg
            style={{
              width: "1.6em",
              height: "1.6em",
            }}
          />
        </ListItemIcon>

        <ListItemText>{lang.label}</ListItemText>
      </MenuItem>
    ))}
  </Menu>
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