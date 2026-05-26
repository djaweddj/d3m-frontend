import { useState } from "react";
import {
  Search, Plus, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Users, X,
  GraduationCap, Phone, Hash,
} from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import { toast } from "sonner";

// ─── Initial data ─────────────────────────────────────────────────────────────
const INITIAL_DATA = {
  "1ère AS": {
    label: "أولى ثانوي",
    color: "#3B82F6",
    light: "#EFF6FF",
    groups: {
      A: [
        { id: 1,  name: "أحمد بن علي",     phone: "0661234501", subjects: ["رياضيات", "فيزياء"],  fee: 3500, paid: true  },
        { id: 2,  name: "فاطمة الزهراء",   phone: "0551234502", subjects: ["علوم طبيعية"],        fee: 2800, paid: true  },
        { id: 3,  name: "كريم بلحوسين",    phone: "0771234503", subjects: ["رياضيات"],            fee: 1800, paid: false },
      ],
      B: [
        { id: 4,  name: "سمية بوخالفة",    phone: "0661234504", subjects: ["لغة عربية"],          fee: 1800, paid: true  },
        { id: 5,  name: "يوسف كريمي",      phone: "0771234505", subjects: ["فيزياء", "رياضيات"], fee: 3200, paid: false },
      ],
    },
  },
  "2ème AS": {
    label: "ثانية ثانوي",
    color: "#8B5CF6",
    light: "#F5F3FF",
    groups: {
      A: [
        { id: 6,  name: "هاجر عيسى",       phone: "0661234506", subjects: ["لغة فرنسية"],         fee: 1800, paid: true  },
        { id: 7,  name: "رضا منصوري",      phone: "0551234507", subjects: ["رياضيات", "فيزياء"], fee: 3500, paid: true  },
      ],
      B: [
        { id: 8,  name: "إيمان بلحسن",     phone: "0771234508", subjects: ["علوم طبيعية"],        fee: 2800, paid: false },
        { id: 9,  name: "نورالدين حمزة",   phone: "0661234509", subjects: ["رياضيات"],            fee: 1800, paid: true  },
      ],
      C: [
        { id: 10, name: "سارة قاسم",       phone: "0551234510", subjects: ["تاريخ", "لغة عربية"],fee: 3000, paid: true  },
      ],
    },
  },
  "BAC": {
    label: "باكالوريا",
    color: "#059669",
    light: "#ECFDF5",
    groups: {
      A: [
        { id: 11, name: "عمر زروق",        phone: "0661234511", subjects: ["رياضيات", "فيزياء"], fee: 4000, paid: true  },
        { id: 12, name: "لينة بن يوسف",    phone: "0551234512", subjects: ["علوم طبيعية"],        fee: 2800, paid: true  },
        { id: 13, name: "ياسين حمادي",     phone: "0771234513", subjects: ["رياضيات"],            fee: 1800, paid: false },
      ],
      B: [
        { id: 14, name: "مريم خالدي",      phone: "0661234514", subjects: ["لغة فرنسية", "تاريخ"],fee:3200, paid: true  },
        { id: 15, name: "إسلام بوزيد",     phone: "0551234515", subjects: ["فيزياء"],             fee: 1800, paid: false },
      ],
      C: [
        { id: 16, name: "نادية صديقي",     phone: "0771234516", subjects: ["رياضيات", "علوم"],   fee: 3600, paid: true  },
        { id: 17, name: "عبدالرحمن علي",   phone: "0661234517", subjects: ["لغة عربية"],          fee: 1800, paid: true  },
      ],
      D: [
        { id: 18, name: "آمال بلقاسم",     phone: "0551234518", subjects: ["فيزياء", "رياضيات"], fee: 3500, paid: false },
        { id: 19, name: "حمزة كرار",       phone: "0771234519", subjects: ["علوم طبيعية"],        fee: 2800, paid: true  },
      ],
    },
  },
};

const ALL_SUBJECTS = ["رياضيات", "فيزياء", "علوم طبيعية", "لغة عربية", "لغة فرنسية", "تاريخ", "كيمياء"];
let nextId = 20;

// ─── Add-student modal ────────────────────────────────────────────────────────
function AddStudentModal({ groupKey, levelColor, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", phone: "", fee: "", paid: true, subjects: [] });
  const [error, setError] = useState("");

  const toggleSubject = (sub) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(sub)
        ? f.subjects.filter((s) => s !== sub)
        : [...f.subjects, sub],
    }));

  const submit = () => {
    if (!form.name.trim())                                  return setError("الاسم مطلوب");
    if (!form.phone.trim())                                 return setError("رقم الهاتف مطلوب");
    if (!form.fee || isNaN(form.fee) || Number(form.fee) <= 0) return setError("الرسوم يجب أن تكون رقماً موجباً");
    if (form.subjects.length === 0)                         return setError("أضف مادة واحدة على الأقل");
    onAdd({ ...form, fee: Number(form.fee), id: nextId++ });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
          style={{ background: levelColor + "15" }}>
          <div>
            <p className="font-bold text-slate-800 text-sm">إضافة تلميذ جديد</p>
            <p className="text-xs text-slate-400 mt-0.5">
              المجموعة <span className="font-bold" style={{ color: levelColor }}>{groupKey}</span>
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              الاسم الكامل <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="أدخل الاسم الكامل"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="0661234567"
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          {/* Subjects */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">
              المواد الدراسية <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((sub) => (
                <button key={sub} type="button" onClick={() => toggleSubject(sub)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition"
                  style={
                    form.subjects.includes(sub)
                      ? { background: levelColor, color: "white", borderColor: levelColor }
                      : { background: "white", color: "#64748B", borderColor: "#E2E8F0" }
                  }>
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Fee + Paid status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                الرسوم الشهرية (دج) <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                style={{ fontFamily: "'Cairo', sans-serif" }}
                placeholder="3500"
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">حالة الدفع</label>
              <div className="flex gap-2 mt-0.5">
                {[{ val: true, label: "مدفوع" }, { val: false, label: "معلق" }].map(({ val, label }) => (
                  <button key={label} type="button"
                    onClick={() => setForm((f) => ({ ...f, paid: val }))}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold border transition"
                    style={
                      form.paid === val
                        ? { background: val ? "#ECFDF5" : "#FEF9C3", color: val ? "#065F46" : "#854D0E", borderColor: val ? "#6EE7B7" : "#FDE047" }
                        : { background: "white", color: "#94A3B8", borderColor: "#E2E8F0" }
                    }>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 transition">
            إلغاء
          </button>
          <button onClick={submit}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-bold transition hover:opacity-90"
            style={{ background: levelColor }}>
            إضافة التلميذ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group accordion ──────────────────────────────────────────────────────────
function GroupSection({ groupKey, students, levelColor, levelLight, onAddClick }) {
  const [open, setOpen] = useState(true);
  const paid   = students.filter((s) => s.paid).length;
  const unpaid = students.length - paid;
  const income = students.filter((s) => s.paid).reduce((a, s) => a + s.fee, 0);

  return (
    <div className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: `1px solid ${levelColor}28`, borderRight: `3px solid ${levelColor}` }}>

      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50/60 transition text-right">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-base"
            style={{ background: levelLight, color: levelColor }}>
            {groupKey}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">المجموعة {groupKey}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                <Users className="w-3 h-3" /> {students.length} تلميذ
              </span>
              {unpaid > 0 && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  {unpaid} معلق
                </span>
              )}
              {unpaid === 0 && students.length > 0 && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  الكل مدفوع ✓
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddClick(groupKey); }}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:opacity-80"
            style={{ color: levelColor, borderColor: levelColor + "50", background: levelLight }}>
            <Plus className="w-3.5 h-3.5" /> إضافة تلميذ
          </button>
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-300" />
            : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </button>

      {/* Students list */}
      {open && (
        <div className="bg-white">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: levelLight }}>
                <Users className="w-5 h-5" style={{ color: levelColor }} />
              </div>
              <p className="text-sm text-slate-400">لا يوجد تلاميذ في هذه المجموعة بعد</p>
              <button
                onClick={() => onAddClick(groupKey)}
                className="text-xs font-bold px-4 py-1.5 rounded-lg text-white transition hover:opacity-90 mt-1"
                style={{ background: levelColor }}>
                إضافة أول تلميذ
              </button>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid items-center gap-3 px-4 py-2 border-t border-b border-slate-50 bg-slate-50/50"
                style={{ gridTemplateColumns: "24px 32px 1fr 120px 90px 80px" }}>
                <span />
                <span />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الاسم والمواد</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الهاتف</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الرسوم</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">الحالة</span>
              </div>

              {students.map((s, i) => (
                <div key={s.id}
                  className="grid items-center gap-3 px-4 py-3 hover:bg-slate-50/70 transition border-b border-slate-50 last:border-0"
                  style={{ gridTemplateColumns: "24px 32px 1fr 120px 90px 80px" }}>

                  {/* Row number */}
                  <span className="text-[11px] text-slate-300 font-mono text-center">{i + 1}</span>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                    style={{ background: levelColor }}>
                    {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>

                  {/* Name + subjects */}
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{s.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {s.subjects.map((sub) => (
                        <span key={sub}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: levelLight, color: levelColor }}>
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span dir="ltr" className="truncate">{s.phone}</span>
                  </div>

                  {/* Fee */}
                  <p className="text-[12px] font-bold text-slate-700">
                    {s.fee.toLocaleString("ar-DZ")} دج
                  </p>

                  {/* Paid badge */}
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: s.paid ? "#ECFDF5" : "#FEF9C3",
                      color:      s.paid ? "#065F46" : "#854D0E",
                    }}>
                    {s.paid
                      ? <><CheckCircle className="w-3 h-3" /> مدفوع</>
                      : <><XCircle    className="w-3 h-3" /> معلق</>}
                  </span>
                </div>
              ))}

              {/* Group summary footer */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-400">
                <span>
                  الدخل المحصّل:{" "}
                  <strong className="text-slate-700">{income.toLocaleString("ar-DZ")} دج</strong>
                </span>
                <span>{paid} مدفوع · {unpaid} معلق</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Level tab button ─────────────────────────────────────────────────────────
function LevelTab({ levelKey, meta, active, onClick }) {
  const total = Object.values(meta.groups).flat().length;
  const groups = Object.keys(meta.groups).length;
  return (
    <button onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border"
      style={
        active
          ? { background: meta.color, color: "white", borderColor: meta.color, boxShadow: `0 4px 14px ${meta.color}40` }
          : { background: "white", color: "#64748B", borderColor: "#E2E8F0" }
      }>
      <GraduationCap className="w-4 h-4" />
      {meta.label}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full"
          style={
            active
              ? { background: "rgba(255,255,255,0.25)", color: "white" }
              : { background: meta.light, color: meta.color }
          }>
          {total} تلميذ
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full opacity-70"
          style={
            active
              ? { background: "rgba(255,255,255,0.15)", color: "white" }
              : { background: "#F1F5F9", color: "#94A3B8" }
          }>
          {groups} مجموعات
        </span>
      </div>
    </button>
  );
}

// ─── Main Students page ───────────────────────────────────────────────────────
export default function Students() {
  const { school } = useSchool();
  const [data,        setData]        = useState(INITIAL_DATA);
  const [activeLevel, setActiveLevel] = useState("1ère AS");
  const [search,      setSearch]      = useState("");
  const [modal,       setModal]       = useState(null); // { groupKey }

  const level = data[activeLevel];

  const filtered = Object.fromEntries(
    Object.entries(level.groups).map(([gk, students]) => [
      gk,
      search.trim()
        ? students.filter(
            (s) =>
              s.name.includes(search) ||
              s.subjects.some((sub) => sub.includes(search))
          )
        : students,
    ])
  );

  const allStudents = Object.values(level.groups).flat();
  const totalStudents = allStudents.length;
  const totalPaid     = allStudents.filter((s) => s.paid).length;
  const totalIncome   = allStudents.filter((s) => s.paid).reduce((a, s) => a + s.fee, 0);

  const handleAdd = (groupKey, student) => {
    setData((prev) => ({
      ...prev,
      [activeLevel]: {
        ...prev[activeLevel],
        groups: {
          ...prev[activeLevel].groups,
          [groupKey]: [...prev[activeLevel].groups[groupKey], student],
        },
      },
    }));
    toast.success(`تمت إضافة ${student.name} إلى المجموعة ${groupKey}`);
  };

  return (
    <div className="p-5" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Level tabs ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(data).map(([key, meta]) => (
          <LevelTab
            key={key}
            levelKey={key}
            meta={meta}
            active={activeLevel === key}
            onClick={() => { setActiveLevel(key); setSearch(""); }}
          />
        ))}
      </div>

      {/* ── Stats + search bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { icon: Users,        val: totalStudents,                         label: "تلميذ" },
            { icon: CheckCircle,  val: totalPaid,                             label: "مدفوع" },
            { icon: Hash,         val: totalIncome.toLocaleString("ar-DZ") + " دج", label: "دخل" },
          ].map(({ icon: Icon, val, label }) => (
            <div key={label}
              className="flex items-center gap-1.5 bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm">
              <Icon className="w-3.5 h-3.5" style={{ color: level.color }} />
              <span className="text-[13px] font-bold text-slate-800">{val}</span>
              <span className="text-[11px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            className="w-full pr-9 pl-3 py-2 rounded-lg border bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-50 transition"
            style={{ fontFamily: "'Cairo', sans-serif", borderColor: search ? level.color : "#E2E8F0" }}
            placeholder="بحث عن تلميذ أو مادة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Group accordions ── */}
      <div className="space-y-3">
        {Object.entries(filtered).map(([groupKey, students]) => (
          <GroupSection
            key={groupKey}
            groupKey={groupKey}
            students={students}
            levelColor={level.color}
            levelLight={level.light}
            onAddClick={(gk) => setModal({ groupKey: gk })}
          />
        ))}
      </div>

      {/* ── Modal ── */}
      {modal && (
        <AddStudentModal
          groupKey={modal.groupKey}
          levelColor={level.color}
          onClose={() => setModal(null)}
          onAdd={(student) => handleAdd(modal.groupKey, student)}
        />
      )}
    </div>
  );
}