import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API = "http://localhost:8081/api";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchProfile() {
  const res = await fetch(`${API}/teachers/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error("فشل تحميل الملف الشخصي");
  return res.json();
}

async function updateProfile(data) {
  const res = await fetch(`${API}/teachers/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("فشل حفظ التعديلات");
  return res.json();
}

// ─── Tiny shared components ───────────────────────────────────────────────────

function Blob({ className }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
    />
  );
}

function StatCard({ emoji, number, label }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-3xl">{emoji}</span>
        <span className="text-3xl font-extrabold text-blue-600">{number}</span>
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </motion.div>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

function ProfilePage({ profile, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        fullName: draft.fullName,
        email: draft.email,
        specialization: draft.specialization,
        bio: draft.bio,
      });
      onSaved(updated);
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cur = editing ? draft : profile;

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="right-[-100px] top-[-100px] h-[350px] w-[350px] bg-blue-100/60" />
      <Blob className="bottom-[-100px] left-[-100px] h-[320px] w-[320px] bg-emerald-100/50" />

      <div className="relative z-10 mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-600">
              👤 الملف الشخصي
            </span>
            <h1 className="mt-4 text-5xl font-extrabold text-slate-900">بروفايلي</h1>
            <p className="mt-3 text-lg text-slate-500">اعرض وعدّل معلوماتك الشخصية.</p>
          </div>

          <div className="mt-8 flex gap-3">
            {!editing ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                onClick={() => { setDraft(profile); setEditing(true); }}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200"
              >
                ✏️ تعديل
              </motion.button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 disabled:opacity-60"
                >
                  {saving ? "جاري الحفظ..." : "✓ حفظ"}
                </button>
                <button
                  onClick={() => { setEditing(false); setError(null); }}
                  className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-500"
                >
                  ✕ إلغاء
                </button>
              </>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center gap-8">
            {/* Avatar */}
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-extrabold text-white shadow-xl shadow-blue-200">
              {cur.fullName?.charAt(0) || "؟"}
            </div>

            <div className="flex-1 space-y-3">
              {editing ? (
                <>
                  <input
                    value={draft.fullName || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition"
                    placeholder="الاسم الكامل"
                  />
                  <input
                    value={draft.specialization || ""}
                    onChange={(e) => setDraft((p) => ({ ...p, specialization: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition"
                    placeholder="التخصص"
                  />
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-extrabold text-slate-900">{cur.fullName}</h2>
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
                    📚 {cur.specialization || "—"}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5 rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
        >
          <h3 className="mb-6 flex items-center gap-3 text-xl font-extrabold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md">
              ✉️
            </span>
            معلومات التواصل
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="mb-1 text-xs text-slate-400">البريد الإلكتروني</p>
              {editing ? (
                <input
                  value={draft.email || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 transition"
                />
              ) : (
                <p className="text-sm font-semibold text-slate-800">{cur.email}</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="mb-1 text-xs text-slate-400">المعرف</p>
              <p className="text-sm font-semibold text-slate-800">#{cur.id}</p>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
        >
          <h3 className="mb-5 flex items-center gap-3 text-xl font-extrabold text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
              📝
            </span>
            نبذة شخصية
          </h3>
          {editing ? (
            <textarea
              value={draft.bio || ""}
              onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-violet-400 focus:bg-white transition resize-none"
              placeholder="اكتب نبذة عنك..."
            />
          ) : (
            <p className="text-base leading-8 text-slate-600">{cur.bio || "لم تتم إضافة نبذة بعد."}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Students page (static demo data) ────────────────────────────────────────

const DEMO_LEVELS = [
  {
    level: "البكالوريا",
    groups: [
      { name: "المجموعة A", students: ["أحمد بوعلام", "سارة بن علي", "محمد أمين", "نور الهدى"] },
      { name: "المجموعة B", students: ["يوسف حمدي", "ريان قادري", "إسلام بوزيد"] },
      { name: "المجموعة C", students: ["عبد الرحمن", "إياد كمال", "إلياس تواتي"] },
    ],
  },
  {
    level: "السنة الثانية ثانوي",
    groups: [
      { name: "المجموعة A", students: ["خالد بوشارب", "أنس زروقي", "أمين بن يوسف"] },
      { name: "المجموعة B", students: ["إبراهيم لعربي", "رامي مسعود", "سيف الدين"] },
    ],
  },
];

function StudentsPage() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="right-[-100px] top-[-100px] h-[350px] w-[350px] bg-blue-100/60" />
      <Blob className="bottom-[-100px] left-[-100px] h-[320px] w-[320px] bg-violet-100/50" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            👨‍🎓 إدارة التلاميذ
          </span>
          <h1 className="mb-4 mt-2 text-5xl font-extrabold text-slate-900">تلاميذي</h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-500">
            اختر المستوى الدراسي ثم المجموعة لعرض التلاميذ.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-10 max-w-md">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="ابحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pr-12 pl-4 text-sm shadow-sm outline-none backdrop-blur-sm transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        {/* Levels */}
        <div className="space-y-10">
          {DEMO_LEVELS.map((lvl, li) => (
            <motion.div
              key={lvl.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: li * 0.1 }}
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200 text-xl">
                  🎓
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{lvl.level}</h2>
                  <p className="text-sm text-slate-400">{lvl.groups.length} مجموعات</p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {lvl.groups.map((group) => (
                  <motion.button
                    key={group.name}
                    whileHover={{ y: -4, scale: 1.01 }}
                    onClick={() => setSelectedGroup(group)}
                    className="group rounded-3xl border border-slate-100 bg-white/80 p-6 text-right shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-blue-100 hover:shadow-2xl"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg text-2xl">
                        👥
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500">
                        ‹
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-slate-900 transition group-hover:text-blue-600">
                      {group.name}
                    </h3>
                    <p className="mb-5 text-sm text-slate-500">عدد التلاميذ: {group.students.length}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        style={{ width: `${Math.min(group.students.length * 20, 100)}%` }}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedGroup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">{selectedGroup.name}</h2>
                <p className="mt-2 text-slate-500">قائمة التلاميذ</p>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="h-11 w-11 rounded-2xl bg-slate-100 text-lg font-bold transition hover:bg-red-50 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {selectedGroup.students
                .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
                .map((student, i) => (
                  <motion.div
                    key={student}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-md"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white shadow-lg shadow-blue-200 text-sm">
                      {student.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{student}</h3>
                      <p className="mt-1 text-sm text-slate-400">تلميذ مسجل</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home", label: "الرئيسية", emoji: "🏠" },
  { id: "profile", label: "بروفايلي", emoji: "👤" },
  { id: "students", label: "تلاميذي", emoji: "👨‍🎓" },
];

function Sidebar({ active, onNav }) {
  return (
    <aside className="relative z-20 flex w-64 shrink-0 flex-col border-l border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200 text-lg">
          🎓
        </div>
        <span className="text-lg font-extrabold text-slate-900">لوحة الأستاذ</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
              active === item.id
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="text-lg">{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-400">
        © 2025 نظام المدرسة
      </div>
    </aside>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

function HomePage({ profile }) {
  const stats = [
    { emoji: "📚", number: "12", label: "قسم نشط" },
    { emoji: "👨‍🎓", number: "320+", label: "تلميذ" },
    { emoji: "🏫", number: "4", label: "مدارس" },
  ];

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="top-[-120px] right-[-120px] h-[420px] w-[420px] bg-blue-100/60" />
      <Blob className="bottom-[-120px] left-[-120px] h-[380px] w-[380px] bg-violet-100/50" />

      <main className="relative z-10 flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[32px] border border-slate-200 bg-white/80 p-10 shadow-xl shadow-slate-100 backdrop-blur-xl"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
            ✨ لوحة تحكم حديثة
          </span>

          <h1 className="mb-3 text-5xl font-extrabold leading-tight text-slate-900">
            مرحباً،{" "}
            <span className="text-blue-600">
              {profile ? profile.fullName : "أستاذ"}
            </span>{" "}
            👋
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-500">
            يمكنك إدارة الأقسام، متابعة التلاميذ، تعديل بروفايلك الشخصي، واستعراض المدارس التي تعمل
            لديها بسهولة.
          </p>

          {profile && (
            <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-700">
                📋 تخصصك: <span className="font-extrabold">{profile.specialization || "—"}</span>
                &nbsp;·&nbsp; البريد: <span className="font-extrabold">{profile.email}</span>
              </p>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const [page, setPage] = useState("home");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl" className="flex min-h-screen overflow-hidden bg-[#fafafa] text-slate-900">
      <Sidebar active={page} onNav={setPage} />

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto" />
            <p className="text-slate-500 font-semibold">جاري التحميل...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-10 text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-xl font-bold text-red-600 mb-2">خطأ في الاتصال</p>
            <p className="text-slate-500">{error}</p>
            <p className="mt-3 text-sm text-slate-400">تأكد أن الخادم يعمل على localhost:8080</p>
          </div>
        </div>
      ) : (
        <>
          {page === "home" && <HomePage profile={profile} />}
          {page === "profile" && <ProfilePage profile={profile} onSaved={setProfile} />}
          {page === "students" && <StudentsPage />}
        </>
      )}
    </div>
  );
}