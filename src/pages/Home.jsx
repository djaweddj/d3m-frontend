import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import {
  GraduationCap, School, Users, BookOpen, Star,
  Search, MapPin, ArrowLeft, Sparkles, Shield,
  TrendingUp, Clock, UserCircle2, Send, Lock,
} from "lucide-react";

import { useAuth } from "../context/authContext";

// ─── Mock schools list ────────────────────────────────────
const SCHOOL_OPTIONS = [
  "مدرسة النجاح للرياضيات",
  "أكاديمية اللغات الحديثة",
  "معهد العلوم الطبيعية",
  "مركز التفوق الدراسي",
  "مدرسة الأدب والفلسفة",
  "أكاديمية البرمجة والتكنولوجيا",
];

const SCHOOL_COLOR = {
  "مدرسة النجاح للرياضيات":        { bg: "#EEF2FF", text: "#4338CA" },
  "أكاديمية اللغات الحديثة":       { bg: "#ECFDF5", text: "#065F46" },
  "معهد العلوم الطبيعية":           { bg: "#F3E8FF", text: "#6B21A8" },
  "مركز التفوق الدراسي":            { bg: "#EBF4FE", text: "#0C447C" },
  "مدرسة الأدب والفلسفة":           { bg: "#FEF3C7", text: "#92400E" },
  "أكاديمية البرمجة والتكنولوجيا":  { bg: "#FFF1F2", text: "#9F1239" },
};

const AVATAR_BG = ["#185FA5", "#0F6E56", "#BA7517", "#534AB7", "#9F1239", "#065F46"];

const INITIAL_COMMENTS = [
  { id: 1, user: "سارة بن علي",     initials: "سب", avatarIdx: 0,
    school: "مدرسة النجاح للرياضيات",        rating: 5,
    text: "مدرسة رائعة! الأساتذة متميزون ومنهجية التدريس واضحة. تحسّن مستواي في الرياضيات بشكل ملحوظ.",
    date: "2026-05-20" },
  { id: 2, user: "أحمد بوعلام",     initials: "أب", avatarIdx: 1,
    school: "أكاديمية البرمجة والتكنولوجيا", rating: 5,
    text: "أفضل أكاديمية للبرمجة في المنطقة. المهندس أمين محترف ويشرح بأسلوب مبسّط جداً.",
    date: "2026-05-18" },
  { id: 3, user: "نور الهدى مزيان", initials: "نم", avatarIdx: 2,
    school: "مركز التفوق الدراسي",            rating: 4,
    text: "المركز ممتاز والأساتذة متعاونون. أتمنى أوقات دراسة أكثر مرونة.",
    date: "2026-05-15" },
  { id: 4, user: "يوسف حمدي",       initials: "يح", avatarIdx: 3,
    school: "أكاديمية اللغات الحديثة",        rating: 5,
    text: "تحسّن مستواي في الفرنسية كثيراً بعد شهرين. الطريقة التفاعلية رائعة جداً.",
    date: "2026-05-10" },
];

// ─── helpers ──────────────────────────────────────────────
const getInitials = (name) =>
  (name ?? "؟").split(" ").map((w) => w[0]).join("").slice(0, 2);

// ─── Star row ─────────────────────────────────────────────
function StarRow({ count, size = 13 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size}
          style={{ fill: i < count ? "#F59E0B" : "none",
                   color: i < count ? "#F59E0B" : "#CBD5E1" }} />
      ))}
    </div>
  );
}

// ─── Comment card ─────────────────────────────────────────
function CommentCard({ c }) {
  const sc = SCHOOL_COLOR[c.school] || { bg: "#F1F5F9", text: "#475569" };
  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6",
      padding: "1.25rem", display: "flex", flexDirection: "column", gap: 10,
      transition: "border-color .15s, box-shadow .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8EEF6"; e.currentTarget.style.boxShadow = "none"; }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: AVATAR_BG[c.avatarIdx % AVATAR_BG.length],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
            border: "2px solid rgba(255,255,255,.5)",
          }}>{c.initials}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{c.user}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{c.date}</div>
            <StarRow count={c.rating} size={12} />
          </div>
        </div>
        <span style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: sc.bg, color: sc.text,
          border: `1px solid ${sc.text}33`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          🏫 {c.school}
        </span>
      </div>

      <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, margin: 0 }}>{c.text}</p>
    </div>
  );
}

// ─── Comments section ─────────────────────────────────────
function CommentsSection({ user }) {
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [school,   setSchool]   = useState("");
  const [text,     setText]     = useState("");
  const [rating,   setRating]   = useState(0);
  const [hover,    setHover]    = useState(0);
  const [saved,    setSaved]    = useState(false);

  // user.name is normalized in fetchMe (= fullName from backend)
  const displayName =  user?.fullName ?? "";

  const handleSubmit = () => {
    if (!school || !text.trim() || rating === 0) return;
    setComments(prev => [{
      id: Date.now(),
      user: displayName,
      initials: getInitials(displayName),
      avatarIdx: 4,
      school, rating,
      text: text.trim(),
      date: new Date().toISOString().slice(0, 10),
    }, ...prev]);
    setSchool(""); setText(""); setRating(0);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inp = {
    padding: "8px 11px", borderRadius: 9, border: "1.5px solid #E2E8F0",
    fontSize: 13, fontFamily: "inherit", color: "#0F172A",
    background: "#FAFCFF", outline: "none", width: "100%",
  };

  return (
    <section style={{
      background: "#F8FAFC", borderTop: "1px solid #E8EEF6",
      borderBottom: "1px solid #E8EEF6", padding: "5rem 1.5rem",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            display: "inline-block", padding: "4px 14px", borderRadius: 20,
            background: "#EBF4FE", color: "#185FA5", fontSize: 12, fontWeight: 600,
            border: "1px solid #B5D4F4", marginBottom: 10,
          }}>
            💬 آراء الطلاب
          </span>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            ما يقوله الطلاب
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            تقييمات حقيقية من طلاب مسجلين في مدارسنا
          </p>
        </div>

        {/* Add comment box */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8EEF6", padding: "1.25rem" }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>✍️</span> أضف تعليقك
          </div>

          {user?.role === "STUDENT" ? (
            /* ── Logged-in student form ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* User badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", background: "#EBF4FE", borderRadius: 9,
                border: "1px solid #B5D4F4",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", background: "#185FA5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                }}>
                  {getInitials(displayName)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#0C447C" }}>
                  تعليق بإسم: {displayName}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

                {/* School select */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                    اختر المدرسة *
                  </label>
                  <select style={{ ...inp, cursor: "pointer" }} value={school} onChange={e => setSchool(e.target.value)}>
                    <option value="">— اختر مدرسة —</option>
                    {SCHOOL_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Star rating */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 6 }}>
                    التقييم *
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={24}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(n)}
                        style={{
                          cursor: "pointer", transition: "transform .1s",
                          transform: (hover || rating) >= n ? "scale(1.15)" : "scale(1)",
                          fill: (hover || rating) >= n ? "#F59E0B" : "none",
                          color: (hover || rating) >= n ? "#F59E0B" : "#CBD5E1",
                        }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Text */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748B", display: "block", marginBottom: 4 }}>
                  تعليقك *
                </label>
                <textarea
                  style={{ ...inp, resize: "none", minHeight: 90, lineHeight: 1.7 }}
                  placeholder="شارك تجربتك مع هذه المدرسة..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
              </div>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                {saved && (
                  <span style={{ fontSize: 12, color: "#0F6E56", fontWeight: 600 }}>
                    ✓ تم نشر تعليقك بنجاح
                  </span>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!school || !text.trim() || rating === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 20px", borderRadius: 9, border: "none",
                    background: (!school || !text.trim() || rating === 0) ? "#94A3B8" : "#185FA5",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: (!school || !text.trim() || rating === 0) ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "background .15s",
                  }}
                >
                  <Send size={13} /> نشر التعليق
                </button>
              </div>
            </div>
          ) : (
            /* ── Guest banner ── */
            <div style={{
              background: "#F8FAFC", borderRadius: 12,
              border: "1.5px dashed #CBD5E1", padding: "1.5rem", textAlign: "center",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#EBF4FE",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px", fontSize: 22,
              }}>
                <Lock size={20} color="#185FA5" />
              </div>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 14, lineHeight: 1.7 }}>
                يمكنك قراءة جميع التعليقات كزائر، لكن لإضافة تعليق يجب تسجيل الدخول كطالب.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Link to="/login">
                  <button style={{
                    padding: "8px 20px", borderRadius: 9, background: "#185FA5",
                    color: "#fff", border: "none", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    تسجيل الدخول
                  </button>
                </Link>
                <Link to="/signup">
                  <button style={{
                    padding: "8px 20px", borderRadius: 9, background: "#fff",
                    color: "#185FA5", border: "1.5px solid #185FA5",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    إنشاء حساب
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Comments list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {comments.map(c => <CommentCard key={c.id} c={c} />)}
        </div>

      </div>
    </section>
  );
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

// ─── Floating badge ───────────────────────────────────────
function FloatingBadge({ icon: Icon, label, value, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className={`absolute flex items-center gap-2 rounded-2xl border border-white bg-white/90 backdrop-blur-sm px-4 py-2.5 shadow-xl ${className}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-900">{value}</p>
        <p className="text-[10px] text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Home page ────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-hidden" dir="rtl">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-[-80px] top-[-80px] h-[420px] w-[420px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute left-[-80px] bottom-[-80px] h-[380px] w-[380px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]"
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
                  <path d="M0 6 Q50 0 100 5 Q150 10 200 4" fill="none" stroke="#BFDBFE" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <br />الدعم في مدينتك
            </motion.h2>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.25 }}
              className="mb-10 max-w-xl text-lg leading-8 text-slate-500 mx-auto lg:mx-0">
              قارن بين المدارس، اقرأ تقييمات الطلاب الحقيقية، وابحث بسهولة.
            </motion.p>

            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 flex flex-col gap-3 sm:flex-row rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-3 shadow-lg shadow-slate-100">
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="ابحث عن مدرسة..."
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white placeholder-slate-400" />
              </div>
              <div className="relative flex-1">
                <MapPin className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="المدينة أو الولاية"
                  className="h-12 w-full rounded-xl border border-slate-100 bg-slate-50 pr-10 pl-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white placeholder-slate-400" />
              </div>
              <Button className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold hover:bg-blue-700 gap-2 shrink-0">
                <Search className="h-4 w-4" /> بحث
              </Button>
            </motion.div>

            {/* Quick filters */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}
              className="mb-10 flex flex-wrap gap-2 justify-center lg:justify-start">
              {["رياضيات", "فيزياء", "لغة عربية", "علوم", "لغة فرنسية"].map(tag => (
                <button key={tag}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition">
                  {tag}
                </button>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/schools">
                <Button className="h-12 rounded-xl bg-blue-600 px-7 text-sm font-bold hover:bg-blue-700 gap-2">
                  تصفح المدارس <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/schoolregister">
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 px-7 text-sm font-semibold text-slate-700 hover:bg-slate-50 gap-2">
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
                <p className="text-xs text-slate-500 mt-0.5">+1,000 طالب يثقون في منصتنا</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right panel */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.2 }}
            className="relative hidden lg:block">
            <div className="rounded-3xl border border-slate-100 bg-slate-50/60 backdrop-blur-sm p-5 shadow-2xl shadow-blue-100/40">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">المدارس المميزة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">أعلى المدارس تقييماً</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold text-green-600">مباشر</span>
                  <div className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white">+50 مدرسة</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { name: "مدرسة التفوق",    city: "الجزائر العاصمة", rating: "4.9", subject: "رياضيات · فيزياء",        delay: 0.3 },
                  { name: "أكاديمية النجاح", city: "قسنطينة",          rating: "4.8", subject: "علوم طبيعية · كيمياء",   delay: 0.4 },
                  { name: "مركز التميز",     city: "وهران",             rating: "4.7", subject: "لغة عربية · تاريخ",     delay: 0.5 },
                ].map(s => <SchoolCard key={s.name} {...s} />)}
              </div>
              <div className="mt-5 rounded-2xl bg-white border border-slate-100 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3">الطلاب المسجلون هذا الشهر</p>
                <div className="flex items-end gap-1.5 h-12">
                  {[40, 65, 50, 80, 60, 90, 75, 95, 70, 100, 85, 110].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm transition-all"
                      style={{ height: `${(h / 110) * 100}%`, background: i === 11 ? "#2563EB" : "#DBEAFE" }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">سبتمبر</span>
                  <span className="text-[10px] font-semibold text-blue-600">+18% هذا الشهر</span>
                </div>
              </div>
            </div>
            <FloatingBadge icon={Users}  label="طالب مسجل"    value="+1,200" className="-top-4 -right-4" />
            <FloatingBadge icon={Shield} label="مدرسة معتمدة" value="50+"    className="-bottom-4 -left-4" />
          </motion.div>
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
          ].map(item => (
            <motion.div key={item.title} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-all">
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h4 className="mb-2.5 text-xl font-bold text-slate-900">{item.title}</h4>
              <p className="leading-7 text-slate-500 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container mx-auto grid gap-8 px-6 text-center md:grid-cols-3">
          {[["50+", "مدرسة مسجلة"], ["1,000+", "طالب مسجل"], ["4.8 ⭐", "متوسط التقييم"]].map(([n, t]) => (
            <div key={t}>
              <div className="mb-2 text-4xl font-extrabold text-blue-600">{n}</div>
              <div className="text-sm font-medium text-slate-500">{t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comments ── */}
      <CommentsSection user={user} />

      {/* ── CTA ── */}
      <section className="container mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-[32px] bg-slate-900 px-8 py-20 text-center text-white md:px-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
          </div>
          <div className="relative">
            <span className="mb-6 inline-block rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm font-semibold text-blue-300">ابدأ مجاناً</span>
            <h3 className="mb-4 text-4xl font-extrabold leading-tight">ابدأ رحلتك التعليمية اليوم</h3>
            <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-slate-300">انضم إلى آلاف الطلاب الذين يستخدمون منصتنا.</p>
            <Link to="/schools">
              <Button className="h-12 rounded-xl bg-blue-600 px-8 text-sm font-bold hover:bg-blue-500 gap-2">
                تصفح المدارس الآن <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
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