import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle2,
  BookOpen,
  Building2,
  Mail,
  Phone,
  Pencil,
  Check,
  X,
  Camera,
} from "lucide-react";

const initialProfile = {
  name: "أحمد بن يوسف",
  subject: "الرياضيات",
  email: "ahmed.benyoussef@email.com",
  phone: "0550 123 456",
  photo: null,
  schools: [
    { id: 1, name: "ثانوية الشهيد بوضياف", city: "الجزائر العاصمة" },
    { id: 2, name: "ثانوية ابن خلدون", city: "البليدة" },
    { id: 3, name: "ثانوية الأمير عبد القادر", city: "المدية" },
  ],
};

const subjectOptions = [
  "الرياضيات",
  "الفيزياء",
  "العلوم الطبيعية",
  "اللغة العربية",
  "اللغة الفرنسية",
  "اللغة الإنجليزية",
  "التاريخ والجغرافيا",
  "الفلسفة",
  "العلوم الإسلامية",
];

export default function TeacherProfile() {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialProfile);
  const [newSchool, setNewSchool] = useState({ name: "", city: "" });
  const [addingSchool, setAddingSchool] = useState(false);

  const handleEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const handleSave = () => {
    setProfile(draft);
    setEditing(false);
    setAddingSchool(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
    setAddingSchool(false);
    setNewSchool({ name: "", city: "" });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((p) => ({ ...p, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleRemoveSchool = (id) => {
    setDraft((p) => ({ ...p, schools: p.schools.filter((s) => s.id !== id) }));
  };

  const handleAddSchool = () => {
    if (!newSchool.name.trim()) return;
    setDraft((p) => ({
      ...p,
      schools: [...p.schools, { id: Date.now(), ...newSchool }],
    }));
    setNewSchool({ name: "", city: "" });
    setAddingSchool(false);
  };

  const current = editing ? draft : profile;

  return (
    <div
      dir="rtl"
      className="relative flex-1 min-h-screen overflow-hidden bg-[#fafafa] p-8"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-100px] top-[-100px] h-[350px] w-[350px] rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-100px] h-[320px] w-[320px] rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex items-start justify-between"
        >
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-600">
              👤 الملف الشخصي
            </span>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight text-slate-900">
              بروفايلي
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              اعرض وعدّل معلوماتك الشخصية والمهنية.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!editing ? (
              <motion.button
                key="edit"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleEdit}
                className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:shadow-xl hover:shadow-blue-300"
              >
                <Pencil className="h-4 w-4" />
                تعديل الملف
              </motion.button>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-8 flex gap-3"
              >
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:shadow-xl"
                >
                  <Check className="h-4 w-4" />
                  حفظ
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 rounded-2xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="space-y-6">
          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-xl shadow-blue-200">
                  {current.photo ? (
                    <img
                      src={current.photo}
                      alt="profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserCircle2 className="h-14 w-14 text-white/80" />
                    </div>
                  )}
                </div>
                {editing && (
                  <label className="absolute -bottom-2 -left-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-white shadow-lg border border-slate-100 transition hover:bg-blue-50">
                    <Camera className="h-4 w-4 text-blue-500" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>

              {/* Name & Subject */}
              <div className="flex-1">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition"
                      placeholder="الاسم الكامل"
                    />
                    <select
                      value={draft.subject}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, subject: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition"
                    >
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <h2 className="text-3xl font-extrabold text-slate-900">
                      {current.name}
                    </h2>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-600">
                        {current.subject}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
          >
            <h3 className="mb-6 flex items-center gap-3 text-xl font-extrabold text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md">
                <Mail className="h-5 w-5" />
              </div>
              معلومات التواصل
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Email */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">البريد الإلكتروني</p>
                  {editing ? (
                    <input
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 transition"
                      placeholder="البريد الإلكتروني"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {current.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 mb-1">رقم الهاتف</p>
                  {editing ? (
                    <input
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 transition"
                      placeholder="رقم الهاتف"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">
                      {current.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Schools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-slate-100 bg-white/80 p-8 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xl font-extrabold text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md">
                  <Building2 className="h-5 w-5" />
                </div>
                المدارس التي أعمل لديها
              </h3>

              {editing && (
                <button
                  onClick={() => setAddingSchool(true)}
                  className="rounded-2xl bg-orange-50 border border-orange-100 px-4 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-100"
                >
                  + إضافة مدرسة
                </button>
              )}
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {current.schools.map((school, index) => (
                  <motion.div
                    key={school.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-4 transition hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-400 text-white shadow-md shadow-orange-100">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{school.name}</p>
                        <p className="text-sm text-slate-400">{school.city}</p>
                      </div>
                    </div>

                    {editing && (
                      <button
                        onClick={() => handleRemoveSchool(school.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add school form */}
              <AnimatePresence>
                {addingSchool && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-4 space-y-3"
                  >
                    <input
                      value={newSchool.name}
                      onChange={(e) =>
                        setNewSchool((s) => ({ ...s, name: e.target.value }))
                      }
                      placeholder="اسم المدرسة"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-orange-400 transition"
                    />
                    <input
                      value={newSchool.city}
                      onChange={(e) =>
                        setNewSchool((s) => ({ ...s, city: e.target.value }))
                      }
                      placeholder="المدينة"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400 transition"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddSchool}
                        className="flex-1 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                      >
                        إضافة
                      </button>
                      <button
                        onClick={() => {
                          setAddingSchool(false);
                          setNewSchool({ name: "", city: "" });
                        }}
                        className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:bg-slate-200"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}