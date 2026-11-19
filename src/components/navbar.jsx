import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import logo from "../assets/num3.png";

import { Menu, MenuItem, ListItemIcon, ListItemText, IconButton } from "@mui/material";
import ReactCountryFlag from "react-country-flag";

const LANGUAGES = [
  { code: "ar", label: "العربية", country: "DZ" },
  { code: "en", label: "English", country: "GB" },
  { code: "fr", label: "Français", country: "FR" },
];

// ─── shared styles ────────────────────────────────────────
const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-bold transition-colors";
const ghost = `${btn} border border-gold/40 text-ivory hover:border-gold hover:text-gold`;
const solid = `${btn} bg-gold text-green-deep hover:bg-gold-deep hover:text-ivory`;
const gold = "rgba(200,162,74,.4)";

function UserPill({ initials, name, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2.5 border border-gold/30 px-3 py-1.5 transition-colors hover:border-gold ${className}`}
    >
      <span className="grid size-8 place-items-center rounded-sm bg-gold text-xs font-bold text-green-deep">{initials}</span>
      <span className="max-w-40 truncate text-sm text-ivory">{name}</span>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, dir } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  // Refs for click-outside detection
  const panelRef = useRef(null);
  const burgerRef = useRef(null);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === language);

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
    setLanguage(lang);
    handleClose();
  };

  const isLoggedIn = user?.role === "STUDENT" || user?.role === "SCHOOL_ADMIN";

  // Close mobile panel when clicking/tapping outside of it
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Close mobile panel automatically if viewport grows back to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        closeMenu();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const line = "block h-0.5 w-6 bg-ivory transition-all duration-300";

  return (
    <header dir={dir} className="sticky top-0 z-50 border-b border-gold/20 bg-green-deep/95 font-body backdrop-blur">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
          <span className="grid size-12 place-items-center rounded-sm bg-ivory">
            <img src={logo} alt="Numeria Academy" className="size-10 object-contain" />
          </span>
          <span className="nm-latin text-xs font-semibold uppercase text-gold sm:text-sm">Numeria Academy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <button className={solid} onClick={() => navigate(dashboardPath)}>
                <LayoutDashboard size={14} />
                {t("navbar.dashboard")}
              </button>

              <UserPill initials={initials} name={user.fullName} onClick={() => navigate(dashboardPath)} />

              <button
                className="grid size-11 place-items-center rounded-sm border border-gold/40 text-ivory transition-colors hover:border-gold hover:text-gold"
                onClick={logout}
                title={t("navbar.logout")}
                aria-label={t("navbar.logout")}
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={ghost}>{t("navbar.login")}</Link>
              <Link to="/signup" className={solid}>{t("navbar.register")}</Link>
            </>
          )}

          {/* Language switcher */}
          <IconButton
            onClick={handleOpen}
            sx={{
              borderRadius: "2px",
              border: `1px solid ${gold}`,
              width: 44,
              height: 44,
              p: 0.8,
              "&:hover": { borderColor: "#C8A24A", bgcolor: "rgba(200,162,74,.08)" },
            }}
          >
            <ReactCountryFlag countryCode={currentLanguage.country} svg style={{ width: "1.6em", height: "1.6em" }} />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: "2px",
                minWidth: 190,
                border: `1px solid ${gold}`,
                "& .MuiMenuItem-root, & .MuiTypography-root": { fontFamily: "Cairo, sans-serif" },
                "& .Mui-selected": { bgcolor: "rgba(200,162,74,.15) !important" },
              },
            }}
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} selected={lang.code === language} onClick={() => changeLanguage(lang.code)}>
                <ListItemIcon>
                  <ReactCountryFlag countryCode={lang.country} svg style={{ width: "1.6em", height: "1.6em" }} />
                </ListItemIcon>
                <ListItemText>{lang.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>

          {/* Teacher-only */}
          {user?.role === "TEACHER" && (
            <>
              <button className={solid} onClick={() => navigate("/teacherDashboard")}>
                <LayoutDashboard size={14} />
                لوحتي
              </button>
              <UserPill initials={initials} name={user.fullName} onClick={() => navigate("/teacherDashboard")} />
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          ref={burgerRef}
          className="flex size-11 flex-col items-center justify-center gap-1.5 border border-gold/40 md:hidden"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={t("navbar.menuOpenAria")}
          aria-expanded={isOpen}
        >
          <span className={`${line} ${isOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`${line} ${isOpen ? "opacity-0" : ""}`} />
          <span className={`${line} ${isOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {isOpen && (
        <div ref={panelRef} className="absolute inset-x-0 top-full flex flex-col gap-3 border-b border-gold/20 bg-green-deep p-5 md:hidden">
          {isLoggedIn ? (
            <>
              <UserPill initials={initials} name={user.fullName} onClick={() => goTo(dashboardPath)} />

              <button className={solid} onClick={() => goTo(dashboardPath)}>
                <LayoutDashboard size={14} />
                {t("navbar.dashboard")}
              </button>

              <button className={ghost} onClick={() => { closeMenu(); logout(); }}>
                <LogOut size={14} />
                {t("navbar.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={ghost} onClick={closeMenu}>{t("navbar.login")}</Link>
              <Link to="/signup" className={solid} onClick={closeMenu}>{t("navbar.register")}</Link>
            </>
          )}

          <div className="grid gap-2 border-t border-ivory/10 pt-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`${ghost} ${language === l.code ? "!border-gold !text-gold" : ""}`}
                onClick={() => changeLanguage(l.code)}
              >
                <ReactCountryFlag countryCode={l.country} svg style={{ width: "1.4em", height: "1.4em" }} />
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}