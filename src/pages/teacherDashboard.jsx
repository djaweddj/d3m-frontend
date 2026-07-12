import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, User, Users, CalendarDays, Wallet, LogOut, School,
} from "lucide-react";
import { useAuth } from "../context/authContext";

const API = "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("accessToken");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const ARABIC_MONTHS = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatPeriod(period) {
  if (!period) return "—";
  const [y, m] = period.split("-");
  const idx = parseInt(m, 10) - 1;
  return `${ARABIC_MONTHS[idx] ?? m} ${y}`;
}

function formatTime(t) {
  return t ? t.slice(0, 5) : "—";
}

function formatMoney(v) {
  if (v === null || v === undefined) return "—";
  return `${Number(v).toLocaleString("en-US")} دج`;
}

function formatDate(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
}

const DAY_LABELS = {
  SUNDAY: "الأحد",
  MONDAY: "الإثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
  SATURDAY: "السبت",
};

const DAY_ORDER = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const PAYOUT_STATUS = {
  PENDING: { label: "قيد الانتظار", classes: "bg-amber-50 text-amber-600 border-amber-100" },
  PAID: { label: "مدفوع", classes: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

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

async function fetchMyModules() {
  const res = await fetch(`${API}/modules/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error("فشل تحميل الأقسام");
  return res.json();
}

async function fetchStudentsByModule(moduleId) {
  const res = await fetch(`${API}/students/by-module/${moduleId}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("فشل تحميل قائمة التلاميذ");
  return res.json();
}

async function fetchMyPayouts() {
  const res = await fetch(`${API}/payouts/mine`, { headers: authHeaders() });
  if (!res.ok) throw new Error("فشل تحميل المستحقات");
  return res.json();
}

// ─── Tiny shared components ───────────────────────────────────────────────────

function Blob({ className }) {
  return <div className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
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

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
      ⚠️ {message}
    </div>
  );
}

function Spinner({ label = "جاري التحميل..." }) {
  return (
    <div className="flex flex-1 items-center justify-center p-16">
      <div className="text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mx-auto" />
        <p className="text-slate-500 font-semibold">{label}</p>
      </div>
    </div>
  );
}

function PageHeader({ badge, title, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
        {badge}
      </span>
      <h1 className="mb-4 mt-2 text-5xl font-extrabold text-slate-900">{title}</h1>
      {subtitle && <p className="max-w-2xl text-lg leading-8 text-slate-500">{subtitle}</p>}
    </motion.div>
  );
}

// ─── Logout confirmation modal ─────────────────────────────────────────────────

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-3xl">
          🚪
        </div>
        <h2 className="mb-2 text-xl font-extrabold text-slate-900">تسجيل الخروج</h2>
        <p className="mb-6 text-sm text-slate-500">هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-200"
          >
            تسجيل الخروج
          </button>
        </div>
      </motion.div>
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
      // Backend only persists fullName and bio for a teacher's self-update —
      // email / specialization / subjects are managed by the school admin.
      const updated = await updateProfile({
        fullName: draft.fullName,
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

        <ErrorBanner message={error} />

        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center gap-8">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-4xl font-extrabold text-white shadow-xl shadow-blue-200">
              {cur.fullName?.charAt(0) || "؟"}
            </div>

            <div className="flex-1 space-y-3">
              {editing ? (
                <input
                  value={draft.fullName || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition"
                  placeholder="الاسم الكامل"
                />
              ) : (
                <h2 className="text-3xl font-extrabold text-slate-900">{cur.fullName}</h2>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600">
                📚 {cur.specialization || "—"}
              </span>
              <p className="text-xs text-slate-400">التخصص يُعدّل من طرف إدارة المدرسة فقط</p>
            </div>
          </div>
        </motion.div>

        {/* Contact + revenue share */}
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="mb-1 text-xs text-slate-400">البريد الإلكتروني</p>
              <p className="text-sm font-semibold text-slate-800">{cur.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="mb-1 text-xs text-slate-400">المعرف</p>
              <p className="text-sm font-semibold text-slate-800">#{cur.id}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="mb-1 text-xs text-emerald-500">نسبتك من الإيرادات</p>
              <p className="text-sm font-extrabold text-emerald-700">
                {cur.percentage !== undefined && cur.percentage !== null ? `${cur.percentage}%` : "—"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subjects */}
        {cur.subjectNames?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-5 rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
          >
            <h3 className="mb-5 flex items-center gap-3 text-xl font-extrabold text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
                📖
              </span>
              المواد التي تُدرّسها
            </h3>
            <div className="flex flex-wrap gap-3">
              {cur.subjectNames.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        )}

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

// ─── Students page (real data via /modules/mine + /students/by-module) ───────

function StudentsModal({ module: mod, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudentsByModule(mod.id)
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [mod.id]);

  const filtered = students.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">{mod.name}</h2>
            <p className="mt-2 text-slate-500">
              {mod.subjectName} · {mod.classroomName} · {mod.level}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-11 w-11 shrink-0 rounded-2xl bg-slate-100 text-lg font-bold transition hover:bg-red-50 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        <div className="relative mb-6">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="ابحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        {loading ? (
          <Spinner label="جاري تحميل التلاميذ..." />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-slate-400">لا يوجد تلاميذ مسجلين بعد.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((student, i) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white shadow-md shadow-blue-200 text-sm">
                    {student.fullName?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{student.fullName}</h3>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </div>
                </div>
                {(student.parentName || student.parentPhone) && (
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {student.parentName && <p>ولي الأمر: {student.parentName}</p>}
                    {student.parentPhone && <p>الهاتف: {student.parentPhone}</p>}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StudentsPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    fetchMyModules()
      .then(setModules)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byLevel = modules.reduce((acc, m) => {
    (acc[m.level] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="right-[-100px] top-[-100px] h-[350px] w-[350px] bg-blue-100/60" />
      <Blob className="bottom-[-100px] left-[-100px] h-[320px] w-[320px] bg-violet-100/50" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <PageHeader
          badge="👨‍🎓 إدارة التلاميذ"
          title="أقسامي وتلاميذي"
          subtitle="اختر أحد أقسامك لعرض قائمة التلاميذ المسجلين فيه."
        />

        <ErrorBanner message={error} />

        {loading ? (
          <Spinner />
        ) : modules.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-16 text-center shadow-sm">
            <p className="mb-2 text-5xl">📭</p>
            <p className="text-lg font-bold text-slate-700">لا توجد أقسام مسندة إليك بعد</p>
            <p className="mt-1 text-sm text-slate-400">سيظهر هنا كل قسم تُسند إليه إدارة المدرسة.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byLevel).map(([level, mods], li) => (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: li * 0.1 }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-200 text-xl">
                    🎓
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{level}</h2>
                    <p className="text-sm text-slate-400">{mods.length} أقسام</p>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {mods.map((m) => (
                    <motion.button
                      key={m.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      onClick={() => setSelectedModule(m)}
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
                      <h3 className="mb-1 text-xl font-bold text-slate-900 transition group-hover:text-blue-600">
                        {m.name}
                      </h3>
                      <p className="mb-4 text-sm text-slate-500">{m.subjectName} · {m.classroomName}</p>
                      <p className="mb-3 text-sm text-slate-500">
                        عدد التلاميذ: {m.enrolledCount} / {m.maxStudents}
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${Math.min((m.enrolledCount / Math.max(m.maxStudents, 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedModule && (
          <StudentsModal module={selectedModule} onClose={() => setSelectedModule(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Schedule page (real data via /modules/mine) ───────────────────────────────

function SchedulePage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyModules()
      .then(setModules)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const sessionsByDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});

  modules.forEach((m) => {
    (m.schedules || []).forEach((s) => {
      if (sessionsByDay[s.day]) {
        sessionsByDay[s.day].push({
          ...s,
          moduleName: m.name,
          subjectName: m.subjectName,
          classroomName: m.classroomName,
          level: m.level,
          enrolledCount: m.enrolledCount,
          maxStudents: m.maxStudents,
        });
      }
    });
  });

  Object.values(sessionsByDay).forEach((list) =>
    list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
  );

  const activeDays = DAY_ORDER.filter((d) => sessionsByDay[d].length > 0);

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="right-[-100px] top-[-100px] h-[350px] w-[350px] bg-blue-100/60" />
      <Blob className="bottom-[-100px] left-[-100px] h-[320px] w-[320px] bg-cyan-100/50" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <PageHeader
          badge="🗓️ جدولي الأسبوعي"
          title="جدول الحصص"
          subtitle="نظرة أسبوعية على جميع حصصك، مرتبة حسب اليوم والوقت."
        />

        <ErrorBanner message={error} />

        {loading ? (
          <Spinner />
        ) : activeDays.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-16 text-center shadow-sm">
            <p className="mb-2 text-5xl">🗓️</p>
            <p className="text-lg font-bold text-slate-700">لا توجد حصص مبرمجة بعد</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeDays.map((day, di) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.08 }}
                className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md text-lg">
                    📅
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{DAY_LABELS[day]}</h2>
                  <span className="text-sm text-slate-400">{sessionsByDay[day].length} حصص</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {sessionsByDay[day].map((s, i) => (
                    <div
                      key={`${day}-${i}`}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-center shadow-sm">
                        <span className="text-sm font-extrabold text-blue-600">{formatTime(s.startTime)}</span>
                        <span className="text-xs text-slate-400">{formatTime(s.endTime)}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">{s.moduleName}</h3>
                        <p className="truncate text-xs text-slate-500">
                          {s.subjectName} · {s.classroomName} · {s.level}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {s.enrolledCount} / {s.maxStudents} تلميذ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payouts page (real data via /payouts/mine) ────────────────────────────────

function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyPayouts()
      .then(setPayouts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8" dir="rtl">
      <Blob className="right-[-100px] top-[-100px] h-[350px] w-[350px] bg-emerald-100/60" />
      <Blob className="bottom-[-100px] left-[-100px] h-[320px] w-[320px] bg-blue-100/50" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <PageHeader
          badge="💰 مستحقاتي"
          title="سجل المستحقات"
          subtitle="تفاصيل مستحقاتك الشهرية بناءً على نسبتك من إيرادات أقسامك."
        />

        <ErrorBanner message={error} />

        {loading ? (
          <Spinner />
        ) : payouts.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/80 p-16 text-center shadow-sm">
            <p className="mb-2 text-5xl">💤</p>
            <p className="text-lg font-bold text-slate-700">لا توجد مستحقات محسوبة بعد</p>
            <p className="mt-1 text-sm text-slate-400">تُحسب المستحقات تلقائياً في بداية كل شهر.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((p, i) => {
              const status = PAYOUT_STATUS[p.status] || { label: p.status, classes: "bg-slate-50 text-slate-600 border-slate-100" };
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">{formatPeriod(p.period)}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        إيرادات أقسامك: {formatMoney(p.totalModuleRevenue)} · نسبتك: {p.percentage}%
                      </p>
                      {p.paidAt && (
                        <p className="mt-1 text-xs text-slate-400">تاريخ الدفع: {formatDate(p.paidAt)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-extrabold text-emerald-600">
                        {formatMoney(p.payoutAmount)}
                      </span>
                      <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV = [
  { id: "home", label: "الرئيسية", icon: LayoutDashboard },
  { id: "profile", label: "بروفايلي", icon: User },
  { id: "students", label: "تلاميذي", icon: Users },
  { id: "schedule", label: "جدولي", icon: CalendarDays },
  { id: "payouts", label: "مستحقاتي", icon: Wallet },
];

function hexToRgb(hex = "#185FA5") {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function Sidebar({ active, onNav, onLogoutClick, profile }) {
  const { school } = useAuth();

  const p = school?.primaryColor || "#185FA5";
  const rgb = hexToRgb(p);

  const schoolName = school?.schoolName || "المدرسة";
  const initials = (profile?.fullName || "أستاذ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      dir="rtl"
      style={{
        width: 224,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#0F172A",
        flexShrink: 0,
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        {school?.logoUrl ? (
          <img src={school.logoUrl} alt="شعار"
            style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: p,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <School size={18} color="#fff" />
          </div>
        )}
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>
            {schoolName}
          </p>
          <p style={{ fontSize: 10, color: "#64748B", marginTop: 2, margin: 0 }}>لوحة الأستاذ</p>
        </div>
      </div>

      {/* ── Teacher badge ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", background: p,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.15)",
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#E2E8F0", margin: 0 }}>
            {profile?.fullName || "أستاذ"}
          </p>
          <p style={{ fontSize: 10, color: "#1D9E75", marginTop: 2, margin: 0 }}>أستاذ ✓</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", fontSize: 13, fontWeight: 500,
                color: isActive ? "#fff" : "#94A3B8",
                background: isActive ? `rgba(${rgb},0.35)` : "transparent",
                borderRight: `3px solid ${isActive ? p : "transparent"}`,
                borderTop: "none",
                borderBottom: "none",
                borderLeft: "none",
                width: "calc(100% - 8px)",
                textAlign: "right",
                borderRadius: "0 8px 8px 0",
                marginLeft: 8,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#E2E8F0";
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#94A3B8";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: isActive ? p : "inherit" }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          onClick={onLogoutClick}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 12, fontWeight: 500, color: "#64748B",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", padding: "8px 10px", width: "100%",
            transition: "color 0.15s, background 0.15s",
            borderRadius: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F87171";
            e.currentTarget.style.background = "rgba(248,113,113,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748B";
            e.currentTarget.style.background = "none";
          }}
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ─── Home page (real stats via /modules/mine + /payouts/mine) ─────────────────

function HomePage({ profile }) {
  const [modules, setModules] = useState([]);
  const [latestPayout, setLatestPayout] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyModules(), fetchMyPayouts()])
      .then(([mods, payouts]) => {
        setModules(mods);
        setLatestPayout(payouts[0] || null);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const totalEnrolled = modules.reduce((sum, m) => sum + (m.enrolledCount || 0), 0);

  const stats = [
    { emoji: "📚", number: statsLoading ? "—" : modules.length, label: "قسم نشط" },
    { emoji: "👨‍🎓", number: statsLoading ? "—" : totalEnrolled, label: "تلميذ مسجل" },
    {
      emoji: "💰",
      number: statsLoading ? "—" : latestPayout ? formatMoney(latestPayout.payoutAmount) : "—",
      label: latestPayout ? `مستحقات ${formatPeriod(latestPayout.period)}` : "لا توجد مستحقات بعد",
    },
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
            مرحباً، <span className="text-blue-600">{profile ? profile.fullName : "أستاذ"}</span> 👋
          </h1>

          <p className="mb-10 max-w-2xl text-lg leading-8 text-slate-500">
            يمكنك متابعة أقسامك وتلاميذك، الاطلاع على جدولك الأسبوعي، ومراجعة مستحقاتك الشهرية.
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  return (
    <div dir="rtl" className="flex min-h-screen overflow-hidden bg-[#fafafa] text-slate-900">
      <Sidebar
        active={page}
        onNav={setPage}
        onLogoutClick={() => setShowLogoutModal(true)}
        profile={profile}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-10 text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-xl font-bold text-red-600 mb-2">خطأ في الاتصال</p>
            <p className="text-slate-500">{error}</p>
            <p className="mt-3 text-sm text-slate-400">تأكد أن الخادم يعمل على localhost:8081</p>
          </div>
        </div>
      ) : (
        <>
          {page === "home" && <HomePage profile={profile} />}
          {page === "profile" && <ProfilePage profile={profile} onSaved={setProfile} />}
          {page === "students" && <StudentsPage />}
          {page === "schedule" && <SchedulePage />}
          {page === "payouts" && <PayoutsPage />}
        </>
      )}

      {showLogoutModal && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutModal(false)} />
      )}
    </div>
  );
}