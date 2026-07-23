import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.jsx";
import { useAuth } from "../context/authContext";

/* ============================================================
   DESIGN TOKENS
   Palette: ink blue (institutional), warm paper bg, amber accent
   (Algerian tile warmth), success green, quiet ink text.
   ============================================================ */
const T = {
  ink:        "#0B3D5C",
  inkDeep:    "#082C43",
  paper:      "#FBF8F3",
  paperDim:   "#F3EEE4",
  amber:      "#D68C34",
  amberDeep:  "#B36F1F",
  green:      "#1F7A5C",
  greenBg:    "#E9F5EF",
  red:        "#B93B3B",
  redBg:      "#FBEDEC",
  text:       "#1A2332",
  textMute:   "#5B6472",
  textFaint:  "#93989E",
  line:       "#E7E0D2",
  lineSoft:   "#EFE9DD",
  white:      "#FFFFFF",
};

const DAY_ORDER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_LABELS = {
  SUNDAY: "الأحد", MONDAY: "الاثنين", TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء", THURSDAY: "الخميس", FRIDAY: "الجمعة", SATURDAY: "السبت",
};
const DAY_SHORT = {
  SUNDAY: "أحد", MONDAY: "اثن", TUESDAY: "ثلا",
  WEDNESDAY: "أرب", THURSDAY: "خمي", FRIDAY: "جمع", SATURDAY: "سبت",
};

/* ============================================================
   GLOBAL KEYFRAMES — injected once
   ============================================================ */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(22px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; } to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(.92); }
        to   { opacity: 1; transform: scale(1); }
      }
      @keyframes popIn {
        0%   { opacity: 0; transform: scale(.9) translateY(8px); }
        60%  { opacity: 1; transform: scale(1.015) translateY(0); }
        100% { transform: scale(1); }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translate(-50%, 18px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes drawLine {
        from { width: 0; } to { width: 100%; }
      }
      @keyframes pulseDot {
        0%, 100% { opacity: 1; } 50% { opacity: .35; }
      }
      @keyframes floatSlow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-14px) rotate(2deg); }
      }
      @keyframes floatSlower {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(12px); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); } to { transform: rotate(360deg); }
      }
      @keyframes checkPop {
        0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
        70%  { transform: scale(1.2) rotate(4deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes ribbonIn {
        from { opacity: 0; transform: translateY(-6px) rotate(-2deg); }
        to   { opacity: 1; transform: translateY(0) rotate(-2deg); }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(214,140,52,.35); }
        50%      { box-shadow: 0 0 0 7px rgba(214,140,52,0); }
      }

      * { box-sizing: border-box; }
      .sd-root { font-family: 'Tajawal', 'Segoe UI', system-ui, Arial, sans-serif; }
      .sd-serif { font-family: 'Georgia', 'Times New Roman', serif; }

      .sd-fade-up { animation: fadeUp .6s cubic-bezier(.22,1,.36,1) both; }
      .sd-scale-in { animation: scaleIn .35s cubic-bezier(.22,1,.36,1) both; }

      .sd-crumb a { transition: color .15s ease; }
      .sd-crumb a:hover { color: ${T.amberDeep} !important; }

      .sd-daytab { position: relative; overflow: hidden; }
      .sd-daytab::after {
        content: ""; position: absolute; bottom: 0; right: 0; left: 0;
        height: 2px; background: ${T.amber}; width: 0;
        transition: width .25s ease;
      }
      .sd-daytab:hover::after { width: 100%; }
      .sd-daytab.active::after { width: 100%; background: rgba(255,255,255,.7); }

      .sd-teacher-card {
        transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-color .28s ease;
      }
      .sd-teacher-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 34px rgba(11,61,92,.12);
        border-color: ${T.amber}55 !important;
      }
      .sd-teacher-avatar {
        transition: transform .28s cubic-bezier(.22,1,.36,1);
      }
      .sd-teacher-card:hover .sd-teacher-avatar { transform: scale(1.08) rotate(-4deg); }

      .sd-module-row {
        transition: box-shadow .25s ease, border-color .25s ease, transform .25s ease;
      }
      .sd-module-row:hover {
        box-shadow: 0 10px 28px rgba(11,61,92,.10);
        border-color: ${T.ink}22;
        transform: translateY(-2px);
      }

      .sd-event-card {
        transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease, border-color .28s ease;
        position: relative;
      }
      .sd-event-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 18px 40px rgba(11,61,92,.14);
        border-color: ${T.amber}66 !important;
      }
      .sd-event-ribbon { animation: ribbonIn .4s cubic-bezier(.22,1,.36,1) both; }
      .sd-event-glow { animation: glowPulse 2.4s ease-in-out infinite; }
      .sd-event-scroll {
        display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px;
        scroll-snap-type: x proximity;
      }
      .sd-event-scroll::-webkit-scrollbar { height: 6px; }
      .sd-event-scroll::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 99px; }
      .sd-event-card-wrap { scroll-snap-align: start; flex-shrink: 0; width: 300px; }

      .sd-btn-primary {
        transition: transform .15s ease, box-shadow .2s ease, filter .15s ease;
      }
      .sd-btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(11,61,92,.28);
        filter: brightness(1.06);
      }
      .sd-btn-primary:active:not(:disabled) { transform: translateY(0); }

      .sd-btn-ghost { transition: background .15s ease, border-color .15s ease, color .15s ease; }

      .sd-stat-card {
        transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease;
      }
      .sd-stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(11,61,92,.10); }

      .sd-pill-pending { animation: pulseDot 1.8s ease-in-out infinite; }

      .sd-modal-overlay { animation: fadeIn .2s ease both; }
      .sd-modal-card { animation: popIn .32s cubic-bezier(.22,1,.36,1) both; }

      .sd-toast { animation: slideUp .35s cubic-bezier(.22,1,.36,1) both; }

      .sd-skel {
        background: linear-gradient(90deg, ${T.paperDim} 25%, #ece4d3 50%, ${T.paperDim} 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .sd-orb1 { animation: floatSlow 9s ease-in-out infinite; }
      .sd-orb2 { animation: floatSlower 11s ease-in-out infinite; }

      .sd-check-badge { animation: checkPop .4s cubic-bezier(.22,1.6,.36,1) both; }

      .sd-spinner {
        animation: spin .7s linear infinite;
      }

      .sd-cap-bar-fill {
        transition: width 1s cubic-bezier(.22,1,.36,1);
      }

      @media (prefers-reduced-motion: reduce) {
        .sd-fade-up, .sd-scale-in, .sd-modal-card, .sd-toast, .sd-check-badge,
        .sd-orb1, .sd-orb2, .sd-pill-pending, .sd-skel, .sd-event-glow, .sd-event-ribbon { animation: none !important; }
      }

      /* ---- Responsive grid ---- */
      .sd-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 28px;
        align-items: start;
      }
      .sd-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px 28px;
      }
      .sd-stats-row { display: flex; gap: 14px; }
      .sd-teachers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 14px;
      }
      .sd-sidebar-sticky { position: sticky; top: 20px; }
      .sd-hero-pad { padding: 3rem 1.75rem 3.25rem; }
      .sd-main-pad { padding: 2rem 1.75rem 4rem; }

      @media (max-width: 860px) {
        .sd-layout { grid-template-columns: 1fr; gap: 20px; }
        .sd-sidebar-sticky { position: static; }
        .sd-info-grid { grid-template-columns: 1fr; }
        .sd-hero-pad { padding: 2.25rem 1.25rem 2.5rem; }
        .sd-main-pad { padding: 1.5rem 1.25rem 3rem; }
        .sd-stats-row { flex-wrap: wrap; }
        .sd-stats-row > * { min-width: calc(50% - 7px); }
        .sd-module-row { flex-wrap: wrap; }
        .sd-module-price-col {
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          width: 100%;
          text-align: right !important;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed ${T.line};
        }
        .sd-hero-logo { display: none; }
        .sd-hero-title { font-size: 24px !important; }
        .sd-event-card-wrap { width: 260px; }
      }

      @media (max-width: 480px) {
        .sd-stats-row > * { min-width: 100%; }
        .sd-daytabs-scroll { padding-bottom: 4px; }
      }
    `}</style>
  );
}

/* ============================================================
   Hooks
   ============================================================ */
function useInView(threshold = 0.12) {
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

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={visible ? "sd-fade-up" : ""}
      style={{ opacity: visible ? undefined : 0, animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   Status badge (subscription)
   ============================================================ */
const STATUS = {
  ACTIVE:    { label: "نشط",     color: T.green,  bg: T.greenBg },
  TRIAL:     { label: "تجريبي",  color: T.amberDeep, bg: "#FCF1E2" },
  EXPIRED:   { label: "منتهي",   color: T.red,    bg: T.redBg },
  SUSPENDED: { label: "موقوف",   color: "#6b7280", bg: "#f3f4f6" },
};
function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: T.ink, bg: "#eef4f8" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}35`,
      borderRadius: 999, padding: "5px 15px",
      fontSize: 12, fontWeight: 700, display: "inline-flex",
      alignItems: "center", gap: 6, letterSpacing: ".2px",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.color,
        animation: status === "ACTIVE" ? "pulseDot 2s ease-in-out infinite" : "none",
      }} />
      {s.label}
    </span>
  );
}

/* ============================================================
   Stat card
   ============================================================ */
function StatCard({ icon, value, label, delay }) {
  return (
    <div className="sd-stat-card sd-scale-in" style={{
      animationDelay: `${delay}s`,
      background: T.white, border: `1px solid ${T.line}`,
      borderRadius: 14, padding: "1.1rem 1.25rem",
      display: "flex", flexDirection: "column", gap: 5,
      flex: 1, minWidth: 0,
    }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span className="sd-serif" style={{ fontSize: 24, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: T.textMute, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/* ============================================================
   Teacher card
   ============================================================ */
function TeacherCard({ teacher, index }) {
  const initials = teacher.fullName
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const palette = [T.ink, T.green, T.amberDeep, "#6D4AAE", "#B14C7A"];
  const bg = palette[index % palette.length];

  return (
    <Reveal delay={index * 0.06}>
      <div className="sd-teacher-card" style={{
        background: T.white, border: `1px solid ${T.line}`,
        borderRadius: 14, padding: "1.25rem",
        display: "flex", flexDirection: "column", gap: "0.75rem",
        height: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="sd-teacher-avatar" style={{
            width: 46, height: 46, borderRadius: "50%",
            background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0,
            boxShadow: `0 4px 12px ${bg}40`,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {teacher.fullName}
            </div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
              {teacher.specialization}
            </div>
          </div>
        </div>

        {teacher.bio && (
          <p style={{
            fontSize: 12, color: T.textMute, lineHeight: 1.6, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {teacher.bio}
          </p>
        )}

        {teacher.subjectNames?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {teacher.subjectNames.map((s) => (
              <span key={s} style={{
                background: `${bg}14`, color: bg, border: `1px solid ${bg}2e`,
                borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600,
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

/* ============================================================
   Module row (timetable-style)
   ============================================================ */
function ModuleRow({ mod, onEnroll, isEnrolled, isPending }) {
  const isFull = mod.full;
  const pct = Math.min(100, Math.round((mod.enrolledCount / mod.maxStudents) * 100));

  return (
    <div className="sd-module-row" style={{
      background: T.white, border: `1px solid ${T.line}`,
      borderRadius: 12, padding: "1rem",
      display: "flex", alignItems: "center", gap: "1rem",
    }}>
      {/* Time rail */}
      <div style={{
        background: T.inkDeep, borderRadius: 9,
        padding: "0.55rem 0.7rem", textAlign: "center",
        flexShrink: 0, minWidth: 68,
        boxShadow: `0 3px 10px ${T.ink}30`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {mod.startTime?.slice(0, 5)}
        </div>
        <div style={{ width: 16, height: 1, background: "rgba(255,255,255,.35)", margin: "3px auto" }} />
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.75)" }}>
          {mod.endTime?.slice(0, 5)}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>
          {mod.moduleName}
        </div>
        <div style={{ fontSize: 12, color: T.textMute, marginTop: 2 }}>
          {mod.teacherName} · {mod.level}
        </div>

        <div style={{ marginTop: 9 }}>
          <div style={{ background: T.paperDim, borderRadius: 99, height: 5, overflow: "hidden" }}>
            <div className="sd-cap-bar-fill" style={{
              width: `${pct}%`, height: "100%",
              background: isFull ? T.red : `linear-gradient(90deg, ${T.ink}, ${T.amber})`,
              borderRadius: 99,
            }} />
          </div>
          <div style={{ fontSize: 10.5, color: T.textMute, marginTop: 4 }}>
            {mod.enrolledCount} / {mod.maxStudents} طالب
            {isFull && <span style={{ color: T.red, marginRight: 6, fontWeight: 600 }}>· ممتلئ</span>}
          </div>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="sd-module-price-col" style={{ textAlign: "left", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
          {mod.monthlyPrice?.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: T.textMute, marginBottom: 8 }}>دج / شهر</div>

        {isEnrolled ? (
          <span className="sd-check-badge" style={{
            background: T.greenBg, color: T.green,
            border: `1px solid ${T.green}30`, borderRadius: 7,
            padding: "5px 11px", fontSize: 11, fontWeight: 700,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>✓ مسجّل</span>
        ) : isPending ? (
          <span className="sd-pill-pending" style={{
            background: "#FCF1E2", color: T.amberDeep,
            border: `1px solid ${T.amberDeep}30`, borderRadius: 7,
            padding: "5px 11px", fontSize: 11, fontWeight: 700,
          }}>⏳ قيد المراجعة</span>
        ) : (
          <button
            className="sd-btn-primary"
            disabled={isFull}
            onClick={() => onEnroll(mod)}
            style={{
              background: isFull ? T.paperDim : T.ink,
              color: isFull ? T.textFaint : "#fff",
              border: "none", borderRadius: 7,
              padding: "6px 16px", fontSize: 12, fontWeight: 700,
              cursor: isFull ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {isFull ? "ممتلئ" : "التسجيل"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Course EVENT card
   Courses are date-bound (one or more specific sessions), so they
   are presented as event cards — not folded into the weekly
   day-tab grid used for recurring modules.
   ============================================================ */
const EVENT_MONTHS_AR = [
  "جانفي","فيفري","مارس","أفريل","ماي","جوان",
  "جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];

function nextUpcomingSession(sessions) {
  if (!sessions?.length) return null;
  const now = new Date();
  const withDates = sessions
    .map((s) => ({ ...s, _dt: s.date ? new Date(`${s.date}T${(s.startTime || "00:00:00")}`) : null }))
    .filter((s) => s._dt)
    .sort((a, b) => a._dt - b._dt);
  const upcoming = withDates.find((s) => s._dt >= now);
  return upcoming || withDates[withDates.length - 1] || sessions[0];
}

function CourseEventCard({ course, onEnroll, isEnrolled, isPending }) {
  const isFull = course.maxStudents != null && course.enrolledCount >= course.maxStudents;
  const pct = course.maxStudents
    ? Math.min(100, Math.round((course.enrolledCount / course.maxStudents) * 100))
    : 0;
  const firstSession = nextUpcomingSession(course.sessions);
  const sessionCount = course.sessions?.length || 0;

  const dateDay = firstSession?.date ? new Date(firstSession.date).getDate() : null;
  const dateMonth = firstSession?.date ? EVENT_MONTHS_AR[new Date(firstSession.date).getMonth()] : null;

  return (
    <div className="sd-event-card-wrap">
      <div className="sd-event-card" style={{
        background: T.white, border: `1.5px solid ${T.line}`,
        borderRadius: 16, overflow: "hidden", height: "100%",
        display: "flex", flexDirection: "column",
      }}>
        {/* Event banner */}
        <div style={{
          background: `linear-gradient(120deg, ${T.ink} 0%, ${T.inkDeep} 100%)`,
          padding: "1rem 1.1rem", position: "relative",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div className="sd-event-ribbon" style={{
            background: T.white, borderRadius: 10,
            width: 52, height: 52, flexShrink: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 16px rgba(0,0,0,.25)",
          }}>
            {dateDay ? (
              <>
                <span className="sd-serif" style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{dateDay}</span>
                <span style={{ fontSize: 9.5, color: T.amberDeep, fontWeight: 700, marginTop: 2 }}>{dateMonth}</span>
              </>
            ) : (
              <span style={{ fontSize: 18 }}>🎟️</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{
              display: "inline-block", background: `${T.amber}2e`, color: "#fff",
              border: "1px solid rgba(255,255,255,.35)", borderRadius: 99,
              padding: "2px 10px", fontSize: 10, fontWeight: 700, marginBottom: 5,
            }}>
              📌 دورة تدريبية
            </span>
            <div style={{
              fontWeight: 700, fontSize: 14.5, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {course.name}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.1rem", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{
              background: T.paperDim, color: T.text, borderRadius: 7,
              padding: "3px 10px", fontSize: 11.5, fontWeight: 600,
            }}>
              {course.subjectName}
            </span>
            {course.level && (
              <span style={{
                background: "#EAF2F8", color: T.ink, borderRadius: 7,
                padding: "3px 10px", fontSize: 11.5, fontWeight: 600,
              }}>
                {course.level}
              </span>
            )}
          </div>

          <div style={{ fontSize: 12.5, color: T.textMute, display: "flex", alignItems: "center", gap: 6 }}>
            <span>👨‍🏫</span> {course.teacherName || "—"}
            {course.externalTeacher && (
              <span style={{ fontSize: 10, color: T.amberDeep, fontWeight: 700 }}>· أستاذ خارجي</span>
            )}
          </div>

          {course.description && (
            <p style={{
              fontSize: 12, color: T.textMute, lineHeight: 1.6, margin: 0,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {course.description}
            </p>
          )}

          {/* Session schedule strip */}
          <div style={{
            background: T.paper, border: `1px dashed ${T.line}`, borderRadius: 10,
            padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{ fontSize: 10.5, color: T.textFaint, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <span>🗓️</span> {sessionCount > 1 ? `${sessionCount} حصص مبرمجة` : "موعد الحصة"}
            </div>
            {firstSession && (
              <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>
                {firstSession.date ? new Date(firstSession.date).toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" }) : "—"}
                {" · "}
                {firstSession.startTime?.slice(0, 5)}–{firstSession.endTime?.slice(0, 5)}
              </div>
            )}
          </div>

          <div>
            <div style={{ background: T.paperDim, borderRadius: 99, height: 5, overflow: "hidden" }}>
              <div className="sd-cap-bar-fill" style={{
                width: `${pct}%`, height: "100%",
                background: isFull ? T.red : `linear-gradient(90deg, ${T.ink}, ${T.amber})`,
                borderRadius: 99,
              }} />
            </div>
            <div style={{ fontSize: 10.5, color: T.textMute, marginTop: 4 }}>
              {course.enrolledCount} / {course.maxStudents ?? "∞"} طالب
              {isFull && <span style={{ color: T.red, marginRight: 6, fontWeight: 600 }}>· ممتلئ</span>}
            </div>
          </div>

          {/* Price + CTA */}
          <div style={{
            marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${T.lineSoft}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>
                {course.totalPrice?.toLocaleString()}
              </div>
              <div style={{ fontSize: 9.5, color: T.textMute }}>دج / الدورة كاملة</div>
            </div>

            {isEnrolled ? (
              <span className="sd-check-badge" style={{
                background: T.greenBg, color: T.green,
                border: `1px solid ${T.green}30`, borderRadius: 7,
                padding: "6px 13px", fontSize: 11.5, fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>✓ مسجّل</span>
            ) : isPending ? (
              <span className="sd-pill-pending" style={{
                background: "#FCF1E2", color: T.amberDeep,
                border: `1px solid ${T.amberDeep}30`, borderRadius: 7,
                padding: "6px 13px", fontSize: 11.5, fontWeight: 700,
              }}>⏳ قيد المراجعة</span>
            ) : (
              <button
                className={`sd-btn-primary${!isFull ? " sd-event-glow" : ""}`}
                disabled={isFull}
                onClick={() => onEnroll(course)}
                style={{
                  background: isFull ? T.paperDim : T.amber,
                  color: isFull ? T.textFaint : "#fff",
                  border: "none", borderRadius: 8,
                  padding: "8px 18px", fontSize: 12.5, fontWeight: 700,
                  cursor: isFull ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isFull ? "ممتلئ" : "🎟️ احجز مكانك"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Enroll modal (module — recurring weekly unit)
   ============================================================ */
function EnrollModal({ mod, schoolName, onConfirm, onCancel, loading }) {
  return (
    <div className="sd-modal-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(8,44,67,.5)",
      backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: "1rem",
    }}>
      <div className="sd-modal-card" style={{
        background: T.white, borderRadius: 18, padding: "2rem",
        maxWidth: 400, width: "100%", border: `1px solid ${T.line}`,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 1rem",
          background: `linear-gradient(135deg, ${T.ink}, ${T.amber})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>📋</div>
        <h2 className="sd-serif" style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 6px", textAlign: "center" }}>
          تأكيد طلب التسجيل
        </h2>
        <p style={{ fontSize: 13, color: T.textMute, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.7 }}>
          هل تريد إرسال طلب التسجيل في <strong style={{ color: T.text }}>{mod?.moduleName}</strong>؟<br />
          ستنتظر موافقة إدارة <strong style={{ color: T.text }}>{schoolName}</strong>.
        </p>

        {mod && (
          <div style={{ background: T.paper, borderRadius: 12, border: `1px solid ${T.line}`, padding: "0.85rem 1rem", marginBottom: "1.5rem" }}>
            {[
              ["المادة", mod.subjectName],
              ["الأستاذ", mod.teacherName],
              ["الوقت", `${mod.startTime?.slice(0,5)} – ${mod.endTime?.slice(0,5)}`],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: T.textMute }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: T.textMute }}>السعر</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>
                {mod.monthlyPrice?.toLocaleString()} دج / شهر
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="sd-btn-ghost" onClick={onCancel} style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            background: T.paper, color: T.textMute,
            border: `1px solid ${T.line}`, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            إلغاء
          </button>
          <button className="sd-btn-primary" onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            background: loading ? `${T.ink}99` : T.ink,
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading && (
              <span className="sd-spinner" style={{
                width: 13, height: 13, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                display: "inline-block",
              }} />
            )}
            {loading ? "جارٍ الإرسال..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Enroll modal (course — event, date-bound)
   ============================================================ */
function CourseEnrollModal({ course, schoolName, onConfirm, onCancel, loading }) {
  const sessionCount = course?.sessions?.length || 0;
  const firstSession = nextUpcomingSession(course?.sessions);

  return (
    <div className="sd-modal-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(8,44,67,.5)",
      backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 300, padding: "1rem",
    }}>
      <div className="sd-modal-card" style={{
        background: T.white, borderRadius: 18, padding: "2rem",
        maxWidth: 400, width: "100%", border: `1px solid ${T.line}`,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, margin: "0 auto 1rem",
          background: `linear-gradient(135deg, ${T.amber}, ${T.ink})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>🎟️</div>
        <h2 className="sd-serif" style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 6px", textAlign: "center" }}>
          تأكيد الحجز في الدورة
        </h2>
        <p style={{ fontSize: 13, color: T.textMute, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.7 }}>
          هل تريد إرسال طلب التسجيل في دورة <strong style={{ color: T.text }}>{course?.name}</strong>؟<br />
          ستنتظر موافقة إدارة <strong style={{ color: T.text }}>{schoolName}</strong>.
        </p>

        {course && (
          <div style={{ background: T.paper, borderRadius: 12, border: `1px solid ${T.line}`, padding: "0.85rem 1rem", marginBottom: "1.5rem" }}>
            {[
              ["المادة", course.subjectName],
              ["الأستاذ", course.teacherName],
              ["عدد الحصص", `${sessionCount} حصة`],
              firstSession ? ["أول موعد", `${firstSession.date ? new Date(firstSession.date).toLocaleDateString("ar-DZ", { day: "numeric", month: "long" }) : "—"} · ${firstSession.startTime?.slice(0,5)}–${firstSession.endTime?.slice(0,5)}`] : null,
            ].filter(Boolean).map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: T.textMute }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: T.textMute }}>السعر</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>
                {course.totalPrice?.toLocaleString()} دج / الدورة كاملة
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="sd-btn-ghost" onClick={onCancel} style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            background: T.paper, color: T.textMute,
            border: `1px solid ${T.line}`, fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            إلغاء
          </button>
          <button className="sd-btn-primary" onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: "11px 0", borderRadius: 9,
            background: loading ? `${T.amber}99` : T.amber,
            color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading && (
              <span className="sd-spinner" style={{
                width: 13, height: 13, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                display: "inline-block",
              }} />
            )}
            {loading ? "جارٍ الإرسال..." : "تأكيد الحجز"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Toast
   ============================================================ */
function Toast({ message, type = "success" }) {
  const isSuccess = type === "success";
  return (
    <div className="sd-toast" style={{
      position: "fixed", bottom: 28, left: "50%",
      background: isSuccess ? T.inkDeep : "#7f1d1d",
      color: "#fff", padding: "13px 22px",
      borderRadius: 13, fontSize: 13,
      display: "flex", alignItems: "center", gap: 10,
      zIndex: 400, boxShadow: "0 10px 30px rgba(0,0,0,.25)",
      maxWidth: "calc(100vw - 40px)",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: isSuccess ? T.green : "#ef4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, flexShrink: 0,
      }}>
        {isSuccess ? "✓" : "✕"}
      </span>
      {message}
    </div>
  );
}

/* ============================================================
   Skeleton
   ============================================================ */
function Skeleton({ w = "100%", h = 16, r = 8, mb = 0 }) {
  return <div className="sd-skel" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />;
}

/* ============================================================
   Main component
   ============================================================ */
export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [school, setSchool]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [enrollModal, setEnrollModal]     = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [pendingIds, setPendingIds] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);

  // ---- Courses (events) — separate domain from weekly modules ----
  const [courses, setCourses]               = useState([]);
  const [coursesLoading, setCoursesLoading]  = useState(true);
  const [courseEnrollModal, setCourseEnrollModal] = useState(null);
  const [courseEnrollLoading, setCourseEnrollLoading] = useState(false);
  const [pendingCourseIds, setPendingCourseIds]   = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  const [toast, setToast] = useState(null);
  const [activeDay, setActiveDay] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get(`/api/schools/${id}/detail`)
      .then((res) => {
        setSchool(res.data);
        const days = Object.keys(res.data.modulesByDay || {});
        const today = new Date().toLocaleString("en-US", { weekday: "long" }).toUpperCase();
        setActiveDay(days.includes(today) ? today : (days[0] || null));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    if (user?.role === "STUDENT") {
      api.get(`/api/enrollments/accepted/${id}`).then((res) => {
        setEnrolledIds(res.data.map((e) => e.moduleId));
        console.log("accepted : ",res.data);
      }).catch(() => {});
      api.get(`/api/enrollments/pending/${id}`).then((res) => {
        setPendingIds(res.data.map((e) => e.moduleId));
      }).catch(() => {});
    }
  }, [id, user]);

  // ---- Load courses (events) for this school ----
  // NOTE: GET /api/courses/browse requires a `level` param on the backend.
  // Until there's a level filter UI here, "all" is sent and courses whose
  // `level` doesn't match are filtered out client-side below — if the
  // backend already treats a missing/blank level as "no filter", this
  // still works unchanged; if it 400s on blank level, tell me and I'll
  // switch this to loop over the known LEVELS or add a filter control.
  useEffect(() => {
    setCoursesLoading(true);
    api.get("/api/courses/browse", { params: { schoolId: id, level: "" } })
      .then((res) =>{
        console.log("dorat",res.data)
         setCourses(res.data || [])})
      
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [id]);

  const sortedDays = useMemo(
    () => Object.keys(school?.modulesByDay || {}).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
    [school]
  );

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

  // ---- Course (event) enroll — POST /api/courses/{id}/enroll-request ----
  const handleCourseEnrollConfirm = async () => {
    if (!courseEnrollModal) return;
    setCourseEnrollLoading(true);
    try {
      await api.post(`/api/courses/${courseEnrollModal.id}/enroll-request`);
      setPendingCourseIds((p) => [...p, courseEnrollModal.id]);
      showToast(`تم إرسال طلب الحجز في دورة "${courseEnrollModal.name}" بنجاح!`);
      setCourseEnrollModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "حدث خطأ، حاول مرة أخرى.";
      showToast(msg, "error");
    } finally {
      setCourseEnrollLoading(false);
    }
  };

  /* ---- Loading ---- */
  if (loading) return (
    <div dir="rtl" className="sd-root" style={{ minHeight: "100vh", background: T.paper, paddingBottom: "3rem" }}>
      <GlobalStyles />
      <div style={{ background: T.white, borderBottom: `1px solid ${T.line}`, padding: "0.6rem 1.5rem" }}>
        <Skeleton w={240} h={14} />
      </div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <Skeleton h={230} r={16} mb={24} />
        <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
          <Skeleton h={90} r={14} /><Skeleton h={90} r={14} /><Skeleton h={90} r={14} />
        </div>
        <Skeleton h={180} r={14} mb={16} />
        <Skeleton h={180} r={14} />
      </div>
    </div>
  );

  /* ---- Not found ---- */
  if (notFound || !school) return (
    <div dir="rtl" className="sd-root" style={{
      minHeight: "100vh", background: T.paper,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <GlobalStyles />
      <div className="sd-scale-in" style={{
        background: T.white, borderRadius: 18, border: `1px solid ${T.line}`,
        padding: "2.5rem", maxWidth: 360, textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🏫</div>
        <h2 className="sd-serif" style={{ fontSize: 19, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
          المدرسة غير موجودة
        </h2>
        <p style={{ fontSize: 13, color: T.textMute, margin: "0 0 1.5rem" }}>
          تحقق من الرابط أو عد للتصفح.
        </p>
        <button className="sd-btn-primary" onClick={() => navigate("/schools")} style={{
          width: "100%", padding: "11px 0", borderRadius: 10, background: T.ink,
          color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>
          العودة للتصفح
        </button>
      </div>
    </div>
  );

  const isStudent = user?.role === "STUDENT";
  const modulesForDay = activeDay ? (school.modulesByDay[activeDay] || []) : [];

  return (
    <div dir="rtl" className="sd-root" style={{ minHeight: "100vh", background: T.paper, paddingBottom: "3rem" }}>
      <GlobalStyles />

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
      {courseEnrollModal && (
        <CourseEnrollModal
          course={courseEnrollModal}
          schoolName={school.schoolName}
          onConfirm={handleCourseEnrollConfirm}
          onCancel={() => setCourseEnrollModal(null)}
          loading={courseEnrollLoading}
        />
      )}

      {/* Breadcrumb */}
      <div className="sd-crumb" style={{
        background: T.white, borderBottom: `1px solid ${T.line}`,
        padding: "0.6rem 1.5rem", display: "flex", alignItems: "center", gap: 6,
        fontSize: 12.5, color: T.textMute, overflowX: "auto", whiteSpace: "nowrap",
      }}>
        <a onClick={() => navigate("/")} style={{ color: T.ink, cursor: "pointer", fontWeight: 600 }}>الرئيسية</a>
        <span>›</span>
        <a onClick={() => navigate("/schools")} style={{ color: T.ink, cursor: "pointer", fontWeight: 600 }}>تصفح المدارس</a>
        <span>›</span>
        <span style={{ color: T.text }}>{school.schoolName}</span>
      </div>

      {/* Hero */}
      <div className="sd-hero-pad" style={{
        background: `linear-gradient(135deg, ${T.inkDeep} 0%, ${T.ink} 55%, #14608f 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        <div className="sd-orb1" style={{
          position: "absolute", top: -70, left: -60, width: 240, height: 240,
          borderRadius: "50%", background: "rgba(255,255,255,.05)",
        }} />
        <div className="sd-orb2" style={{
          position: "absolute", bottom: -50, right: 40, width: 190, height: 190,
          borderRadius: "50%", background: `${T.amber}22`,
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "42%", width: 90, height: 90,
          borderRadius: "50%", background: "rgba(255,255,255,.04)",
        }} />

        <div style={{
          maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1,
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20,
        }}>
          <div className="sd-fade-up">
            <div style={{ marginBottom: 12 }}>
              <StatusBadge status={school.subscriptionStatus} />
            </div>
            <h1 className="sd-serif sd-hero-title" style={{
              fontSize: 30, fontWeight: 700, color: "#fff", margin: "0 0 8px", lineHeight: 1.25,
            }}>
              {school.schoolName}
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.78)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📍</span> {school.wilaya} — {school.commune}
            </p>
          </div>

          {school.logoUrl && (
            <img
              src={school.logoUrl}
              className="sd-hero-logo sd-scale-in"
              alt={school.schoolName}
              style={{
                height: 96, width: 96, borderRadius: 18, objectFit: "cover",
                border: "3px solid rgba(255,255,255,.85)",
                boxShadow: "0 12px 30px rgba(0,0,0,.25)", flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="sd-layout sd-main-pad" style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", minWidth: 0 }}>

          <div className="sd-stats-row">
            <StatCard icon="👩‍🏫" value={school.totalTeachers} label="أستاذ" delay={0} />
            <StatCard icon="📚" value={school.totalModules} label="وحدة تعليمية" delay={0.08} />
            <StatCard icon="🎓" value={school.totalStudents} label="طالب مسجّل" delay={0.16} />
          </div>

          {/* School info */}
          <Reveal delay={0.05}>
            <div style={{ background: T.white, border: `1px solid ${T.line}`, borderRadius: 14, padding: "1.5rem" }}>
              <h2 className="sd-serif" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 1.25rem" }}>
                معلومات المدرسة
              </h2>
              <div className="sd-info-grid">
                {[
                  { label: "صاحب المدرسة", value: school.ownerName, icon: "👤" },
                  { label: "البريد الإلكتروني", value: school.email, icon: "📧" },
                  { label: "رقم الهاتف", value: school.phone, icon: "📞" },
                  { label: "العنوان", value: school.address, icon: "🏠" },
                  { label: "انتهاء الاشتراك", value: school.subscriptionExpiresAt, icon: "📅" },
                  { label: "الولاية", value: `${school.wilaya} — ${school.commune}`, icon: "📍" },
                ].map(({ label, value, icon }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: T.textFaint, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{icon}</span> {label}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, wordBreak: "break-word" }}>
                      {value || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Courses — presented as EVENTS, distinct from the recurring weekly modules below */}
          {!coursesLoading && courses.length > 0 && (
            <Reveal delay={0.06}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div>
                    <h2 className="sd-serif" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: "0 0 3px" }}>
                      🎟️ دورات وفعاليات
                    </h2>
                    <p style={{ fontSize: 11.5, color: T.textMute, margin: 0 }}>
                      دورات مبرمجة بتواريخ محددة — احجز مكانك قبل الامتلاء
                    </p>
                  </div>
                  <span style={{ background: `${T.amber}1e`, color: T.amberDeep, borderRadius: 99, padding: "3px 13px", fontSize: 12, fontWeight: 700 }}>
                    {courses.length} دورة
                  </span>
                </div>

                <div className="sd-event-scroll">
                  {courses.map((course) => (
                    <CourseEventCard
                      key={course.id}
                      course={course}
                      isEnrolled={enrolledCourseIds.includes(course.id)}
                      isPending={pendingCourseIds.includes(course.id)}
                      onEnroll={(c) => {
                        if (!isStudent) { navigate("/login"); return; }
                        setCourseEnrollModal(c);
                      }}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Teachers */}
          {school.teachers?.length > 0 && (
            <Reveal delay={0.08}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h2 className="sd-serif" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>
                    الأساتذة
                  </h2>
                  <span style={{ background: "#EAF2F8", color: T.ink, borderRadius: 99, padding: "3px 13px", fontSize: 12, fontWeight: 600 }}>
                    {school.teachers.length} أستاذ
                  </span>
                </div>
                <div className="sd-teachers-grid">
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
                  <h2 className="sd-serif" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: 0 }}>
                    الجدول الأسبوعي
                  </h2>
                  <span style={{ fontSize: 12, color: T.textMute }}>{school.totalModules} وحدة تعليمية</span>
                </div>

                <div className="sd-daytabs-scroll" style={{ display: "flex", gap: 8, marginBottom: "1rem", overflowX: "auto" }}>
                  {sortedDays.map((day) => {
                    const isActive = activeDay === day;
                    const count = school.modulesByDay[day]?.length || 0;
                    return (
                      <button
                        key={day}
                        onClick={() => setActiveDay(day)}
                        className={`sd-daytab${isActive ? " active" : ""}`}
                        style={{
                          padding: "8px 16px", borderRadius: 9, flexShrink: 0,
                          border: isActive ? `1.5px solid ${T.ink}` : `1px solid ${T.line}`,
                          background: isActive ? T.ink : T.white,
                          color: isActive ? "#fff" : T.textMute,
                          fontSize: 13, fontWeight: isActive ? 700 : 500,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span className="sd-day-full" style={{ display: "inline" }}>{DAY_LABELS[day]}</span>
                        <span style={{
                          background: isActive ? "rgba(255,255,255,.25)" : T.paperDim,
                          color: isActive ? "#fff" : T.textMute,
                          borderRadius: 99, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {modulesForDay.map((mod, i) => (
                    <div key={`${mod.moduleId}-${mod.day}`} className="sd-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <ModuleRow
                        mod={mod}
                        isEnrolled={enrolledIds.includes(mod.moduleId)}
                        isPending={pendingIds.includes(mod.moduleId)}
                        onEnroll={(m) => {
                          if (!isStudent) { navigate("/login"); return; }
                          setEnrollModal(m);
                        }}
                      />
                    </div>
                  ))}
                  {modulesForDay.length === 0 && (
                    <div style={{
                      background: T.white, borderRadius: 12, border: `1px dashed ${T.line}`,
                      padding: "2rem", textAlign: "center", color: T.textMute, fontSize: 13,
                    }}>
                      لا توجد حصص يوم {DAY_LABELS[activeDay]}
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Sidebar */}
        <div className="sd-sidebar-sticky">
          <Reveal delay={0.05}>
            <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.line}`, padding: "1.5rem" }}>
              {isStudent ? (
                <>
                  <h2 className="sd-serif" style={{ fontSize: 16.5, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
                    اختر وحدة وسجّل
                  </h2>
                  <p style={{ fontSize: 12.5, color: T.textMute, margin: "0 0 1.25rem", lineHeight: 1.7 }}>
                    اختر يوماً من الجدول ثم اضغط "التسجيل" في الوحدة التي تريدها، أو احجز مكانك في إحدى الدورات المبرمجة.
                  </p>

                  <div style={{ background: T.paper, borderRadius: 11, border: `1px solid ${T.line}`, padding: "0.8rem 1rem", marginBottom: "1.25rem" }}>
                    {[
                      ["الأيام المتاحة", `${sortedDays.length} أيام`],
                      ["الوحدات التعليمية", `${school.totalModules} وحدة`],
                      ["الدورات المبرمجة", `${courses.length} دورة`],
                      ["الطلاب المسجلون", `${school.totalStudents} طالب`],
                    ].map(([k, v], i, arr) => (
                      <div key={k} style={{
                        display: "flex", justifyContent: "space-between", padding: "6px 0",
                        borderBottom: i < arr.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                      }}>
                        <span style={{ fontSize: 12, color: T.textMute }}>{k}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {(pendingIds.length + pendingCourseIds.length) > 0 && (
                    <div style={{
                      background: "#FCF1E2", border: `1px solid ${T.amberDeep}30`, borderRadius: 9,
                      padding: "10px 12px", fontSize: 12, color: T.amberDeep,
                      display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", fontWeight: 600,
                    }}>
                      <span className="sd-pill-pending">⏳</span>
                      لديك {pendingIds.length + pendingCourseIds.length} طلب قيد المراجعة
                    </div>
                  )}

                  {(enrolledIds.length + enrolledCourseIds.length) > 0 && (
                    <div style={{
                      background: T.greenBg, border: `1px solid ${T.green}30`, borderRadius: 9,
                      padding: "10px 12px", fontSize: 12, color: T.green,
                      display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", fontWeight: 600,
                    }}>
                      <span>✓</span> مسجّل في {enrolledIds.length + enrolledCourseIds.length} وحدة/دورة
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="sd-serif" style={{ fontSize: 16.5, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>
                    سجّل كطالب
                  </h2>
                  <p style={{ fontSize: 12.5, color: T.textMute, margin: "0 0 1.25rem", lineHeight: 1.7 }}>
                    تحتاج حساب طالب للتسجيل في وحدات ودورات هذه المدرسة.
                  </p>
                  <div style={{
                    background: T.paper, border: `1.5px dashed ${T.line}`, borderRadius: 12,
                    padding: "1.25rem", textAlign: "center", marginBottom: "1.25rem",
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 13, background: "#EAF2F8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 10px", fontSize: 22,
                    }}>🔒</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                      تسجيل الدخول مطلوب
                    </div>
                    <p style={{ fontSize: 12, color: T.textMute, margin: "0 0 14px", lineHeight: 1.7 }}>
                      أنشئ حساباً أو سجّل دخولك لتتمكن من الانضمام.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="sd-btn-primary" onClick={() => navigate("/login")} style={{
                        width: "100%", padding: "11px 0", borderRadius: 9, background: T.ink,
                        color: "#fff", border: "none", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        تسجيل الدخول
                      </button>
                      <button className="sd-btn-ghost" onClick={() => navigate("/signup")} style={{
                        width: "100%", padding: "11px 0", borderRadius: 9, background: T.white,
                        color: T.ink, border: `1.5px solid ${T.ink}`, fontSize: 13, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                        إنشاء حساب طالب
                      </button>
                    </div>
                  </div>
                </>
              )}

              <hr style={{ border: "none", borderTop: `1px solid ${T.line}`, margin: "0 0 1rem" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { dot: T.green, text: "مدرسة معتمدة على المنصة" },
                  { dot: T.ink, text: "أساتذة مؤهلون ومعتمدون" },
                  { dot: T.amberDeep, text: "متابعة مستمرة للطلاب" },
                ].map(({ dot, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.textMute, fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}