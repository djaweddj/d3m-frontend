import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.jsx";
import { useAuth } from "../context/authContext";

// ── Day ordering & labels ─────────────────────────────────────────
const DAY_ORDER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = {
  SUNDAY:    "الأحد",
  MONDAY:    "الاثنين",
  TUESDAY:   "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY:  "الخميس",
  FRIDAY:    "الجمعة",
  SATURDAY:  "السبت",
};

// ── Hooks ─────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Fade-in wrapper ───────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────
const STATUS = {
  ACTIVE:    { label: "نشط",     color: "#0F6E56", bg: "#e6f4f1" },
  TRIAL:     { label: "تجريبي", color: "#BA7517", bg: "#fdf3e3" },
  EXPIRED:   { label: "منتهي",  color: "#b91c1c", bg: "#fef2f2" },
  SUSPENDED: { label: "موقوف", color: "#6b7280", bg: "#f3f4f6" },
};
function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: "#185FA5", bg: "#eff6ff" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
      borderRadius: 999, padding: "4px 14px",
      fontSize: 12, fontWeight: 600, display: "inline-block",
    }}>
      {s.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ icon, value, label }) {
  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e2e8f0",
      borderRadius: 12, padding: "1rem 1.25rem",
      display: "flex", flexDirection: "column", gap: 4,
      flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 22, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
    </div>
  );
}

// ── Teacher card ──────────────────────────────────────────────────
function TeacherCard({ teacher, index }) {
  const initials = teacher.fullName
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colors = ["#185FA5","#0F6E56","#BA7517","#7c3aed","#be185d"];
  const bg = colors[index % colors.length];

  return (
    <Reveal delay={index * 0.07}>
      <div style={{
        background: "#fff", border: "0.5px solid #e2e8f0",
        borderRadius: 12, padding: "1.25rem",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        height: "100%", boxSizing: "border-box",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(24,95,165,.12)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: bg, display: "flex",
            alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 600, fontSize: 15, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {teacher.fullName}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {teacher.specialization}
            </div>
          </div>
        </div>

        {teacher.bio && (
          <p style={{
            fontSize: 12, color: "#64748b", lineHeight: 1.6,
            margin: 0, display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {teacher.bio}
          </p>
        )}

        {teacher.subjectNames?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {teacher.subjectNames.map((s) => (
              <span key={s} style={{
                background: `${bg}15`, color: bg,
                border: `1px solid ${bg}30`,
                borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 500,
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
}

// ── Module row in schedule ────────────────────────────────────────
function ModuleRow({ mod, onEnroll, enrolledIds, pendingId }) {
  const isFull = mod.full;
  const isEnrolled = enrolledIds?.includes(mod.moduleId);
  const isPending = pendingId === mod.moduleId;
  const pct = Math.min(100, Math.round((mod.enrolledCount / mod.maxStudents) * 100));

  return (
    <div style={{
      background: "#fff", border: "0.5px solid #e2e8f0",
      borderRadius: 10, padding: "1rem",
      display: "flex", alignItems: "center", gap: "1rem",
      transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.06)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Time block */}
      <div style={{
        background: "#EBF4FE", borderRadius: 8,
        padding: "0.5rem 0.75rem", textAlign: "center",
        flexShrink: 0, minWidth: 72,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#185FA5" }}>
          {mod.startTime?.slice(0, 5)}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
          {mod.endTime?.slice(0, 5)}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 14, color: "#0f172a" }}>
          {mod.moduleName}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {mod.teacherName} · {mod.level}
        </div>

        {/* Capacity bar */}
        <div style={{ marginTop: 8 }}>
          <div style={{
            background: "#f1f5f9", borderRadius: 99,
            height: 4, overflow: "hidden",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: isFull ? "#ef4444" : "#185FA5",
              borderRadius: 99,
              transition: "width 1s ease",
            }} />
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
            {mod.enrolledCount} / {mod.maxStudents} طالب
            {isFull && (
              <span style={{ color: "#ef4444", marginRight: 6 }}>· ممتلئ</span>
            )}
          </div>
        </div>
      </div>

      {/* Price + CTA */}
      <div style={{ textAlign: "left", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#185FA5" }}>
          {mod.monthlyPrice?.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>دج / شهر</div>

        {isEnrolled ? (
          <span style={{
            background: "#e6f4f1", color: "#0F6E56",
            border: "1px solid #5DCAA530", borderRadius: 6,
            padding: "5px 10px", fontSize: 11, fontWeight: 600,
          }}>✓ مسجّل</span>
        ) : isPending ? (
          <span style={{
            background: "#fdf3e3", color: "#BA7517",
            border: "1px solid #BA751730", borderRadius: 6,
            padding: "5px 10px", fontSize: 11, fontWeight: 600,
          }}>⏳ قيد المراجعة</span>
        ) : (
          <button
            disabled={isFull}
            onClick={() => onEnroll(mod)}
            style={{
              background: isFull ? "#f1f5f9" : "#185FA5",
              color: isFull ? "#94a3b8" : "#fff",
              border: "none", borderRadius: 6,
              padding: "5px 14px", fontSize: 12,
              fontWeight: 600, cursor: isFull ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              transition: "opacity .15s",
            }}
            onMouseEnter={e => !isFull && (e.currentTarget.style.opacity = ".85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {isFull ? "ممتلئ" : "التسجيل"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Enroll modal ──────────────────────────────────────────────────
function EnrollModal({ mod, schoolName, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        padding: "2rem", maxWidth: 400, width: "100%",
        border: "0.5px solid #e2e8f0",
        animation: "popIn .25s ease",
      }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>

        <div style={{ fontSize: 28, marginBottom: "0.75rem", textAlign: "center" }}>📋</div>
        <h2 style={{
          fontSize: 17, fontWeight: 600, color: "#0f172a",
          margin: "0 0 6px", textAlign: "center",
        }}>
          تأكيد طلب التسجيل
        </h2>
        <p style={{
          fontSize: 13, color: "#64748b", textAlign: "center",
          margin: "0 0 1.5rem", lineHeight: 1.6,
        }}>
          هل تريد إرسال طلب التسجيل في <strong style={{ color: "#0f172a" }}>{mod?.moduleName}</strong>؟<br />
          ستنتظر موافقة إدارة <strong style={{ color: "#0f172a" }}>{schoolName}</strong>.
        </p>

        {mod && (
          <div style={{
            background: "#f8fafc", borderRadius: 10,
            border: "0.5px solid #e2e8f0",
            padding: "0.75rem 1rem", marginBottom: "1.5rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>المادة</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{mod.subjectName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>الأستاذ</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{mod.teacherName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>الوقت</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {mod.startTime?.slice(0, 5)} – {mod.endTime?.slice(0, 5)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>السعر</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#185FA5" }}>
                {mod.monthlyPrice?.toLocaleString()} دج / شهر
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              background: "#f8fafc", color: "#475569",
              border: "0.5px solid #e2e8f0", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8,
              background: loading ? "#93c5fd" : "#185FA5",
              color: "#fff", border: "none", fontSize: 13,
              fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background .15s",
            }}
          >
            {loading ? "جارٍ الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ message, type = "success" }) {
  const isSuccess = type === "success";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      background: isSuccess ? "#0f172a" : "#7f1d1d",
      color: "#fff", padding: "12px 22px",
      borderRadius: 12, fontSize: 13,
      display: "flex", alignItems: "center", gap: 10,
      zIndex: 400, boxShadow: "0 8px 24px rgba(0,0,0,.2)",
      animation: "slideUp .3s ease",
      whiteSpace: "nowrap",
    }}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}`}</style>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: isSuccess ? "#1D9E75" : "#ef4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, flexShrink: 0,
      }}>
        {isSuccess ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 6, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      marginBottom: mb,
    }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [school, setSchool]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  const [enrollModal, setEnrollModal] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [pendingIds, setPendingIds]   = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [toast, setToast]             = useState(null);

  const [activeDay, setActiveDay]     = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get(`/api/schools/${id}/detail`)
      .then((res) => {
        setSchool(res.data);
        console.log(res.data);
        const days = Object.keys(res.data.modulesByDay || {});
        const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
        setActiveDay(days.includes(today) ? today : (days[0] || null));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    if (user?.role === "STUDENT") {
      api.get("/api/enrollments/mine").then((res) => {
        setEnrolledIds(res.data.map((e) => e.moduleId));
      }).catch(() => {});
    }
  }, [id, user]);

  const sortedDays = Object.keys(school?.modulesByDay || {})
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

  const handleEnrollConfirm = async () => {
    if (!enrollModal) return;
    setEnrollLoading(true);
    try {
      await api.post("/api/enrollments/request", { moduleId: enrollModal.moduleId });
      setPendingIds((p) => [...p, enrollModal.moduleId]);
      showToast(`تم إرسال طلب التسجيل في ${enrollModal.moduleName} بنجاح!`);
      setEnrollModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "حدث خطأ، حاول مرة أخرى.";
      showToast(msg, "error");
    } finally {
      setEnrollLoading(false);
    }
  };

  // ── Loading skeleton ──
  if (loading) return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "system-ui,Arial,sans-serif", paddingBottom: "3rem",
    }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e2e8f0", padding: "0.6rem 1.5rem" }}>
        <Skeleton w={240} h={14} />
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <Skeleton h={260} r={12} mb={24} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Skeleton h={90} r={12} />
          <Skeleton h={90} r={12} />
          <Skeleton h={90} r={12} />
        </div>
        <Skeleton h={180} r={12} mb={16} />
        <Skeleton h={180} r={12} />
      </div>
    </div>
  );

  // ── Not found ──
  if (notFound || !school) return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#f8fafc",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui,Arial,sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        border: "0.5px solid #e2e8f0", padding: "2.5rem",
        maxWidth: 360, textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🏫</div>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: "#0f172a", margin: "0 0 8px" }}>
          المدرسة غير موجودة
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 1.5rem" }}>
          تحقق من الرابط أو عد للتصفح.
        </p>
        <button
          onClick={() => navigate("/schools")}
          style={{
            width: "100%", padding: "10px 0",
            borderRadius: 8, background: "#185FA5",
            color: "#fff", border: "none",
            fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          العودة للتصفح
        </button>
      </div>
    </div>
  );

  const isStudent = user?.role === "STUDENT";
  const modulesForDay = activeDay ? (school.modulesByDay[activeDay] || []) : [];

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "system-ui,Arial,sans-serif", paddingBottom: "4rem",
    }}>
      {toast && <Toast message={toast.message} type={toast.type} />}
      {enrollModal && (
        <EnrollModal
          mod={enrollModal}
          schoolName={school.schoolName}
          onConfirm={handleEnrollConfirm}
          onCancel={() => setEnrollModal(null)}
          loading={enrollLoading}
        />
      )}

      {/* ── Breadcrumb ── */}
      <div style={{
        background: "#fff", borderBottom: "0.5px solid #e2e8f0",
        padding: "0.55rem 1.5rem",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, color: "#64748b",
      }}>
        <span style={{ color: "#185FA5", cursor: "pointer" }} onClick={() => navigate("/")}>الرئيسية</span>
        <span>›</span>
        <span style={{ color: "#185FA5", cursor: "pointer" }} onClick={() => navigate("/schools")}>تصفح المدارس</span>
        <span>›</span>
        <span style={{ color: "#0f172a" }}>{school.schoolName}</span>
      </div>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #0c447c 0%, #185FA5 55%, #0ea5e9 100%)",
        minHeight: 220, position: "relative",
        display: "flex", alignItems: "flex-end",
        padding: "0 0 0 0", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -60, left: -60,
          width: 260, height: 260, borderRadius: "50%",
          background: "rgba(255,255,255,.05)",
        }} />
        <div style={{
          position: "absolute", top: 30, left: 160,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,.04)",
        }} />
        <div style={{
          position: "absolute", bottom: -40, right: 80,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(255,255,255,.05)",
        }} />

        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "2.5rem 1.5rem 2rem",
          width: "100%", position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ marginBottom: 10 }}>
                <StatusBadge status={school.subscriptionStatus} />
              </div>
              <h1 style={{
                fontSize: 28, fontWeight: 600, color: "#fff",
                margin: "0 0 6px", lineHeight: 1.2,
              }}>
                {school.schoolName}
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", margin: 0 }}>
                📍 {school.wilaya} — {school.commune}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "1.75rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* Stats row */}
          <Reveal>
            <div style={{ display: "flex", gap: 14 }}>
              <StatCard icon="👩‍🏫" value={school.totalTeachers} label="أستاذ" />
              <StatCard icon="📚" value={school.totalModules}  label="وحدة تعليمية" />
              <StatCard icon="🎓" value={school.totalStudents} label="طالب مسجّل" />
            </div>
          </Reveal>

          {/* School info */}
          <Reveal delay={0.05}>
            <div style={{
              background: "#fff", border: "0.5px solid #e2e8f0",
              borderRadius: 12, padding: "1.5rem",
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: "0 0 1.25rem" }}>
                معلومات المدرسة
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 2rem" }}>
                {[
                  { label: "صاحب المدرسة", value: school.ownerName, icon: "👤" },
                  { label: "البريد الإلكتروني", value: school.email, icon: "📧" },
                  { label: "رقم الهاتف", value: school.phone, icon: "📞" },
                  { label: "العنوان", value: school.address, icon: "🏠" },
                  {
                    label: "انتهاء الاشتراك",
                    value: school.subscriptionExpiresAt,
                    icon: "📅",
                  },
                  { label: "الولاية", value: `${school.wilaya} — ${school.commune}`, icon: "📍" },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{icon}</span> {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                      {value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Teachers */}
          {school.teachers?.length > 0 && (
            <Reveal delay={0.08}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: 0 }}>
                    الأساتذة
                  </h2>
                  <span style={{
                    background: "#EBF4FE", color: "#185FA5",
                    borderRadius: 99, padding: "3px 12px", fontSize: 12,
                  }}>
                    {school.teachers.length} أستاذ
                  </span>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                  gap: 14,
                }}>
                  {school.teachers.map((t, i) => (
                    <TeacherCard key={t.teacherId} teacher={t} index={i} />
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Weekly schedule */}
          {sortedDays.length > 0 && (
            <Reveal delay={0.1}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: 0 }}>
                    الجدول الأسبوعي
                  </h2>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    {school.totalModules} وحدة تعليمية
                  </span>
                </div>

                {/* Day tabs */}
                <div style={{
                  display: "flex", gap: 8,
                  marginBottom: "1rem", flexWrap: "wrap",
                }}>
                  {sortedDays.map((day) => {
                    const isActive = activeDay === day;
                    const count = school.modulesByDay[day]?.length || 0;
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        style={{
                          padding: "7px 16px",
                          borderRadius: 8,
                          border: isActive ? "1.5px solid #185FA5" : "0.5px solid #e2e8f0",
                          background: isActive ? "#185FA5" : "#fff",
                          color: isActive ? "#fff" : "#475569",
                          fontSize: 13, fontWeight: isActive ? 600 : 400,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 6,
                          transition: "all .15s",
                        }}
                      >
                        {DAY_LABELS[day]}
                        <span style={{
                          background: isActive ? "rgba(255,255,255,.25)" : "#f1f5f9",
                          color: isActive ? "#fff" : "#64748b",
                          borderRadius: 99, padding: "1px 7px", fontSize: 11,
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Modules for active day */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {modulesForDay.map((mod) => (
                    <ModuleRow
                      key={`${mod.moduleId}-${mod.day}`}
                      mod={mod}
                      enrolledIds={enrolledIds}
                      pendingId={pendingIds.find(id => id === mod.moduleId)}
                      onEnroll={(m) => {
                        if (!isStudent) { navigate("/login"); return; }
                        setEnrollModal(m);
                      }}
                    />
                  ))}
                  {modulesForDay.length === 0 && (
                    <div style={{
                      background: "#fff", borderRadius: 10,
                      border: "0.5px solid #e2e8f0",
                      padding: "2rem", textAlign: "center",
                      color: "#64748b", fontSize: 13,
                    }}>
                      لا توجد حصص يوم {DAY_LABELS[activeDay]}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div>
          <div style={{
            background: "#fff", borderRadius: 12,
            border: "0.5px solid #e2e8f0",
            padding: "1.5rem",
            position: "sticky", top: 80,
          }}>
            {isStudent ? (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: "0 0 4px" }}>
                  اختر وحدة وسجّل
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                  اختر يوماً من الجدول ثم اضغط "التسجيل" في الوحدة التي تريدها.
                </p>

                {/* Quick stats */}
                <div style={{
                  background: "#f8fafc", borderRadius: 10,
                  border: "0.5px solid #e2e8f0",
                  padding: "0.75rem 1rem", marginBottom: "1.25rem",
                }}>
                  {[
                    ["الأيام المتاحة", `${sortedDays.length} أيام`],
                    ["الوحدات التعليمية", `${school.totalModules} وحدة`],
                    ["الطلاب المسجلون", `${school.totalStudents} طالب`],
                  ].map(([k, v]) => (
                    <div key={k} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: "0.5px solid #f1f5f9",
                    }}>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#0f172a" }}>{v}</span>
                    </div>
                  ))}
                </div>

                {pendingIds.length > 0 && (
                  <div style={{
                    background: "#fdf3e3", border: "1px solid #BA751730",
                    borderRadius: 8, padding: "10px 12px",
                    fontSize: 12, color: "#BA7517",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: "1rem",
                  }}>
                    <span>⏳</span>
                    لديك {pendingIds.length} طلب قيد المراجعة
                  </div>
                )}

                {enrolledIds.length > 0 && (
                  <div style={{
                    background: "#e6f4f1", border: "1px solid #1D9E7530",
                    borderRadius: 8, padding: "10px 12px",
                    fontSize: 12, color: "#0F6E56",
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: "1rem",
                  }}>
                    <span>✓</span>
                    مسجّل في {enrolledIds.length} وحدة
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", margin: "0 0 4px" }}>
                  سجّل كطالب
                </h2>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                  تحتاج حساب طالب للتسجيل في وحدات هذه المدرسة.
                </p>
                <div style={{
                  background: "#f8fafc", border: "1.5px dashed #cbd5e1",
                  borderRadius: 10, padding: "1.25rem",
                  textAlign: "center", marginBottom: "1.25rem",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "#EBF4FE",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 10px", fontSize: 22,
                  }}>
                    🔒
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                    تسجيل الدخول مطلوب
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 }}>
                    أنشئ حساباً أو سجّل دخولك لتتمكن من الانضمام.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => navigate("/login")}
                      style={{
                        width: "100%", padding: "10px 0",
                        borderRadius: 8, background: "#185FA5",
                        color: "#fff", border: "none",
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      تسجيل الدخول
                    </button>
                    <button
                      onClick={() => navigate("/signup")}
                      style={{
                        width: "100%", padding: "10px 0",
                        borderRadius: 8, background: "#fff",
                        color: "#185FA5", border: "1.5px solid #185FA5",
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      إنشاء حساب طالب
                    </button>
                  </div>
                </div>
              </>
            )}

            <hr style={{ border: "none", borderTop: "0.5px solid #e2e8f0", margin: "0 0 1rem" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { dot: "#1D9E75", text: "مدرسة معتمدة على المنصة" },
                { dot: "#185FA5", text: "أساتذة مؤهلون ومعتمدون" },
                { dot: "#BA7517", text: "متابعة مستمرة للطلاب" },
              ].map(({ dot, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#475569" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}