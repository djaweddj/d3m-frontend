import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate ,Link} from "react-router-dom";
import {
  BookOpen, User, CalendarDays, School,
  LogOut, Edit3, Check, AlertCircle,
  Loader2, RefreshCw, Clock, MapPin, GraduationCap,
  Wallet, ChevronLeft, Menu, X,Home
} from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api";

// ─────────────────────────────────────────────────────────
// API  — real backend endpoints (unchanged)
// ─────────────────────────────────────────────────────────
const studentApi = {
  getProfile: () => api.get("api/students/profile"),
  updateProfile: (data) => api.put("api/students/profile", data),
  getEnrollments: () => api.get("api/enrollments/mine"),
  getInvoices: () => api.get("api/invoices/mine"),
  getSessionsBySchool: (schoolId) => api.get(`api/sessions/school/${schoolId}`),
  browseModules: (schoolId, level) =>
    api.get("api/modules/browse", { params: { schoolId, level } }),
    getCourseEnrollments: () => api.get("api/courses/mine"),
  getCourseInvoices: () => api.get("api/courses/invoices/mine"),
};

// ─────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────
const INK    = "#0B2540";
const INK_2  = "#0F3A5F";
const ACTION = "#1C6FB8";
const ACTION_DEEP = "#0B4D85";
const CANVAS = "#F5F8FB";
const SUCCESS = "#0E8F6F";
const SUCCESS_BG = "#E7F6EF";
const WARNING = "#C2780C";
const WARNING_BG = "#FCF1DD";
const DANGER  = "#D23B3B";
const DANGER_BG = "#FDEAEA";
const LINE    = "#E6ECF3";

const PALETTE = [
  { bg: "#EAF3FC", text: "#0B4D85", border: "#BBDBF6", accent: "#1C6FB8" },
  { bg: "#E7F6EF", text: "#0E6F54", border: "#A9E2C9", accent: "#0E8F6F" },
  { bg: "#F1EEFC", text: "#5142A8", border: "#CDC4F2", accent: "#6C5CE7" },
  { bg: "#FCEFE6", text: "#9A4A18", border: "#F3CBA9", accent: "#D9762D" },
];
const pal = (i) => PALETTE[i % PALETTE.length];

const WEEK_DAYS_KEY = {
  MONDAY: "monday", TUESDAY: "tuesday", WEDNESDAY: "wednesday",
  THURSDAY: "thursday", FRIDAY: "friday", SATURDAY: "saturday", SUNDAY: "sunday",
};
// Week starts Saturday to match the original Arabic-locale ordering
const WEEK_ORDER_KEYS = ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"];

const NAV = [
  { id: "sessions", icon: BookOpen },
  { id: "schedule", icon: CalendarDays },
  { id: "schools",  icon: School },
  { id: "profile",  icon: User },
  { id: "courses",  icon: GraduationCap },
];

// Fallback locale for date formatting, keyed off dir (rtl -> Arabic-Morocco, ltr -> default browser/French)
function localeForDir(dir, lang) {
  if (lang === "ar") return "ar-MA";
  if (lang === "fr") return "fr-FR";
  if (lang === "en") return "en-US";
  return dir === "rtl" ? "ar-MA" : "en-US";
}

const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");

// Simple {placeholder} interpolation helper — works whether or not `t` already does this internally.
function fill(str, vars) {
  if (typeof str !== "string" || !vars) return str;
  return Object.keys(vars).reduce(
    (acc, key) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), vars[key]),
    str
  );
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function localeForLang(language) {
  return language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-US";
}

// ─────────────────────────────────────────────────────────
// useFetch hook (unchanged logic, translated fallback error)
// ─────────────────────────────────────────────────────────
function useFetch(fetchFn, fallbackMsg, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data?.content ?? res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─────────────────────────────────────────────────────────
// Page: دوراتي (Course enrollments + course invoices)
// ─────────────────────────────────────────────────────────
function PageCourses({ courseEnrollments, courseInvoices }) {
  const { t, dir } = useLanguage();

  const enrollStatusStyle = (status) => {
    switch (status) {
      case "ACCEPTED": return { label: t("studentDashboard.enrollmentStatus.ACTIVE"), color: SUCCESS, bg: SUCCESS_BG };
      case "PENDING":  return { label: t("studentDashboard.enrollmentStatus.PENDING"), color: WARNING, bg: WARNING_BG };
      case "REJECTED": return { label: t("studentDashboard.courses.rejected"), color: DANGER, bg: DANGER_BG };
      default:         return { label: status || "—", color: "#64748B", bg: "#F1F5F9" };
    }
  };

  const invoiceStyle = (status) => {
    switch (status) {
      case "PAID":    return { label: t("studentDashboard.invoiceStatus.PAID"),    color: SUCCESS, bg: SUCCESS_BG };
      case "PENDING": return { label: t("studentDashboard.invoiceStatus.PENDING"), color: WARNING, bg: WARNING_BG };
      case "OVERDUE": return { label: t("studentDashboard.invoiceStatus.OVERDUE"), color: DANGER,  bg: DANGER_BG };
      default:        return { label: status || "—", color: "#64748B", bg: "#F1F5F9" };
    }
  };

  const totalDue = (courseInvoices || [])
    .filter((inv) => inv.status !== "PAID")
    .reduce((s, inv) => s + (Number(inv.amount) || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="sd-schools-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ textAlign: "center", padding: "1.15rem 1rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, margin: "0 auto 8px",
            background: "#F1EEFC", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GraduationCap size={16} color="#5142A8" />
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, color: "#5142A8" }}>
            {(courseEnrollments || []).length}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
            {t("studentDashboard.courses.enrolledCourses")}
          </div>
        </Card>
        <Card delay={60} style={{ textAlign: "center", padding: "1.15rem 1rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, margin: "0 auto 8px",
            background: SUCCESS_BG, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Wallet size={16} color={SUCCESS} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: SUCCESS }}>
            {totalDue ? `${totalDue} ${t("studentDashboard.currency")}` : "—"}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
            {t("studentDashboard.schools.amountDue")}
          </div>
        </Card>
      </div>

      <Card delay={100}>
        <SecTitle icon={GraduationCap}>{t("studentDashboard.courses.enrolledCoursesTitle")}</SecTitle>
        {(courseEnrollments || []).length === 0 ? (
          <Empty text={t("studentDashboard.courses.noCourses")} icon={GraduationCap} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {courseEnrollments.map((enr, i) => {
              const c  = pal(i);
              const st = enrollStatusStyle(enr.status);
              return (
                <div key={enr.id} className="sd-row sd-slide-in" style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "11px 13px", borderRadius: 12,
                  border: `1px solid ${LINE}`, background: "#FBFCFE",
                  borderRight: dir === "rtl" ? `3px solid ${c.accent}` : undefined,
                  borderLeft: dir !== "rtl" ? `3px solid ${c.accent}` : undefined,
                  animationDelay: `${i * 35}ms`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 11, background: c.bg,
                    border: `1px solid ${c.border}`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>🎓</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                      {enr.courseName || fill(t("studentDashboard.courses.courseFallback"), { id: enr.courseId })}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span>{enr.subjectName || "—"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <School size={11} /> {enr.schoolName || "—"}
                      </span>
                    </div>
                  </div>
                  {enr.totalPrice != null && (
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: INK, flexShrink: 0 }}>
                      {enr.totalPrice} {t("studentDashboard.currency")}
                    </div>
                  )}
                  <Tag bg={st.bg} color={st.color}>{st.label}</Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card delay={150}>
        <SecTitle icon={Wallet}>{t("studentDashboard.courses.invoicesTitle")}</SecTitle>
        {(courseInvoices || []).length === 0 ? (
          <Empty text={t("studentDashboard.courses.noInvoices")} icon={Wallet} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {courseInvoices.map((inv, i) => {
              const st = invoiceStyle(inv.status);
              return (
                <div key={inv.id} className="sd-row sd-slide-in" style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "11px 14px", borderRadius: 12,
                  border: `1px solid ${LINE}`, background: "#FBFCFE",
                  borderRight: dir === "rtl" ? `3px solid ${st.color}` : undefined,
                  borderLeft: dir !== "rtl" ? `3px solid ${st.color}` : undefined,
                  animationDelay: `${i * 35}ms`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
                      {inv.courseName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                      {inv.dueDate ? `${t("studentDashboard.sessions.dueDateLabel")} ${new Date(inv.dueDate).toLocaleDateString(localeForDir(dir))}` : ""}
                      {inv.paidAt ? ` · ${t("studentDashboard.courses.paidAt")} ${new Date(inv.paidAt).toLocaleDateString(localeForDir(dir))}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4 }}>
                      {inv.amount ? `${inv.amount} ${t("studentDashboard.currency")}` : "—"}
                    </div>
                    <Tag bg={st.bg} color={st.color}>{st.label}</Tag>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Global styles (keyframes, responsive rules, focus states)
// ─────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }

      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(.96); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes shimmer {
        0%   { background-position: -300px 0; }
        100% { background-position: 300px 0; }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(14px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; }
        50%      { opacity: .35; }
      }

      .sd-fade-up { animation: fadeSlideUp .45s cubic-bezier(.16,1,.3,1) both; }
      .sd-fade-in { animation: fadeIn .3s ease both; }
      .sd-scale-in { animation: scaleIn .35s cubic-bezier(.16,1,.3,1) both; }
      .sd-slide-in { animation: slideInRight .4s cubic-bezier(.16,1,.3,1) both; }

      .sd-skeleton {
        background: linear-gradient(90deg, #EEF2F7 25%, #F8FAFC 37%, #EEF2F7 63%);
        background-size: 400px 100%;
        animation: shimmer 1.4s ease-in-out infinite;
        border-radius: 8px;
      }

      .sd-card {
        transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease;
      }
      .sd-card:hover {
        box-shadow: 0 4px 18px -4px rgba(11,37,64,.08);
      }

      .sd-row {
        transition: border-color .18s ease, background .18s ease, transform .18s ease;
      }
      .sd-row:hover {
        transform: translateX(-2px);
      }

      .sd-btn { transition: background .18s ease, color .18s ease, border-color .18s ease, transform .12s ease; }
      .sd-btn:active { transform: scale(.97); }

      .sd-nav-item { transition: background .18s ease, color .18s ease, border-color .18s ease; }

      .sd-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
      .sd-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      .sd-scroll::-webkit-scrollbar-track { background: transparent; }

      *:focus-visible {
        outline: 2px solid ${ACTION};
        outline-offset: 2px;
        border-radius: 4px;
      }

      @media (prefers-reduced-motion: reduce) {
        .sd-fade-up, .sd-fade-in, .sd-scale-in, .sd-slide-in, .sd-skeleton {
          animation: none !important;
        }
        .sd-card, .sd-row, .sd-btn { transition: none !important; }
      }

      /* ── Mobile layout ── */
      @media (max-width: 860px) {
        .sd-sidebar { display: none !important; }
        .sd-main { width: 100% !important; }
        .sd-topbar { padding: 0 1rem !important; }
        .sd-welcome { padding: 1rem 1rem !important; }
        .sd-body { padding: 1rem .85rem 5.5rem !important; }
        .sd-stats-grid { grid-template-columns: 1fr 1fr !important; }
        .sd-stats-grid > *:last-child { grid-column: span 2; }
        .sd-week-grid { grid-template-columns: repeat(7, minmax(86px,1fr)) !important; overflow-x: auto; }
        .sd-mobile-tabbar { display: flex !important; }
        .sd-form-grid { grid-template-columns: 1fr !important; }
        .sd-schools-summary { grid-template-columns: 1fr 1fr !important; }
      }
      @media (min-width: 861px) {
        .sd-mobile-tabbar { display: none !important; }
      }
    `}</style>
  );
}

// ─────────────────────────────────────────────────────────
// Shared UI atoms
// ─────────────────────────────────────────────────────────
function Card({ children, style = {}, className = "", delay = 0 }) {
  return (
    <div
      className={`sd-card sd-fade-up ${className}`}
      style={{
        background: "#fff", borderRadius: 16,
        border: `1px solid ${LINE}`, padding: "1.4rem",
        animationDelay: `${delay}ms`, ...style,
      }}
    >
      {children}
    </div>
  );
}

function SecTitle({ children, icon: Icon, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: "1.15rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {Icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 9, background: CANVAS,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: ACTION_DEEP, flexShrink: 0,
          }}>
            <Icon size={15} />
          </div>
        )}
        <h2 style={{ fontSize: 15.5, fontWeight: 800, color: INK, margin: 0, letterSpacing: "-.01em" }}>
          {children}
        </h2>
      </div>
      {action}
    </div>
  );
}

function Tag({ children, bg = "#EAF3FC", color = ACTION_DEEP }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: "3px 11px", borderRadius: 20, display: "inline-block",
      whiteSpace: "nowrap", letterSpacing: "-.01em",
    }}>
      {children}
    </span>
  );
}

function Spinner({ size = 20, color = ACTION }) {
  return <Loader2 size={size} style={{ animation: "spin .85s linear infinite", color }} />;
}

function SkeletonCard({ lines = 3, height = 64 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="sd-skeleton" style={{ height, borderRadius: 12 }} />
      ))}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }} className="sd-stats-grid">
      {[0, 1, 2].map((i) => (
        <Card key={i} style={{ padding: "1.1rem" }} delay={i * 60}>
          <div className="sd-skeleton" style={{ height: 26, width: "40%", margin: "0 auto 8px" }} />
          <div className="sd-skeleton" style={{ height: 11, width: "70%", margin: "0 auto" }} />
        </Card>
      ))}
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div className="sd-fade-in" style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      padding: "3rem 1.5rem", textAlign: "center",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%", background: DANGER_BG,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertCircle size={24} color={DANGER} />
      </div>
      <div style={{ fontSize: 13.5, color: "#64748B", maxWidth: 280, lineHeight: 1.6 }}>{message}</div>
      {onRetry && (
        <button className="sd-btn" onClick={onRetry} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 18px", borderRadius: 10,
          border: `1.5px solid ${ACTION}`, background: "#fff",
          color: ACTION, fontSize: 12.5, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          <RefreshCw size={13} /> {t("studentDashboard.retry")}
        </button>
      )}
    </div>
  );
}

function Empty({ text, icon: Icon = AlertCircle }) {
  const { t } = useLanguage();
  return (
    <div className="sd-fade-in" style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "2.4rem 1rem",
    }}>
      <Icon size={26} style={{ opacity: .45 }} />
      {text ?? t("studentDashboard.common.noData")}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sidebar (desktop)
// ─────────────────────────────────────────────────────────
function Sidebar({ active, setActive, profile, profileLoading, enrollments, onLogout }) {
  const { t, dir } = useLanguage();

  return (
    <aside className="sd-sidebar" dir={dir} style={{
      width: 232, flexShrink: 0, background: INK,
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "1.15rem 1.1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `linear-gradient(135deg, ${ACTION} 0%, ${ACTION_DEEP} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, boxShadow: `0 4px 12px -2px ${ACTION}66`,
        }}>🎓</div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>
            {t("studentDashboard.sidebar.platformName")}
          </div>
          <div style={{ fontSize: 10, color: "#5B7494", marginTop: 1 }}>
            {t("studentDashboard.sidebar.subtitle")}
          </div>
        </div>
      </div>

      {/* Student badge */}
      <div style={{
        padding: "11px 1.1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.025)",
      }}>
        {profileLoading ? (
          <>
            <div className="sd-skeleton" style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
            <div style={{ flex: 1 }}>
              <div className="sd-skeleton" style={{ height: 10, width: "70%", marginBottom: 6, background: "rgba(255,255,255,.06)" }} />
              <div className="sd-skeleton" style={{ height: 8, width: "45%", background: "rgba(255,255,255,.06)" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `linear-gradient(135deg, ${ACTION} 0%, ${ACTION_DEEP} 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12.5, fontWeight: 800, color: "#fff",
              border: "2px solid rgba(255,255,255,.15)", flexShrink: 0,
            }}>
              {profile ? initials(profile.fullName) : "?"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 700, color: "#E8EEF6",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {profile?.fullName || "..."}
              </div>
              <div style={{ fontSize: 10, color: "#3FBF93", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#3FBF93",
                  display: "inline-block", animation: "pulseDot 2s ease-in-out infinite",
                }} />
                {profile?.level || t("studentDashboard.sidebar.enrolledStudentFallback")}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Nav */}

      <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          <Link to={"/home"}>

          <button

              className="sd-nav-item"
              onClick={()=>{setActive(true)}}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%",
                padding: "10px 1.1rem", border: "none", cursor: "pointer",
                background: "rgba(28,111,184,.18)",
                borderRight: dir === "rtl" ? `3px solid transparent` : undefined,
                borderLeft: dir !== "rtl" ? `3px solid transparent` : undefined,
                color: "#7E93AC",
                fontSize: 13, fontWeight:  500,
                fontFamily: "'Cairo',system-ui,sans-serif",
                textAlign: dir === "rtl" ? "right" : "left",
              }}

            >
              <Home></Home>
              {t("studentDashboard.sidebar.homePage")}
            </button></Link>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              className="sd-nav-item"
              onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%",
                padding: "10px 1.1rem", border: "none", cursor: "pointer",
                background: isActive ? "rgba(28,111,184,.18)" : "transparent",
                borderRight: dir === "rtl" ? `3px solid ${isActive ? ACTION : "transparent"}` : undefined,
                borderLeft: dir !== "rtl" ? `3px solid ${isActive ? ACTION : "transparent"}` : undefined,
                color: isActive ? "#fff" : "#7E93AC",
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                fontFamily: "'Cairo',system-ui,sans-serif",
                textAlign: dir === "rtl" ? "right" : "left",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,.045)"; e.currentTarget.style.color = "#C5D4E5"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7E93AC"; } }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? "#5BA3E0" : "inherit" }} />
              {t(`studentDashboard.nav.${item.id}`)}
            </button>
          );
        })}
      </nav>

      {enrollments && enrollments.length > 0 && (
        <div style={{ padding: "8px 1.1rem" }}>
          <div style={{
            background: "rgba(28,111,184,.14)", borderRadius: 10,
            padding: "8px 12px", fontSize: 11, color: "#8FBFEA",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "1px solid rgba(28,111,184,.2)",
          }}>
            <span>{t("studentDashboard.sidebar.registeredSchools")}</span>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{enrollments.length}</span>
          </div>
        </div>
      )}

      <div style={{ padding: "12px 1.1rem", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <button className="sd-btn" onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 8, background: "none",
          border: "none", color: "#5B7494", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", width: "100%", padding: "6px 0",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#A8C0D9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#5B7494")}
        >
          <LogOut size={14} /> {t("studentDashboard.sidebar.logout")}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// Mobile bottom tab bar
// ─────────────────────────────────────────────────────────
function MobileTabBar({ active, setActive }) {
  const { t } = useLanguage();
  return (
    <nav className="sd-mobile-tabbar" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#fff", borderTop: `1px solid ${LINE}`,
      padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
      justifyContent: "space-around",
      boxShadow: "0 -8px 24px -8px rgba(11,37,64,.08)",
    }}>
      <Link to={"/home"}>
          <button
            className="sd-btn"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              border: "none", background: "none", cursor: "pointer",
              padding: "6px 14px", borderRadius: 12,
              color: "#94A3B8",
              fontFamily: "inherit",
            }}
          >
            <Home/>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{t("studentDashboard.sidebar.homePage")}</span>
          </button>
          </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className="sd-btn"
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              border: "none", background: "none", cursor: "pointer",
              padding: "6px 14px", borderRadius: 12,
              color: isActive ? ACTION_DEEP : "#94A3B8",
              fontFamily: "inherit",
            }}
          >
            <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 600 }}>{t(`studentDashboard.nav.${item.id}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// Page: حصصي
// ─────────────────────────────────────────────────────────
function PageSessions({ sessions, enrollments, invoices, moduleMap }) {
  const { t, dir } = useLanguage();

  const invoiceStyle = (status) => {
    switch (status) {
      case "PAID":    return { label: t("studentDashboard.invoiceStatus.PAID"),    color: SUCCESS, bg: SUCCESS_BG };
      case "PENDING": return { label: t("studentDashboard.invoiceStatus.PENDING"), color: WARNING, bg: WARNING_BG };
      case "OVERDUE": return { label: t("studentDashboard.invoiceStatus.OVERDUE"), color: DANGER,  bg: DANGER_BG };
      default:        return { label: status || "—", color: "#64748B", bg: "#F1F5F9" };
    }
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(localeForDir(dir), { weekday: "long", month: "long", day: "numeric" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrolledModuleIds = new Set(
    (enrollments || []).map((e) => e.moduleId ?? e.module?.id)
  );

  const upcoming = (sessions || [])
    .filter((s) => {
      if (s.isArchived || s.archived) return false;
      if (!enrolledModuleIds.has(s.moduleId)) return false;
      return new Date(s.date) >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 20);

  const totalWeekly = (enrollments || []).reduce(
    (sum, e) => sum + (moduleMap[e.moduleId ?? e.module?.id]?.schedules?.length || 0), 0
  );
  const unpaidCount = (invoices || []).filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="sd-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: t("studentDashboard.sessions.statWeekly"), value: totalWeekly || "—", icon: CalendarDays, color: ACTION_DEEP },
          { label: t("studentDashboard.sessions.statUpcoming"), value: upcoming.length, icon: BookOpen, color: SUCCESS },
          { label: t("studentDashboard.sessions.statUnpaid"), value: unpaidCount, icon: Wallet, color: unpaidCount > 0 ? DANGER : "#64748B" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} delay={i * 70} style={{ textAlign: "center", padding: "1.15rem 1rem" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, margin: "0 auto 8px",
                background: `${stat.color}14`, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} color={stat.color} />
              </div>
              <div style={{ fontSize: 23, fontWeight: 800, color: stat.color, letterSpacing: "-.02em" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, fontWeight: 600 }}>{stat.label}</div>
            </Card>
          );
        })}
      </div>

      <Card delay={120}>
        <SecTitle icon={BookOpen}>{t("studentDashboard.sessions.upcomingTitle")}</SecTitle>
        {upcoming.length === 0 ? (
          <Empty text={t("studentDashboard.sessions.noUpcoming")} icon={CalendarDays} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {upcoming.map((s, i) => {
              const c   = pal(i);
              const mod = moduleMap[s.moduleId];
              return (
                <div key={s.id} className="sd-row sd-slide-in" style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "11px 13px", borderRadius: 12,
                  border: `1px solid ${LINE}`, background: "#FBFCFE",
                  borderRight: dir === "rtl" ? `3px solid ${c.accent}` : undefined,
                  borderLeft: dir !== "rtl" ? `3px solid ${c.accent}` : undefined,
                  animationDelay: `${i * 35}ms`,
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = c.bg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FBFCFE")}
                >
                  <div style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 10, padding: "6px 13px",
                    textAlign: "center", flexShrink: 0, minWidth: 84,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>
                      {fmtDate(s.date)}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                      <Clock size={10} /> {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                      {mod?.subjectName || mod?.name || fill(t("studentDashboard.sessions.moduleFallback"), { id: s.moduleId })}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><GraduationCap size={11} /> {mod?.teacherName || "—"}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {mod?.classroomName || "—"}</span>
                    </div>
                  </div>
                  <Tag bg={c.bg} color={c.text}>{mod?.level || "—"}</Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card delay={170}>
        <SecTitle icon={Wallet}>{t("studentDashboard.sessions.invoicesTitle")}</SecTitle>
        {!invoices || invoices.length === 0 ? (
          <Empty text={t("studentDashboard.sessions.noInvoices")} icon={Wallet} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {invoices.map((inv, i) => {
              const st = invoiceStyle(inv.status);
              return (
                <div key={inv.id} className="sd-row sd-slide-in" style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "11px 14px", borderRadius: 12,
                  border: `1px solid ${LINE}`, background: "#FBFCFE",
                  borderRight: dir === "rtl" ? `3px solid ${st.color}` : undefined,
                  borderLeft: dir !== "rtl" ? `3px solid ${st.color}` : undefined,
                  animationDelay: `${i * 35}ms`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>
                      {inv.moduleName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                      📅 {inv.period ? String(inv.period).replace("-", "/") : "—"}
                      {inv.dueDate ? ` · ${t("studentDashboard.sessions.dueDateLabel")} ${new Date(inv.dueDate).toLocaleDateString(localeForDir(dir))}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 4 }}>
                      {inv.amount ? `${inv.amount} ${t("studentDashboard.currency")}` : "—"}
                    </div>
                    <Tag bg={st.bg} color={st.color}>{st.label}</Tag>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: الجدول الأسبوعي
// ─────────────────────────────────────────────────────────
function PageSchedule({ enrollments, moduleMap }) {
  const { t, dir } = useLanguage();

  const byDay = {};
  WEEK_ORDER_KEYS.forEach((k) => { byDay[k] = []; });

  (enrollments || []).forEach((enr, idx) => {
    const mod = moduleMap[enr.moduleId ?? enr.module?.id];
    if (!mod) return;
    (mod.schedules || []).forEach((sch) => {
      const dayKey = WEEK_DAYS_KEY[sch.dayOfWeek] || sch.dayOfWeek;
      if (byDay[dayKey]) byDay[dayKey].push({ ...sch, mod, idx });
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Card>
        <SecTitle icon={CalendarDays}>{t("studentDashboard.schedule.title")}</SecTitle>
        <div className="sd-week-grid sd-scroll" style={{
          display: "grid",
          gridTemplateColumns: `repeat(${WEEK_ORDER_KEYS.length}, 1fr)`,
          gap: 7,
        }}>
          {WEEK_ORDER_KEYS.map((dayKey, di) => {
            const slots = byDay[dayKey];
            const isToday = false;
            return (
              <div key={dayKey} className="sd-fade-up" style={{ animationDelay: `${di * 40}ms` }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: ACTION_DEEP,
                  textAlign: "center", padding: "6px 0",
                  borderRadius: 8, marginBottom: 6,
                  background: isToday ? "#EAF3FC" : "transparent",
                }}>
                  {t(`studentDashboard.weekDays.${dayKey}`)}
                </div>
                {slots.length === 0
                  ? <div style={{
                      height: 48, borderRadius: 10, background: "#FAFBFD",
                      border: "1.5px dashed #E2E8F0", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#CBD5E1",
                    }}>—</div>
                  : slots.map((slot, si) => {
                      const c = pal(slot.idx);
                      return (
                        <div key={si} className="sd-row" style={{
                          background: c.bg, border: `1px solid ${c.border}`,
                          borderRight: dir === "rtl" ? `3px solid ${c.accent}` : undefined,
                          borderLeft: dir !== "rtl" ? `3px solid ${c.accent}` : undefined,
                          borderRadius: 9, padding: "6px 8px", marginBottom: 5,
                          cursor: "default",
                        }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: c.text, lineHeight: 1.3 }}>
                            {slot.mod.subjectName || slot.mod.name || "—"}
                          </div>
                          <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 2, display: "flex", alignItems: "center", gap: 2 }}>
                            <Clock size={9} /> {fmtTime(slot.startTime)}
                          </div>
                          <div style={{ fontSize: 9, color: c.text, opacity: .7, marginTop: 1 }}>
                            {slot.mod.classroomName || ""}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            );
          })}
        </div>
      </Card>

      <Card delay={100}>
        <SecTitle icon={BookOpen}>{t("studentDashboard.schedule.myModules")}</SecTitle>
        {(enrollments || []).length === 0
          ? <Empty text={t("studentDashboard.schedule.noModules")} icon={BookOpen} />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(enrollments || []).map((enr, i) => {
                const c   = pal(i);
                const mod = moduleMap[enr.moduleId ?? enr.module?.id];
                if (!mod) return null;
                return (
                  <div key={enr.id || i} className="sd-row" style={{
                    display: "flex", alignItems: "center", gap: 13,
                    padding: "11px 13px", borderRadius: 12,
                    border: `1px solid ${c.border}`, background: c.bg,
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 11, background: "#fff",
                      border: `1px solid ${c.border}`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>📚</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: c.text }}>
                        {mod.subjectName || mod.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><GraduationCap size={11} /> {mod.teacherName || "—"}</span>
                        <span>{fill(t("studentDashboard.schedule.sessionsPerWeek"), { count: mod.schedules?.length || 0 })}</span>
                      </div>
                    </div>
                    <Tag bg="#fff" color={c.text}>{mod.level}</Tag>
                  </div>
                );
              })}
            </div>
          )
        }
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: مدارسي المسجلة
// ─────────────────────────────────────────────────────────
function PageSchools({ enrollments, moduleMap, invoices }) {
  const { t, dir } = useLanguage();

  const bySchool = {};
  (enrollments || []).forEach((enr) => {
    const sid = enr.schoolId ?? enr.school?.id ?? "unknown";
    if (!bySchool[sid]) bySchool[sid] = { schoolId: sid, schoolName: enr.schoolName || enr.school?.name || fill(t("studentDashboard.schools.schoolFallback"), { id: sid }), items: [] };
    bySchool[sid].items.push(enr);
  });
  const schools = Object.values(bySchool);

  const totalInvoiced = (invoices || [])
    .filter((inv) => inv.status !== "PAID")
    .reduce((s, inv) => s + (inv.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="sd-schools-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ textAlign: "center", padding: "1.15rem 1rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, margin: "0 auto 8px",
            background: "#EAF3FC", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <School size={16} color={ACTION_DEEP} />
          </div>
          <div style={{ fontSize: 25, fontWeight: 800, color: ACTION_DEEP }}>{schools.length}</div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
            {t("studentDashboard.schools.registeredSchools")}
          </div>
        </Card>
        <Card delay={60} style={{ textAlign: "center", padding: "1.15rem 1rem" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, margin: "0 auto 8px",
            background: SUCCESS_BG, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Wallet size={16} color={SUCCESS} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, color: SUCCESS }}>
            {totalInvoiced ? `${totalInvoiced} ${t("studentDashboard.currency")}` : "—"}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
            {t("studentDashboard.schools.amountDue")}
          </div>
        </Card>
      </div>

      {schools.length === 0
        ? <Card><Empty text={t("studentDashboard.schools.noSchools")} icon={School} /></Card>
        : schools.map((school, si) => {
            const c = pal(si);
            return (
              <Card key={school.schoolId} delay={si * 80}>
                <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: "1.05rem" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 13, background: c.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, border: `1.5px solid ${c.border}`, flexShrink: 0,
                  }}>🏫</div>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>
                      {school.schoolName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
                      {fill(t("studentDashboard.schools.moduleCount"), { count: school.items.length })}
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: `1px solid ${LINE}`, margin: "0 0 13px" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {school.items.map((enr, ei) => {
                    const mod = moduleMap[enr.moduleId ?? enr.module?.id];
                    return (
                      <div key={enr.id || ei} className="sd-row" style={{
                        display: "flex", alignItems: "center", gap: 11,
                        padding: "9px 13px", borderRadius: 10,
                        background: c.bg, border: `1px solid ${c.border}`,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                            {mod?.subjectName || mod?.name || fill(t("studentDashboard.sessions.moduleFallback"), { id: enr.moduleId })}
                          </div>
                          {mod && (
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                              👨‍🏫 {mod.teacherName || "—"} · {fill(t("studentDashboard.schedule.sessionsPerWeek"), { count: mod.schedules?.length || 0 })}
                            </div>
                          )}
                        </div>
                        {mod && <Tag bg="#fff" color={c.text}>{mod.level}</Tag>}
                        {enr.status && (
                          <Tag
                            bg={enr.status === "ACTIVE" ? SUCCESS_BG : WARNING_BG}
                            color={enr.status === "ACTIVE" ? SUCCESS : WARNING}
                          >
                            {enr.status === "ACTIVE"
                              ? t("studentDashboard.enrollmentStatus.ACTIVE")
                              : enr.status === "PENDING"
                                ? t("studentDashboard.enrollmentStatus.PENDING")
                                : enr.status}
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: بروفايل شخصي
// ─────────────────────────────────────────────────────────
function PageProfile({ profile, enrollments, moduleMap, onProfileUpdated }) {
  const { t, dir } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const [form, setForm] = useState({
    fullName:    profile?.fullName    || "",
    parentName:  profile?.parentName  || "",
    parentPhone: profile?.parentPhone || "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName:    profile.fullName    || "",
        parentName:  profile.parentName  || "",
        parentPhone: profile.parentPhone || "",
      });
    }
  }, [profile]);

  const inp = {
    padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${LINE}`,
    fontSize: 13, fontFamily: "inherit", color: INK,
    background: "#FBFCFE", outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color .18s ease, box-shadow .18s ease",
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      await studentApi.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setEditing(false);
      onProfileUpdated?.();
    } catch (err) {
      setSaveErr(err?.response?.data?.message || t("studentDashboard.profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const totalWeekly = (enrollments || []).reduce(
    (sum, e) => sum + (moduleMap[e.moduleId ?? e.module?.id]?.schedules?.length || 0), 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 580 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 17, flexWrap: "wrap" }}>
          <div style={{
            width: 74, height: 74, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ACTION} 0%, ${ACTION_DEEP} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 25, fontWeight: 800, color: "#fff",
            border: "3px solid #EAF3FC", flexShrink: 0,
            boxShadow: `0 6px 16px -4px ${ACTION}55`,
          }}>
            {initials(form.fullName)}
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>{form.fullName || "—"}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
              {profile?.email || "—"}
            </div>
            {profile?.level && (
              <div style={{ fontSize: 11.5, color: ACTION_DEEP, marginTop: 5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <GraduationCap size={12} /> {profile.level}
              </div>
            )}
          </div>
          <button className="sd-btn" onClick={() => { setEditing((e) => !e); setSaveErr(null); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            border: `1.5px solid ${editing ? LINE : ACTION}`,
            background: editing ? "#fff" : "#EAF3FC",
            color: editing ? "#64748B" : ACTION_DEEP,
            fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Edit3 size={13} /> {editing ? t("studentDashboard.profile.cancel") : t("studentDashboard.profile.edit")}
          </button>
        </div>
      </Card>

      <Card delay={80}>
        <SecTitle icon={User} action={saved && (
          <span className="sd-scale-in" style={{ fontSize: 12, color: SUCCESS, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <Check size={13} /> {t("studentDashboard.profile.savedSuccess")}
          </span>
        )}>
          {t("studentDashboard.profile.personalInfoTitle")}
        </SecTitle>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="sd-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>
                {t("studentDashboard.profile.emailLabel")}
              </label>
              <div style={{ fontSize: 13, color: "#94A3B8", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
                {profile?.email || "—"}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>
                {t("studentDashboard.profile.levelLabel")}
              </label>
              <div style={{ fontSize: 13, color: "#94A3B8", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
                {profile?.level || "—"}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>
              {t("studentDashboard.profile.fullNameLabel")}
            </label>
            {editing
              ? <input
                  style={inp} value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  onFocus={(e) => { e.target.style.borderColor = ACTION; e.target.style.boxShadow = `0 0 0 3px ${ACTION}1A`; }}
                  onBlur={(e) => { e.target.style.borderColor = LINE; e.target.style.boxShadow = "none"; }}
                />
              : <div style={{ fontSize: 14, color: INK, padding: "9px 0", borderBottom: `1px solid ${LINE}`, fontWeight: 600 }}>
                  {form.fullName || "—"}
                </div>
            }
          </div>

          <div className="sd-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>
                {t("studentDashboard.profile.parentNameLabel")}
              </label>
              {editing
                ? <input
                    style={inp} value={form.parentName}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                    onFocus={(e) => { e.target.style.borderColor = ACTION; e.target.style.boxShadow = `0 0 0 3px ${ACTION}1A`; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; e.target.style.boxShadow = "none"; }}
                  />
                : <div style={{ fontSize: 14, color: INK, padding: "9px 0", borderBottom: `1px solid ${LINE}`, fontWeight: 600 }}>
                    {form.parentName || "—"}
                  </div>
              }
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 5 }}>
                {t("studentDashboard.profile.parentPhoneLabel")}
              </label>
              {editing
                ? <input
                    style={inp} type="tel" value={form.parentPhone}
                    onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                    onFocus={(e) => { e.target.style.borderColor = ACTION; e.target.style.boxShadow = `0 0 0 3px ${ACTION}1A`; }}
                    onBlur={(e) => { e.target.style.borderColor = LINE; e.target.style.boxShadow = "none"; }}
                  />
                : <div style={{ fontSize: 14, color: INK, padding: "9px 0", borderBottom: `1px solid ${LINE}`, direction: "ltr", textAlign: dir === "rtl" ? "right" : "left", fontWeight: 600 }}>
                    {form.parentPhone || "—"}
                  </div>
              }
            </div>
          </div>

          <hr style={{ border: "none", borderTop: `1px solid ${LINE}` }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: t("studentDashboard.profile.statSchools"),  value: [...new Set((enrollments||[]).map(e => e.schoolId ?? e.school?.id))].length },
              { label: t("studentDashboard.profile.statModules"), value: (enrollments || []).length },
              { label: t("studentDashboard.profile.statWeeklySessions"), value: totalWeekly },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: CANVAS, borderRadius: 11,
                padding: "11px 13px", border: `1px solid ${LINE}`,
              }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: ACTION_DEEP }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {saveErr && (
            <div className="sd-fade-in" style={{
              fontSize: 12, color: DANGER, background: DANGER_BG,
              border: "1px solid #F7C9C9", borderRadius: 10, padding: "9px 13px",
            }}>
              ⚠️ {saveErr}
            </div>
          )}

          {editing && (
            <div className="sd-fade-in" style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 4 }}>
              <button className="sd-btn" onClick={() => { setEditing(false); setSaveErr(null); }} style={{
                padding: "8px 18px", borderRadius: 10,
                border: `1.5px solid ${LINE}`, background: "#fff",
                color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t("studentDashboard.profile.cancel")}
              </button>
              <button className="sd-btn" onClick={handleSave} disabled={saving} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 20px", borderRadius: 10, border: "none",
                background: saving ? "#8FB8DC" : ACTION_DEEP,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                boxShadow: saving ? "none" : `0 4px 12px -3px ${ACTION_DEEP}55`,
              }}>
                {saving ? <Spinner size={13} color="#fff" /> : <Check size={13} />}
                {saving ? t("studentDashboard.profile.saving") : t("studentDashboard.profile.saveChanges")}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main StudentDashboard
// ─────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth?.() || {};
  const { t, dir } = useLanguage();
  const [active, setActive] = useState("sessions");
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => { setTransitionKey((k) => k + 1); }, [active]);
  const {
  data: courseEnrollments,
  loading: courseEnrollLoading,
  error: courseEnrollError,
  reload: reloadCourseEnroll,
} = useFetch(() => studentApi.getCourseEnrollments());

const {
  data: courseInvoices,
  loading: courseInvoicesLoading,
  error: courseInvoicesError,
  reload: reloadCourseInvoices,
} = useFetch(() => studentApi.getCourseInvoices());

  const PAGE_TITLES = {
    sessions: t("studentDashboard.pages.sessions.title"),
    schedule: t("studentDashboard.pages.schedule.title"),
    schools:  t("studentDashboard.pages.schools.title"),
    profile:  t("studentDashboard.pages.profile.title"),
  };
  const PAGE_SUBTITLES = {
    sessions: t("studentDashboard.pages.sessions.subtitle"),
    schedule: t("studentDashboard.pages.schedule.subtitle"),
    schools:  t("studentDashboard.pages.schools.subtitle"),
    profile:  t("studentDashboard.pages.profile.subtitle"),
  };

  // ── Core fetches (unchanged) ─────────────────────────
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useFetch(() => studentApi.getProfile(), t("studentDashboard.errors.profileLoad"));

  const {
    data: enrollments,
    loading: enrollLoading,
    error: enrollError,
    reload: reloadEnroll,
  } = useFetch(() => studentApi.getEnrollments(), t("studentDashboard.errors.enrollmentsLoad"));

  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
    reload: reloadInvoices,
  } = useFetch(() => studentApi.getInvoices(), t("studentDashboard.errors.invoicesLoad"));

  const schoolIds = enrollments
    ? [...new Set(enrollments.map((e) => e.schoolId ?? e.school?.id).filter(Boolean))]
    : [];

  const [allSessions, setAllSessions]   = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (schoolIds.length === 0) { setAllSessions([]); return; }
    setSessionsLoading(true);
    Promise.all(schoolIds.map((id) => studentApi.getSessionsBySchool(id)))
      .then((results) => {
        const merged = results.flatMap((r) => r.data?.content ?? r.data ?? []);
        setAllSessions(merged);
      })
      .catch(() => setAllSessions([]))
      .finally(() => setSessionsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schoolIds)]);

  const [moduleMap, setModuleMap] = useState({});
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    if (!enrollments || enrollments.length === 0) { setModuleMap({}); return; }
    const toFetch = enrollments.reduce((acc, enr) => {
      const sid   = enr.schoolId   ?? enr.school?.id;
      const level = enr.level      ?? enr.module?.level ?? profile?.level;
      if (sid && level) {
        const key = `${sid}_${level}`;
        if (!acc[key]) acc[key] = { schoolId: sid, level };
      }
      return acc;
    }, {});

    const entries = Object.values(toFetch);
    if (entries.length === 0) {
      const map = {};
      enrollments.forEach((enr) => {
        if (enr.module) map[enr.module.id] = enr.module;
        else if (enr.moduleId && enr.moduleName) map[enr.moduleId] = { id: enr.moduleId, name: enr.moduleName, subjectName: enr.moduleName };
      });
      setModuleMap(map);
      return;
    }

    setModulesLoading(true);
    Promise.all(entries.map((e) => studentApi.browseModules(e.schoolId, e.level)))
      .then((results) => {
        const map = {};
        results.forEach((r) => {
          const mods = r.data?.content ?? r.data ?? [];
          mods.forEach((m) => { map[m.id] = m; });
        });
        enrollments.forEach((enr) => {
          if (enr.module) map[enr.module.id] = enr.module;
        });
        setModuleMap(map);
      })
      .catch(() => setModuleMap({}))
      .finally(() => setModulesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(enrollments?.map((e) => e.id))]);

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/");
  };

  const reloadAll = () => {
    reloadProfile();
    reloadEnroll();
    reloadInvoices();
     reloadCourseEnroll();     // NEW
  reloadCourseInvoices(); 
  };

  const isLoading = profileLoading || enrollLoading || invoicesLoading || sessionsLoading || modulesLoading ||courseEnrollLoading || courseInvoicesLoading;

  const renderPage = () => {
    if (profileLoading) return <StatSkeleton />;
    if (profileError)   return <ErrorBlock message={profileError || t("studentDashboard.errors.profileLoad")} onRetry={reloadProfile} />;

    switch (active) {
      case "sessions":
        if (enrollLoading || invoicesLoading) return <StatSkeleton />;
        if (enrollError)   return <ErrorBlock message={enrollError || t("studentDashboard.errors.enrollmentsLoad")}   onRetry={reloadEnroll} />;
        if (invoicesError) return <ErrorBlock message={invoicesError || t("studentDashboard.errors.invoicesLoad")} onRetry={reloadInvoices} />;
        return (
          <PageSessions
            sessions={allSessions}
            enrollments={enrollments || []}
            invoices={invoices || []}
            moduleMap={moduleMap}
          />
        );

      case "schedule":
        if (enrollLoading || modulesLoading) return <SkeletonCard lines={4} height={90} />;
        if (enrollError) return <ErrorBlock message={enrollError || t("studentDashboard.errors.enrollmentsLoad")} onRetry={reloadEnroll} />;
        return (
          <PageSchedule
            enrollments={enrollments || []}
            moduleMap={moduleMap}
          />
        );

      case "schools":
        if (enrollLoading || invoicesLoading) return <SkeletonCard lines={3} height={100} />;
        if (enrollError) return <ErrorBlock message={enrollError || t("studentDashboard.errors.enrollmentsLoad")} onRetry={reloadEnroll} />;
        return (
          <PageSchools
            enrollments={enrollments || []}
            moduleMap={moduleMap}
            invoices={invoices || []}
          />
        );

      case "profile":
        return (
          <PageProfile
            profile={profile}
            enrollments={enrollments || []}
            moduleMap={moduleMap}
            onProfileUpdated={reloadProfile}
          />
        );
        case "courses":
  if (courseEnrollLoading || courseInvoicesLoading) return <StatSkeleton />;
  if (courseEnrollError)   return <ErrorBlock message={courseEnrollError || t("studentDashboard.errors.enrollmentsLoad")}   onRetry={reloadCourseEnroll} />;
  if (courseInvoicesError) return <ErrorBlock message={courseInvoicesError || t("studentDashboard.errors.invoicesLoad")} onRetry={reloadCourseInvoices} />;
  return (
    <PageCourses
      courseEnrollments={courseEnrollments || []}
      courseInvoices={courseInvoices || []}
    />
  );

      default:
        return null;
    }
  };

  const pageTitleKey = `studentDashboard.pages.${active}.title`;
  const pageSubtitleKey = `studentDashboard.pages.${active}.subtitle`;

  return (
    <div dir={dir} style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "'Cairo', system-ui, Arial, sans-serif",
      background: CANVAS,
    }}>
      <GlobalStyles />

      <Sidebar
        active={active}
        setActive={setActive}
        profile={profile}
        profileLoading={profileLoading}
        enrollments={enrollments}
        onLogout={handleLogout}
      />

      <main className="sd-main" style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div className="sd-topbar" style={{
          background: "rgba(255,255,255,.92)", backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${LINE}`,
          padding: "0 1.6rem", height: 58,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: INK, margin: 0, letterSpacing: "-.01em" }}>
              {t(pageTitleKey)}
            </h1>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1, display: "none" }} className="sd-subtitle">
              {t(pageSubtitleKey)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isLoading && <Spinner size={16} />}
            <button className="sd-btn" onClick={reloadAll} title={t("studentDashboard.refresh")} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34, borderRadius: 10,
              border: `1.5px solid ${LINE}`, background: "#fff",
              cursor: "pointer", color: "#64748B",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ACTION_DEEP; e.currentTarget.style.borderColor = ACTION; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; e.currentTarget.style.borderColor = LINE; }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div className="sd-welcome" style={{
          background: `linear-gradient(120deg, ${INK} 0%, ${ACTION_DEEP} 100%)`,
          padding: "1.3rem 1.6rem", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", left: -40, top: -60, width: 180, height: 180,
            borderRadius: "50%", background: "rgba(255,255,255,.05)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11.5, color: "#8FBFEA", marginBottom: 3, fontWeight: 600 }}>
              {t("studentDashboard.welcome.greeting")}
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-.01em" }}>
              {profileLoading ? t("studentDashboard.common.loading") : (profile?.fullName || "—")}
            </h2>
            {profile?.level && !profileLoading && (
              <div style={{ fontSize: 11.5, color: "#A8CCEC", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                <GraduationCap size={12} /> {t("studentDashboard.welcome.levelLabel")} {profile.level}
              </div>
            )}
          </div>
        </div>

        {/* Page body */}
        <div className="sd-body" style={{ padding: "1.6rem", flex: 1 }}>
          <div key={transitionKey} className="sd-fade-up">
            {renderPage()}
          </div>
        </div>
      </main>

      <MobileTabBar active={active} setActive={setActive} />
    </div>
  );
}