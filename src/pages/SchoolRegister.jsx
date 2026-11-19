import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  X, CheckCircle2, MapPin, Phone, Mail, Lock, Eye, EyeOff,
  Info, Send, Home, Building2, ShieldCheck, User, Loader2,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import logo from "../assets/num3.png";

import Navbar from "../components/navbar";
import Footer from "../components/home/Footer";
import NButton from "../components/home/NButton";
import Reveal from "../components/home/Reveal";
import { Diamond, ColumnMark } from "../components/home/Marks";
import PageHero from "../components/BrowseSchools/PageHero";
import FormSection from "../components/SchoolRegister/FromSection";
import { Field, InputIcon, inputCls } from "../components/SchoolRegister/FormField";

// Official Arabic place names, whatever the interface language.
const WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
  "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر", "الجلفة", "جيجل", "سطيف", "سعيدة",
  "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
  "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
  "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون",
  "برج باجي مختار", "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "توقرت", "جانت", "المغير", "المنيعة",
  "آفلو", "بريكة", "القنطرة", "بئر العاتر", "العريشة", "قصر الشلالة", "عين وسارة", "مسعد", "قصر البخاري",
  "بوسعادة", "الأبيض سيدي الشيخ",
].map((name, i) => `${String(i + 1).padStart(2, "0")} - ${name}`);

// Navbar + Footer shell shared by the form and the success screen
function PageShell({ dir, t, children }) {
  const footerLinks = [
    { to: "/", label: t("schoolRegister.success.home") },
    { to: "/schools", label: t("schoolRegister.browseSchools") },
  ];
  return (
    <div dir={dir} className="min-h-screen bg-ivory font-body">
      <Navbar />
      {children}
      <Footer
        logo={logo}
        name="Numeria Academy"
        rights={`© ${new Date().getFullYear()} Numeria Academy`}
        links={footerLinks}
      />
    </div>
  );
}

// ─── Success screen ──────────────────────────────────────────────────────────
function SuccessScreen({ t, dir }) {
  const steps = t("schoolRegister.success.steps");
  return (
    <PageShell dir={dir} t={t}>
      <PageHero title={t("schoolRegister.success.title")} subtitle={t("schoolRegister.success.subtitle")} />

      <div className="container relative mx-auto -mt-10 max-w-2xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="border border-gold/25 bg-white p-6 text-center sm:p-10">
            <span className="mx-auto mb-6 grid size-16 place-items-center rounded-sm bg-green-deep text-gold">
              <CheckCircle2 className="size-8" strokeWidth={1.5} />
            </span>

            <div className="border border-gold/25 bg-ivory p-5 text-start">
              <p className="mb-4 font-display text-lg text-green-deep">
                {t("schoolRegister.success.nextStepsTitle")}
              </p>
              <ul className="space-y-3">
                {steps.map((step) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-7 text-green-deep/70">
                    <Diamond className="mt-2.5 size-2 shrink-0 text-gold" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <NButton to="/schools" variant="outline" className="w-full sm:w-auto">
                {t("schoolRegister.success.browseSchools")}
              </NButton>
              <NButton to="/" variant="green" className="w-full sm:w-auto">
                <Home className="size-4" />
                {t("schoolRegister.success.home")}
              </NButton>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function SchoolRegister() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate(); // kept from the original, not used yet
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError(null);

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
      const response = await fetch(`${API_URL}/api/school-requests/submit`, {
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
  const invalid = (name) => (errors[name] ? true : undefined);
  const describedBy = (name) => (errors[name] ? `${name}-error` : undefined);

  return (
    <PageShell dir={dir} t={t}>
      <PageHero title={t("schoolRegister.hero.title")} subtitle={t("schoolRegister.hero.subtitle")}>
        <ol className="flex flex-wrap items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <li
              key={label}
              aria-current={i === 0 ? "step" : undefined}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs ${
                i === 0
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : "border-ivory/15 text-ivory/60"
              }`}
            >
              <span
                className={`grid size-5 place-items-center rounded-full text-[10px] font-bold tabular-nums ${
                  i === 0 ? "bg-gold text-green-deep" : "border border-current"
                }`}
              >
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </PageHero>

      <div className="container relative mx-auto -mt-10 max-w-3xl px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="border border-gold/25 bg-white shadow-[0_30px_60px_-40px_rgba(0,0,0,.5)]">
              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="mx-5 mt-8 flex items-start gap-3 border border-algeria-red/40 bg-algeria-red/10 p-4 sm:mx-8"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-sm bg-algeria-red text-ivory">
                    <X className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-algeria-red">{t("schoolRegister.errors.serverErrorTitle")}</p>
                    <p className="mt-0.5 text-xs leading-6 text-green-deep/70">{serverError}</p>
                  </div>
                </div>
              )}

              {/* 1 · School info */}
              <FormSection
                icon={Info}
                label={t("schoolRegister.sections.schoolInfo.label")}
                sub={t("schoolRegister.sections.schoolInfo.sub")}
              >
                <Field id="schoolName" label={t("schoolRegister.fields.schoolName")} req error={errors.schoolName?.message}>
                  <input
                    id="schoolName"
                    aria-invalid={invalid("schoolName")}
                    aria-describedby={describedBy("schoolName")}
                    className={inputCls}
                    placeholder={t("schoolRegister.fields.schoolNamePlaceholder")}
                    {...register("schoolName", { required: t("schoolRegister.errors.schoolName") })}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="wilaya" label={t("schoolRegister.fields.wilaya")} req error={errors.wilaya?.message}>
                    <InputIcon icon={MapPin}>
                      <select
                        id="wilaya"
                        defaultValue=""
                        aria-invalid={invalid("wilaya")}
                        aria-describedby={describedBy("wilaya")}
                        className={`${inputCls} cursor-pointer appearance-none pe-11`}
                        {...register("wilaya", { required: t("schoolRegister.errors.wilaya") })}
                      >
                        <option value="" disabled>{t("schoolRegister.fields.selectWilaya")}</option>
                        {WILAYAS.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </InputIcon>
                  </Field>

                  <Field id="commune" label={t("schoolRegister.fields.commune")} req error={errors.commune?.message}>
                    <input
                      id="commune"
                      aria-invalid={invalid("commune")}
                      aria-describedby={describedBy("commune")}
                      className={inputCls}
                      placeholder={t("schoolRegister.fields.communePlaceholder")}
                      {...register("commune", { required: t("schoolRegister.errors.commune") })}
                    />
                  </Field>
                </div>

                <Field id="address" label={t("schoolRegister.fields.address")} req error={errors.address?.message}>
                  <InputIcon icon={MapPin}>
                    <input
                      id="address"
                      aria-invalid={invalid("address")}
                      aria-describedby={describedBy("address")}
                      className={`${inputCls} pe-11`}
                      placeholder={t("schoolRegister.fields.addressPlaceholder")}
                      {...register("address", { required: t("schoolRegister.errors.address") })}
                    />
                  </InputIcon>
                </Field>
              </FormSection>

              {/* 2 · Owner info */}
              <FormSection
                divider
                icon={User}
                label={t("schoolRegister.sections.ownerInfo.label")}
                sub={t("schoolRegister.sections.ownerInfo.sub")}
              >
                <Field id="ownerFullName" label={t("schoolRegister.fields.ownerFullName")} req error={errors.ownerFullName?.message}>
                  <InputIcon icon={User}>
                    <input
                      id="ownerFullName"
                      aria-invalid={invalid("ownerFullName")}
                      aria-describedby={describedBy("ownerFullName")}
                      className={`${inputCls} pe-11`}
                      placeholder={t("schoolRegister.fields.ownerFullNamePlaceholder")}
                      {...register("ownerFullName", { required: t("schoolRegister.errors.ownerFullName") })}
                    />
                  </InputIcon>
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="phone" label={t("schoolRegister.fields.phone")} req error={errors.phone?.message}>
                    <InputIcon icon={Phone} ltr>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        aria-invalid={invalid("phone")}
                        aria-describedby={describedBy("phone")}
                        className={`${inputCls} pe-11 text-start`}
                        placeholder="0612345678"
                        {...register("phone", {
                          required: t("schoolRegister.errors.phone"),
                          pattern: { value: /^0[5-7][0-9]{8}$/, message: t("schoolRegister.errors.phoneInvalid") },
                        })}
                      />
                    </InputIcon>
                  </Field>

                  <Field id="email" label={t("schoolRegister.fields.email")} req error={errors.email?.message}>
                    <InputIcon icon={Mail} ltr>
                      <input
                        id="email"
                        type="email"
                        aria-invalid={invalid("email")}
                        aria-describedby={describedBy("email")}
                        className={`${inputCls} pe-11 text-start`}
                        placeholder="example@email.com"
                        {...register("email", {
                          required: t("schoolRegister.errors.email"),
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("schoolRegister.errors.emailInvalid") },
                        })}
                      />
                    </InputIcon>
                  </Field>
                </div>
              </FormSection>

              {/* 3 · Security */}
              <FormSection
                divider
                icon={Lock}
                label={t("schoolRegister.sections.security.label")}
                sub={t("schoolRegister.sections.security.sub")}
              >
                <Field id="password" label={t("schoolRegister.fields.password")} req error={errors.password?.message}>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      aria-invalid={invalid("password")}
                      aria-describedby={describedBy("password")}
                      className={`${inputCls} pe-11`}
                      placeholder={t("schoolRegister.fields.passwordPlaceholder")}
                      {...register("password", {
                        required: t("schoolRegister.errors.password"),
                        minLength: { value: 8, message: t("schoolRegister.errors.passwordLength") },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-pressed={showPassword}
                      aria-label={t("schoolRegister.fields.togglePassword") || "Show / hide password"}
                      className="absolute end-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-gold-deep transition-colors hover:bg-gold/15"
                    >
                      {showPassword ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                    </button>
                  </div>
                </Field>
              </FormSection>

              {/* Notice */}
              <div className="relative mx-5 mb-8 overflow-hidden bg-green-deep p-6 sm:mx-8">
                <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.08]" />
                <ColumnMark className="pointer-events-none absolute -bottom-3 end-3 h-28 text-gold/10" />
                <div className="relative flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-gold text-green-deep">
                    <ShieldCheck className="size-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="mb-3 font-display text-ivory">{t("schoolRegister.notice.title")}</p>
                    <ul className="space-y-2">
                      {t("schoolRegister.notice.items").map((note) => (
                        <li key={note} className="flex items-start gap-2 text-xs leading-6 text-ivory/70">
                          <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-gold" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-gold/25 bg-ivory px-5 py-5 sm:flex-row sm:px-8">
                <NButton to="/" variant="outline" className="w-full sm:w-auto">
                  {t("schoolRegister.cancel")}
                </NButton>
                <NButton
                  type="submit"
                  variant="gold"
                  disabled={isLoading}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("schoolRegister.submitting")}
                    </>
                  ) : (
                    <>
                      <Send className="size-4 rtl:-scale-x-100" />
                      {t("schoolRegister.submit")}
                    </>
                  )}
                </NButton>
              </div>
            </div>
          </form>
        </Reveal>

        <p className="mt-8 text-center">
          <Link
            to="/schools"
            className="inline-flex items-center gap-2 text-sm font-bold text-gold-deep transition-colors hover:text-green-deep"
          >
            <Building2 className="size-4" />
            {t("schoolRegister.browseSchools")}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}