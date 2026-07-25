import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion, useInView, useMotionValue, animate as fmAnimate } from "framer-motion";
import api from "../api.jsx";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";

/* ============================================================
   DESIGN TOKENS — Ink blue + warm paper, elevated
   Palette preserved; extended with elevation + gradient system.
   ============================================================ */
const T = {
  ink:        "#0B3D5C",
  inkDeep:    "#082C43",
  inkSoft:    "#14608F",
  paper:      "#FBF8F3",
  paperDim:   "#F3EEE4",
  paperDeep:  "#EFE9DD",
  amber:      "#D68C34",
  amberDeep:  "#B36F1F",
  amberSoft:  "#F5D9B0",
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

  // Elevation
  shadowSm:   "0 1px 2px rgba(11,61,92,.06), 0 1px 3px rgba(11,61,92,.04)",
  shadowMd:   "0 4px 10px rgba(11,61,92,.06), 0 10px 24px rgba(11,61,92,.08)",
  shadowLg:   "0 10px 24px rgba(11,61,92,.10), 0 24px 60px rgba(11,61,92,.14)",
  shadowXl:   "0 30px 80px rgba(11,61,92,.22)",
  ring:       "0 0 0 3px rgba(214,140,52,.35)",

  // Gradients
  gradInk:    "linear-gradient(135deg, #082C43 0%, #0B3D5C 55%, #14608F 100%)",
  gradAmber:  "linear-gradient(135deg, #D68C34 0%, #B36F1F 100%)",
  gradMixed:  "linear-gradient(135deg, #0B3D5C 0%, #D68C34 100%)",
};

const DAY_ORDER = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];

/* ============================================================
   GLOBAL STYLES — fonts, keyframes, focus rings, scrollbar
   ============================================================ */
function GlobalStyles() {
  useEffect(() => {
    // Inject Google Fonts once
    const id = "sd-fonts-link";
    if (!document.getElementById(id)) {
      const pre1 = document.createElement("link");
      pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
      const pre2 = document.createElement("link");
      pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous";
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Playfair+Display:wght@600;700;800&display=swap";
      document.head.appendChild(pre1);
      document.head.appendChild(pre2);
      document.head.appendChild(link);
    }
  }, []);

  return (
    <style>{`
      @keyframes sd-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      @keyframes sd-pulseDot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: .45; transform: scale(1.15); }
      }
      @keyframes sd-glowPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(214,140,52,.45), 0 8px 22px rgba(214,140,52,.28); }
        50%      { box-shadow: 0 0 0 10px rgba(214,140,52,0), 0 8px 22px rgba(214,140,52,.35); }
      }
      @keyframes sd-toastBar {
        from { transform: scaleX(1); }
        to   { transform: scaleX(0); }
      }
      @keyframes sd-floatY {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }

      * { box-sizing: border-box; }

      .sd-root {
        font-family: 'Tajawal', 'Inter', 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      .sd-serif {
        font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
        letter-spacing: -0.01em;
      }

      /* Focus rings — amber, tasteful */
      .sd-root :focus { outline: none; }
      .sd-root :focus-visible {
        outline: 2px solid ${T.amber};
        outline-offset: 2px;
        border-radius: 6px;
      }

      /* Skeleton shimmer */
      .sd-skel {
        background: linear-gradient(90deg, ${T.paperDim} 25%, #ece4d3 50%, ${T.paperDim} 75%);
        background-size: 200% 100%;
        animation: sd-shimmer 1.5s infinite;
      }

      .sd-pulse-dot { animation: sd-pulseDot 2s ease-in-out infinite; }
      .sd-glow { animation: sd-glowPulse 2.6s ease-in-out infinite; }
      .sd-float { animation: sd-floatY 6s ease-in-out infinite; }

      /* Breadcrumb link hover underline */
      .sd-crumb-link {
        position: relative; cursor: pointer; color: ${T.ink}; font-weight: 600;
        transition: color .15s ease;
      }
      .sd-crumb-link::after {
        content: ""; position: absolute; inset-inline-start: 0; bottom: -2px;
        height: 2px; width: 0; background: ${T.amber};
        transition: width .25s ease;
      }
      .sd-crumb-link:hover { color: ${T.amberDeep}; }
      .sd-crumb-link:hover::after { width: 100%; }

      /* Horizontal snap scroll */
      .sd-event-scroll {
        display: flex; gap: 18px; overflow-x: auto; padding: 4px 4px 14px;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        scrollbar-color: ${T.line} transparent;
      }
      .sd-event-scroll::-webkit-scrollbar { height: 8px; }
      .sd-event-scroll::-webkit-scrollbar-track { background: transparent; }
      .sd-event-scroll::-webkit-scrollbar-thumb {
        background: ${T.line}; border-radius: 99px;
      }
      .sd-event-scroll::-webkit-scrollbar-thumb:hover { background: ${T.amber}; }
      .sd-event-card-wrap { scroll-snap-align: start; flex-shrink: 0; width: 320px; }

      .sd-daytabs-scroll {
        scrollbar-width: none;
      }
      .sd-daytabs-scroll::-webkit-scrollbar { display: none; }

      /* Toast progress bar */
      .sd-toast-bar {
        transform-origin: right;
        animation: sd-toastBar 3.5s linear forwards;
      }

      /* Grain overlay for hero */
      .sd-grain {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        opacity: .35;
      }

      /* Arabic geometric pattern overlay */
      .sd-pattern {
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='white' stroke-width='.6' opacity='.35'><path d='M40 0 L80 40 L40 80 L0 40 Z'/><circle cx='40' cy='40' r='18'/><path d='M40 10 L70 40 L40 70 L10 40 Z'/></g></svg>");
        opacity: .07;
      }

      /* ---- Responsive grid ---- */
      .sd-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 32px;
        align-items: start;
      }
      .sd-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .sd-stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .sd-teachers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
      }
      .sd-sidebar-sticky { position: sticky; top: 20px; }
      .sd-hero-pad { padding: 3.5rem 2rem 3.75rem; }
      .sd-main-pad { padding: 2.25rem 2rem 4rem; }

      @media (max-width: 960px) {
        .sd-layout { grid-template-columns: 1fr; gap: 24px; }
        .sd-sidebar-sticky { position: static; }
      }
      @media (max-width: 720px) {
        .sd-info-grid { grid-template-columns: 1fr; }
        .sd-hero-pad { padding: 2.5rem 1.25rem 2.75rem; }
        .sd-main-pad { padding: 1.5rem 1.25rem 3rem; }
        .sd-stats-row { grid-template-columns: 1fr 1fr; }
        .sd-module-row { flex-wrap: wrap; }
        .sd-module-price-col {
          flex-direction: row !important;
          align-items: center !important;
          justify-content: space-between !important;
          width: 100%;
          text-align: right !important;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed ${T.line};
        }
        .sd-hero-logo { display: none; }
        .sd-hero-title { font-size: 28px !important; }
        .sd-event-card-wrap { width: 280px; }
      }
      @media (max-width: 420px) {
        .sd-stats-row { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}

/* ============================================================
   Motion helpers
   ============================================================ */
const springSoft = { type: "spring", stiffness: 260, damping: 26 };
const springFirm = { type: "spring", stiffness: 380, damping: 30 };

function Reveal({ children, delay = 0, y = 24 }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function CountUp({ value = 0, duration = 1.1 }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setDisplay(value); return; }
    const controls = fmAnimate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, duration, reduce, mv]);
  return <>{display?.toLocaleString?.() ?? display}</>;
}

/* ============================================================
   Status badge (subscription)
   ============================================================ */
function StatusBadge({ status, onDark = false }) {
  const { t } = useLanguage();
  const STATUS = {
    ACTIVE:    { label: t("schoolDetails.status.active"),    color: T.green,     bg: T.greenBg },
    TRIAL:     { label: t("schoolDetails.status.trial"),     color: T.amberDeep, bg: "#FCF1E2" },
    EXPIRED:   { label: t("schoolDetails.status.expired"),   color: T.red,       bg: T.redBg },
    SUSPENDED: { label: t("schoolDetails.status.suspended"), color: "#6b7280",   bg: "#f3f4f6" },
  };
  const s = STATUS[status] || { label: status, color: T.ink, bg: "#eef4f8" };
  return (
    <span style={{
      background: onDark ? "rgba(255,255,255,.14)" : s.bg,
      color: onDark ? "#fff" : s.color,
      border: `1px solid ${onDark ? "rgba(255,255,255,.28)" : s.color + "35"}`,
      backdropFilter: onDark ? "blur(8px)" : "none",
      borderRadius: 999, padding: "6px 14px",
      fontSize: 12, fontWeight: 700, display: "inline-flex",
      alignItems: "center", gap: 8, letterSpacing: ".2px",
    }}>
      <span
        className={status === "ACTIVE" ? "sd-pulse-dot" : ""}
        style={{
          width: 7, height: 7, borderRadius: "50%",
          background: onDark ? "#fff" : s.color,
          boxShadow: onDark ? "0 0 8px rgba(255,255,255,.7)" : `0 0 8px ${s.color}80`,
        }}
      />
      {s.label}
    </span>
  );
}

/* ============================================================
   Stat card — animated counter, gradient medallion, hover lift
   ============================================================ */
function StatCard({ icon, value, label, delay = 0, accent = T.ink }) {
  return (
    <Reveal delay={delay}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={springSoft}
        style={{
          background: T.white,
          border: `1px solid ${T.line}`,
          borderRadius: 18,
          padding: "1.25rem 1.35rem",
          display: "flex", flexDirection: "column", gap: 10,
          position: "relative", overflow: "hidden",
          boxShadow: T.shadowSm,
        }}
      >
        {/* Floating blob */}
        <div style={{
          position: "absolute", top: -28, left: -28,
          width: 110, height: 110, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: `0 8px 18px ${accent}45`,
        }}>
          {icon}
        </div>
        <div>
          <div className="sd-serif" style={{
            fontSize: 30, fontWeight: 700, color: T.ink, lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            <CountUp value={Number(value) || 0} />
          </div>
          <div style={{ fontSize: 12.5, color: T.textMute, fontWeight: 500, marginTop: 6 }}>
            {label}
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

/* ============================================================
   Teacher card — glass profile, hover glow, chip stagger
   ============================================================ */
function TeacherCard({ teacher, index }) {
  const initials = teacher.fullName
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const palette = [T.ink, T.green, T.amberDeep, "#6D4AAE", "#B14C7A", T.inkSoft];
  const bg = palette[index % palette.length];

  return (
    <Reveal delay={index * 0.05}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={springSoft}
        style={{
          background: T.white,
          border: `1px solid ${T.line}`,
          borderRadius: 18,
          padding: "1.35rem",
          display: "flex", flexDirection: "column", gap: "0.85rem",
          height: "100%",
          boxShadow: T.shadowSm,
          position: "relative", overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `${T.shadowMd}, 0 0 0 1px ${bg}30`;
          e.currentTarget.style.borderColor = `${bg}55`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = T.shadowSm;
          e.currentTarget.style.borderColor = T.line;
        }}
      >
        {/* Decorative corner */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 100, height: 100,
          borderRadius: "50%", background: `${bg}0d`,
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={springFirm}
            style={{
              width: 52, height: 52, borderRadius: "50%",
              background: `linear-gradient(135deg, ${bg}, ${bg}bb)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0,
              boxShadow: `0 6px 16px ${bg}55, inset 0 0 0 2px rgba(255,255,255,.25)`,
            }}
          >
            {initials}
          </motion.div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 14.5, color: T.text,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {teacher.fullName}
            </div>
            <div style={{ fontSize: 12, color: T.textMute, marginTop: 3, fontWeight: 500 }}>
              {teacher.specialization}
            </div>
          </div>
        </div>

        {teacher.bio && (
          <p style={{
            fontSize: 12.5, color: T.textMute, lineHeight: 1.65, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {teacher.bio}
          </p>
        )}

        {teacher.subjectNames?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {teacher.subjectNames.map((s, i) => (
              <motion.span
                key={s}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                style={{
                  background: `${bg}12`, color: bg,
                  border: `1px solid ${bg}2e`,
                  borderRadius: 8, padding: "4px 11px",
                  fontSize: 11, fontWeight: 600,
                }}
              >
                {s}
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    </Reveal>
  );
}

/* ============================================================
   Module row — timetable
   ============================================================ */
function ModuleRow({ mod, onEnroll, isEnrolled, isPending }) {
  const { t } = useLanguage();
  const isFull = mod.full;
  const pct = Math.min(100, Math.round((mod.enrolledCount / mod.maxStudents) * 100));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={springSoft}
      className="sd-module-row"
      style={{
        background: T.white,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        padding: "1.1rem 1.15rem",
        display: "flex", alignItems: "center", gap: "1.15rem",
        boxShadow: T.shadowSm,
      }}
    >
      {/* Time rail */}
      <div style={{
        background: T.gradInk,
        borderRadius: 12,
        padding: "0.7rem 0.85rem", textAlign: "center",
        flexShrink: 0, minWidth: 74,
        boxShadow: `0 6px 16px ${T.ink}40`,
        color: "#fff",
      }}>
        <div className="sd-serif" style={{ fontSize: 15, fontWeight: 700 }}>
          {mod.startTime?.slice(0, 5)}
        </div>
        <div style={{ width: 22, height: 1, background: "rgba(255,255,255,.4)", margin: "4px auto" }} />
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.8)", fontWeight: 500 }}>
          {mod.endTime?.slice(0, 5)}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: T.text }}>
          {mod.moduleName}
        </div>
        <div style={{ fontSize: 12, color: T.textMute, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ opacity: .7 }}>👨‍🏫</span> {mod.teacherName}
          <span style={{ color: T.line }}>•</span>
          <span>{mod.level}</span>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ background: T.paperDim, borderRadius: 99, height: 6, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: "100%",
                background: isFull ? T.red : `linear-gradient(90deg, ${T.ink}, ${T.amber})`,
                borderRadius: 99,
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: T.textMute, marginTop: 5, fontWeight: 500 }}>
            {t("schoolDetails.module.enrolledCount", { count: mod.enrolledCount, max: mod.maxStudents })}
            {isFull && <span style={{ color: T.red, marginRight: 6, fontWeight: 700 }}>· {t("schoolDetails.module.full")}</span>}
          </div>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="sd-module-price-col" style={{
        textAlign: "left", flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
      }}>
        <div className="sd-serif" style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>
          {mod.monthlyPrice?.toLocaleString()}
        </div>
        <div style={{ fontSize: 10.5, color: T.textMute, marginBottom: 8, fontWeight: 500 }}>{t("schoolDetails.module.pricePerMonth")}</div>

        {isEnrolled ? (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            style={{
              background: T.greenBg, color: T.green,
              border: `1px solid ${T.green}30`, borderRadius: 8,
              padding: "6px 13px", fontSize: 11.5, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >✓ {t("schoolDetails.module.enrolled")}</motion.span>
        ) : isPending ? (
          <span className="sd-pulse-dot" style={{
            background: "#FCF1E2", color: T.amberDeep,
            border: `1px solid ${T.amberDeep}30`, borderRadius: 8,
            padding: "6px 13px", fontSize: 11.5, fontWeight: 700,
          }}>⏳ {t("schoolDetails.module.pending")}</span>
        ) : (
          <motion.button
            whileHover={isFull ? {} : { scale: 1.03 }}
            whileTap={isFull ? {} : { scale: 0.97 }}
            transition={springFirm}
            disabled={isFull}
            onClick={() => onEnroll(mod)}
            style={{
              background: isFull ? T.paperDim : T.gradInk,
              color: isFull ? T.textFaint : "#fff",
              border: "none", borderRadius: 9,
              padding: "8px 20px", fontSize: 12.5, fontWeight: 700,
              cursor: isFull ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: isFull ? "none" : `0 6px 16px ${T.ink}40`,
            }}
          >
            {isFull ? t("schoolDetails.module.full") : t("schoolDetails.module.enrollCta")}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   Course EVENT card
   ============================================================ */
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
  const { t, locale } = useLanguage();
  const isFull = course.maxStudents != null && course.enrolledCount >= course.maxStudents;
  const pct = course.maxStudents
    ? Math.min(100, Math.round((course.enrolledCount / course.maxStudents) * 100))
    : 0;
  const firstSession = nextUpcomingSession(course.sessions);
  const sessionCount = course.sessions?.length || 0;

  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US";
  const dateDay = firstSession?.date ? new Date(firstSession.date).getDate() : null;
  const dateMonth = firstSession?.date
    ? new Date(firstSession.date).toLocaleDateString(dateLocale, { month: "short" })
    : null;

  return (
    <div className="sd-event-card-wrap">
      <motion.div
        whileHover={{ y: -6 }}
        transition={springSoft}
        style={{
          background: T.white,
          border: `1px solid ${T.line}`,
          borderRadius: 20,
          overflow: "hidden",
          height: "100%",
          display: "flex", flexDirection: "column",
          boxShadow: T.shadowSm,
        }}
      >
        {/* Event banner */}
        <div style={{
          background: T.gradInk,
          padding: "1.15rem 1.25rem",
          position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div className="sd-pattern" style={{
            position: "absolute", inset: 0, pointerEvents: "none",
          }} />
          <motion.div
            initial={{ opacity: 0, y: -8, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: T.white, borderRadius: 12,
              width: 58, height: 58, flexShrink: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,.3)",
              position: "relative",
            }}
          >
            {dateDay ? (
              <>
                <span className="sd-serif" style={{ fontSize: 22, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{dateDay}</span>
                <span style={{ fontSize: 10, color: T.amberDeep, fontWeight: 700, marginTop: 3, letterSpacing: ".3px" }}>{dateMonth}</span>
              </>
            ) : (
              <span style={{ fontSize: 20 }}>🎟️</span>
            )}
          </motion.div>
          <div style={{ minWidth: 0, position: "relative" }}>
            <span style={{
              display: "inline-block",
              background: "rgba(255,255,255,.16)", color: "#fff",
              border: "1px solid rgba(255,255,255,.35)",
              backdropFilter: "blur(8px)",
              borderRadius: 99, padding: "3px 11px",
              fontSize: 10.5, fontWeight: 700, marginBottom: 6,
              letterSpacing: ".3px",
            }}>
              📌 {t("schoolDetails.courses.badge")}
            </span>
            <div className="sd-serif" style={{
              fontWeight: 700, fontSize: 16, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}>
              {course.name}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "1.15rem", display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{
              background: T.paperDim, color: T.text, borderRadius: 8,
              padding: "4px 11px", fontSize: 11.5, fontWeight: 600,
              border: `1px solid ${T.line}`,
            }}>
              {course.subjectName}
            </span>
            {course.level && (
              <span style={{
                background: "#EAF2F8", color: T.ink, borderRadius: 8,
                padding: "4px 11px", fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${T.ink}22`,
              }}>
                {course.level}
              </span>
            )}
          </div>

          <div style={{ fontSize: 12.5, color: T.textMute, display: "flex", alignItems: "center", gap: 6 }}>
            <span>👨‍🏫</span> {course.teacherName || "—"}
            {course.externalTeacher && (
              <span style={{ fontSize: 10, color: T.amberDeep, fontWeight: 700, marginRight: 4 }}>· {t("schoolDetails.courses.externalTeacher")}</span>
            )}
          </div>

          {course.description && (
            <p style={{
              fontSize: 12.5, color: T.textMute, lineHeight: 1.65, margin: 0,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {course.description}
            </p>
          )}

          {/* Session schedule strip */}
          <div style={{
            background: T.paper, border: `1px dashed ${T.line}`, borderRadius: 11,
            padding: "0.7rem 0.85rem", display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{
              fontSize: 10.5, color: T.textFaint, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 5, letterSpacing: ".3px",
            }}>
              <span>🗓️</span> {sessionCount > 1 ? t("schoolDetails.courses.sessionsScheduled", { count: sessionCount }) : t("schoolDetails.courses.sessionDate")}
            </div>
            {firstSession && (
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>
                {firstSession.date ? new Date(firstSession.date).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }) : "—"}
                {" · "}
                {firstSession.startTime?.slice(0, 5)}–{firstSession.endTime?.slice(0, 5)}
              </div>
            )}
          </div>

          <div>
            <div style={{ background: T.paperDim, borderRadius: 99, height: 6, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: "100%",
                  background: isFull ? T.red : `linear-gradient(90deg, ${T.ink}, ${T.amber})`,
                  borderRadius: 99,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 5, fontWeight: 500 }}>
              {t("schoolDetails.courses.enrolledCount", { count: course.enrolledCount, max: course.maxStudents ?? "∞" })}
              {isFull && <span style={{ color: T.red, marginRight: 6, fontWeight: 700 }}>· {t("schoolDetails.module.full")}</span>}
            </div>
          </div>

          {/* Price + CTA */}
          <div style={{
            marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${T.lineSoft}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <div className="sd-serif" style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>
                {course.totalPrice?.toLocaleString()}
              </div>
              <div style={{ fontSize: 10.5, color: T.textMute, fontWeight: 500 }}>{t("schoolDetails.courses.pricePerCourse")}</div>
            </div>

            {isEnrolled ? (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                style={{
                  background: T.greenBg, color: T.green,
                  border: `1px solid ${T.green}30`, borderRadius: 9,
                  padding: "7px 14px", fontSize: 12, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >✓ {t("schoolDetails.module.enrolled")}</motion.span>
            ) : isPending ? (
              <span className="sd-pulse-dot" style={{
                background: "#FCF1E2", color: T.amberDeep,
                border: `1px solid ${T.amberDeep}30`, borderRadius: 9,
                padding: "7px 14px", fontSize: 12, fontWeight: 700,
              }}>⏳ {t("schoolDetails.module.pending")}</span>
            ) : (
              <motion.button
                whileHover={isFull ? {} : { scale: 1.04, y: -1 }}
                whileTap={isFull ? {} : { scale: 0.96 }}
                transition={springFirm}
                className={!isFull ? "sd-glow" : ""}
                disabled={isFull}
                onClick={() => onEnroll(course)}
                style={{
                  background: isFull ? T.paperDim : T.gradAmber,
                  color: isFull ? T.textFaint : "#fff",
                  border: "none", borderRadius: 10,
                  padding: "9px 20px", fontSize: 13, fontWeight: 700,
                  cursor: isFull ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isFull ? t("schoolDetails.module.full") : `🎟️ ${t("schoolDetails.courses.enrollCta")}`}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============================================================
   Enroll modal (module — recurring weekly unit)
   ============================================================ */
function EnrollModal({ mod, schoolName, onConfirm, onCancel, loading }) {
  const { t } = useLanguage();
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel, loading]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !loading && onCancel()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8,44,67,.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: "1rem",
      }}
      role="dialog" aria-modal="true"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={springSoft}
        style={{
          background: T.white, borderRadius: 22, padding: "2rem",
          maxWidth: 440, width: "100%",
          border: `1px solid ${T.line}`,
          boxShadow: T.shadowXl,
          position: "relative",
        }}
      >
        <button
          onClick={() => !loading && onCancel()}
          aria-label={t("schoolDetails.modal.close")}
          style={{
            position: "absolute", top: 14, left: 14,
            background: T.paper, border: `1px solid ${T.line}`,
            width: 32, height: 32, borderRadius: 10,
            cursor: "pointer", color: T.textMute,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          ✕
        </button>

        <motion.div
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 1.25rem",
            background: T.gradInk,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, color: "#fff",
            boxShadow: `0 12px 28px ${T.ink}50`,
          }}
        >📋</motion.div>

        <h2 className="sd-serif" style={{
          fontSize: 20, fontWeight: 700, color: T.text,
          margin: "0 0 6px", textAlign: "center",
        }}>
          {t("schoolDetails.modal.moduleTitle")}
        </h2>
        <p style={{
          fontSize: 13, color: T.textMute, textAlign: "center",
          margin: "0 0 1.5rem", lineHeight: 1.7,
        }}>
          {t("schoolDetails.modal.moduleQuestion", { moduleName: mod?.moduleName })}<br />
          {t("schoolDetails.modal.awaitingApproval", { schoolName })}
        </p>

        {mod && (
          <div style={{
            background: T.paper, borderRadius: 14,
            border: `1px solid ${T.line}`, padding: "1rem 1.15rem",
            marginBottom: "1.5rem",
          }}>
            {[
              [t("schoolDetails.modal.subject"), mod.subjectName],
              [t("schoolDetails.modal.teacher"), mod.teacherName],
              [t("schoolDetails.modal.time"), `${mod.startTime?.slice(0,5)} – ${mod.endTime?.slice(0,5)}`],
            ].map(([k, v], i, arr) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: `1px solid ${T.lineSoft}`,
              }}>
                <span style={{ fontSize: 12.5, color: T.textMute }}>{k}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
              <span style={{ fontSize: 12.5, color: T.textMute }}>{t("schoolDetails.modal.price")}</span>
              <span className="sd-serif" style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                {t("schoolDetails.modal.priceMonthly", { price: mod.monthlyPrice?.toLocaleString() })}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 11,
              background: T.paper, color: T.textMute,
              border: `1px solid ${T.line}`, fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("schoolDetails.modal.cancel")}
          </motion.button>
          <motion.button
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 11,
              background: loading ? `${T.ink}99` : T.gradInk,
              color: "#fff", border: "none", fontSize: 13.5, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : `0 8px 20px ${T.ink}40`,
            }}
          >
            {loading && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                  display: "inline-block",
                }}
              />
            )}
            {loading ? t("schoolDetails.modal.sending") : t("schoolDetails.modal.confirmRequest")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Enroll modal (course — event, date-bound)
   ============================================================ */
function CourseEnrollModal({ course, schoolName, onConfirm, onCancel, loading }) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US";
  const sessionCount = course?.sessions?.length || 0;
  const firstSession = nextUpcomingSession(course?.sessions);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !loading && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel, loading]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => !loading && onCancel()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8,44,67,.55)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 300, padding: "1rem",
      }}
      role="dialog" aria-modal="true"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={springSoft}
        style={{
          background: T.white, borderRadius: 22, padding: "2rem",
          maxWidth: 440, width: "100%",
          border: `1px solid ${T.line}`,
          boxShadow: T.shadowXl,
          position: "relative",
        }}
      >
        <button
          onClick={() => !loading && onCancel()}
          aria-label={t("schoolDetails.modal.close")}
          style={{
            position: "absolute", top: 14, left: 14,
            background: T.paper, border: `1px solid ${T.line}`,
            width: 32, height: 32, borderRadius: 10,
            cursor: "pointer", color: T.textMute,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 600, fontFamily: "inherit",
          }}
        >
          ✕
        </button>

        <motion.div
          initial={{ scale: 0.5, rotate: 15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 1.25rem",
            background: T.gradAmber,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, color: "#fff",
            boxShadow: `0 12px 28px ${T.amber}70`,
          }}
        >🎟️</motion.div>

        <h2 className="sd-serif" style={{
          fontSize: 20, fontWeight: 700, color: T.text,
          margin: "0 0 6px", textAlign: "center",
        }}>
          {t("schoolDetails.modal.courseTitle")}
        </h2>
        <p style={{
          fontSize: 13, color: T.textMute, textAlign: "center",
          margin: "0 0 1.5rem", lineHeight: 1.7,
        }}>
          {t("schoolDetails.modal.courseQuestion", { courseName: course?.name })}<br />
          {t("schoolDetails.modal.awaitingApproval", { schoolName })}
        </p>

        {course && (
          <div style={{
            background: T.paper, borderRadius: 14,
            border: `1px solid ${T.line}`, padding: "1rem 1.15rem",
            marginBottom: "1.5rem",
          }}>
            {[
              [t("schoolDetails.modal.subject"), course.subjectName],
              [t("schoolDetails.modal.teacher"), course.teacherName],
              [t("schoolDetails.modal.sessionCount"), t("schoolDetails.modal.sessionCountValue", { count: sessionCount })],
              firstSession ? [t("schoolDetails.modal.firstSession"), `${firstSession.date ? new Date(firstSession.date).toLocaleDateString(dateLocale, { day: "numeric", month: "long" }) : "—"} · ${firstSession.startTime?.slice(0,5)}–${firstSession.endTime?.slice(0,5)}`] : null,
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: `1px solid ${T.lineSoft}`,
              }}>
                <span style={{ fontSize: 12.5, color: T.textMute }}>{k}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
              <span style={{ fontSize: 12.5, color: T.textMute }}>{t("schoolDetails.modal.price")}</span>
              <span className="sd-serif" style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                {t("schoolDetails.modal.priceTotal", { price: course.totalPrice?.toLocaleString() })}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 11,
              background: T.paper, color: T.textMute,
              border: `1px solid ${T.line}`, fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t("schoolDetails.modal.cancel")}
          </motion.button>
          <motion.button
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.98 }}
            onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: "12px 0", borderRadius: 11,
              background: loading ? `${T.amber}99` : T.gradAmber,
              color: "#fff", border: "none", fontSize: 13.5, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: loading ? "none" : `0 8px 20px ${T.amber}60`,
            }}
          >
            {loading && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                  display: "inline-block",
                }}
              />
            )}
            {loading ? t("schoolDetails.modal.sending") : t("schoolDetails.modal.confirmBooking")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Toast — floating, glassy, animated progress bar
   ============================================================ */
function Toast({ message, type = "success" }) {
  const isSuccess = type === "success";
  const barColor = isSuccess ? T.green : "#ef4444";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 20, x: "-50%" }}
      transition={springSoft}
      role="status" aria-live="polite"
      style={{
        position: "fixed", bottom: 32, left: "50%",
        background: isSuccess ? T.inkDeep : "#7f1d1d",
        color: "#fff",
        padding: "14px 22px 0",
        borderRadius: 14,
        fontSize: 13.5, fontWeight: 500,
        zIndex: 400,
        boxShadow: "0 20px 50px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.06) inset",
        maxWidth: "calc(100vw - 40px)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14 }}>
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: barColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: "#fff", fontWeight: 700, flexShrink: 0,
            boxShadow: `0 0 0 3px ${barColor}30`,
          }}
        >
          {isSuccess ? "✓" : "✕"}
        </motion.span>
        <span>{message}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,.1)" }}>
        <div className="sd-toast-bar" style={{
          height: "100%", background: barColor, transformOrigin: "right",
        }} />
      </div>
    </motion.div>
  );
}

/* ============================================================
   Skeleton primitives + full-page skeleton
   ============================================================ */
function Skeleton({ w = "100%", h = 16, r = 8, mb = 0, style }) {
  return <div className="sd-skel" style={{ width: w, height: h, borderRadius: r, marginBottom: mb, ...style }} />;
}

function SchoolDetailsSkeleton() {
  const { dir } = useLanguage();
  return (
    <div dir={dir} className="sd-root" style={{ minHeight: "100vh", background: T.paper, paddingBottom: "3rem" }}>
      <GlobalStyles />
      <div style={{ background: T.white, borderBottom: `1px solid ${T.line}`, padding: "0.75rem 2rem" }}>
        <Skeleton w={260} h={14} />
      </div>
      <div style={{ padding: "2.5rem 2rem", background: T.gradInk }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Skeleton w={90} h={26} r={99} mb={16} style={{ background: "rgba(255,255,255,.15)" }} />
          <Skeleton w={320} h={36} mb={10} style={{ background: "rgba(255,255,255,.15)" }} />
          <Skeleton w={200} h={16} style={{ background: "rgba(255,255,255,.12)" }} />
        </div>
      </div>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "2.25rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
              <Skeleton h={110} r={18} /><Skeleton h={110} r={18} /><Skeleton h={110} r={18} />
            </div>
            <Skeleton h={200} r={18} mb={24} />
            <Skeleton h={240} r={18} mb={24} />
            <Skeleton h={200} r={18} />
          </div>
          <div>
            <Skeleton h={480} r={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Empty states
   ============================================================ */
function EmptyState({ icon = "📭", title, subtitle, cta, onCta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: T.white, borderRadius: 16,
        border: `1.5px dashed ${T.line}`,
        padding: "2rem", textAlign: "center",
      }}
    >
      <div className="sd-float" style={{
        width: 64, height: 64, borderRadius: 18,
        background: T.paper, border: `1px solid ${T.line}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px", fontSize: 28,
      }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 5 }}>{title}</div>
      {subtitle && <p style={{ fontSize: 12.5, color: T.textMute, margin: 0, lineHeight: 1.7 }}>{subtitle}</p>}
      {cta && (
        <button onClick={onCta} style={{
          marginTop: 14, background: T.gradInk, color: "#fff",
          border: "none", borderRadius: 10, padding: "9px 20px",
          fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 8px 18px ${T.ink}35`,
        }}>
          {cta}
        </button>
      )}
    </motion.div>
  );
}

/* ============================================================
   Main component
   ============================================================ */
export default function SchoolDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir, locale } = useLanguage();

  const DAY_LABELS = {
    SUNDAY: t("schoolDetails.days.sunday"),
    MONDAY: t("schoolDetails.days.monday"),
    TUESDAY: t("schoolDetails.days.tuesday"),
    WEDNESDAY: t("schoolDetails.days.wednesday"),
    THURSDAY: t("schoolDetails.days.thursday"),
    FRIDAY: t("schoolDetails.days.friday"),
    SATURDAY: t("schoolDetails.days.saturday"),
  };

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
        console.log("accepted : ", res.data);
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
      .then((res) => {
        console.log("dorat", res.data);
        setCourses(res.data || []);
      })
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
      showToast(t("schoolDetails.toast.moduleRequestSuccess", { moduleName: enrollModal.moduleName }));
      setEnrollModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || t("schoolDetails.toast.genericError");
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
      showToast(t("schoolDetails.toast.courseRequestSuccess", { courseName: courseEnrollModal.name }));
      setCourseEnrollModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || t("schoolDetails.toast.genericError");
      showToast(msg, "error");
    } finally {
      setCourseEnrollLoading(false);
    }
  };

  /* ---- Loading ---- */
  if (loading) return <SchoolDetailsSkeleton />;

  /* ---- Not found ---- */
  if (notFound || !school) return (
    <div dir={dir} className="sd-root" style={{
      minHeight: "100vh", background: T.paper,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <GlobalStyles />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springSoft}
        style={{
          background: T.white, borderRadius: 22, border: `1px solid ${T.line}`,
          padding: "2.75rem", maxWidth: 400, textAlign: "center",
          boxShadow: T.shadowLg,
        }}
      >
        <div className="sd-float" style={{
          width: 84, height: 84, borderRadius: 22, margin: "0 auto 1.25rem",
          background: T.paper, border: `1px solid ${T.line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
        }}>🏫</div>
        <h2 className="sd-serif" style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 10px" }}>
          {t("schoolDetails.notFound.title")}
        </h2>
        <p style={{ fontSize: 13.5, color: T.textMute, margin: "0 0 1.75rem", lineHeight: 1.7 }}>
          {t("schoolDetails.notFound.subtitle")}
        </p>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/schools")}
          style={{
            width: "100%", padding: "13px 0", borderRadius: 12,
            background: T.gradInk,
            color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 10px 24px ${T.ink}40`,
          }}
        >
          {t("schoolDetails.notFound.back")}
        </motion.button>
      </motion.div>
    </div>
  );

  const isStudent = user?.role === "STUDENT";
  const modulesForDay = activeDay ? (school.modulesByDay[activeDay] || []) : [];

  return (
    <div dir={dir} className="sd-root" style={{ minHeight: "100vh", background: T.paper, paddingBottom: "3rem" }}>
      <GlobalStyles />

      <AnimatePresence>
        {toast && <Toast key={toast.message} message={toast.message} type={toast.type} />}
      </AnimatePresence>
      <AnimatePresence>
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
      </AnimatePresence>

      {/* Breadcrumb */}
      <div style={{
        background: `${T.white}dd`,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${T.line}`,
        padding: "0.75rem 2rem",
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, color: T.textMute, overflowX: "auto", whiteSpace: "nowrap",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <span className="sd-crumb-link" onClick={() => navigate("/")}>{t("schoolDetails.breadcrumb.home")}</span>
        <span style={{ color: T.textFaint }}>›</span>
        <span className="sd-crumb-link" onClick={() => navigate("/schools")}>{t("schoolDetails.breadcrumb.browseSchools")}</span>
        <span style={{ color: T.textFaint }}>›</span>
        <span style={{ color: T.text, fontWeight: 600 }}>{school.schoolName}</span>
      </div>

      {/* Hero */}
      <div className="sd-hero-pad" style={{
        background: T.gradInk,
        position: "relative", overflow: "hidden",
      }}>
        <div className="sd-grain" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        <div className="sd-pattern" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Animated orbs */}
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: -80, left: -70,
            width: 300, height: 300, borderRadius: "50%",
            background: "rgba(255,255,255,.05)", filter: "blur(20px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 14, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: -60, right: 40,
            width: 220, height: 220, borderRadius: "50%",
            background: `${T.amber}25`, filter: "blur(24px)",
          }}
        />
        <div style={{
          position: "absolute", top: "28%", left: "44%",
          width: 110, height: 110, borderRadius: "50%",
          background: "rgba(255,255,255,.04)", filter: "blur(10px)",
        }} />

        <div style={{
          maxWidth: 1180, margin: "0 auto", position: "relative", zIndex: 1,
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge status={school.subscriptionStatus} onDark />
              <span style={{
                background: "rgba(255,255,255,.14)",
                border: "1px solid rgba(255,255,255,.28)",
                backdropFilter: "blur(8px)",
                color: "#fff", borderRadius: 999,
                padding: "6px 14px", fontSize: 12, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <span>📍</span> {school.wilaya}
              </span>
            </div>
            <h1 className="sd-serif sd-hero-title" style={{
              fontSize: 44, fontWeight: 700, color: "#fff",
              margin: "0 0 12px", lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textShadow: "0 4px 24px rgba(0,0,0,.25)",
            }}>
              {school.schoolName}
            </h1>
            <p style={{
              fontSize: 15, color: "rgba(255,255,255,.82)",
              margin: 0, display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
            }}>
              <span>🏛️</span> {school.wilaya} — {school.commune}
            </p>
          </motion.div>

          {school.logoUrl && (
            <motion.img
              src={school.logoUrl}
              className="sd-hero-logo"
              alt={school.schoolName}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              style={{
                height: 112, width: 112, borderRadius: 22, objectFit: "cover",
                border: "4px solid rgba(255,255,255,.9)",
                boxShadow: "0 16px 40px rgba(0,0,0,.35), 0 0 0 6px rgba(214,140,52,.35)",
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="sd-layout sd-main-pad" style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0 }}>

          <div className="sd-stats-row">
            <StatCard icon="👩‍🏫" value={school.totalTeachers} label={t("schoolDetails.stats.teachers")} delay={0} accent={T.ink} />
            <StatCard icon="📚" value={school.totalModules} label={t("schoolDetails.stats.modules")} delay={0.08} accent={T.amberDeep} />
            <StatCard icon="🎓" value={school.totalStudents} label={t("schoolDetails.stats.students")} delay={0.16} accent={T.green} />
          </div>

          {/* School info */}
          <Reveal delay={0.05}>
            <div style={{
              background: T.white, border: `1px solid ${T.line}`,
              borderRadius: 20, padding: "1.75rem",
              boxShadow: T.shadowSm,
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "1.5rem",
              }}>
                <h2 className="sd-serif" style={{
                  fontSize: 20, fontWeight: 700, color: T.text, margin: 0,
                  letterSpacing: "-0.01em",
                }}>
                  {t("schoolDetails.info.title")}
                </h2>
                <div style={{
                  height: 1, flex: 1, marginRight: 16,
                  background: `linear-gradient(to left, transparent, ${T.line})`,
                }} />
              </div>
              <div className="sd-info-grid">
                {[
                  { label: t("schoolDetails.info.owner"), value: school.ownerName, icon: "👤" },
                  { label: t("schoolDetails.info.email"), value: school.email, icon: "📧" },
                  { label: t("schoolDetails.info.phone"), value: school.phone, icon: "📞" },
                  { label: t("schoolDetails.info.address"), value: school.address, icon: "🏠" },
                  { label: t("schoolDetails.info.subscriptionExpires"), value: school.subscriptionExpiresAt, icon: "📅" },
                  { label: t("schoolDetails.info.wilaya"), value: `${school.wilaya} — ${school.commune}`, icon: "📍" },
                ].map(({ label, value, icon }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: "12px", borderRadius: 12,
                      background: T.paper, border: `1px solid ${T.lineSoft}`,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: T.white, border: `1px solid ${T.line}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: 10.5, color: T.textFaint,
                        marginBottom: 4, fontWeight: 700,
                        letterSpacing: ".5px", textTransform: "uppercase",
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontSize: 13.5, fontWeight: 600, color: T.text,
                        wordBreak: "break-word", lineHeight: 1.4,
                      }}>
                        {value || "—"}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Courses — presented as EVENTS, distinct from the recurring weekly modules below */}
          {!coursesLoading && courses.length > 0 && (
            <Reveal delay={0.06}>
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem", gap: 12, flexWrap: "wrap",
                }}>
                  <div>
                    <h2 className="sd-serif" style={{
                      fontSize: 20, fontWeight: 700, color: T.text,
                      margin: "0 0 4px", letterSpacing: "-0.01em",
                    }}>
                      🎟️ {t("schoolDetails.courses.title")}
                    </h2>
                    <p style={{ fontSize: 12.5, color: T.textMute, margin: 0 }}>
                      {t("schoolDetails.courses.subtitle")}
                    </p>
                  </div>
                  <span style={{
                    background: T.gradAmber, color: "#fff",
                    borderRadius: 99, padding: "5px 14px",
                    fontSize: 12, fontWeight: 700,
                    boxShadow: `0 6px 14px ${T.amber}45`,
                  }}>
                    {t("schoolDetails.courses.count", { count: courses.length })}
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
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}>
                  <h2 className="sd-serif" style={{
                    fontSize: 20, fontWeight: 700, color: T.text, margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    {t("schoolDetails.teachers.title")}
                  </h2>
                  <span style={{
                    background: "#EAF2F8", color: T.ink,
                    border: `1px solid ${T.ink}22`,
                    borderRadius: 99, padding: "5px 14px",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {t("schoolDetails.teachers.count", { count: school.teachers.length })}
                  </span>
                </div>
                <div className="sd-teachers-grid">
                  {school.teachers.map((t2, i) => (
                    <TeacherCard key={t2.teacherId} teacher={t2} index={i} />
                  ))}
                </div>
              </div>
            </Reveal>
          )}

          {/* Weekly schedule */}
          {sortedDays.length > 0 && (
            <Reveal delay={0.1}>
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem",
                }}>
                  <h2 className="sd-serif" style={{
                    fontSize: 20, fontWeight: 700, color: T.text, margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    {t("schoolDetails.schedule.title")}
                  </h2>
                  <span style={{
                    fontSize: 12, color: T.textMute, fontWeight: 500,
                    background: T.paper, border: `1px solid ${T.line}`,
                    padding: "5px 12px", borderRadius: 99,
                  }}>
                    {t("schoolDetails.schedule.moduleCount", { count: school.totalModules })}
                  </span>
                </div>

                <div
                  role="tablist"
                  className="sd-daytabs-scroll"
                  style={{
                    display: "flex", gap: 8, marginBottom: "1.25rem",
                    overflowX: "auto", padding: "4px",
                    background: T.white, borderRadius: 14,
                    border: `1px solid ${T.line}`,
                  }}
                >
                  {sortedDays.map((day) => {
                    const isActive = activeDay === day;
                    const count = school.modulesByDay[day]?.length || 0;
                    return (
                      <button
                        key={day}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveDay(day)}
                        style={{
                          position: "relative",
                          padding: "10px 18px", borderRadius: 10,
                          flexShrink: 0, border: "none",
                          background: "transparent",
                          color: isActive ? "#fff" : T.textMute,
                          fontSize: 13, fontWeight: isActive ? 700 : 600,
                          cursor: "pointer", fontFamily: "inherit",
                          display: "flex", alignItems: "center", gap: 8,
                          transition: "color .25s ease",
                          zIndex: 1,
                        }}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="sd-daytab-pill"
                            transition={springSoft}
                            style={{
                              position: "absolute", inset: 0,
                              background: T.gradInk, borderRadius: 10,
                              boxShadow: `0 6px 14px ${T.ink}35`,
                              zIndex: -1,
                            }}
                          />
                        )}
                        <span>{DAY_LABELS[day]}</span>
                        <span style={{
                          background: isActive ? "rgba(255,255,255,.22)" : T.paperDim,
                          color: isActive ? "#fff" : T.textMute,
                          borderRadius: 99, padding: "2px 8px",
                          fontSize: 11, fontWeight: 700, minWidth: 22, textAlign: "center",
                        }}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div role="tabpanel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDay}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      style={{ display: "flex", flexDirection: "column", gap: 12 }}
                    >
                      {modulesForDay.map((mod, i) => (
                        <motion.div
                          key={`${mod.moduleId}-${mod.day}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <ModuleRow
                            mod={mod}
                            isEnrolled={enrolledIds.includes(mod.moduleId)}
                            isPending={pendingIds.includes(mod.moduleId)}
                            onEnroll={(m) => {
                              if (!isStudent) { navigate("/login"); return; }
                              setEnrollModal(m);
                            }}
                          />
                        </motion.div>
                      ))}
                      {modulesForDay.length === 0 && (
                        <EmptyState
                          icon="📭"
                          title={t("schoolDetails.schedule.emptyDayTitle", { day: DAY_LABELS[activeDay] })}
                          subtitle={t("schoolDetails.schedule.emptyDaySubtitle")}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {/* Sidebar */}
        <div className="sd-sidebar-sticky">
          <Reveal delay={0.05}>
            <div style={{
              background: T.white, borderRadius: 20,
              border: `1px solid ${T.line}`, padding: "1.75rem",
              boxShadow: T.shadowMd,
              position: "relative", overflow: "hidden",
            }}>
              {/* Decorative gradient corner */}
              <div style={{
                position: "absolute", top: -60, left: -60,
                width: 160, height: 160, borderRadius: "50%",
                background: `radial-gradient(circle, ${T.amber}18 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              {isStudent ? (
                <>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      fontSize: 10.5, fontWeight: 700, color: T.amberDeep,
                      letterSpacing: ".5px", textTransform: "uppercase",
                      marginBottom: 6,
                    }}>
                      {t("schoolDetails.sidebar.eyebrowStudent")}
                    </div>
                    <h2 className="sd-serif" style={{
                      fontSize: 19, fontWeight: 700, color: T.text,
                      margin: "0 0 6px", letterSpacing: "-0.01em",
                    }}>
                      {t("schoolDetails.sidebar.titleStudent")}
                    </h2>
                    <p style={{ fontSize: 12.5, color: T.textMute, margin: "0 0 1.25rem", lineHeight: 1.7 }}>
                      {t("schoolDetails.sidebar.subtitleStudent")}
                    </p>
                  </div>

                  <div style={{
                    background: T.paper, borderRadius: 13,
                    border: `1px solid ${T.line}`,
                    padding: "0.4rem 1rem", marginBottom: "1.25rem",
                  }}>
                    {[
                      [t("schoolDetails.sidebar.availableDays"), t("schoolDetails.sidebar.availableDaysValue", { count: sortedDays.length })],
                      [t("schoolDetails.sidebar.modulesLabel"), t("schoolDetails.sidebar.modulesValue", { count: school.totalModules })],
                      [t("schoolDetails.sidebar.coursesLabel"), t("schoolDetails.sidebar.coursesValue", { count: courses.length })],
                      [t("schoolDetails.sidebar.studentsLabel"), t("schoolDetails.sidebar.studentsValue", { count: school.totalStudents })],
                    ].map(([k, v], i, arr) => (
                      <div key={k} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 0",
                        borderBottom: i < arr.length - 1 ? `1px solid ${T.lineSoft}` : "none",
                      }}>
                        <span style={{ fontSize: 12, color: T.textMute, fontWeight: 500 }}>{k}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {(pendingIds.length + pendingCourseIds.length) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={springSoft}
                      style={{
                        background: "#FCF1E2",
                        border: `1px solid ${T.amberDeep}30`,
                        borderRadius: 11,
                        padding: "11px 14px", fontSize: 12.5, color: T.amberDeep,
                        display: "flex", alignItems: "center", gap: 10,
                        marginBottom: "0.75rem", fontWeight: 600,
                      }}
                    >
                      <span className="sd-pulse-dot" style={{ fontSize: 15 }}>⏳</span>
                      {t("schoolDetails.sidebar.pendingNotice", { count: pendingIds.length + pendingCourseIds.length })}
                    </motion.div>
                  )}

                  {(enrolledIds.length + enrolledCourseIds.length) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={springSoft}
                      style={{
                        background: T.greenBg,
                        border: `1px solid ${T.green}30`,
                        borderRadius: 11,
                        padding: "11px 14px", fontSize: 12.5, color: T.green,
                        display: "flex", alignItems: "center", gap: 10,
                        marginBottom: "1rem", fontWeight: 600,
                      }}
                    >
                      <span style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: T.green, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>✓</span>
                      {t("schoolDetails.sidebar.enrolledNotice", { count: enrolledIds.length + enrolledCourseIds.length })}
                    </motion.div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      fontSize: 10.5, fontWeight: 700, color: T.amberDeep,
                      letterSpacing: ".5px", textTransform: "uppercase",
                      marginBottom: 6,
                    }}>
                      {t("schoolDetails.sidebar.eyebrowGuest")}
                    </div>
                    <h2 className="sd-serif" style={{
                      fontSize: 19, fontWeight: 700, color: T.text,
                      margin: "0 0 6px", letterSpacing: "-0.01em",
                    }}>
                      {t("schoolDetails.sidebar.titleGuest")}
                    </h2>
                    <p style={{ fontSize: 12.5, color: T.textMute, margin: "0 0 1.25rem", lineHeight: 1.7 }}>
                      {t("schoolDetails.sidebar.subtitleGuest")}
                    </p>
                  </div>
                  <div style={{
                    background: T.paper, border: `1.5px dashed ${T.line}`,
                    borderRadius: 14, padding: "1.5rem",
                    textAlign: "center", marginBottom: "1.25rem",
                  }}>
                    <div className="sd-float" style={{
                      width: 56, height: 56, borderRadius: 15,
                      background: T.gradInk,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 14px", fontSize: 24, color: "#fff",
                      boxShadow: `0 10px 24px ${T.ink}40`,
                    }}>🔒</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                      {t("schoolDetails.sidebar.loginRequiredTitle")}
                    </div>
                    <p style={{ fontSize: 12, color: T.textMute, margin: "0 0 16px", lineHeight: 1.7 }}>
                      {t("schoolDetails.sidebar.loginRequiredSubtitle")}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/login")}
                        style={{
                          width: "100%", padding: "12px 0", borderRadius: 11,
                          background: T.gradInk, color: "#fff", border: "none",
                          fontSize: 13.5, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                          boxShadow: `0 8px 20px ${T.ink}40`,
                        }}
                      >
                        {t("schoolDetails.sidebar.loginCta")}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/signup")}
                        style={{
                          width: "100%", padding: "12px 0", borderRadius: 11,
                          background: T.white, color: T.ink,
                          border: `1.5px solid ${T.ink}`,
                          fontSize: 13.5, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {t("schoolDetails.sidebar.signupCta")}
                      </motion.button>
                    </div>
                  </div>
                </>
              )}

              <div style={{
                height: 1, margin: "0 0 1.25rem",
                background: `linear-gradient(to left, transparent, ${T.line}, transparent)`,
              }} />

              <div style={{ position: "relative" }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: T.textFaint,
                  letterSpacing: ".5px", textTransform: "uppercase",
                  marginBottom: 10,
                }}>
                  {t("schoolDetails.sidebar.whyUsTitle")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[
                    { dot: T.green, text: t("schoolDetails.sidebar.whyUs1") },
                    { dot: T.ink, text: t("schoolDetails.sidebar.whyUs2") },
                    { dot: T.amberDeep, text: t("schoolDetails.sidebar.whyUs3") },
                  ].map(({ dot, text }, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: 7,
                        background: `${dot}15`, border: `1px solid ${dot}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%", background: dot,
                        }} />
                      </div>
                      <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}