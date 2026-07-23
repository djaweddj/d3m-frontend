import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  GraduationCap, School, Users, BookOpen, Star,
  MapPin, ArrowLeft, Sparkles, Shield,
  TrendingUp, Clock, UserCircle2, PresentationIcon,
  ChevronDown, CheckCircle2, Search, Menu, X, Zap, Award, Heart
} from "lucide-react";

import { useAuth } from "../context/authContext";
import Navbar from "../components/navbar";

// ─── API config ───────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── helpers ──────────────────────────────────────────────
const getInitials = (name) =>
  (name ?? "؟").split(" ").map((w) => w[0]).join("").slice(0, 2);

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

function formatNumber(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
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
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2.5 rounded-full border border-blue-200/60 bg-white/80 backdrop-blur-md px-4 py-2 shadow-sm"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-[11px] font-bold text-white shadow-lg shadow-blue-600/25">
          {getInitials(user.name)}
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
      <span className="text-sm font-medium text-slate-500">زائر</span>
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
    </motion.div>
  );
}

// ─── Stat card (live data) ────────────────────────────────
function StatCard({ icon: Icon, value, label, loading, delay, color }) {
  const { display, ref, hasStarted } = useCountUp(loading ? null : value);

  const colorSchemes = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", glow: "bg-blue-400/20", border: "border-blue-200/60" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", glow: "bg-emerald-400/20", border: "border-emerald-200/60" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", glow: "bg-violet-400/20", border: "border-violet-200/60" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", glow: "bg-amber-400/20", border: "border-amber-200/60" },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

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
            {formatNumber(display)}<span className="text-3xl">+</span>
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
    blue: "bg-blue-50 text-blue-600 shadow-blue-200/50",
    violet: "bg-violet-50 text-violet-600 shadow-violet-200/50",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-200/50",
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

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
    blue: "from-blue-600 to-blue-700 shadow-blue-600/30",
    emerald: "from-emerald-600 to-emerald-700 shadow-emerald-600/30",
    violet: "from-violet-600 to-violet-700 shadow-violet-600/30",
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
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-[11px] font-medium text-slate-400">اسحب للأسفل</span>
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
        ctx.fillStyle = `rgba(59, 130, 246, ${p.opacity})`;
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
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 * (1 - dist / 120)})`;
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
  const { user } = useAuth();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden" dir="rtl">

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
            className="absolute right-[-120px] top-[-120px] h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-[100px] glow-pulse"
          />
          <motion.div
            style={{ y: bgY }}
            className="absolute left-[-100px] bottom-[-100px] h-[450px] w-[450px] rounded-full bg-indigo-100/40 blur-[100px] glow-pulse"
            style={{ animationDelay: "1.5s" }}
          />
          <motion.div
            style={{ y: bgY }}
            className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-violet-100/30 blur-[80px] glow-pulse"
            style={{ animationDelay: "3s" }}
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.025] bg-grid-drift"
            style={{ 
              backgroundImage: "linear-gradient(#1e3a8a 1px,transparent 1px),linear-gradient(90deg,#1e3a8a 1px,transparent 1px)", 
              backgroundSize: "64px 64px" 
            }} 
          />

          {/* Particle network */}
          <ParticleBackground />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="container relative mx-auto grid min-h-[calc(100vh-4rem)] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8 lg:gap-16"
        >
          {/* Left content */}
          <div className="text-center lg:text-right order-2 lg:order-1">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 backdrop-blur-sm px-5 py-2 text-sm font-bold text-blue-700 shadow-sm"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
              منصة تعليمية جزائرية حديثة
            </motion.div>

            {/* Headline with animated text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="mb-6 text-4xl font-black leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[3.5rem]">
                <AnimatedText text="ابحث عن" delay={0.3} />
                <br />
                <span className="relative inline-block">
                  <AnimatedText text="أفضل مدارس" delay={0.5} className="text-blue-600" />
                  <svg className="absolute -bottom-2 right-0 left-0 w-full hidden sm:block" viewBox="0 0 200 10" preserveAspectRatio="none" style={{ height: 10 }}>
                    <path className="hero-underline" d="M0 8 Q50 0 100 6 Q150 12 200 5" fill="none" stroke="#BFDBFE" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
                <br />
                <AnimatedText text="الدعم في مدينتك" delay={0.7} />
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0"
              style={{marginTop:"20px"}}
            >
              اكتشف أفضل مدارس الدعم والتقوية في الجزائر. قارن بين المدارس، اقرأ التقييمات، واختر ما يناسبك بكل سهولة.
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
                  <Button className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 text-sm font-bold text-white shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 gap-2 transition-all duration-300 w-full sm:w-auto">
                    <Search className="h-4 w-4" />
                    تصفح المدارس
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/schoolregister">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="outline" className="h-14 rounded-2xl border-2 border-slate-200 px-8 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 gap-2 transition-all duration-300 w-full sm:w-auto">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    سجّل مدرستك
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="mt-12 flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3 space-x-reverse">
                {[
                  { bg: "#3B82F6", letter: "أ" },
                  { bg: "#8B5CF6", letter: "ف" },
                  { bg: "#10B981", letter: "م" },
                  { bg: "#F59E0B", letter: "س" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-lg"
                    style={{ background: item.bg, zIndex: 4 - i }}
                  >
                    {item.letter}
                  </motion.div>
                ))}
              </div>
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, rotate: -180 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{ delay: 1.3 + i * 0.1, type: "spring", stiffness: 200 }}
                    >
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  {statsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      جاري التحميل...
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-slate-900">+{formatNumber(stats.students ?? 0)}</span> طالب يثقون في منصتنا
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right panel — floating visual */}
          <div className="relative hidden lg:flex items-center justify-center h-[500px] order-1 lg:order-2">
            {/* Central morphing blob */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-80 w-80 bg-gradient-to-br from-blue-100/60 to-indigo-100/60 morph-blob blur-2xl" />
            </div>

            {/* Orbiting elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="orbit-element absolute">
                <div className="h-3 w-3 rounded-full bg-blue-400/60 shadow-lg shadow-blue-400/30" />
              </div>
              <div className="orbit-reverse absolute" style={{ animationDelay: "-5s" }}>
                <div className="h-2 w-2 rounded-full bg-violet-400/60 shadow-lg shadow-violet-400/30" />
              </div>
            </div>

            {/* Floating badges */}
            <FloatingBadge
              icon={School}
              value={statsLoading ? "…" : formatNumber(stats.schools ?? 0)}
              label="مدرسة مسجلة"
              delay={0.5}
              position="right-4 top-8"
              color="blue"
            />
            <FloatingBadge
              icon={Users}
              value={statsLoading ? "…" : formatNumber(stats.students ?? 0)}
              label="طالب مسجل"
              delay={0.7}
              position="left-0 top-36"
              color="emerald"
            />
            <FloatingBadge
              icon={PresentationIcon}
              value={statsLoading ? "…" : formatNumber(stats.teachers ?? 0)}
              label="أستاذ منضم"
              delay={0.9}
              position="right-12 bottom-12"
              color="violet"
            />

            {/* Central icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 150 }}
              className="relative z-10"
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-2xl shadow-blue-600/30">
                <GraduationCap className="h-16 w-16" strokeWidth={1.5} />
              </div>
              {/* Ripple rings */}
              <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 rounded-[2rem] border-2 border-blue-200/50 animate-ping" style={{ animationDuration: "3s" }} />
                <div className="absolute inset-[-8px] rounded-[2.5rem] border border-blue-100/40 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <ScrollIndicator />
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
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-600"
            >
              <Zap className="h-4 w-4" />
              لماذا نحن؟
            </motion.span>
            <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
              <AnimatedText text="كل ما تحتاجه في مكان واحد" />
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg" style={{marginTop:"20px"}}>
              منصة مصممة خصيصاً لربط الطلاب بأفضل مدارس الدعم في الجزائر بأسلوب عصري وذكي
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Shield}
              title="مدارس معتمدة"
              desc="جميع المدارس يتم التحقق منها لضمان أعلى مستوى من الجودة والموثوقية."
              delay={0}
              color="blue"
            />
            <FeatureCard
              icon={Clock}
              title="تسجيل سريع"
              desc="عملية تسجيل بسيطة لا تتجاوز دقيقتين للطلاب والمدارس على حد سواء."
              delay={0.1}
              color="violet"
            />
            <FeatureCard
              icon={TrendingUp}
              title="تقييمات حقيقية"
              desc="اقرأ تقييمات الطلاب الحقيقية وقارن قبل اتخاذ قرارك النهائي."
              delay={0.2}
              color="emerald"
            />
            <FeatureCard
              icon={Award}
              title="نتائج مضمونة"
              desc="مدارس ذات سجل حافل بالنجاحات والنتائج المتميزة في البكالوريا."
              delay={0.3}
              color="blue"
            />
            <FeatureCard
              icon={Heart}
              title="مجتمع تفاعلي"
              desc="انضم لمجتمع طلابي نشط يشارك الخبرات والنصائح التعليمية."
              delay={0.4}
              color="violet"
            />
            <FeatureCard
              icon={MapPin}
              title="بحث ذكي بالموقع"
              desc="اعثر على أقرب المدارس إليك باستخدام خاصية البحث المتقدم بالموقع."
              delay={0.5}
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* ── Stats (live from API) ── */}
      <section className="relative overflow-hidden border-y border-slate-200 bg-white py-20 sm:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-50/50 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-violet-50/50 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-600">
              <TrendingUp className="h-4 w-4" />
              أرقامنا
            </span>
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
              <AnimatedText text="مجتمع ينمو كل يوم" />
            </h2>
          </motion.div>

          {statsError ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-center"
            >
              <div className="mb-2 flex justify-center">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-600">
                تعذر تحميل الإحصائيات في الوقت الحالي. حاول تحديث الصفحة.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={School} value={stats.schools} label="مدرسة مسجلة" loading={statsLoading} delay={0} color="blue" />
              <StatCard icon={Users} value={stats.students} label="طالب مسجل" loading={statsLoading} delay={0.15} color="emerald" />
              <StatCard icon={PresentationIcon} value={stats.teachers} label="أستاذ منضم" loading={statsLoading} delay={0.3} color="violet" />
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-2 text-sm font-bold text-blue-600">
              <BookOpen className="h-4 w-4" />
              كيف يعمل؟
            </span>
            <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl md:text-5xl">
              <AnimatedText text="ثلاث خطوات فقط" />
            </h2>
            <p className="mx-auto max-w-xl text-base text-slate-500">
              ابدأ رحلتك التعليمية في دقائق معدودة
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "ابحث", desc: "استخدم خاصية البحث المتقدم للعثور على المدارس القريبة منك", icon: Search },
              { step: "02", title: "قارن", desc: "قارن بين المدارس بناءً على التقييمات والموقع والأسعار", icon: TrendingUp },
              { step: "03", title: "سجّل", desc: "سجّل في المدرسة التي تناسبك بخطوات بسيطة وسريعة", icon: CheckCircle2 },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative text-center"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute top-12 left-0 hidden h-0.5 w-full -translate-x-1/2 md:block">
                    <div className="h-full w-full bg-gradient-to-l from-blue-200 to-transparent" />
                  </div>
                )}

                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 shadow-lg shadow-blue-200/50 group-hover:shadow-blue-300/50 transition-shadow duration-500"
                >
                  <item.icon className="h-10 w-10" strokeWidth={1.5} />
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-lg">
                    {item.step}
                  </div>
                </motion.div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">{item.desc}</p>
              </motion.div>
            ))}
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
          className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-6 py-20 text-center text-white sm:px-12 sm:py-28"
        >
          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-600/15 blur-[100px] glow-pulse" />
            <div className="absolute left-0 bottom-0 h-96 w-96 rounded-full bg-violet-600/15 blur-[100px] glow-pulse" style={{ animationDelay: "1.5s" }} />
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
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-bold text-blue-300 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              ابدأ مجاناً
            </motion.span>

            <h2 className="mb-5 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              <AnimatedText text="ابدأ رحلتك التعليمية اليوم" />
            </h2>

            <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              انضم إلى آلاف الطلاب الذين يستخدمون منصتنا للعثور على أفضل مدارس الدعم في الجزائر
            </p>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block"
            >
              <Link to="/schools">
                <Button className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-10 text-sm font-bold text-white shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 gap-2 transition-all duration-300">
                  تصفح المدارس الآن
                  <ArrowLeft className="h-4 w-4" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">منصة مدارس الدعم</p>
                <p className="text-xs text-slate-400">© 2026 جميع الحقوق محفوظة</p>
              </div>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <Link to="/" className="hover:text-blue-600 transition-colors font-medium">الرئيسية</Link>
              <Link to="/schools" className="hover:text-blue-600 transition-colors font-medium">المدارس</Link>
              <Link to="/login" className="hover:text-blue-600 transition-colors font-medium">تسجيل الدخول</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
