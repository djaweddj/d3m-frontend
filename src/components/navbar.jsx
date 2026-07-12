import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/authContext";
import "../Css/Navbar.css";

export default function Navbar() {
  const { user,logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);


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

  return (
    <header dir="rtl" className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar__logo" onClick={closeMenu}>
        <div className="navbar__logo-mark">
          <GraduationCap size={18} strokeWidth={2.4} />
        </div>
        <span className="navbar__logo-text">منصة مدارس الدعم</span>
      </Link>

      {/* Desktop nav */}
      <nav className="navbar__nav navbar__nav--desktop "  style={{display:user?.role ==="SCHOOL_ADMIN"?"none":"flex"}}>
        {user?.role === "STUDENT"  ? (
          <>
            <button
              className="nav-btn nav-btn--dashboard"
              onClick={() => navigate("/studentdashboard")}
            >
              <LayoutDashboard size={14} />
              لوحتي
            </button>

            <div
              className="navbar__user"
              onClick={() => navigate("/studentdashboard")}
            >
              <div className="navbar__avatar">{initials}</div>
              <span className="navbar__user-name">{user.fullName}</span>
            </div>

            <button
              className="nav-icon-btn"
              onClick={logout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn nav-btn--ghost">
              تسجيل الدخول
            </Link>
            <Link to="/signup" className="nav-btn nav-btn--solid">
              إنشاء حساب
            </Link>
          </>
        )}
      </nav>
       <nav className="navbar__nav navbar__nav--desktop" style={{display:user?.role !="SCHOOL_ADMIN"?"none":"flex"}}>
        {user?.role === "SCHOOL_ADMIN"  ? (
          <>
            <button
              className="nav-btn nav-btn--dashboard"
              onClick={() => navigate("/Dashboard")}
            >
              <LayoutDashboard size={14} />
              لوحتي
            </button>

            <div
              className="navbar__user"
              onClick={() => navigate("/Dashboard")}
            >
              <div className="navbar__avatar">{initials}</div>
              <span className="navbar__user-name">{user.fullName}</span>
            </div>

            <button
              className="nav-icon-btn"
              onClick={logout}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn nav-btn--ghost">
              تسجيل الدخول
            </Link>
            <Link to="/signup" className="nav-btn nav-btn--solid">
              إنشاء حساب
            </Link>
          </>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className={`navbar__burger${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="فتح القائمة"
        aria-expanded={isOpen}
      >
        <span className="navbar__burger-line" />
        <span className="navbar__burger-line" />
        <span className="navbar__burger-line" />
      </button>

      {/* Mobile dropdown panel */}
      {isOpen && (
        <div className="navbar__mobile-panel">
          {user?.role === "STUDENT" ? (
            <>
              <div className="navbar__mobile-user" onClick={() => goTo("/studentdashboard")}>
                <div className="navbar__avatar">{initials}</div>
                <span className="navbar__user-name">{user.fullName}</span>
              </div>

              <button
                className="nav-btn nav-btn--dashboard"
                onClick={() => goTo("/studentdashboard")}
              >
                <LayoutDashboard size={14} />
                لوحتي
              </button>

              <button
                className="nav-btn nav-btn--ghost"
                onClick={() => goTo("/")}
              >
                <LogOut size={14} />
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn--ghost" onClick={closeMenu}>
                تسجيل الدخول
              </Link>
              <Link to="/signup" className="nav-btn nav-btn--solid" onClick={closeMenu}>
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}