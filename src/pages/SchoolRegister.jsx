import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  GraduationCap,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Info,
  Send,
  Home,
  Building2,
  ShieldCheck,
  User,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// ─── Algerian wilayas ─────────────────────────────────────────────────────────
// Kept as official Arabic place names regardless of interface language.
const WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار",
  "البليدة","البويرة","تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر",
  "الجلفة","جيجل","سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة",
  "قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة","وهران","البيض",
  "إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي",
  "خنشلة","سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تيموشنت",
  "غرداية","غليزان","تيميمون","برج باجي مختار","أولاد جلال","بني عباس",
  "عين صالح","عين قزام","توقرت","جانت","المغير","المنيعة",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Field = ({ label, req, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-semibold text-gray-800">
      {label}
      {req && <span className="text-red-500 mx-1">*</span>}
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
    <Icon className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
function SuccessScreen({ t, dir }) {
  return (
    <div
      className="min-h-screen bg-gray-50 font-cairo"
      dir={dir}
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');`}</style>

      <header className="border-b bg-white h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            {t("navbar.platformName")}
          </span>
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          {t("schoolRegister.success.title")}
        </h1>
        <p className="text-sm text-gray-500 mb-8">{t("schoolRegister.success.subtitle")}</p>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-start mb-8">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            {t("schoolRegister.success.nextStepsTitle")}
          </p>
          {t("schoolRegister.success.steps").map((step) => (
            <div key={step} className="flex items-center gap-2 mb-2.5 last:mb-0">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">{step}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/schools">
            <button className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              {t("schoolRegister.success.browseSchools")}
            </button>
          </Link>
          <Link to="/">
            <button className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2">
              <Home className="h-4 w-4" />
              {t("schoolRegister.success.home")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SchoolRegister() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError(null);

    // Map form fields → backend DTO
    const payload = {
      schoolName: data.schoolName,
      ownerFullName: data.ownerFullName,
      phone: data.phone,
      email: data.email,
      wilaya: data.wilaya,
      commune: data.commune,
      address: data.address,
      password: data.password,
    };

    try {
      const response = await fetch(`${API_URL}/api/school-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        const message =
          errorData?.message || errorData?.error || `${t("schoolRegister.errors.serverErrorTitle")} (${response.status})`;
        throw new Error(message);
      }

      toast.success(t("schoolRegister.success.title"));
      setIsSubmitted(true);
    } catch (err) {
      const msg = err.message === "Failed to fetch" ? t("schoolRegister.errors.fetchError") : err.message;
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) return <SuccessScreen t={t} dir={dir} />;

  const stepLabels = t("schoolRegister.steps");

  return (
    <div className="min-h-screen bg-gray-50" dir={dir} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');`}</style>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 h-16 flex items-center px-6 justify-between sticky top-0 z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Tajawal', sans-serif" }}>
            {t("navbar.platformName")}
          </span>
        </Link>
        <Link to="/schools">
          <button className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {t("schoolRegister.browseSchools")}
          </button>
        </Link>
      </header>

      {/* ── Hero strip ── */}
      <div
        className="relative overflow-hidden text-center px-4 py-10"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)",
          }}
        />
        <h1 className="text-2xl font-bold text-white relative" style={{ fontFamily: "'Tajawal', sans-serif" }}>
          {t("schoolRegister.hero.title")}
        </h1>
        <p className="text-sm text-blue-200 mt-1 relative">{t("schoolRegister.hero.subtitle")}</p>

        {/* Step pills */}
        <div className="flex justify-center mt-6 relative">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium border transition
                ${i === 0 ? "rounded-s-full" : ""}
                ${i === stepLabels.length - 1 ? "rounded-e-full" : ""}
                ${i === 0 ? "bg-white/20 text-white border-white/40" : "bg-white/10 text-white/60 border-white/15"}`}
            >
              <span
                className={`w-5 h-5 rounded-full border text-[10px] flex items-center justify-center
                  ${i === 0 ? "bg-white text-blue-700 border-white font-bold" : "border-current"}`}
              >
                {i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="max-w-2xl mx-auto px-4 -mt-5 pb-12 relative">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Server error banner */}
            {serverError && (
              <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
                <X className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {t("schoolRegister.errors.serverErrorTitle")}
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">{serverError}</p>
                </div>
              </div>
            )}

            {/* ── Section 1: School info ── */}
            <SectionHeader
              icon={Info}
              label={t("schoolRegister.sections.schoolInfo.label")}
              sub={t("schoolRegister.sections.schoolInfo.sub")}
            />

            <div className="p-6 space-y-4">
              <Field label={t("schoolRegister.fields.schoolName")} req error={errors.schoolName?.message}>
                <input
                  className={inputCls}
                  placeholder={t("schoolRegister.fields.schoolNamePlaceholder")}
                  {...register("schoolName", { required: t("schoolRegister.errors.schoolName") })}
                />
              </Field>

              {/* Wilaya + Commune */}
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("schoolRegister.fields.wilaya")} req error={errors.wilaya?.message}>
                  <InputIcon icon={MapPin}>
                    <select
                      className={`${inputCls} pe-9 appearance-none cursor-pointer`}
                      defaultValue=""
                      {...register("wilaya", { required: t("schoolRegister.errors.wilaya") })}
                    >
                      <option value="" disabled>
                        {t("schoolRegister.fields.selectWilaya")}
                      </option>
                      {WILAYAS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </InputIcon>
                </Field>

                <Field label={t("schoolRegister.fields.commune")} req error={errors.commune?.message}>
                  <input
                    className={inputCls}
                    placeholder={t("schoolRegister.fields.communePlaceholder")}
                    {...register("commune", { required: t("schoolRegister.errors.commune") })}
                  />
                </Field>
              </div>

              <Field label={t("schoolRegister.fields.address")} req error={errors.address?.message}>
                <InputIcon icon={MapPin}>
                  <input
                    className={`${inputCls} pe-9`}
                    placeholder={t("schoolRegister.fields.addressPlaceholder")}
                    {...register("address", { required: t("schoolRegister.errors.address") })}
                  />
                </InputIcon>
              </Field>
            </div>

            <div className="border-t border-gray-100 mx-6" />

            {/* ── Section 2: Owner info ── */}
            <SectionHeader
              icon={User}
              label={t("schoolRegister.sections.ownerInfo.label")}
              sub={t("schoolRegister.sections.ownerInfo.sub")}
            />

            <div className="p-6 space-y-4">
              <Field label={t("schoolRegister.fields.ownerFullName")} req error={errors.ownerFullName?.message}>
                <InputIcon icon={User}>
                  <input
                    className={`${inputCls} pe-9`}
                    placeholder={t("schoolRegister.fields.ownerFullNamePlaceholder")}
                    {...register("ownerFullName", { required: t("schoolRegister.errors.ownerFullName") })}
                  />
                </InputIcon>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t("schoolRegister.fields.phone")} req error={errors.phone?.message}>
                  <InputIcon icon={Phone}>
                    <input
                      className={`${inputCls} pe-9`}
                      placeholder="0612345678"
                      dir="ltr"
                      style={{ textAlign: "start" }}
                      {...register("phone", {
                        required: t("schoolRegister.errors.phone"),
                        pattern: {
                          value: /^0[5-7][0-9]{8}$/,
                          message: t("schoolRegister.errors.phoneInvalid"),
                        },
                      })}
                    />
                  </InputIcon>
                </Field>

                <Field label={t("schoolRegister.fields.email")} req error={errors.email?.message}>
                  <InputIcon icon={Mail}>
                    <input
                      type="email"
                      className={`${inputCls} pe-9`}
                      placeholder="example@email.com"
                      dir="ltr"
                      style={{ textAlign: "start" }}
                      {...register("email", {
                        required: t("schoolRegister.errors.email"),
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: t("schoolRegister.errors.emailInvalid"),
                        },
                      })}
                    />
                  </InputIcon>
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-100 mx-6" />

            {/* ── Section 3: Account security ── */}
            <SectionHeader
              icon={Lock}
              label={t("schoolRegister.sections.security.label")}
              sub={t("schoolRegister.sections.security.sub")}
            />

            <div className="p-6">
              <Field label={t("schoolRegister.fields.password")} req error={errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${inputCls} pe-9`}
                    placeholder={t("schoolRegister.fields.passwordPlaceholder")}
                    {...register("password", {
                      required: t("schoolRegister.errors.password"),
                      minLength: { value: 8, message: t("schoolRegister.errors.passwordLength") },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {/* ── Notice box ── */}
            <div className="mx-6 mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 mb-1">{t("schoolRegister.notice.title")}</p>
                <ul className="space-y-1">
                  {t("schoolRegister.notice.items").map((note) => (
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
                  {t("schoolRegister.cancel")}
                </button>
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("schoolRegister.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t("schoolRegister.submit")}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}