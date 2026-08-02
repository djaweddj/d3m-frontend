import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  GraduationCap, School, Users, BookOpen, Star,
  MapPin, ArrowLeft, ArrowRight, Sparkles, Shield,
  TrendingUp, Clock, UserCircle2, PresentationIcon,
  ChevronDown, CheckCircle2, Search, X, Zap, Award, Heart
} from "lucide-react";

import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";

// ─── API config ───────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── Numeria brand tokens ──────────────────────────────────
// Primary: Deep Emerald · Secondary: Royal Gold · Accent: Algerian Red (used sparingly)
// Background: Warm Off White
const BRAND = {
  emerald: "#0F5A46",
  emeraldDeep: "#0B4436",
  gold: "#C8A24B",
  goldDeep: "#96751F",
  red: "#C53030",
  bg: "#FAFAF7",
};

// ─── helpers ──────────────────────────────────────────────
const getInitials = (name, fallback) =>
  (name ?? fallback).split(" ").map((w) => w[0]).join("").slice(0, 2);
// ─── Custom hook: Count up with spring physics ────────────
function useCountUp(value, duration = 2000) {
  const [display, setDisplay] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (value == null || !isInView) return;
    setHasStarted(true);
    let start = null;
    let raf;

    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out-expo for snappy feel
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, isInView]);

  return { display, ref, hasStarted };
}

function formatNumber(n, locale = "en-US") {
  if (n == null) return "—";
  return n.toLocaleString(locale);
}

// ─── Animated text component ──────────────────────────────
function AnimatedText({ text, className = "", delay = 0 }) {
  const words = text.split(" ");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.08,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className="inline-block mr-[0.25em]"
          style={{ transformOrigin: "bottom" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// ─── User pill ────────────────────────────────────────────
function UserPill({ user }) {
  const { t } = useLanguage();
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2.5 rounded-full border border-[#0F5A46]/20 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0F5A46] to-[#0B4436] text-[11px] font-bold text-white shadow-lg shadow-[#0F5A46]/25">
          {getInitials(user.name, t("home.visitor")[0])}
        </div>
        <span className="text-sm font-semibold text-slate-800">{user.name}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm"
    >
      <UserCircle2 className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-500">{t("home.visitor")}</span>
      <span className="h-2 w-2 rounded-full bg-[#C8A24B] animate-pulse shadow-sm shadow-[#C8A24B]/50" />
    </motion.div>
  );
}

// ─── Stat card (live data) ────────────────────────────────
function StatCard({ icon: Icon, value, label, loading, delay, color, locale }) {
  const { display, ref, hasStarted } = useCountUp(loading ? null : value);

  // Two brand hues carry the set; red appears once, reserved for the Teachers
  // card so the accent stays a rare flourish rather than a repeated color.
  const colorSchemes = {
    emerald: { bg: "bg-[#0F5A46]/8", text: "text-[#0F5A46]", glow: "bg-[#0F5A46]/20", border: "border-[#0F5A46]/25" },
    gold: { bg: "bg-[#C8A24B]/12", text: "text-[#96751F]", glow: "bg-[#C8A24B]/25", border: "border-[#C8A24B]/30" },
    red: { bg: "bg-[#C53030]/8", text: "text-[#C53030]", glow: "bg-[#C53030]/20", border: "border-[#C53030]/25" },
  };

  const scheme = colorSchemes[color] || colorSchemes.emerald;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`group relative overflow-hidden rounded-3xl border ${scheme.border} bg-white px-6 py-10 text-center shadow-sm hover:shadow-xl transition-all duration-500`}
    >
      {/* Animated glow */}
      <div className={`absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full ${scheme.glow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

      {/* Icon */}
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
        className={`relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${scheme.bg} ${scheme.text} shadow-inner`}
      >
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </motion.div>

      {/* Number */}
      <div className="relative mb-2 text-5xl font-black tabular-nums tracking-tight">
        {loading ? (
          <span className="inline-block h-12 w-24 animate-pulse rounded-xl bg-slate-100 align-middle" />
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={hasStarted ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className={scheme.text}
          >
            {formatNumber(display, locale)}<span className="text-3xl">+</span>
          </motion.span>
        )}
      </div>

      {/* Label */}
      <div className="relative text-sm font-semibold text-slate-500 tracking-wide">{label}</div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-1/2 h-1 w-0 -translate-x-1/2 rounded-full ${scheme.text.replace('text-', 'bg-')} opacity-60 group-hover:w-1/2 transition-all duration-500`} />
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, delay, color }) {
  const colorSchemes = {
    emerald: "bg-[#0F5A46]/8 text-[#0F5A46] shadow-[#0F5A46]/20",
    gold: "bg-[#C8A24B]/12 text-[#96751F] shadow-[#C8A24B]/25",
    red: "bg-[#C53030]/8 text-[#C53030] shadow-[#C53030]/20",
  };

  const scheme = colorSchemes[color] || colorSchemes.emerald;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.7 }}
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${scheme} shadow-lg`}
        >
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </motion.div>
        <h4 className="mb-3 text-xl font-bold text-slate-900">{title}</h4>
        <p className="leading-relaxed text-slate-500 text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Floating badge component ─────────────────────────────
function FloatingBadge({ icon: Icon, value, label, delay, position, color }) {
  const colorMap = {
    emerald: "from-[#0F5A46] to-[#0B4436] shadow-[#0F5A46]/30",
    gold: "from-[#C8A24B] to-[#96751F] shadow-[#C8A24B]/30",
    red: "from-[#C53030] to-[#9E2424] shadow-[#C53030]/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 200 }}
      className={`absolute ${position} float-badge hidden lg:flex items-center gap-3 rounded-2xl border border-white/40 bg-white/90 backdrop-blur-xl px-5 py-3 shadow-2xl shadow-slate-200/50`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color]} text-white shadow-lg`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 tabular-nums">{value ?? "…"}</p>
        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Scroll indicator ─────────────────────────────────────
function ScrollIndicator({ label }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown className="h-5 w-5 text-slate-400" />
      </motion.div>
    </motion.div>
  );
}

// ─── Particle background ──────────────────────────────────
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(15, 90, 70, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(15, 90, 70, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// ─── Home page ────────────────────────────────────────────
export default function Home() {
  const LOCALE_MAP = {
  en: "en-US",
  ar: "ar-DZ",
  fr: "fr-FR",
};
  const { user } = useAuth();
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const locale = LOCALE_MAP[language] || "en-US";
  // Trailing arrow on primary CTAs should point toward reading-end: left in RTL, right in LTR.
  const TrailingArrow = isRtl ? ArrowLeft : ArrowRight;

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const [stats, setStats] = useState({ schools: null, students: null, teachers: null });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(false);
        const res = await fetch(`${API_BASE_URL}/api/home`);
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStats({
            schools: data.schools ?? 0,
            students: data.students ?? 0,
            teachers: data.teachers ?? 0,
          });
        }
      } catch (err) {
        if (!cancelled) setStatsError(true);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  // Spring-smoothed scroll progress for parallax
  const springScroll = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const bgY = useTransform(springScroll, [0, 1], ["0%", "30%"]);

  // "How it works" 3-step section and the scroll-hint copy have no keys yet in the
  // `home` namespace — plugging in a home.howItWorks.* / home.hero.scrollHint shape here.
  // Add these to translations.js; falling back to the Arabic originals until then.
  const howItWorks = t("home.howItWorks") && typeof t("home.howItWorks") === "object"
    ? t("home.howItWorks")
    : {
        tag: t("home.strategy.question") ,
        title: t("home.strategy.title") ,
        subtitle: t("home.strategy.subtitle") ,
        steps: [
          { title: t("home.strategy.search"), desc: t("home.strategy.searchP") },
          { title: t("home.strategy.compare"), desc: t("home.strategy.compareP") },
          { title: t("home.strategy.register") , desc: t("home.strategy.registerP") },
        ],
      };
  const scrollHintLabel = (() => {
    const val = t("home.hero.scrollHint");
    return val && val !== "home.hero.scrollHint" ? val : "اسحب للأسفل";
  })();

  const featureItems = t("home.features.items");
  const featureIcons = [Shield, Clock, TrendingUp, Award, Heart, MapPin];
  // Emerald and gold carry the set; red surfaces once (Heart/community) so the
  // accent reads as a deliberate flourish rather than a repeated color.
  const featureColors = ["emerald", "gold", "emerald", "gold", "red", "gold"];

  const avatarInitials = [
    { bg: BRAND.emerald }, { bg: BRAND.gold }, { bg: BRAND.red }, { bg: "#2F7A63" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 overflow-x-hidden" dir={dir}>

      {/* ── Global Styles & Keyframes ── */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(1.5deg); }
        }
        @keyframes floatX {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 64px 64px; }
        }
        @keyframes underlineDraw {
          from { stroke-dashoffset: 220; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(120px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
        }
        @keyframes orbitReverse {
          0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
          100% { transform: rotate(-360deg) translateX(80px) rotate(360deg); }
        }
        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 30% / 70% 30% 50% 60%; }
        }
        .float-badge { animation: floatY 5s ease-in-out infinite; }
        .float-badge-slow { animation: floatSlow 8s ease-in-out infinite; }
        .float-x { animation: floatX 6s ease-in-out infinite; }
        .glow-pulse { animation: pulseGlow 4s ease-in-out infinite; }
        .bg-grid-drift { animation: gridDrift 24s linear infinite; }
        .hero-underline { stroke-dasharray: 220; stroke-dashoffset: 220; animation: underlineDraw 1.2s 0.8s ease-out forwards; }
        .morph-blob { animation: morphBlob 12s ease-in-out infinite; }
        .orbit-element { animation: orbit 20s linear infinite; }
        .orbit-reverse { animation: orbitReverse 15s linear infinite; }

        @media (prefers-reduced-motion: reduce) {
          .float-badge, .float-badge-slow, .float-x, .glow-pulse, .bg-grid-drift,
          .hero-underline, .morph-blob, .orbit-element, .orbit-reverse {
            animation: none !important;
          }
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>


      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative overflow-hidden bg-white min-h-screen flex items-center pt-16">
        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Gradient orbs */}
          <motion.div
            style={{ y: bgY }}
            className="absolute right-[-120px] top-[-120px] h-[500px] w-[500px] rounded-full bg-[#0F5A46]/10 blur-[100px] glow-pulse"
          />
          <motion.div
            style={{ y: bgY }}
            className="absolute left-[-100px] bottom-[-100px] h-[450px] w-[450px] rounded-full bg-[#C8A24B]/10 blur-[100px] glow-pulse"
          />
          <motion.div
            style={{ y: bgY }}
            className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-[#C53030]/6 blur-[80px] glow-pulse"
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.025] bg-grid-drift"
            style={{
              backgroundImage: "linear-gradient(#0F5A46 1px,transparent 1px),linear-gradient(90deg,#0F5A46 1px,transparent 1px)",
              backgroundSize: "64px 64px"
            }}
          />

          {/* Particle network */}
          <ParticleBackground />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className={`container relative mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:gap-16`}
        >
          {/* Left content */}
          <div className={`text-center ${isRtl ? "lg:text-right" : "lg:text-left"} order-2 lg:order-1`}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/20 bg-[#0F5A46]/8 backdrop-blur-sm px-5 py-2 text-sm font-bold text-[#0F5A46] shadow-sm"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              {t("home.hero.badge")}
            </motion.div>

            {/* Headline with animated text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[3.5rem]">
                <AnimatedText text={t("home.hero.titleLine1")} delay={0.3} />
                <br />
                <span className="relative inline-block">
                  <AnimatedText text={t("home.hero.titleHighlight")} delay={0.5} className="text-[#0F5A46]" />
                  <svg className="absolute -bottom-2 right-0 left-0 w-full hidden sm:block" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ height: 10 }}>
                    <path className="hero-underline" d="M0 8 Q50 0 100 6 Q150 12 200 5" fill="none" stroke="#E4CE94" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
                <br />
                <AnimatedText text={t("home.hero.titleLine2")} delay={0.7} />
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0"
              style={{ marginTop: "20px" }}
            >
              {t("home.hero.subtitle") /* falls back to feature/subtitle copy if hero.subtitle isn't set */
                || t("home.features.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Link to="/schools">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="h-14 rounded-2xl bg-gradient-to-r from-[#0F5A46] to-[#0B4436] px-8 text-sm font-bold text-white shadow-xl shadow-[#0F5A46]/25 hover:shadow-[#0F5A46]/40 gap-2 transition-all duration-300 w-full sm:w-auto">
                    <Search className="h-4 w-4" />
                    {t("home.hero.ctaBrowse")}
                    <TrailingArrow className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/schoolregister">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="h-14 rounded-2xl border-2 border-slate-200 px-8 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 gap-2 transition-all duration-300 w-full sm:w-auto">
                    <BookOpen className="h-4 w-4 text-[#C8A24B]" />
                    {t("home.hero.ctaRegister")}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className={`mt-12 flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start`}
            >
              <div className={`flex ${isRtl ? "-space-x-3 space-x-reverse" : "-space-x-3"}`}>
                {avatarInitials.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-lg"
                    style={{ background: item.bg, zIndex: 4 - i }}
                  >
                    {t("home.visitor")[0]}
                  </motion.div>
                ))}
              </div>
              <div className={`text-center ${isRtl ? "sm:text-right" : "sm:text-left"}`}>
                <div className={`flex items-center justify-center ${isRtl ? "sm:justify-start" : "sm:justify-start"} gap-0.5 mb-1`}>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 1.3 + i * 0.1, type: "spring", stiffness: 200 }}
                    >
                      <Star className="h-4 w-4 fill-[#C8A24B] text-[#C8A24B]" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  {statsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#0F5A46]/70 animate-pulse" />
                      {t("home.hero.loading")}
                    </span>
                  ) : (
                    t("home.hero.socialProof", { count: formatNumber(stats.students ?? 0, locale) })
                  )}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right panel — floating visual */}
          <div className="relative hidden lg:flex items-center justify-center h-[500px] order-1 lg:order-2">
            {/* Central morphing blob */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-80 w-80 bg-gradient-to-br from-[#0F5A46]/10 to-[#C8A24B]/10 morph-blob blur-2xl" />
            </div>

            {/* Orbiting elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="orbit-element absolute">
                <div className="h-3 w-3 rounded-full bg-[#0F5A46]/50 shadow-lg shadow-[#0F5A46]/25" />
              </div>
              <div className="orbit-reverse absolute">
                <div className="h-2 w-2 rounded-full bg-[#C8A24B]/60 shadow-lg shadow-[#C8A24B]/30" />
              </div>
            </div>

            {/* Floating badges */}
            <FloatingBadge
              icon={School}
              value={statsLoading ? "…" : formatNumber(stats.schools ?? 0, locale)}
              label={t("home.badges.schools")}
              delay={0.5}
              position="right-4 top-8"
              color="emerald"
            />
            <FloatingBadge
              icon={Users}
              value={statsLoading ? "…" : formatNumber(stats.students ?? 0, locale)}
              label={t("home.badges.students")}
              delay={0.7}
              position="left-0 top-36"
              color="gold"
            />
            <FloatingBadge
              icon={PresentationIcon}
              value={statsLoading ? "…" : formatNumber(stats.teachers ?? 0, locale)}
              label={t("home.badges.teachers")}
              delay={0.9}
              position="right-12 bottom-12"
              color="red"
            />

            {/* Central icon */}
           <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 150 }}
              className="relative z-10"
            >
              <div className="flex h-52 w-52 items-center justify-center">
                <img src="/src/assets/herologo.png" alt="Numeria Academy" className="h-full w-full object-contain drop-shadow-2xl" />
              </div>
              {/* Ripple rings */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 rounded-[2rem] border-2 border-[#0F5A46]/20 animate-ping" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-[-8px] rounded-[2.5rem] border border-[#0F5A46]/12 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <ScrollIndicator label={scrollHintLabel} />
      </section>

      {/* ── Features ── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/20 bg-[#0F5A46]/8 px-5 py-2 text-sm font-bold text-[#0F5A46]"
            >
              <Zap className="h-4 w-4" />
              {t("home.features.tag")}
            </motion.span>
            <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
              <AnimatedText text={t("home.features.title")} />
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg" style={{ marginTop: "20px" }}>
              {t("home.features.subtitle")}
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((item, i) => (
              <FeatureCard
                key={i}
                icon={featureIcons[i] || Shield}
                title={item.title}
                desc={item.desc}
                delay={i * 0.1}
                color={featureColors[i] || "emerald"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (live from API) ── */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-white py-20 sm:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#0F5A46]/6 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-[#C8A24B]/8 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/20 bg-[#0F5A46]/8 px-5 py-2 text-sm font-bold text-[#0F5A46]">
              <TrendingUp className="h-4 w-4" />
              {t("home.stats.tag")}
            </span>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
              <AnimatedText text={t("home.stats.title")} />
            </h2>
          </motion.div>

          {statsError ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-[#C53030]/25 bg-[#C53030]/8 px-6 py-5 text-center"
            >
              <div className="mb-2 flex justify-center">
                <X className="h-8 w-8 text-[#C53030]/70" />
              </div>
              <p className="text-sm font-medium text-[#C53030]">
                {t("home.stats.error")}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={School} value={stats.schools} label={t("home.stats.schools")} loading={statsLoading} delay={0} color="emerald" locale={locale} />
              <StatCard icon={Users} value={stats.students} label={t("home.stats.students")} loading={statsLoading} delay={0.15} color="gold" locale={locale} />
              <StatCard icon={PresentationIcon} value={stats.teachers} label={t("home.stats.teachers")} loading={statsLoading} delay={0.3} color="red" locale={locale} />
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ──
          NOTE: no translations exist yet for this section (home.howItWorks.*).
          Using a local fallback object above; add real keys to translations.js
          for fr/en and this will pick them up automatically. */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0F5A46]/20 bg-[#0F5A46]/8 px-5 py-2 text-sm font-bold text-[#0F5A46]">
              <BookOpen className="h-4 w-4" />
              {howItWorks.tag}
            </span>
            <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
              <AnimatedText text={howItWorks.title} />
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-500">
              {howItWorks.subtitle}
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.steps.map((item, i) => {
              const StepIcon = [Search, TrendingUp, CheckCircle2][i] || Search;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="group relative text-center"
                >
                  {/* Connector line */}
                  {i < howItWorks.steps.length - 1 && (
                    <div className={`absolute top-12 ${isRtl ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"} hidden h-0.5 w-full md:block`}>
                      <div className={`h-full w-full bg-gradient-to-${isRtl ? "l" : "r"} from-[#0F5A46]/25 to-transparent`} />
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0F5A46]/8 to-[#0F5A46]/15 text-[#0F5A46] shadow-lg shadow-[#0F5A46]/20 group-hover:shadow-[#0F5A46]/30 transition-shadow duration-500"
                  >
                    <StepIcon className="h-10 w-10" strokeWidth={1.5} />
                    <div className={`absolute -top-2 ${isRtl ? "-right-2" : "-left-2"} flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5A46] text-xs font-bold text-white shadow-lg`}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#0A2E24] px-6 py-20 text-center text-white sm:px-12 sm:py-28"
        >
          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[#0F5A46]/25 blur-[100px] glow-pulse" />
            <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-[#C8A24B]/15 blur-[100px] glow-pulse" />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "40px 40px"
              }}
            />
          </div>

          <div className="relative">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-bold text-[#E3C97B] backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              {t("home.cta.tag")}
            </motion.span>

            <h2 className="mb-5 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              <AnimatedText text={t("home.cta.title")} />
            </h2>

            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
              {t("home.cta.subtitle")}
            </p>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block"
            >
              <Link to="/schools">
                <Button className="h-14 rounded-2xl bg-gradient-to-r from-[#C8A24B] to-[#96751F] px-10 text-sm font-bold text-[#0A2E24] shadow-2xl shadow-[#C8A24B]/30 hover:shadow-[#C8A24B]/50 gap-2 transition-all duration-300">
                  {t("home.cta.button")}
                  <TrailingArrow className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <img src="/src/assets/herologo.png" alt="Numeria Academy" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Numeria Academy</p>
                <p className="text-xs text-slate-400">{t("home.footer.rights")}</p>
              </div>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <Link to="/" className="hover:text-[#0F5A46] transition-colors font-medium">{t("home.footer.nav.home")}</Link>
              <Link to="/schools" className="hover:text-[#0F5A46] transition-colors font-medium">{t("home.footer.nav.schools")}</Link>
              <Link to="/login" className="hover:text-[#0F5A46] transition-colors font-medium">{t("home.footer.nav.login")}</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}