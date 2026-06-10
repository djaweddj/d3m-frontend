import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap,
  CalendarDays, Settings, LogOut, School, UserPlus,
} from "lucide-react";
import { useAuth } from "../context/authContext";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم",    section: null },
  { to: "/students",  icon: Users,           label: "التلاميذ",       section: "الإدارة" },
  { to: "/requests",  icon: UserPlus,        label: "طلبات الانضمام", section: null },
  { to: "/teachers",  icon: GraduationCap,   label: "الأساتذة",       section: null },
  { to: "/schedule",  icon: CalendarDays,    label: "الجدول الأسبوعي",section: null },
  { to: "/settings",  icon: Settings,        label: "إعدادات المدرسة",section: "الإعدادات" },
];

function hexToRgb(hex = "#185FA5") {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function Sidebar() {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

  // Primary color: from school profile or fallback
  const p = school?.primaryColor || "#185FA5";

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

  return (
    <aside
      dir="rtl"
      style={{
        width: 224,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#0F172A",
        flexShrink: 0,
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {school?.logoUrl ? (
          <img
            src={school.logoUrl}
            alt="شعار"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: p,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <School size={18} color="#fff" />
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
            {schoolName}
          </p>
          <p style={{ fontSize: 10, color: "#64748B", marginTop: 2, margin: 0 }}>لوحة التحكم</p>
        </div>
      </div>

      {/* ── Admin badge ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", background: "rgba(255,255,255,0.03)",
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
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", margin: 0 }}>
            {user?.fullName || schoolName}
          </p>
          <p style={{ fontSize: 10, color: "#1D9E75", marginTop: 2, margin: 0 }}>مدير المدرسة ✓</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.to}>
              {item.section && (
                <p style={{
                  fontSize: 9, fontWeight: 700, color: "#334155",
                  letterSpacing: ".12em", textTransform: "uppercase",
                  padding: "16px 16px 6px", margin: 0,
                }}>
                  {item.section}
                </p>
              )}
              <NavLink
                to={item.to}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", fontSize: 13, fontWeight: 500,
                  color: isActive ? "#fff" : "#64748B",
                  background: isActive ? `rgba(${hexToRgb(p)},0.18)` : "transparent",
                  borderRight: `3px solid ${isActive ? p : "transparent"}`,
                  textDecoration: "none", transition: "all .15s",
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#CBD5E1";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  // NavLink handles active state, just reset hover
                  e.currentTarget.style.background = "";
                  e.currentTarget.style.color = "";
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} style={{ flexShrink: 0, color: isActive ? p : "inherit" }} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, fontWeight: 500, color: "#475569",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", padding: "6px 0", width: "100%",
            transition: "color .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#94A3B8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}