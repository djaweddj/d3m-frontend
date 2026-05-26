import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  GraduationCap,
  Plus,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Clock,
  BookOpen,
  Info,
  Send,
  Home,
  Building2,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

// ─── tiny helpers ────────────────────────────────────────────────────────────
const Field = ({ label, hint, req, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-semibold text-gray-800">
      {label}
      {req && <span className="text-red-500 mr-1">*</span>}
      {hint && <span className="font-normal text-gray-400 text-xs mr-1">— {hint}</span>}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-red-500 flex items-center gap-1">
        <span>⚠</span> {error}
      </p>
    )}
  </div>
);

const InputIcon = ({ icon: Icon, children }) => (
  <div className="relative">
    {children}
    <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
  </div>
);

const SectionHeader = ({ icon: Icon, label, sub }) => (
  <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-blue-600" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  </div>
);

const inputCls =
  "w-full font-cairo text-sm px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition";

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div className="min-h-screen bg-gray-50 font-cairo" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');`}</style>

      <header className="border-b bg-white h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            منصة <span className="text-blue-600">مدارس</span> الدعم
          </span>
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          تم إرسال طلبك بنجاح!
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          شكراً لانضمامك — سيتواصل معك فريقنا خلال 48 ساعة لتأكيد التسجيل.
        </p>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-right mb-8">
          <p className="text-sm font-semibold text-gray-800 mb-3">الخطوات التالية</p>
          {[
            "مراجعة المعلومات من قبل فريقنا",
            "التواصل معك لتأكيد التفاصيل والمستندات",
            "تفعيل حساب مدرستك على المنصة",
            "البدء في استقبال طلبات التسجيل",
          ].map((step) => (
            <div key={step} className="flex items-center gap-2 mb-2.5 last:mb-0">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">{step}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/schools">
            <button className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              تصفح المدارس
            </button>
          </Link>
          <Link to="/">
            <button className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2">
              <Home className="h-4 w-4" />
              الرئيسية
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SchoolRegister() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    if (subjects.length === 0) {
      toast.error("يرجى إضافة مادة واحدة على الأقل");
      return;
    }
    console.log({ ...data, subjects });
    toast.success("تم تسجيل المدرسة بنجاح!");
    setIsSubmitted(true);
  };

  const addSubject = () => {
    const val = currentSubject.trim();
    if (val && !subjects.includes(val)) {
      setSubjects([...subjects, val]);
      setCurrentSubject("");
    }
  };

  const removeSubject = (s) => setSubjects(subjects.filter((x) => x !== s));

  if (isSubmitted) return <SuccessScreen />;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');`}</style>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            منصة <span className="text-blue-600">مدارس</span> الدعم
          </span>
        </Link>
        <Link to="/schools">
          <button className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            تصفح المدارس
          </button>
        </Link>
      </header>

      {/* ── Hero strip ── */}
      <div
        className="relative overflow-hidden text-center px-4 py-10"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
        }}
      >
        {/* subtle diagonal texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)",
          }}
        />

        <h1 className="text-2xl font-bold text-white relative" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          تسجيل مدرسة جديدة
        </h1>
        <p className="text-sm text-blue-200 mt-1 relative">
          انضم إلى شبكة مدارس الدعم وابدأ في استقبال الطلاب اليوم
        </p>

        {/* Step pills */}
        <div className="flex justify-center mt-6 relative">
          {[
            { n: "1", label: "معلومات المدرسة", active: true },
            { n: "2", label: "المراجعة", active: false },
            { n: "3", label: "التفعيل", active: false },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium border transition
                ${i === 0 ? "rounded-r-full" : ""}
                ${i === 2 ? "rounded-l-full" : ""}
                ${step.active
                  ? "bg-white/20 text-white border-white/40"
                  : "bg-white/10 text-white/60 border-white/15"
                }`}
            >
              <span
                className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center
                  ${step.active ? "bg-white text-blue-700 border-white font-bold" : "border-current"}`}
              >
                {step.n}
              </span>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-5 pb-12 relative">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

            {/* ── Section 1: Basic info ── */}
            <SectionHeader icon={Info} label="المعلومات الأساسية" sub="بيانات هوية مدرستك على المنصة" />

            <div className="p-6 space-y-4">
              <Field label="اسم المدرسة" req error={errors.name?.message}>
                <input
                  className={inputCls}
                  placeholder="مثال: مدرسة الأمل للدعم التربوي"
                  {...register("name", { required: "اسم المدرسة مطلوب" })}
                />
              </Field>

              <Field label="وصف المدرسة" hint="اشرح ما يميزكم" req error={errors.description?.message}>
                <textarea
                  className={inputCls}
                  rows={3}
                  placeholder="اكتب نبذة عن المدرسة، المستويات المدعومة، وأسلوب التدريس..."
                  {...register("description", { required: "وصف المدرسة مطلوب" })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="اسم المدير المسؤول" req error={errors.teacher?.message}>
                  <input
                    className={inputCls}
                    placeholder="الاسم الكامل"
                    {...register("teacher", { required: "اسم المسؤول مطلوب" })}
                  />
                </Field>

                <Field label="الموقع" req error={errors.location?.message}>
                  <InputIcon icon={MapPin}>
                    <input
                      className={`${inputCls} pr-9`}
                      placeholder="المدينة، الحي"
                      {...register("location", { required: "الموقع مطلوب" })}
                    />
                  </InputIcon>
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-100 mx-6" />

            {/* ── Section 2: Subjects ── */}
            <SectionHeader icon={BookOpen} label="المواد الدراسية" sub="أضف المواد التي تقدمها مدرستك" />

            <div className="p-6">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  placeholder="مثال: الرياضيات، الفيزياء، اللغة العربية..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addSubject(); }
                  }}
                />
                <button
                  type="button"
                  onClick={addSubject}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  إضافة
                </button>
              </div>

              <div className="mt-3 min-h-[32px]">
                {subjects.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    لم تُضف أي مادة بعد — أضف مادة واحدة على الأقل
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[13px] font-medium px-3 py-1 rounded-full"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => removeSubject(s)}
                          className="text-blue-400 hover:text-red-500 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 mx-6" />

            {/* ── Section 3: Schedule & contact ── */}
            <SectionHeader icon={Clock} label="الجدول والتواصل" sub="أوقات الدراسة وطريقة التواصل" />

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="أوقات الدراسة" req error={errors.schedule?.message}>
                  <InputIcon icon={Clock}>
                    <input
                      className={`${inputCls} pr-9`}
                      placeholder="السبت–الخميس، 4:00–7:00 م"
                      {...register("schedule", { required: "أوقات الدراسة مطلوبة" })}
                    />
                  </InputIcon>
                </Field>

                <Field label="رقم الهاتف" req error={errors.contact?.message}>
                  <InputIcon icon={Phone}>
                    <input
                      className={`${inputCls} pr-9`}
                      placeholder="0612345678"
                      dir="ltr"
                      style={{ textAlign: "right" }}
                      {...register("contact", {
                        required: "رقم الهاتف مطلوب",
                        pattern: {
                          value: /^0[5-7][0-9]{8}$/,
                          message: "رقم الهاتف غير صحيح",
                        },
                      })}
                    />
                  </InputIcon>
                </Field>
              </div>

              <Field label="الرسوم الشهرية (بالدينار الجزائري)" req error={errors.price?.message}>
                <div className="relative">
                  <input
                    type="number"
                    className={`${inputCls} pr-14`}
                    placeholder="5000"
                    min={0}
                    {...register("price", {
                      required: "الرسوم الشهرية مطلوبة",
                      min: { value: 0, message: "السعر يجب أن يكون أكبر من 0" },
                    })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 pointer-events-none">
                    DZD
                  </span>
                </div>
              </Field>
            </div>

            {/* ── Notice box ── */}
            <div className="mx-6 mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 mb-1">ملاحظات مهمة</p>
                <ul className="space-y-1">
                  {[
                    "ستتم مراجعة طلبك خلال 48 ساعة عمل",
                    "سيُطلب منك تقديم مستندات رسمية عند التواصل",
                    "يمكنك تعديل بيانات مدرستك بعد التفعيل",
                  ].map((note) => (
                    <li key={note} className="flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex gap-3">
              <Link to="/">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-500 hover:bg-white hover:text-gray-800 transition"
                >
                  إلغاء
                </button>
              </Link>
              <button
                type="submit"
                disabled={subjects.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                إرسال طلب التسجيل
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}