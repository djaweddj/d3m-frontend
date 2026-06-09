import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../context/authContext";

export default function Navbar() {
  
  const { user } = useAuth();
  const navigate = useNavigate();
console.log("AUTH USER:", user);
  return (
    <header
      dir="rtl"
      style={{
        background: "#fff",
        borderBottom: "1.5px solid #E8EEF6",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        fontFamily: "system-ui, 'Cairo', Arial, sans-serif",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#185FA5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <GraduationCap size={18} color="#fff" />
        </div>

        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#185FA5",
          }}
        >
          منصة مدارس الدعم
        </span>
      </Link>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Browse schools */}
        <Link
          to="/schools"
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "#475569",
            textDecoration: "none",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#F1F5F9";
            e.currentTarget.style.color = "#0F172A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#475569";
          }}
        >
          تصفح المدارس
        </Link>

        {user?.role === "STUDENT" ? (
          /* ───────── Logged-in Student ───────── */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginRight: 8,
            }}
          >
            {/* Dashboard */}
            <button
              onClick={() => navigate("/studentdashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #E8EEF6",
                background: "#F8FAFC",
                fontSize: 13,
                fontWeight: 500,
                color: "#475569",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#185FA5";
                e.currentTarget.style.color = "#185FA5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8EEF6";
                e.currentTarget.style.color = "#475569";
              }}
            >
              <LayoutDashboard size={14} />
              لوحتي
            </button>

            {/* User */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 6px",
                borderRadius: 999,
                background: "#EBF4FE",
                border: "1.5px solid #B5D4F4",
                cursor: "pointer",
              }}
              onClick={() => navigate("/studentdashboard")}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#185FA5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {user.avatar ||
                  user.fullName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
              </div>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0C447C",
                }}
              >
                {user.fullName}
              </span>
            </div>

            {/* Logout */}
            <button
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1.5px solid #E8EEF6",
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all .15s",
                color: "#94A3B8",
              }}
              onClick={() => navigate("/")}
              title="تسجيل الخروج"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#FCA5A5";
                e.currentTarget.style.color = "#DC2626";
                e.currentTarget.style.background = "#FEE2E2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8EEF6";
                e.currentTarget.style.color = "#94A3B8";
                e.currentTarget.style.background = "#fff";
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          /* ───────── Guest ───────── */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginRight: 8,
            }}
          >
            {/* Guest badge */}
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748B",
              }}
            >
              Guest
            </div>

            {/* Register school */}
            <Link
              to="/schoolregister"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "#EEF6FF",
                border: "1px solid #BFDBFE",
                color: "#185FA5",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#DBEAFE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#EEF6FF";
              }}
            >
              تسجيل مدرسك
            </Link>

            {/* Login */}
            <Link
              to="/login"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1.5px solid #E8EEF6",
                background: "#fff",
                fontSize: 13,
                fontWeight: 500,
                color: "#475569",
                textDecoration: "none",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E8EEF6";
                e.currentTarget.style.color = "#475569";
              }}
            >
              تسجيل الدخول
            </Link>

            {/* Signup */}
            <Link
              to="/signup"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                background: "#185FA5",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                textDecoration: "none",
                transition: "opacity .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = ".88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              إنشاء حساب
            </Link>
           
          </div>
        )}
      </nav>
    </header>
  );
}