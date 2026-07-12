import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  GraduationCap, School, Users, BookOpen, Star,
  MapPin, ArrowLeft, Sparkles, Shield,
  TrendingUp, Clock, UserCircle2, PresentationIcon,
} from "lucide-react";

import { useAuth } from "../context/authContext";

// ─── API config ───────────────────────────────────────────
const API_BASE_URL = "http://localhost:8080";

// ─── helpers ──────────────────────────────────────────────
const getInitials = (name) =>
  (name ?? "؟").split(" ").map((w) => w[0]).join("").slice(0, 2);

// Animates a number counting up from 0 to `value` whenever it changes/enters view
function useCountUp(value, duration = 1400) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    let start = null;
    let raf;

    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out-quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

function formatNumber(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}

// ─── User pill ────────────────────────────────────────────
function UserPill({ user }) {
  if (user) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
          {getInitials(user.name)}
        </div>
        <span className="text-sm font-semibold text-slate-800">{user.name}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
      <UserCircle2 className="h-4 w-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-500">زائر</span>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
    </div>
  );
}

// ─── Stat card (live data) ────────────────────────────────
function StatCard({ icon: Icon, value, label, loading, delay }) {
  const count = useCountUp(loading ? null : value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="stat-card relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm"
    >
      <div className="stat-glow pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-7 w-7" />
      </div>
      <div className="relative mb-2 text-4xl font-extrabold text-blue-600 tabular-nums">
        {loading ? (
          <span className="inline-block h-9 w-20 animate-pulse rounded-lg bg-slate-100 align-middle" />
        ) : (
          <>{formatNumber(count)}+</>
        )}
      </div>
      <div className="relative text-sm font-medium text-slate-500">{label}</div>
    </motion.div>
  );
}

// ─── School card ──────────────────────────────────────────
function SchoolCard({ name, city, rating, subject, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
          <School className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold text-slate-900 text-sm">{name}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" /> {city}
          </p>
          <p className="text-[10px] font-medium text-blue-500 mt-0.5">{subject}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
          ⭐ {rating}
        </div>
        <div className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          مفتوح
        </div>
      </div>
    </motion.div>
  );
}

// ─── Home page ────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-hidden" dir="rtl">

      {/* Keyframes + small utility animations used across the page */}
      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(2deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
        @keyframes underlineDraw {
          from { stroke-dashoffset: 220; }
          to { stroke-dashoffset: 0; }
        }
        .float-badge { animation: floatY 4.5s ease-in-out infinite; }
        .float-badge-slow { animation: floatSlow 7s ease-in-out infinite; }
        .bg-grid-drift { animation: gridDrift 18s linear infinite; }
        .glow-pulse { animation: pulseGlow 3.5s ease-in-out infinite; }
        .hero-underline { stroke-dasharray: 220; stroke-dashoffset: 220; animation: underlineDraw 1.1s 0.5s ease-out forwards; }
        .stat-card:hover .stat-glow { animation: pulseGlow 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .float-badge, .float-badge-slow, .bg-grid-drift, .glow-pulse, .hero-underline, .stat-card:hover .stat-glow {
            animation: none !important;
          }
        }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-[-80px] top-[-80px] h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-3xl glow-pulse" />
          <div className="absolute left-[-80px] bottom-[-80px] h-[380px] w-[380px] rounded-full bg-indigo-100/50 blur-3xl glow-pulse" style={{ animationDelay: "1.2s" }} />
          <div className="absolute inset-0 opacity-[0.03] bg-grid-drift"
            style={{ backgroundImage: "linear-gradient(#1e3a8a 1px,transparent 1px),linear-gradient(90deg,#1e3a8a 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>

        <div className="container relative mx-auto grid min-h-[90vh] items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-center lg:text-right">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700">
              <Sparkles className="h-4 w-4" /> منصة تعليمية جزائرية حديثة
            </motion.div>

            <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }}
              className="mb-5 text-5xl font-extrabold leading-[1.15] tracking-tight text-slate-900 md:text-6xl">
              ابحث عن{" "}
              <span className="relative">
                <span className="relative z-10 text-blue-600">أفضل مدارس</span>
                <svg className="absolute -bottom-1 right-0 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" style={{ height: 8 }}>
                  <path className="hero-underline" d="M0 6 Q50 0 100 5 Q150 10 200 4" fill="none" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <br />الدعم في مدينتك
            </motion.h2>

           

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start " style={{marginTop:"70px"}} >
              <Link to="/schools">
                <Button className="h-12 rounded-xl bg-blue-600 px-7 text-sm font-bold hover:bg-blue-700 gap-2 transition-transform hover:scale-[1.03] active:scale-95" >
                  تصفح المدارس <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/schoolregister">
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 px-7 text-sm font-semibold text-slate-700 hover:bg-slate-50 gap-2 transition-transform hover:scale-[1.03] active:scale-95">
                  <BookOpen className="h-4 w-4 text-blue-500" /> سجّل مدرستك
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-10 flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-2 space-x-reverse">
                {["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"].map((c, i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: c }}>{["أ", "ف", "م", "س"][i]}</div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {statsLoading ? "جاري التحميل..." : `+${formatNumber(stats.students ?? 0)} طالب يثقون في منصتنا`}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right panel — floating badges */}
          <div className="relative hidden lg:block h-[420px]">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="float-badge-slow absolute right-6 top-6 flex items-center gap-2 rounded-2xl border border-white bg-white/90 backdrop-blur-sm px-4 py-2.5 shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                <School className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{statsLoading ? "…" : formatNumber(stats.schools ?? 0)}</p>
                <p className="text-[10px] text-slate-400">مدرسة</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
              className="float-badge absolute left-4 top-40 flex items-center gap-2 rounded-2xl border border-white bg-white/90 backdrop-blur-sm px-4 py-2.5 shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{statsLoading ? "…" : formatNumber(stats.students ?? 0)}</p>
                <p className="text-[10px] text-slate-400">طالب</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
              className="float-badge-slow absolute right-16 bottom-10 flex items-center gap-2 rounded-2xl border border-white bg-white/90 backdrop-blur-sm px-4 py-2.5 shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white">
                <PresentationIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{statsLoading ? "…" : formatNumber(stats.teachers ?? 0)}</p>
                <p className="text-[10px] text-slate-400">أستاذ</p>
              </div>
            </motion.div>

            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="h-72 w-72 rounded-full bg-blue-50 glow-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="container mx-auto px-6 py-24">
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600 mb-4">لماذا نحن؟</span>
          <h3 className="mb-3 text-4xl font-extrabold text-slate-900">كل ما تحتاجه في مكان واحد</h3>
          <p className="mx-auto max-w-xl text-base leading-7 text-slate-500">منصة مصممة خصيصاً لربط الطلاب بأفضل مدارس الدعم في الجزائر</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Shield,     title: "مدارس معتمدة",   desc: "جميع المدارس يتم التحقق منها لضمان أعلى مستوى من الجودة.", color: "bg-blue-50 text-blue-600" },
            { icon: Clock,      title: "تسجيل سريع",     desc: "عملية تسجيل بسيطة لا تتجاوز دقيقتين للطلاب والمدارس.",    color: "bg-violet-50 text-violet-600" },
            { icon: TrendingUp, title: "تقييمات حقيقية", desc: "اقرأ تقييمات الطلاب الحقيقية وقارن قبل اتخاذ قرارك.",     color: "bg-emerald-50 text-emerald-600" },
          ].map((item, i) => (
            <motion.div key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h4 className="mb-2.5 text-xl font-bold text-slate-900">{item.title}</h4>
              <p className="leading-7 text-slate-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats (live from API) ── */}
      <section className="border-y border-slate-200 bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <span className="inline-block rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-600 mb-4">أرقامنا</span>
            <h3 className="text-3xl font-extrabold text-slate-900">مجتمع ينمو كل يوم</h3>
          </div>

          {statsError ? (
            <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-center text-sm text-red-600">
              تعذر تحميل الإحصائيات في الوقت الحالي. حاول تحديث الصفحة.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              <StatCard icon={School}  value={stats.schools}  label="مدرسة مسجلة" loading={statsLoading} delay={0} />
              <StatCard icon={Users}   value={stats.students} label="طالب مسجل"   loading={statsLoading} delay={0.1} />
              <StatCard icon={PresentationIcon} value={stats.teachers} label="أستاذ منضم" loading={statsLoading} delay={0.2} />
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] bg-slate-900 px-8 py-20 text-center text-white md:px-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl glow-pulse" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl glow-pulse" style={{ animationDelay: "1s" }} />
          </div>
          <div className="relative">
            <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm font-semibold text-blue-300">ابدأ مجاناً</span>
            <h3 className="mb-4 text-4xl font-extrabold leading-tight">ابدأ رحلتك التعليمية اليوم</h3>
            <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-slate-300">انضم إلى آلاف الطلاب الذين يستخدمون منصتنا.</p>
            <Link to="/schools">
              <Button className="h-12 rounded-xl bg-blue-600 px-8 text-sm font-bold hover:bg-blue-500 gap-2 transition-transform hover:scale-[1.03] active:scale-95">
                تصفح المدارس الآن <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-5 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">منصة مدارس الدعم</p>
              <p className="text-xs text-slate-400">© 2026 جميع الحقوق محفوظة</p>
            </div>
          </div>
          <nav className="flex gap-6 text-sm text-slate-400">
            <Link to="/"        className="hover:text-slate-700 transition">الرئيسية</Link>
            <Link to="/schools" className="hover:text-slate-700 transition">المدارس</Link>
            <Link to="/login"   className="hover:text-slate-700 transition">تسجيل الدخول</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}