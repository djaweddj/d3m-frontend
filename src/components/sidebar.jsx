import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap,
  CalendarDays, Settings, LogOut, School, UserPlus, BookOpen, Home,
  ChevronsRight, Menu, X
} from "lucide-react";
import { useAuth } from "../context/authContext";

const NAV = [
  { to: "/home",                icon: Home,            label: "الصفحة الرئيسية", section: null },
  { to: "/dashboard",           icon: LayoutDashboard, label: "لوحة التحكم",     section: null },
  { to: "/students",            icon: Users,           label: "التلاميذ",        section: "الإدارة" },
  { to: "/requests",            icon: UserPlus,        label: "طلبات الانضمام",  section: null },
  { to: "/teachers",            icon: GraduationCap,   label: "الأساتذة",        section: null },
  { to: "/schedule",            icon: CalendarDays,    label: "الجدول الأسبوعي", section: null },
  { to: "/subjectandclassroom", icon: BookOpen,        label: "المواد والفصول",  section: null },
  { to: "/createmodule",        icon: BookOpen,        label: "حصص",             section: null },
  { to: "/settings",            icon: Settings,        label: "إعدادات المدرسة", section: "الإعدادات" },
];

function hexToRgb(hex = "#185FA5") {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const EXPANDED = 224;
const COLLAPSED = 76;

export default function Sidebar() {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  // desktop collapse/expand
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1280;
  });
  // mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [hoveredTip, setHoveredTip] = useState(null);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // close mobile drawer on route change (click on a link)
  const closeMobile = () => setMobileOpen(false);

  const p = school?.primaryColor || "#185FA5";
  const rgb = hexToRgb(p);

  const schoolName = school?.schoolName || user?.fullName || "المدرسة";
  const initials = schoolName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const width = collapsed && !isMobile ? COLLAPSED : EXPANDED;
  const showLabels = !collapsed || isMobile;

  return (
    <>
      <style>{`
        @keyframes sidebarFadeIn {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(${rgb},0.45); }
          70% { box-shadow: 0 0 0 6px rgba(${rgb},0); }
          100% { box-shadow: 0 0 0 0 rgba(${rgb},0); }
        }
        .sb-scroll::-webkit-scrollbar { width: 5px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; }
        .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

        .sb-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          margin: 2px 8px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          color: #94A3B8;
          white-space: nowrap;
          overflow: hidden;
          transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
        }
        .sb-link:hover {
          background: rgba(255,255,255,0.06);
          color: #E2E8F0;
          transform: translateX(-2px);
        }
        .sb-link.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(${rgb},0.32), rgba(${rgb},0.08));
        }
        .sb-link.active .sb-active-bar {
          transform: scaleY(1);
          opacity: 1;
        }
        .sb-active-bar {
          position: absolute;
          right: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          border-radius: 3px;
          background: ${p};
          transform: scaleY(0);
          opacity: 0;
          transition: transform 0.25s ease, opacity 0.25s ease;
        }
        .sb-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
        }
        .sb-label {
          transition: opacity 0.18s ease, max-width 0.28s ease;
        }
        .sb-collapse-btn {
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s ease, color 0.2s ease;
        }
        .sb-tooltip {
          animation: sidebarFadeIn 0.15s ease;
        }
        .sb-logout-btn {
          transition: color 0.2s ease, background 0.2s ease, transform 0.15s ease;
        }
        .sb-logout-btn:hover {
          transform: translateX(-2px);
        }
        .sb-fab {
          animation: pulseRing 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* ── Mobile top bar trigger ── */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          className="sb-fab"
          aria-label="فتح القائمة"
          style={{
            position: "fixed", top: 14, right: 14, zIndex: 60,
            width: 44, height: 44, borderRadius: 12,
            background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
        >
          <Menu size={20} />
        </button>
      )}

      {/* ── Mobile overlay ── */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: "fixed", inset: 0, zIndex: 70,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
            animation: "overlayFadeIn 0.2s ease",
          }}
        />
      )}

      <aside
        dir="rtl"
        style={{
          width: isMobile ? EXPANDED : width,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          right: isMobile ? (mobileOpen ? 0 : -EXPANDED) : "auto",
          zIndex: 80,
          background: "#0F172A",
          flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          fontFamily: "'Cairo', sans-serif",
          transition: isMobile
            ? "right 0.28s cubic-bezier(0.4,0,0.2,1)"
            : "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
          boxShadow: isMobile && mobileOpen ? "-8px 0 30px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* ── Logo ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          minHeight: 70,
        }}>
          {school?.logoUrl ? (
            <img src={school.logoUrl} alt="شعار"
              style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: p,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <School size={18} color="#fff" />
            </div>
          )}
          {showLabels && (
            <div style={{ overflow: "hidden", animation: "sidebarFadeIn 0.25s ease" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0, whiteSpace: "nowrap" }}>
                {schoolName}
              </p>
              <p style={{ fontSize: 10, color: "#64748B", marginTop: 2, margin: 0, whiteSpace: "nowrap" }}>لوحة التحكم</p>
            </div>
          )}

          {isMobile && (
            <button
              onClick={closeMobile}
              aria-label="إغلاق القائمة"
              style={{
                marginRight: "auto", background: "none", border: "none",
                color: "#64748B", cursor: "pointer", padding: 6,
                borderRadius: 8, display: "flex",
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Admin badge ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: showLabels ? "12px 16px" : "12px 0",
          justifyContent: showLabels ? "flex-start" : "center",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: p,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.15)",
          }}>
            {initials}
          </div>
          {showLabels && (
            <div style={{ overflow: "hidden", animation: "sidebarFadeIn 0.25s ease" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", margin: 0, whiteSpace: "nowrap" }}>
                {user?.fullName || schoolName}
              </p>
              <p style={{ fontSize: 10, color: "#1D9E75", marginTop: 2, margin: 0, whiteSpace: "nowrap" }}>مدير المدرسة ✓</p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="sb-scroll" style={{ flex: 1, padding: "8px 0", overflowY: "auto", overflowX: "hidden" }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to} style={{ position: "relative" }}>
                {item.section && showLabels && (
                  <p style={{
                    fontSize: 9, fontWeight: 700, color: "#334155",
                    letterSpacing: ".12em", textTransform: "uppercase",
                    padding: "16px 16px 6px", margin: 0, whiteSpace: "nowrap",
                  }}>
                    {item.section}
                  </p>
                )}
                {item.section && !showLabels && (
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "12px 12px 8px" }} />
                )}
                <NavLink
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) => `sb-link${isActive ? " active" : ""}`}
                  style={{ justifyContent: showLabels ? "flex-start" : "center" }}
                  onMouseEnter={() => !showLabels && setHoveredTip(item.to)}
                  onMouseLeave={() => setHoveredTip(null)}
                >
                  <span className="sb-active-bar" />
                  <span className="sb-icon-wrap">
                    <Icon size={16} />
                  </span>
                  {showLabels && <span className="sb-label">{item.label}</span>}
                </NavLink>

                {!showLabels && hoveredTip === item.to && (
                  <div className="sb-tooltip" style={{
                    position: "absolute", right: COLLAPSED + 6, top: "50%",
                    transform: "translateY(-50%)", zIndex: 100,
                    background: "#1E293B", color: "#fff", fontSize: 12,
                    fontWeight: 500, padding: "6px 10px", borderRadius: 8,
                    whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    pointerEvents: "none",
                  }}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Collapse toggle (desktop only) ── */}
        {!isMobile && (
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="sb-collapse-btn"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                justifyContent: showLabels ? "flex-start" : "center",
                width: "100%", fontSize: 12, fontWeight: 500, color: "#64748B",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", padding: "8px 6px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#E2E8F0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
            >
              <ChevronsRight
                size={16}
                style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
              />
              {showLabels && <span>طي القائمة</span>}
            </button>
          </div>
        )}

        {/* ── Logout ── */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={handleLogout}
            className="sb-logout-btn"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              justifyContent: showLabels ? "flex-start" : "center",
              fontSize: 12, fontWeight: 500, color: "#64748B",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", padding: "8px 10px", width: "100%",
              borderRadius: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F87171";
              e.currentTarget.style.background = "rgba(248,113,113,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748B";
              e.currentTarget.style.background = "none";
            }}
          >
            <LogOut size={15} />
            {showLabels && "تسجيل الخروج"}
          </button>
        </div>
      </aside>
    </>
  );
}