import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap,
  CalendarDays, Settings, LogOut, School, UserPlus, BookOpen,
} from "lucide-react";
import { useAuth } from "../context/authContext";

const NAV = [
  { to: "/dashboard",           icon: LayoutDashboard, label: "لوحة التحكم",     section: null },
  { to: "/students",            icon: Users,           label: "التلاميذ",        section: "الإدارة" },
  { to: "/requests",            icon: UserPlus,        label: "طلبات الانضمام",  section: null },
  { to: "/teachers",            icon: GraduationCap,   label: "الأساتذة",        section: null },
  { to: "/schedule",            icon: CalendarDays,    label: "الجدول الأسبوعي", section: null },
  { to: "/subjectandclassroom", icon: BookOpen,        label: "المواد والفصول",  section: null },
  { to: "/createmodule", icon: BookOpen,        label: "حصص",  section: null },
  { to: "/settings",            icon: Settings,        label: "إعدادات المدرسة", section: "الإعدادات" },
];

function hexToRgb(hex = "#185FA5") {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function Sidebar() {
  const { user, school, logout } = useAuth();
  const navigate = useNavigate();

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
                className="sidebar-link"
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", fontSize: 13, fontWeight: 500,
                  color: isActive ? "#fff" : "#94A3B8",
                  background: isActive ? `rgba(${rgb},0.35)` : "transparent",
                  borderRight: `3px solid ${isActive ? p : "transparent"}`,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  borderRadius: "0 8px 8px 0",
                  marginLeft: 8,
                })}
                onMouseEnter={(e) => {
                  const isActive = e.currentTarget.style.borderRightColor !== "transparent" &&
                                   e.currentTarget.style.borderRightColor !== "";
                  if (!isActive) {
                    e.currentTarget.style.color = "#E2E8F0";
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.borderRightColor = `rgba(${rgb},0.4)`;
                  }
                }}
                onMouseLeave={(e) => {
                  const isActive = e.currentTarget.style.background.includes("0.18");
                  if (!isActive) {
                    e.currentTarget.style.color = "#94A3B8";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderRightColor = "transparent";
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: isActive ? p : "inherit",
                        transition: "color 0.15s",
                      }}
                    />
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
            fontSize: 12, fontWeight: 500, color: "#64748B",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", padding: "8px 10px", width: "100%",
            transition: "color 0.15s, background 0.15s",
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
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}