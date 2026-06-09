import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, User, CalendarDays, School,
  LogOut, Edit3, Check, AlertCircle,
  Loader2, RefreshCw, ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api"; // your JWT-authenticated Axios instance

// ─────────────────────────────────────────────────────────
// API helpers  — all calls go through the auth'd Axios instance
// ─────────────────────────────────────────────────────────
const studentApi = {
  getProfile:    ()           => api.get("api/students/profile"),
  updateProfile: (data)       => api.put("api/students/profile", data),
  getEnrollments: ()          => api.get("api/students/my-enrollments"),    // TODO: confirm endpoint
  getSessions:    ()          => api.get("api/students/my-sessions"),        // TODO: confirm endpoint
  getPayments:    ()          => api.get("api/students/my-payments"),        // TODO: confirm endpoint
  getUpcoming:    ()          => api.get("api/students/my-upcoming-sessions"),// TODO: confirm endpoint
};

// ─────────────────────────────────────────────────────────
// Color palette (4 rotating)
// ─────────────────────────────────────────────────────────
const PALETTE = [
  { bg:"#EBF4FE", text:"#0C447C", border:"#85B7EB", dot:"#185FA5" },
  { bg:"#E1F5EE", text:"#085041", border:"#5DCAA5", dot:"#0F6E56" },
  { bg:"#EEEDFE", text:"#3C3489", border:"#AFA9EC", dot:"#534AB7" },
  { bg:"#FAECE7", text:"#712B13", border:"#F0997B", dot:"#C05621" },
];
const pal = (i) => PALETTE[i % PALETTE.length];

const WEEK_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const SESSIONS_PER_MONTH = 4;

const PAGE_TITLES = {
  sessions:  "حصصي",
  schedule:  "برنامجي الأسبوعي",
  schools:   "مدارسي المسجلة",
  profile:   "بروفايل شخصي",
};

const NAV = [
  { id: "sessions",  icon: BookOpen,    label: "حصصي"              },
  { id: "schedule",  icon: CalendarDays, label: "برنامجي الأسبوعي"  },
  { id: "schools",   icon: School,      label: "مدارسي المسجلة"    },
  { id: "profile",   icon: User,        label: "بروفايل شخصي"      },
];

// ─────────────────────────────────────────────────────────
// Custom hook: fetch with loading/error state
// ─────────────────────────────────────────────────────────
function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─────────────────────────────────────────────────────────
// Shared tiny components
// ─────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: "1.5px solid #E8EEF6", padding: "1.25rem", ...style,
    }}>
      {children}
    </div>
  );
}

function SecTitle({ children }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 1.1rem" }}>
      {children}
    </h2>
  );
}

function Tag({ children, c }) {
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 600, padding: "2px 10px",
      borderRadius: 20, display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function Spinner({ size = 20 }) {
  return (
    <Loader2
      size={size}
      style={{ animation: "spin 1s linear infinite", color: "#185FA5" }}
    />
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 10, padding: "2rem", color: "#94A3B8",
    }}>
      <AlertCircle size={32} color="#E2A84B" />
      <div style={{ fontSize: 13, color: "#64748B", textAlign: "center" }}>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8,
            border: "1.5px solid #185FA5", background: "#EBF4FE",
            color: "#185FA5", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
      <Spinner size={28} />
    </div>
  );
}

// Helper: get student initials from fullName
function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────
function Sidebar({ active, setActive, profile, onLogout }) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: "#0F172A",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0,
      borderLeft: "1px solid rgba(255,255,255,.07)",
    }}>
      {/* Logo */}
      <div style={{
        padding: "1.1rem 1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: "#185FA5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🎓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>مدارس الدعم</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>لوحة الطالب</div>
        </div>
      </div>

      {/* Student badge */}
      <div style={{
        padding: "10px 1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 9,
        background: "rgba(255,255,255,.03)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "#185FA5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          border: "2px solid rgba(255,255,255,.15)",
        }}>
          {profile ? initials(profile.fullName) : "?"}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>
            {profile?.fullName || "..."}
          </div>
          <div style={{ fontSize: 10, color: "#1D9E75", marginTop: 1 }}>
            {profile?.level ? `المستوى: ${profile.level}` : "طالب مسجل ✓"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 1rem", border: "none", cursor: "pointer",
                background: isActive ? "rgba(24,95,165,.2)" : "transparent",
                borderRight: `3px solid ${isActive ? "#185FA5" : "transparent"}`,
                color: isActive ? "#fff" : "#64748B",
                fontSize: 13, fontWeight: 500,
                fontFamily: "'Cairo',system-ui,sans-serif",
                transition: "all .15s", textAlign: "right",
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "#CBD5E1"; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; } }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? "#185FA5" : "inherit" }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 1rem", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 8, background: "none",
            border: "none", color: "#475569", fontSize: 12, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit", width: "100%", padding: "5px 0",
            transition: "color .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"}
          onMouseLeave={e => e.currentTarget.style.color = "#475569"}
        >
          <LogOut size={14} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// Page: حصصي
// ─────────────────────────────────────────────────────────
function PageSessions({ enrollments, upcomingSessions, payments }) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("ar-MA", {
      weekday: "long", month: "long", day: "numeric",
    });

  const totalWeeklyCount = enrollments?.reduce((s, e) => s + (e.sessions?.length || 0), 0) || 0;
  const totalFees        = enrollments?.reduce((s, e) => s + (e.monthlyFee || e.price || 0), 0) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "الحصص الأسبوعية", value: totalWeeklyCount },
          { label: "حصص قادمة",       value: upcomingSessions?.length ?? "—" },
          { label: "رسوم شهرية",      value: totalFees ? `${totalFees} دج` : "—" },
        ].map(stat => (
          <Card key={stat.label} style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#185FA5" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Upcoming sessions list */}
      <Card>
        <SecTitle>الحصص القادمة</SecTitle>
        {!upcomingSessions || upcomingSessions.length === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1rem" }}>
            لا توجد حصص قادمة
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingSessions.map((s, i) => {
              const c = pal(i);
              return (
                <div
                  key={s.id || i}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    border: "1px solid #F1F5F9", background: "#FAFCFF",
                    transition: "border-color .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = c.border}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#F1F5F9"}
                >
                  <div style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 9, padding: "5px 12px",
                    textAlign: "center", flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: c.text }}>
                      {s.sessionDate ? fmt(s.sessionDate) : s.dayOfWeek || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>
                      🕐 {s.startTime || s.time || "—"}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                      {s.subject || s.moduleName || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {s.schoolName || s.school?.name || "—"}
                    </div>
                  </div>
                  <Tag c={c}>{s.type || s.sessionType || "حصة"}</Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Payment tracking per school */}
      <Card>
        <SecTitle>متابعة الدفع الشهري</SecTitle>
        {!enrollments || enrollments.length === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1rem" }}>
            لا توجد تسجيلات
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {enrollments.map((enr, i) => {
              const c = pal(i);
              // Match payment record for this enrollment/school
              const payRecord  = payments?.find(p =>
                p.enrollmentId === enr.id || p.schoolId === enr.schoolId
              );
              const attended   = payRecord?.attendedSessions ?? enr.attendedSessions ?? 0;
              const rem        = SESSIONS_PER_MONTH - attended;
              const pct        = Math.min((attended / SESSIONS_PER_MONTH) * 100, 100);
              const schoolName = enr.schoolName || enr.school?.name || `مدرسة #${enr.schoolId || i + 1}`;

              return (
                <div
                  key={enr.id || i}
                  style={{
                    padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${c.border}`, background: c.bg,
                  }}
                >
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>
                      {schoolName}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: rem <= 0 ? "#DC2626" : rem === 1 ? "#BA7517" : "#0F6E56",
                    }}>
                      {rem <= 0 ? "يجب تجديد الدفع !" : `${rem} حصة متبقية`}
                    </span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 6,
                    background: "rgba(0,0,0,.08)", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 6, width: `${pct}%`,
                      background: rem <= 0 ? "#EF4444" : rem === 1 ? "#F59E0B" : c.dot,
                      transition: "width .4s",
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: c.text, marginTop: 4, opacity: .7 }}>
                    {attended} من {SESSIONS_PER_MONTH} حصة
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
// Page: برنامجي الأسبوعي
// ─────────────────────────────────────────────────────────
function PageSchedule({ sessions, upcomingSessions }) {
  // Group weekly recurring sessions by day
  const byDay = {};
  WEEK_DAYS.forEach(d => { byDay[d] = []; });
  sessions?.forEach((ses, i) => {
    const day = ses.dayOfWeek || ses.day;
    if (day && byDay[day] !== undefined) {
      byDay[day].push({ ...ses, idx: i });
    }
  });

  const fmt = (d) =>
    new Date(d).toLocaleDateString("ar-MA", {
      weekday: "long", month: "long", day: "numeric",
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Weekly grid */}
      <Card>
        <SecTitle>الجدول الأسبوعي</SecTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${WEEK_DAYS.length}, 1fr)`,
          gap: 8,
        }}>
          {WEEK_DAYS.map(day => {
            const slots = byDay[day];
            return (
              <div key={day}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#185FA5",
                  textAlign: "center", paddingBottom: 6,
                  borderBottom: "2px solid #EBF4FE", marginBottom: 6,
                }}>
                  {day}
                </div>
                {slots.length === 0 ? (
                  <div style={{
                    height: 48, borderRadius: 8,
                    background: "#F8FAFC", border: "1px dashed #E2E8F0",
                  }} />
                ) : (
                  slots.map((s, idx) => {
                    const c = pal(s.idx);
                    return (
                      <div
                        key={idx}
                        style={{
                          background: c.bg, border: `1px solid ${c.border}`,
                          borderRadius: 8, padding: "5px 7px", marginBottom: 4,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: c.text }}>
                          {s.subject || s.moduleName || "—"}
                        </div>
                        <div style={{ fontSize: 9, color: "#64748B", marginTop: 1 }}>
                          {(s.startTime || s.time || "").split(" - ")[0]}
                        </div>
                        <div style={{ fontSize: 9, color: c.text, opacity: .7, marginTop: 1 }}>
                          {s.room || s.classroom || ""}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming list */}
      <Card>
        <SecTitle>الحصص القادمة</SecTitle>
        {!upcomingSessions || upcomingSessions.length === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1rem" }}>
            لا توجد حصص قادمة
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcomingSessions.map((s, i) => {
              const c   = pal(i);
              const raw = s.sessionDate ? new Date(s.sessionDate) : null;
              return (
                <div
                  key={s.id || i}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "9px 12px", borderRadius: 10,
                    border: "1.5px solid #F1F5F9", background: "#FAFCFF",
                  }}
                >
                  <div style={{ width: 44, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>
                      {raw ? raw.getDate() : s.dayOfWeek?.slice(0, 2) || "—"}
                    </div>
                    <div style={{ fontSize: 9, color: "#94A3B8" }}>
                      {raw ? raw.toLocaleDateString("ar-MA", { month: "short" }) : ""}
                    </div>
                  </div>
                  <div style={{ width: 1, height: 36, background: "#E8EEF6", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                      {s.subject || s.moduleName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      🕐 {s.startTime || s.time || "—"} · {s.schoolName || s.school?.name || ""}
                    </div>
                  </div>
                  <Tag c={c}>{s.type || s.sessionType || "حصة"}</Tag>
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
// Page: مدارسي المسجلة
// ─────────────────────────────────────────────────────────
function PageSchools({ enrollments }) {
  const totalFees = enrollments?.reduce((s, e) => s + (e.monthlyFee || e.price || 0), 0) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#185FA5" }}>
            {enrollments?.length ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>مدارس مسجلة</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#0F6E56" }}>
            {totalFees ? `${totalFees} دج` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>إجمالي رسوم شهرية</div>
        </Card>
      </div>

      {!enrollments || enrollments.length === 0 ? (
        <Card>
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1rem" }}>
            لم تسجل في أي مدرسة بعد
          </div>
        </Card>
      ) : (
        enrollments.map((enr, i) => {
          const c = pal(i);
          const schoolName    = enr.schoolName    || enr.school?.name     || `مدرسة #${i + 1}`;
          const location      = enr.location      || enr.school?.wilaya   || enr.school?.commune || "—";
          const teacherName   = enr.teacherName   || enr.teacher?.fullName || "—";
          const fee           = enr.monthlyFee    || enr.price            || 0;
          const sessions      = enr.sessions      || [];

          return (
            <Card key={enr.id || i}>
              {/* School header */}
              <div style={{
                display: "flex", alignItems: "flex-start",
                gap: 12, marginBottom: "1rem",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, background: c.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, border: `1.5px solid ${c.border}`, flexShrink: 0,
                }}>🏫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                    {schoolName}
                  </div>
                  <div style={{
                    fontSize: 12, color: "#64748B", marginTop: 3,
                    display: "flex", gap: 12,
                  }}>
                    <span>📍 {location}</span>
                    <span>👨‍🏫 {teacherName}</span>
                  </div>
                </div>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: 9, padding: "5px 12px",
                  textAlign: "center", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                    {fee ? `${fee} دج` : "—"}
                  </div>
                  <div style={{ fontSize: 9, color: c.text, opacity: .7 }}>شهرياً</div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #F1F5F9", margin: "0 0 12px" }} />

              {/* Sessions */}
              {sessions.length === 0 ? (
                <div style={{ fontSize: 12, color: "#94A3B8" }}>لا توجد حصص مسجلة</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 8 }}>
                    الحصص الأسبوعية ({sessions.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sessions.map((ses, si) => (
                      <div
                        key={ses.id || si}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px", borderRadius: 9,
                          background: c.bg, border: `1px solid ${c.border}`,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 600, color: c.text, minWidth: 80 }}>
                          {ses.subject || ses.moduleName || "—"}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {ses.dayOfWeek || ses.day || "—"}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748B", marginRight: "auto" }}>
                          {ses.startTime || ses.time || "—"}
                        </span>
                        <span style={{
                          fontSize: 10, color: c.text, background: "#fff",
                          borderRadius: 5, padding: "2px 7px",
                          border: `1px solid ${c.border}`,
                        }}>
                          {ses.room || ses.classroom || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page: بروفايل شخصي
// ─────────────────────────────────────────────────────────
function PageProfile({ profile, onProfileUpdated, enrollments }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  // Local editable form (mapped from StudentResponseDto fields)
  const [form, setForm] = useState({
    fullName:    profile?.fullName    || "",
    email:       profile?.email       || "",
    parentPhone: profile?.parentPhone || "",
    level:       profile?.level       || "",
    parentName:  profile?.parentName  || "",
  });

  // Sync if profile reloads
  useEffect(() => {
    if (profile) {
      setForm({
        fullName:    profile.fullName    || "",
        email:       profile.email       || "",
        parentPhone: profile.parentPhone || "",
        level:       profile.level       || "",
        parentName:  profile.parentName  || "",
      });
    }
  }, [profile]);

  const inp = {
    padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0",
    fontSize: 13, fontFamily: "inherit", color: "#0F172A",
    background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await studentApi.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setEditing(false);
      onProfileUpdated?.(res.data);
    } catch (err) {
      setSaveErr(err?.response?.data?.message || "فشل الحفظ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 560 }}>

      {/* Avatar card */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: "#185FA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#fff",
            border: "3px solid #EBF4FE", flexShrink: 0,
          }}>
            {initials(form.fullName)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{form.fullName}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
              طالب مسجل · {form.level || "—"}
            </div>
          </div>
          <button
            onClick={() => { setEditing(e => !e); setSaveErr(null); }}
            style={{
              marginRight: "auto", display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 9,
              border: `1.5px solid ${editing ? "#E2E8F0" : "#185FA5"}`,
              background: editing ? "#fff" : "#EBF4FE",
              color: editing ? "#64748B" : "#185FA5",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Edit3 size={13} /> {editing ? "إلغاء" : "تعديل"}
          </button>
        </div>
      </Card>

      {/* Info form */}
      <Card>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "1.1rem",
        }}>
          <SecTitle>المعلومات الشخصية</SecTitle>
          {saved && (
            <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5 }}>
              <Check size={13} /> تم الحفظ بنجاح
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Full Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B",
              display: "block", marginBottom: 4 }}>الاسم الكامل</label>
            {editing
              ? <input style={inp} value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
              : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0",
                  borderBottom: "1px solid #F1F5F9" }}>{form.fullName || "—"}</div>
            }
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B",
              display: "block", marginBottom: 4 }}>البريد الإلكتروني</label>
            {editing
              ? <input style={inp} type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0",
                  borderBottom: "1px solid #F1F5F9", direction: "ltr", textAlign: "right" }}>
                  {form.email || "—"}
                </div>
            }
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Level */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B",
                display: "block", marginBottom: 4 }}>المستوى الدراسي</label>
              {editing
                ? <input style={inp} value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: e.target.value }))} />
                : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0",
                    borderBottom: "1px solid #F1F5F9" }}>{form.level || "—"}</div>
              }
            </div>
            {/* Parent Phone */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B",
                display: "block", marginBottom: 4 }}>هاتف ولي الأمر</label>
              {editing
                ? <input style={inp} type="tel" value={form.parentPhone}
                    onChange={e => setForm(f => ({ ...f, parentPhone: e.target.value }))} />
                : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0",
                    borderBottom: "1px solid #F1F5F9", direction: "ltr", textAlign: "right" }}>
                    {form.parentPhone || "—"}
                  </div>
              }
            </div>
          </div>

          {/* Parent Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B",
              display: "block", marginBottom: 4 }}>اسم ولي الأمر</label>
            {editing
              ? <input style={inp} value={form.parentName}
                  onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} />
              : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0",
                  borderBottom: "1px solid #F1F5F9" }}>{form.parentName || "—"}</div>
            }
          </div>

          {/* Read-only stats */}
          <hr style={{ border: "none", borderTop: "1px solid #F1F5F9" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              {
                label: "المدارس المسجلة",
                value: enrollments?.length ?? "—",
              },
              {
                label: "الحصص الأسبوعية",
                value: enrollments?.reduce((s, e) => s + (e.sessions?.length || 0), 0) ?? "—",
              },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#F8FAFC", borderRadius: 10,
                padding: "10px 12px", border: "1px solid #E8EEF6",
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#185FA5" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {saveErr && (
            <div style={{
              fontSize: 12, color: "#DC2626", background: "#FEF2F2",
              border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px",
            }}>
              ⚠️ {saveErr}
            </div>
          )}

          {editing && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => { setEditing(false); setSaveErr(null); }}
                style={{
                  padding: "7px 16px", borderRadius: 9,
                  border: "1.5px solid #E2E8F0", background: "#fff",
                  color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 18px", borderRadius: 9, border: "none",
                  background: saving ? "#93B5D9" : "#185FA5",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {saving ? <Spinner size={13} /> : <Check size={13} />}
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
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
  const navigate  = useNavigate();
  const { logout } = useAuth?.() || {};

  const [active, setActive] = useState("sessions");

  // ── Data fetches ──────────────────────────────────────
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useFetch(() => studentApi.getProfile());

  const {
    data: enrollments,
    loading: enrollLoading,
    error: enrollError,
    reload: reloadEnroll,
  } = useFetch(() => studentApi.getEnrollments());

  const {
    data: sessions,
    loading: sessionsLoading,
    error: sessionsError,
    reload: reloadSessions,
  } = useFetch(() => studentApi.getSessions());

  const {
    data: upcomingSessions,
    loading: upcomingLoading,
    error: upcomingError,
    reload: reloadUpcoming,
  } = useFetch(() => studentApi.getUpcoming());

  const {
    data: payments,
    loading: paymentsLoading,
  } = useFetch(() => studentApi.getPayments());

  // ── Logout ────────────────────────────────────────────
  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/");
  };

  // ── Inject CSS keyframes once ─────────────────────────
  useEffect(() => {
    const id = "student-dashboard-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  // ── Page renderer ─────────────────────────────────────
  const renderPage = () => {
    switch (active) {
      case "sessions":
        if (enrollLoading || upcomingLoading || paymentsLoading) return <LoadingBlock />;
        if (enrollError)   return <ErrorBlock message={enrollError}   onRetry={reloadEnroll} />;
        if (upcomingError) return <ErrorBlock message={upcomingError} onRetry={reloadUpcoming} />;
        return (
          <PageSessions
            enrollments={enrollments || []}
            upcomingSessions={upcomingSessions || []}
            payments={payments || []}
          />
        );

      case "schedule":
        if (sessionsLoading || upcomingLoading) return <LoadingBlock />;
        if (sessionsError)  return <ErrorBlock message={sessionsError}  onRetry={reloadSessions} />;
        if (upcomingError)  return <ErrorBlock message={upcomingError}  onRetry={reloadUpcoming} />;
        return (
          <PageSchedule
            sessions={sessions || []}
            upcomingSessions={upcomingSessions || []}
          />
        );

      case "schools":
        if (enrollLoading) return <LoadingBlock />;
        if (enrollError)   return <ErrorBlock message={enrollError} onRetry={reloadEnroll} />;
        return <PageSchools enrollments={enrollments || []} />;

      case "profile":
        if (profileLoading) return <LoadingBlock />;
        if (profileError)   return <ErrorBlock message={profileError} onRetry={reloadProfile} />;
        return (
          <PageProfile
            profile={profile}
            enrollments={enrollments || []}
            onProfileUpdated={reloadProfile}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div dir="rtl" style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "'Cairo', system-ui, Arial, sans-serif",
      background: "#F8FAFC",
    }}>
      {/* Sidebar */}
      <Sidebar
        active={active}
        setActive={setActive}
        profile={profile}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{
          background: "#fff", borderBottom: "1.5px solid #E8EEF6",
          padding: "0 1.5rem", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            {PAGE_TITLES[active]}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* School count badge */}
            {enrollments && (
              <div style={{
                background: "#EBF4FE", border: "1px solid #B5D4F4",
                borderRadius: 999, padding: "4px 12px",
                fontSize: 12, fontWeight: 600, color: "#0C447C",
              }}>
                🏫 {enrollments.length} مدرسة
              </div>
            )}
            {/* Reload button */}
            <button
              onClick={() => { reloadProfile(); reloadEnroll(); reloadSessions(); reloadUpcoming(); }}
              title="تحديث البيانات"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 8,
                border: "1.5px solid #E2E8F0", background: "#fff",
                cursor: "pointer", color: "#64748B",
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div style={{ background: "#185FA5", padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: 12, color: "#B5D4F4", marginBottom: 3 }}>مرحباً بك،</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            {profileLoading ? "..." : profile?.fullName || "الطالب"}
          </h2>
          {profile?.level && (
            <div style={{ fontSize: 12, color: "#93C5FD", marginTop: 4 }}>
              المستوى الدراسي: {profile.level}
            </div>
          )}
        </div>

        {/* Page body */}
        <div style={{ padding: "1.5rem", flex: 1 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}