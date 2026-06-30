import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/authContext";
import api from "../api";
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ══════════════════════════════════════════════════════════════════
const DAY_ORDER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_AR = {
  SUNDAY:    "الأحد",
  MONDAY:    "الاثنين",
  TUESDAY:   "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY:  "الخميس",
  FRIDAY:    "الجمعة",
  SATURDAY:  "السبت",
};
const PRICING_META = {
  MONTHLY_FLAT: { label: "شهري ثابت", bg: "#EBF4FE", color: "#185FA5", border: "#B5D4F4" },
  PER_SESSION:  { label: "لكل حصة",   bg: "#FAEEDA", color: "#854F0B", border: "#F0C87A" },
};

const todayDayKey = () => DAY_ORDER[new Date().getDay()];
const toLocalDate  = (d) => d.toLocaleDateString("fr-CA");         // YYYY-MM-DD
const todayDate    = () => toLocalDate(new Date());
const todayYM      = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const fmtTime = (t) => t ? String(t).slice(0, 5) : "—";
const fmtDateRange = (s, e) => {
  if (!s) return "";
  const opts1 = { day: "numeric", month: "short" };
  const opts2 = { day: "numeric", month: "short", year: "numeric" };
  return `${new Date(s).toLocaleDateString("ar-DZ", opts1)} – ${new Date(e).toLocaleDateString("ar-DZ", opts2)}`;
};

// ══════════════════════════════════════════════════════════════════
//  PRIMITIVE COMPONENTS
// ══════════════════════════════════════════════════════════════════

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, subNeutral, accent, iconBg }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "1.1rem 1.25rem",
        border: "1.5px solid #E8EEF6", position: "relative", overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "#CBD5E1";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.07)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#E8EEF6";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 4, height: "100%",
        background: accent, borderRadius: "0 14px 14px 0",
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, marginBottom: 10,
      }}>
        {emoji}
      </div>
      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", lineHeight: 1, marginBottom: 6 }}>
        {value ?? "—"}
      </div>
      <div style={{ fontSize: 11, color: subNeutral ? "#94A3B8" : "#0F6E56", display: "flex", alignItems: "center", gap: 4 }}>
        {subNeutral ? "" : "▲"} {sub}
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────
function IncomeChart({ data, color }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    chartRef.current?.destroy();
    const amounts = data.map(m => m.totalCollected ?? m.amount ?? 0);
    const maxIdx  = amounts.indexOf(Math.max(...amounts));
    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels: data.map(m => m.period ? String(m.period).slice(0, 7) : m.month ?? ""),
        datasets: [{
          label: "الدخل",
          data: amounts,
          backgroundColor: amounts.map((_, i) => i === maxIdx ? color : "#B5D4F4"),
          borderRadius: 6, borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: v => v.raw.toLocaleString("ar-DZ") + " دج" } },
        },
        scales: {
          x: { ticks: { font: { family: "Cairo", size: 10 }, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
          y: { ticks: { font: { family: "Cairo", size: 10 }, callback: v => (v / 1000) + "K" }, grid: { color: "#F1F5F9" }, border: { display: false } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, color]);

  return <div style={{ position: "relative", height: 190, width: "100%" }}><canvas ref={ref} /></div>;
}

// ── Card wrapper ──────────────────────────────────────────────────
function Card({ title, sub, children, style }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 14, padding: "1.25rem",
        border: "1.5px solid #E8EEF6",
        transition: "border-color .2s",
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#CBD5E1"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#E8EEF6"}
    >
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{title}</span>
          {sub && <span style={{ fontSize: 11, color: "#94A3B8" }}>{sub}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Info row in school card ───────────────────────────────────────
function InfoItem({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
      <span style={{ color: "#64748B" }}>{label}</span>
      <span style={{
        fontWeight: 600,
        color: highlight ? "#0F6E56" : "#0F172A",
        background: highlight ? "#E1F5EE" : "transparent",
        padding: highlight ? "2px 10px" : 0,
        borderRadius: highlight ? 20 : 0,
        border: highlight ? "1px solid #5DCAA5" : "none",
        fontSize: highlight ? 11 : 13,
      }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ── Attendance badge ──────────────────────────────────────────────
function AttBadge({ marked }) {
  return marked ? (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, background: "#E1F5EE",
      color: "#0F6E56", border: "1px solid #5DCAA5",
      whiteSpace: "nowrap",
    }}>
      ✓ حضور مسجّل
    </span>
  ) : (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 8px",
      borderRadius: 20, background: "#FAEEDA",
      color: "#BA7517", border: "1px solid #F0C87A",
      whiteSpace: "nowrap",
    }}>
      ⏳ لم يُسجّل
    </span>
  );
}

// ── Session row — updated to use SessionDetailDto fields ──────────
//    Works for both old format (moduleId only) and new (has moduleName, attendanceMarked, etc.)
const ROW_COLORS = [
  { bg: "#EBF4FE", color: "#185FA5", border: "#B5D4F4" },
  { bg: "#E1F5EE", color: "#0F6E56", border: "#5DCAA5" },
  { bg: "#FAEEDA", color: "#BA7517", border: "#F0C87A" },
  { bg: "#EEEDFE", color: "#534AB7", border: "#C4C2F5" },
];

function SessionRow({ session, isLast }) {
  const c  = ROW_COLORS[(session.id || 0) % ROW_COLORS.length];
  const pm = PRICING_META[session.pricingModel];

  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap",
      gap: 10, padding: "11px 0",
      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
    }}>
      {/* Time */}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
        background: "#EBF4FE", color: "#185FA5", border: "1px solid #B5D4F4",
        whiteSpace: "nowrap", minWidth: 52, textAlign: "center",
      }}>
        {fmtTime(session.startTime)}
      </span>

      {/* Module name */}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
        background: c.bg, color: c.color, border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}>
        {session.moduleName ?? `وحدة #${session.moduleId}`}
      </span>

      {/* Teacher */}
      <span style={{ flex: 1, fontSize: 12, color: "#64748B", minWidth: 80 }}>
        {session.teacherName ?? "—"}
      </span>

      {/* Level */}
      {session.level && (
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 20,
          background: "#F1F5F9", color: "#475569",
          border: "1px solid #E2E8F0", whiteSpace: "nowrap",
        }}>
          {session.level}
        </span>
      )}

      {/* Enrolled count */}
      {session.enrolledCount != null && (
        <span style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap" }}>
          👥 {session.enrolledCount}
        </span>
      )}

      {/* Pricing model */}
      {pm && (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
          background: pm.bg, color: pm.color, border: `1px solid ${pm.border}`,
          whiteSpace: "nowrap",
        }}>
          {pm.label}
        </span>
      )}

      {/* Attendance badge — only show for SessionDetailDto (has the field) */}
      {session.attendanceMarked !== undefined && (
        <AttBadge marked={session.attendanceMarked} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  WEEK SCHEDULE SECTION
//  Replaces old "Today's Sessions" — shows full week with navigation
//  Uses GET /api/sessions/week?schoolId={id}&date={date}
// ══════════════════════════════════════════════════════════════════
function WeekSchedule({ schoolId }) {
  const [weekDate,  setWeekDate]  = useState(new Date());
  const [schedule,  setSchedule]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [activeDay, setActiveDay] = useState(null);

  const loadWeek = useCallback(async (date) => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const dateStr = toLocalDate(date);
      const res = await api.get("/api/sessions/week", {
        params: { schoolId, date: dateStr },
      });
      setSchedule(res.data);

      // Auto-select today if it has sessions, else first day with sessions
      const byDay = res.data?.byDay || {};
      const today = todayDayKey();
      const daysWithSessions = DAY_ORDER.filter(d => byDay[d]?.length > 0);

      setActiveDay(
        daysWithSessions.includes(today)
          ? today
          : daysWithSessions[0] || null
      );
    } catch {
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { loadWeek(weekDate); }, [weekDate, loadWeek]);

  const prevWeek = () => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() - 7);
    setWeekDate(d);
  };

  const nextWeek = () => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + 7);
    setWeekDate(d);
  };

  const byDay    = schedule?.byDay || {};
  const sortedDays = DAY_ORDER.filter(d => byDay[d]?.length > 0);
  const sessions   = activeDay ? (byDay[activeDay] || []) : [];
  const today      = todayDayKey();

  // Check if the current week includes today
  const isCurrentWeek = (() => {
    if (!schedule?.weekStart || !schedule?.weekEnd) return false;
    const now   = new Date();
    const start = new Date(schedule.weekStart);
    const end   = new Date(schedule.weekEnd);
    return now >= start && now <= end;
  })();

  return (
    <Card>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 14,
      }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            الحصص الأسبوعية
          </span>
          {isCurrentWeek && (
            <span style={{
              marginRight: 8, fontSize: 10, fontWeight: 600,
              background: "#E1F5EE", color: "#0F6E56",
              border: "1px solid #5DCAA5",
              padding: "2px 8px", borderRadius: 20,
            }}>
              الأسبوع الحالي
            </span>
          )}
        </div>

        {/* Week navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748B" }}>
            {fmtDateRange(schedule?.weekStart, schedule?.weekEnd)}
          </span>
          <button
            onClick={prevWeek}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid #E2E8F0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#475569",
              transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={nextWeek}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: "1px solid #E2E8F0", background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#475569",
              transition: "background .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* Day tabs */}
      {sortedDays.length > 0 && (
        <div style={{
          display: "flex", gap: 8,
          overflowX: "auto", marginBottom: 16,
          paddingBottom: 4,
        }}>
          {sortedDays.map(day => {
            const isActive  = activeDay === day;
            const isToday   = day === today && isCurrentWeek;
            const count     = byDay[day]?.length || 0;
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: isActive
                    ? "1.5px solid #185FA5"
                    : isToday
                    ? "1.5px solid #B5D4F4"
                    : "1.5px solid #E8EEF6",
                  background: isActive ? "#185FA5" : isToday ? "#EBF4FE" : "#F8FAFC",
                  color: isActive ? "#fff" : isToday ? "#185FA5" : "#475569",
                  fontSize: 12,
                  fontWeight: isActive || isToday ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all .15s",
                  flexShrink: 0,
                }}
              >
                {DAY_AR[day]}
                {isToday && !isActive && (
                  <span style={{ fontSize: 9, background: "#185FA5", color: "#fff", padding: "1px 5px", borderRadius: 99 }}>
                    اليوم
                  </span>
                )}
                <span style={{
                  fontSize: 10, padding: "1px 6px", borderRadius: 99,
                  background: isActive ? "rgba(255,255,255,.22)" : "#E2E8F0",
                  color: isActive ? "#fff" : "#64748B",
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, padding: "2rem 0", color: "#94A3B8", fontSize: 13,
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "2px solid #185FA5", borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
          }} />
          جارٍ التحميل...
        </div>
      ) : sortedDays.length === 0 ? (
        <div style={{
          textAlign: "center", color: "#94A3B8",
          fontSize: 13, padding: "2.5rem 0",
        }}>
          لا توجد حصص مجدولة هذا الأسبوع
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: "center", color: "#94A3B8",
          fontSize: 13, padding: "2rem 0",
        }}>
          لا توجد حصص يوم {activeDay ? DAY_AR[activeDay] : ""}
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div style={{
            display: "flex", gap: 16, marginBottom: 12,
            padding: "8px 12px", background: "#F8FAFC",
            borderRadius: 8, border: "1px solid #F1F5F9",
          }}>
            <span style={{ fontSize: 11, color: "#64748B" }}>
              <strong style={{ color: "#0F172A" }}>{sessions.length}</strong> حصص
            </span>
            <span style={{ fontSize: 11, color: "#0F6E56" }}>
              ✓ <strong>{sessions.filter(s => s.attendanceMarked).length}</strong> مسجّل
            </span>
            <span style={{ fontSize: 11, color: "#BA7517" }}>
              ⏳ <strong>{sessions.filter(s => !s.attendanceMarked).length}</strong> لم يُسجّل
            </span>
          </div>

          {/* Session rows */}
          {sessions.map((s, i) => (
            <SessionRow
              key={s.id ?? i}
              session={s}
              isLast={i === sessions.length - 1}
            />
          ))}
        </>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();
  const BLUE = "#185FA5";

  const [schoolInfo,  setSchoolInfo]  = useState(null);
  const [revenue,     setRevenue]     = useState(null);
  const [monthlyList, setMonthlyList] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const period = todayYM();

      // Step 1: school info (gives us schoolId for session endpoints)
      const schoolRes = await api.get("/api/schools/one");
      const school    = schoolRes.data;
      setSchoolInfo(school);

      // Step 2: revenue (parallel — doesn't need schoolId in query since auth resolves it)
      const revenueRes = await api.get("/api/invoices/school/revenue", {
        params: { period },
      });
      setRevenue(revenueRes.data);
      setMonthlyList([revenueRes.data]);

    } catch (err) {
      setError(err?.response?.data?.message || "خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div dir="rtl" style={{
        padding: "2rem", fontFamily: "'Cairo', sans-serif",
        color: "#64748B", fontSize: 15,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          border: "2px solid #185FA5", borderTopColor: "transparent",
          animation: "spin 1s linear infinite",
        }} />
        جارٍ تحميل البيانات...
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div dir="rtl" style={{
        padding: "2rem", fontFamily: "'Cairo', sans-serif",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <AlertCircle size={32} color="#E2A84B" />
        <p style={{ color: "#64748B", fontSize: 13 }}>{error}</p>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 9,
            border: "1.5px solid #185FA5", background: "#EBF4FE",
            color: "#185FA5", fontSize: 13, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <RefreshCw size={13} /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const schoolName = schoolInfo?.schoolName ?? user?.schoolName ?? "المدرسة";
  const wilaya     = schoolInfo?.wilaya ?? user?.wilaya ?? "";

  return (
    <div
      dir="rtl"
      style={{
        padding: "1.5rem",
        display: "flex", flexDirection: "column", gap: "1.25rem",
        fontFamily: "'Cairo', sans-serif",
        background: "#F8FAFC", minHeight: "100vh",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            لوحة التحكم — {schoolName}
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{wilaya}</div>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            border: "1.5px solid #E2E8F0", background: "#fff",
            color: "#64748B", fontSize: 12, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <RefreshCw size={13} /> تحديث
        </button>
      </div>

      {/* ── Stat cards row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <StatCard
          emoji="💰" label="إجمالي المحصّل هذا الشهر"
          value={(revenue?.totalCollected ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="هذا الشهر" accent={BLUE} iconBg="#EBF4FE"
        />
        <StatCard
          emoji="🎓" label="عدد الطلاب"
          value={schoolInfo?.totalStudents ?? "—"}
          sub="طالب مسجّل" accent="#0F6E56" iconBg="#E1F5EE"
          subNeutral={!schoolInfo?.totalStudents}
        />
        <StatCard
          emoji="👨‍🏫" label="عدد الأساتذة"
          value={schoolInfo?.totalTeachers ?? "—"}
          sub="أستاذ نشط" accent="#534AB7" iconBg="#EEEDFE"
          subNeutral={!schoolInfo?.totalTeachers}
        />
      </div>

      {/* ── Stat cards row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <StatCard
          emoji="⏳" label="المبلغ المعلق"
          value={(revenue?.totalPending ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="فواتير معلقة" accent="#BA7517" iconBg="#FAEEDA"
          subNeutral={!revenue?.totalPending}
        />
        <StatCard
          emoji="🔴" label="المبلغ المتأخر"
          value={(revenue?.totalOverdue ?? 0).toLocaleString("ar-DZ") + " دج"}
          sub="فواتير متأخرة" accent="#DC2626" iconBg="#FEE2E2"
          subNeutral={!revenue?.totalOverdue}
        />
        <StatCard
          emoji="📄" label="عدد الفواتير"
          value={revenue?.invoiceCount ?? "—"}
          sub="هذا الشهر" accent="#64748B" iconBg="#F1F5F9" subNeutral
        />
      </div>

      {/* ── Chart + School info ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 12 }}>
        <Card title="ملخص الدخل الشهري" sub="الدينار الجزائري">
          {monthlyList.length > 0 && (revenue?.totalCollected ?? 0) > 0
            ? <IncomeChart data={monthlyList} color={BLUE} />
            : (
              <div style={{
                height: 190, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#94A3B8", fontSize: 13,
              }}>
                لا توجد بيانات دخل بعد
              </div>
            )
          }
        </Card>

        <Card title="معلومات المدرسة">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            <InfoItem label="اسم المدرسة"       value={schoolInfo?.schoolName} />
            <InfoItem label="المالك"             value={schoolInfo?.ownerName} />
            <InfoItem label="الولاية"            value={schoolInfo?.wilaya} />
            <InfoItem label="البريد"             value={schoolInfo?.email} />
            <InfoItem
              label="حالة الاشتراك"
              value={schoolInfo?.subscriptionStatus}
              highlight
            />
            <InfoItem
              label="انتهاء الاشتراك"
              value={
                schoolInfo?.subscriptionExpiresAt
                  ? new Date(schoolInfo.subscriptionExpiresAt).toLocaleDateString("ar-MA", {
                      year: "numeric", month: "long", day: "numeric",
                    })
                  : "—"
              }
            />
            <InfoItem
              label="دخل هذا الشهر"
              value={
                schoolInfo?.currentMonthRevenue != null
                  ? Number(schoolInfo.currentMonthRevenue).toLocaleString("ar-DZ") + " دج"
                  : "—"
              }
              highlight={!!schoolInfo?.currentMonthRevenue}
            />
          </div>
        </Card>
      </div>

      {/* ── Week Schedule (NEW) ── */}
      {schoolInfo?.id && (
        <WeekSchedule schoolId={schoolInfo.id} />
      )}

      {/* ── Revenue invoices list ── */}
      {revenue?.invoices?.length > 0 && (
        <Card title="فواتير هذا الشهر" sub={`${revenue.invoices.length} فاتورة`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {revenue.invoices.slice(0, 8).map((inv, i) => {
              const st = inv.status === "PAID"
                ? { bg: "#E1F5EE", color: "#085041", label: "مدفوعة" }
                : inv.status === "OVERDUE"
                ? { bg: "#FEE2E2", color: "#DC2626", label: "متأخرة" }
                : { bg: "#FAEEDA", color: "#BA7517", label: "معلقة" };

              return (
                <div key={inv.id ?? i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 10,
                  border: "1px solid #F1F5F9", background: "#FAFCFF",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                      {inv.studentName ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      {inv.moduleName ?? "—"}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    {(inv.amount ?? 0).toLocaleString("ar-DZ")} دج
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 10px", borderRadius: 20,
                    background: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}