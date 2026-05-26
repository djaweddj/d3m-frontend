import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Palette,
  LogOut,
  School,
  UserPlus,
} from "lucide-react";

import { useSchool } from "../context/SchoolContext";

const NAV = [
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "لوحة التحكم",
    section: null,
  },

  {
    to: "/students",
    icon: Users,
    label: "تلاميذنا",
    section: "الإدارة",
  },

  {
    to: "/requests",
    icon: UserPlus,
    label: "الطلبات",
    section: "الطلاب",
  },

  {
    to: "/teachers",
    icon: GraduationCap,
    label: "أساتذتنا",
    section: null,
  },

  {
    to: "/schedule",
    icon: CalendarDays,
    label: "جدول الحصص",
    section: null,
  },

  {
    to: "/settings",
    icon: Palette,
    label: "تخصيص المدرسة",
    section: "الإعدادات",
  },
];

// ── styles ─────────────────────────────────────
const S = {
  aside: {
    width: 224,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#0F172A",
    flexShrink: 0,
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    fontFamily: "'Cairo', sans-serif",
  },

  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  logoIcon: (p) => ({
    width: 38,
    height: 38,
    borderRadius: 10,
    background: p,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),

  badgeBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  avatar: (p) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: p,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    border: "2px solid rgba(255,255,255,0.15)",
  }),
};

export default function Sidebar() {
  const { school } = useSchool();
  const p = school.primaryColor;

  const initials = school.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <aside style={S.aside} dir="rtl">
      {/* ── Logo ── */}
      <div style={S.logoBlock}>
        {school.logoUrl ? (
          <img
            src={school.logoUrl}
            alt="شعار"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={S.logoIcon(p)}>
            <School size={18} color="#fff" />
          </div>
        )}

        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {school.name}
          </p>

          <p
            style={{
              fontSize: 10,
              color: "#64748B",
              marginTop: 2,
            }}
          >
            لوحة التحكم
          </p>
        </div>
      </div>

      {/* ── Account Badge ── */}
      <div style={S.badgeBlock}>
        <div style={S.avatar(p)}>{initials}</div>

        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#E2E8F0",
            }}
          >
            {school.name}
          </p>

          <p
            style={{
              fontSize: 10,
              color: "#1D9E75",
              marginTop: 2,
            }}
          >
            حساب موثّق ✓
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav
        style={{
          flex: 1,
          padding: "8px 0",
          overflowY: "auto",
        }}
      >
        {NAV.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.to}>
              {item.section && (
                <p
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#334155",
                    letterSpacing: ".12em",
                    textTransform: "uppercase",
                    padding: "16px 16px 6px",
                  }}
                >
                  {item.section}
                </p>
              )}

              <NavLink
                to={item.to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "#fff" : "#64748B",
                  background: isActive
                    ? `rgba(${hexToRgb(p)},0.18)`
                    : "transparent",
                  borderRight: `3px solid ${
                    isActive ? p : "transparent"
                  }`,
                  textDecoration: "none",
                  transition: "all .15s",
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#CBD5E1";
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderRightColor =
                    "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                  e.currentTarget.style.borderRightColor =
                    "transparent";
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: isActive ? p : "inherit",
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
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 500,
            color: "#475569",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "6px 0",
            width: "100%",
            transition: "color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#94A3B8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#475569";
          }}
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ── helper ─────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);

  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}