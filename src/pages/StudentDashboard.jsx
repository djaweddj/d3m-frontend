import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, User, CalendarDays, School,
  LogOut, Edit3, Check, AlertCircle,
  Loader2, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/authContext";
import api from "../api";

// ─────────────────────────────────────────────────────────
// API  — real backend endpoints
// ─────────────────────────────────────────────────────────
const studentApi = {
  // GET /api/students/profile  → StudentResponseDto
  getProfile: () => api.get("api/students/profile"),

  // PUT /api/students/profile  → StudentResponseDto
  updateProfile: (data) => api.put("api/students/profile", data),

  // GET /api/enrollments/mine  → List<EnrollmentResponseDto>
  getEnrollments: () => api.get("api/enrollments/mine"),

  // GET /api/invoices/mine  → List<StudentInvoiceResponseDto>
  getInvoices: () => api.get("api/invoices/mine"),

  // GET /api/sessions/school/{schoolId}  → List<SessionResponseDto>
  getSessionsBySchool: (schoolId) => api.get(`api/sessions/school/${schoolId}`),

  // GET /api/modules/browse?schoolId=x&level=y  → List<CourseModuleResponseDto>
  browseModules: (schoolId, level) =>
    api.get("api/modules/browse", { params: { schoolId, level } }),
};

// ─────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────
const PALETTE = [
  { bg: "#EBF4FE", text: "#0C447C", border: "#85B7EB", dot: "#185FA5" },
  { bg: "#E1F5EE", text: "#085041", border: "#5DCAA5", dot: "#0F6E56" },
  { bg: "#EEEDFE", text: "#3C3489", border: "#AFA9EC", dot: "#534AB7" },
  { bg: "#FAECE7", text: "#712B13", border: "#F0997B", dot: "#C05621" },
];
const pal = (i) => PALETTE[i % PALETTE.length];

const WEEK_DAYS_AR = {
  MONDAY:    "الإثنين",
  TUESDAY:   "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY:  "الخميس",
  FRIDAY:    "الجمعة",
  SATURDAY:  "السبت",
  SUNDAY:    "الأحد",
};
const WEEK_ORDER = ["السبت","الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة"];

const PAGE_TITLES = {
  sessions: "حصصي والفواتير",
  schedule: "برنامجي الأسبوعي",
  schools:  "مدارسي المسجلة",
  profile:  "بروفايل شخصي",
};

const NAV = [
  { id: "sessions", icon: BookOpen,     label: "حصصي" },
  { id: "schedule", icon: CalendarDays, label: "الجدول الأسبوعي" },
  { id: "schools",  icon: School,       label: "مدارسي" },
  { id: "profile",  icon: User,         label: "بروفايل" },
];

// Arabic date formatter
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("ar-MA", {
    weekday: "long", month: "long", day: "numeric",
  });

const fmtTime = (t) => (t ? String(t).slice(0, 5) : "—");

// Invoice status → Arabic label + colour
const invoiceStyle = (status) => {
  switch (status) {
    case "PAID":    return { label: "مدفوعة",    color: "#0F6E56", bg: "#E1F5EE" };
    case "PENDING": return { label: "معلقة",     color: "#BA7517", bg: "#FAEEDA" };
    case "OVERDUE": return { label: "متأخرة",    color: "#DC2626", bg: "#FEF2F2" };
    default:        return { label: status || "—", color: "#64748B", bg: "#F1F5F9" };
  }
};

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

// ─────────────────────────────────────────────────────────
// useFetch hook
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
      // handle both paginated {content:[]} and plain []
      setData(res.data?.content ?? res.data);
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
// Shared UI atoms
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

function Tag({ children, bg = "#EBF4FE", color = "#0C447C" }) {
  return (
    <span style={{
      background: bg, color, fontSize: 11, fontWeight: 600,
      padding: "2px 10px", borderRadius: 20, display: "inline-block",
    }}>
      {children}
    </span>
  );
}

function Spinner({ size = 20 }) {
  return <Loader2 size={size} style={{ animation: "spin 1s linear infinite", color: "#185FA5" }} />;
}

function LoadingBlock() {
  return <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><Spinner size={28} /></div>;
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "2rem" }}>
      <AlertCircle size={32} color="#E2A84B" />
      <div style={{ fontSize: 13, color: "#64748B", textAlign: "center" }}>{message}</div>
      {onRetry && (
        <button onClick={onRetry} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 8,
          border: "1.5px solid #185FA5", background: "#EBF4FE",
          color: "#185FA5", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function Empty({ text = "لا توجد بيانات" }) {
  return <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: "1.5rem" }}>{text}</div>;
}

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────
function Sidebar({ active, setActive, profile, enrollments, onLogout }) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, background: "#0F172A",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "1.1rem 1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 9,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: "#185FA5",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🎓</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>مدارس الدعم</div>
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>لوحة الطالب</div>
        </div>
      </div>

      {/* Student badge */}
      <div style={{
        padding: "10px 1rem", borderBottom: "1px solid rgba(255,255,255,.07)",
        display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,.03)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: "#185FA5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff",
          border: "2px solid rgba(255,255,255,.15)", flexShrink: 0,
        }}>
          {profile ? initials(profile.fullName) : "?"}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0" }}>
            {profile?.fullName || "..."}
          </div>
          <div style={{ fontSize: 10, color: "#1D9E75", marginTop: 1 }}>
            {profile?.level || "طالب مسجل ✓"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => setActive(item.id)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 1rem", border: "none", cursor: "pointer",
              background: isActive ? "rgba(24,95,165,.2)" : "transparent",
              borderRight: `3px solid ${isActive ? "#185FA5" : "transparent"}`,
              color: isActive ? "#fff" : "#64748B",
              fontSize: 13, fontWeight: 500,
              fontFamily: "'Cairo',system-ui,sans-serif",
              transition: "all .15s", textAlign: "right",
            }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "#CBD5E1"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; } }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? "#185FA5" : "inherit" }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* School count */}
      {enrollments && enrollments.length > 0 && (
        <div style={{ padding: "8px 1rem", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <div style={{
            background: "rgba(24,95,165,.15)", borderRadius: 8,
            padding: "6px 10px", fontSize: 11, color: "#93C5FD",
            display: "flex", justifyContent: "space-between",
          }}>
            <span>مدارس مسجلة</span>
            <span style={{ fontWeight: 700 }}>{enrollments.length}</span>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ padding: "10px 1rem", borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 8, background: "none",
          border: "none", color: "#475569", fontSize: 12, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit", width: "100%", padding: "5px 0",
          transition: "color .15s",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#94A3B8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
        >
          <LogOut size={14} /> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────
// Page: حصصي  (upcoming sessions from real date + invoices)
// ─────────────────────────────────────────────────────────
// sessions  = List<SessionResponseDto>  {id, moduleId, schoolId, date, startTime, endTime}
// enrollments = List<EnrollmentResponseDto>  (used to find enrolled moduleIds)
// invoices  = List<StudentInvoiceResponseDto> {id, studentName, moduleName, period, amount, status, dueDate, paidAt}
// modules   = Map<moduleId, CourseModuleResponseDto>
function PageSessions({ sessions, enrollments, invoices, moduleMap }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Enrolled module IDs
  const enrolledModuleIds = new Set(
    (enrollments || []).map((e) => e.moduleId ?? e.module?.id)
  );

  // Future sessions the student is in, sorted by date
  const upcoming = (sessions || [])
    .filter((s) => {
      if (s.isArchived || s.archived) return false;
      if (!enrolledModuleIds.has(s.moduleId)) return false;
      return new Date(s.date) >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 20);

  // Stats
  const totalWeekly = (enrollments || []).reduce(
    (sum, e) => sum + (moduleMap[e.moduleId ?? e.module?.id]?.schedules?.length || 0), 0
  );
  const unpaidCount = (invoices || []).filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE"
  ).length;
  const totalFees = (invoices || [])
    .filter((inv) => inv.status === "PENDING" || inv.status === "OVERDUE")
    .reduce((s, inv) => s + (inv.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "حصص أسبوعية",    value: totalWeekly || "—" },
          { label: "حصص قادمة",      value: upcoming.length },
          { label: "فواتير غير مدفوعة", value: unpaidCount, alert: unpaidCount > 0 },
        ].map((stat) => (
          <Card key={stat.label} style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.alert ? "#DC2626" : "#185FA5" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Upcoming sessions */}
      <Card>
        <SecTitle>الحصص القادمة</SecTitle>
        {upcoming.length === 0 ? (
          <Empty text="لا توجد حصص قادمة" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((s, i) => {
              const c   = pal(i);
              const mod = moduleMap[s.moduleId];
              return (
                <div key={s.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #F1F5F9", background: "#FAFCFF",
                  transition: "border-color .15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = c.border)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#F1F5F9")}
                >
                  {/* Date pill */}
                  <div style={{
                    background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: 9, padding: "5px 12px",
                    textAlign: "center", flexShrink: 0, minWidth: 80,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>
                      {fmtDate(s.date)}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 1 }}>
                      🕐 {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                      {mod?.subjectName || mod?.name || `وحدة #${s.moduleId}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      👨‍🏫 {mod?.teacherName || "—"} · 🏫 {mod?.classroomName || "—"}
                    </div>
                  </div>
                  <Tag bg={c.bg} color={c.text}>{mod?.level || "—"}</Tag>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Invoices */}
      <Card>
        <SecTitle>الفواتير الشهرية</SecTitle>
        {!invoices || invoices.length === 0 ? (
          <Empty text="لا توجد فواتير" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invoices.map((inv, i) => {
              const st = invoiceStyle(inv.status);
              const c  = pal(i);
              return (
                <div key={inv.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${c.border}`, background: c.bg,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                      {inv.moduleName || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      📅 {inv.period ? String(inv.period).replace("-", "/") : "—"}
                      {inv.dueDate ? ` · الاستحقاق: ${new Date(inv.dueDate).toLocaleDateString("ar-MA")}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
                      {inv.amount ? `${inv.amount} دج` : "—"}
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
// Uses schedules from CourseModuleResponseDto
// schedules = List<ScheduleEntryDto>  — assumed to have {dayOfWeek, startTime, endTime}
function PageSchedule({ enrollments, moduleMap }) {
  // Build byDay from module schedules
  const byDay = {};
  WEEK_ORDER.forEach((d) => { byDay[d] = []; });

  (enrollments || []).forEach((enr, idx) => {
    const mod = moduleMap[enr.moduleId ?? enr.module?.id];
    if (!mod) return;
    (mod.schedules || []).forEach((sch) => {
      const dayAr = WEEK_DAYS_AR[sch.dayOfWeek] || sch.dayOfWeek;
      if (byDay[dayAr]) {
        byDay[dayAr].push({ ...sch, mod, idx });
      }
    });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <Card>
        <SecTitle>الجدول الأسبوعي</SecTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${WEEK_ORDER.length}, 1fr)`,
          gap: 6,
        }}>
          {WEEK_ORDER.map((day) => {
            const slots = byDay[day];
            return (
              <div key={day}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "#185FA5",
                  textAlign: "center", paddingBottom: 5,
                  borderBottom: "2px solid #EBF4FE", marginBottom: 5,
                }}>
                  {day}
                </div>
                {slots.length === 0
                  ? <div style={{ height: 44, borderRadius: 8, background: "#F8FAFC", border: "1px dashed #E2E8F0" }} />
                  : slots.map((slot, si) => {
                      const c = pal(slot.idx);
                      return (
                        <div key={si} style={{
                          background: c.bg, border: `1px solid ${c.border}`,
                          borderRadius: 8, padding: "5px 6px", marginBottom: 4,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: c.text, lineHeight: 1.3 }}>
                            {slot.mod.subjectName || slot.mod.name || "—"}
                          </div>
                          <div style={{ fontSize: 9, color: "#64748B", marginTop: 1 }}>
                            {fmtTime(slot.startTime)}
                          </div>
                          <div style={{ fontSize: 9, color: c.text, opacity: .75, marginTop: 1 }}>
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

      {/* Module summary cards */}
      <Card>
        <SecTitle>وحداتي الدراسية</SecTitle>
        {(enrollments || []).length === 0
          ? <Empty text="لا توجد وحدات مسجلة" />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(enrollments || []).map((enr, i) => {
                const c   = pal(i);
                const mod = moduleMap[enr.moduleId ?? enr.module?.id];
                if (!mod) return null;
                return (
                  <div key={enr.id || i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${c.border}`, background: c.bg,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: "#fff",
                      border: `1px solid ${c.border}`, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>📚</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>
                        {mod.subjectName || mod.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        👨‍🏫 {mod.teacherName || "—"} · {mod.schedules?.length || 0} حصص/أسبوع
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
  // Group enrollments by schoolId
  const bySchool = {};
  (enrollments || []).forEach((enr) => {
    const sid = enr.schoolId ?? enr.school?.id ?? "unknown";
    if (!bySchool[sid]) bySchool[sid] = { schoolId: sid, schoolName: enr.schoolName || enr.school?.name || `مدرسة #${sid}`, items: [] };
    bySchool[sid].items.push(enr);
  });
  const schools = Object.values(bySchool);

  const totalInvoiced = (invoices || [])
    .filter((inv) => inv.status !== "PAID")
    .reduce((s, inv) => s + (inv.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#185FA5" }}>{schools.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>مدارس مسجلة</div>
        </Card>
        <Card style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0F6E56" }}>
            {totalInvoiced ? `${totalInvoiced} دج` : "—"}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>مستحق الدفع</div>
        </Card>
      </div>

      {schools.length === 0
        ? <Card><Empty text="لم تسجل في أي مدرسة بعد" /></Card>
        : schools.map((school, si) => {
            const c = pal(si);
            return (
              <Card key={school.schoolId}>
                {/* School header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, background: c.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, border: `1.5px solid ${c.border}`, flexShrink: 0,
                  }}>🏫</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                      {school.schoolName}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      {school.items.length} وحدة دراسية
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid #F1F5F9", margin: "0 0 12px" }} />

                {/* Modules in this school */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {school.items.map((enr, ei) => {
                    const mod = moduleMap[enr.moduleId ?? enr.module?.id];
                    return (
                      <div key={enr.id || ei} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px", borderRadius: 9,
                        background: c.bg, border: `1px solid ${c.border}`,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>
                            {mod?.subjectName || mod?.name || `وحدة #${enr.moduleId}`}
                          </div>
                          {mod && (
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                              👨‍🏫 {mod.teacherName || "—"} · {mod.schedules?.length || 0} حصص/أسبوع
                            </div>
                          )}
                        </div>
                        {mod && (
                          <div style={{ textAlign: "left", flexShrink: 0 }}>
                            <Tag bg="#fff" color={c.text}>{mod.level}</Tag>
                          </div>
                        )}
                        {/* Enrollment status badge */}
                        {enr.status && (
                          <Tag
                            bg={enr.status === "ACTIVE" ? "#E1F5EE" : "#FAEEDA"}
                            color={enr.status === "ACTIVE" ? "#085041" : "#BA7517"}
                          >
                            {enr.status === "ACTIVE" ? "نشط" : enr.status === "PENDING" ? "قيد الانتظار" : enr.status}
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
// Fields from StudentResponseDto: fullName, email, level, parentName, parentPhone
// PUT /api/students/profile  accepts StudentRequestDto
// ─────────────────────────────────────────────────────────
function PageProfile({ profile, enrollments, moduleMap, onProfileUpdated }) {
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
    padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0",
    fontSize: 13, fontFamily: "inherit", color: "#0F172A",
    background: "#FAFCFF", outline: "none", width: "100%", boxSizing: "border-box",
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      // StudentRequestDto fields: fullName, parentName, parentPhone
      await studentApi.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      setEditing(false);
      onProfileUpdated?.();
    } catch (err) {
      setSaveErr(err?.response?.data?.message || "فشل الحفظ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const totalWeekly = (enrollments || []).reduce(
    (sum, e) => sum + (moduleMap[e.moduleId ?? e.module?.id]?.schedules?.length || 0), 0
  );

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
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{form.fullName || "—"}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
              {profile?.email || "—"}
            </div>
            {profile?.level && (
              <div style={{ fontSize: 11, color: "#185FA5", marginTop: 2 }}>
                📖 {profile.level}
              </div>
            )}
          </div>
          <button onClick={() => { setEditing((e) => !e); setSaveErr(null); }} style={{
            marginRight: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 9,
            border: `1.5px solid ${editing ? "#E2E8F0" : "#185FA5"}`,
            background: editing ? "#fff" : "#EBF4FE",
            color: editing ? "#64748B" : "#185FA5",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            <Edit3 size={13} /> {editing ? "إلغاء" : "تعديل"}
          </button>
        </div>
      </Card>

      {/* Info form */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
          <SecTitle>المعلومات الشخصية</SecTitle>
          {saved && (
            <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <Check size={13} /> تم الحفظ بنجاح
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Read-only: email + level (not editable from StudentRequestDto) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                البريد الإلكتروني
              </label>
              <div style={{ fontSize: 13, color: "#94A3B8", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                {profile?.email || "—"}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                المستوى الدراسي
              </label>
              <div style={{ fontSize: 13, color: "#94A3B8", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                {profile?.level || "—"}
              </div>
            </div>
          </div>

          {/* Editable: fullName */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
              الاسم الكامل
            </label>
            {editing
              ? <input style={inp} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
              : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                  {form.fullName || "—"}
                </div>
            }
          </div>

          {/* Editable: parentName + parentPhone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                اسم ولي الأمر
              </label>
              {editing
                ? <input style={inp} value={form.parentName} onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))} />
                : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
                    {form.parentName || "—"}
                  </div>
              }
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                هاتف ولي الأمر
              </label>
              {editing
                ? <input style={inp} type="tel" value={form.parentPhone} onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))} />
                : <div style={{ fontSize: 14, color: "#0F172A", padding: "8px 0", borderBottom: "1px solid #F1F5F9", direction: "ltr", textAlign: "right" }}>
                    {form.parentPhone || "—"}
                  </div>
              }
            </div>
          </div>

          {/* Stats */}
          <hr style={{ border: "none", borderTop: "1px solid #F1F5F9" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "مدارس مسجلة",    value: [...new Set((enrollments||[]).map(e => e.schoolId ?? e.school?.id))].length },
              { label: "وحدات دراسية",   value: (enrollments || []).length },
              { label: "حصص أسبوعية",   value: totalWeekly },
            ].map((stat) => (
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
              <button onClick={() => { setEditing(false); setSaveErr(null); }} style={{
                padding: "7px 16px", borderRadius: 9,
                border: "1.5px solid #E2E8F0", background: "#fff",
                color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                إلغاء
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 18px", borderRadius: 9, border: "none",
                background: saving ? "#93B5D9" : "#185FA5",
                color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}>
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
  const navigate = useNavigate();
  const { logout } = useAuth?.() || {};
  const [active, setActive] = useState("sessions");

  // Inject keyframes once
  useEffect(() => {
    const id = "sdash-keyframes";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
      document.head.appendChild(s);
    }
  }, []);

  // ── Core fetches ─────────────────────────────────────
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useFetch(() => studentApi.getProfile());

  // GET /api/enrollments/mine
  const {
    data: enrollments,
    loading: enrollLoading,
    error: enrollError,
    reload: reloadEnroll,
  } = useFetch(() => studentApi.getEnrollments());

  // GET /api/invoices/mine
  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
    reload: reloadInvoices,
  } = useFetch(() => studentApi.getInvoices());

  // ── Derived: unique schoolIds from enrollments ───────
  const schoolIds = enrollments
    ? [...new Set(enrollments.map((e) => e.schoolId ?? e.school?.id).filter(Boolean))]
    : [];

  // ── Sessions: fetch per school once schoolIds are known ──
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

  // ── Modules: fetch per unique moduleId from enrollments ─
  const [moduleMap, setModuleMap] = useState({});
  const [modulesLoading, setModulesLoading] = useState(false);

  useEffect(() => {
    if (!enrollments || enrollments.length === 0) { setModuleMap({}); return; }
    // Group by schoolId+level to use the browse endpoint
    // Fallback: try to get module info from enrollment itself if present
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
      // Build moduleMap directly from enrollment data if it contains module info
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
        // Also inline any module data already in enrollment
        enrollments.forEach((enr) => {
          if (enr.module) map[enr.module.id] = enr.module;
        });
        setModuleMap(map);
      })
      .catch(() => setModuleMap({}))
      .finally(() => setModulesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(enrollments?.map((e) => e.id))]);

  // ── Helpers ──────────────────────────────────────────
  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/");
  };

  const reloadAll = () => {
    reloadProfile();
    reloadEnroll();
    reloadInvoices();
  };

  const isLoading = profileLoading || enrollLoading || invoicesLoading || sessionsLoading || modulesLoading;

  // ── Page renderer ─────────────────────────────────────
  const renderPage = () => {
    // Profile always needs to load first
    if (profileLoading) return <LoadingBlock />;
    if (profileError)   return <ErrorBlock message={profileError} onRetry={reloadProfile} />;

    switch (active) {
      case "sessions":
        if (enrollLoading || invoicesLoading) return <LoadingBlock />;
        if (enrollError)   return <ErrorBlock message={enrollError}   onRetry={reloadEnroll} />;
        if (invoicesError) return <ErrorBlock message={invoicesError} onRetry={reloadInvoices} />;
        return (
          <PageSessions
            sessions={allSessions}
            enrollments={enrollments || []}
            invoices={invoices || []}
            moduleMap={moduleMap}
          />
        );

      case "schedule":
        if (enrollLoading || modulesLoading) return <LoadingBlock />;
        if (enrollError) return <ErrorBlock message={enrollError} onRetry={reloadEnroll} />;
        return (
          <PageSchedule
            enrollments={enrollments || []}
            moduleMap={moduleMap}
          />
        );

      case "schools":
        if (enrollLoading || invoicesLoading) return <LoadingBlock />;
        if (enrollError) return <ErrorBlock message={enrollError} onRetry={reloadEnroll} />;
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
      <Sidebar
        active={active}
        setActive={setActive}
        profile={profile}
        enrollments={enrollments}
        onLogout={handleLogout}
      />

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
            {isLoading && <Spinner size={16} />}
            <button onClick={reloadAll} title="تحديث" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              border: "1.5px solid #E2E8F0", background: "#fff",
              cursor: "pointer", color: "#64748B",
            }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Welcome banner */}
        <div style={{ background: "#185FA5", padding: "1.1rem 1.5rem" }}>
          <div style={{ fontSize: 11, color: "#B5D4F4", marginBottom: 2 }}>مرحباً بك،</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
            {profile?.fullName || "..."}
          </h2>
          {profile?.level && (
            <div style={{ fontSize: 11, color: "#93C5FD", marginTop: 3 }}>
              المستوى: {profile.level}
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