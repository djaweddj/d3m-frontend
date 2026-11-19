// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { User, Mail, Phone, Users, ChevronDown, ArrowRight, Loader2 } from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

import PageShell from "../components/Enroll/PageShell";
import PageHero from "../components/BrowseSchools/PageHero";
import NButton from "../components/home/NButton";
import Reveal from "../components/home/Reveal";
import { Diamond } from "../components/home/Marks";
import AlertBanner from "../components/Enroll/AlertBanner";
import PasswordInput from "../components/Enroll/PasswordInput";
import AuthSidePanel from "../components/Enroll/AuthSidePanel";
import { Field, InputIcon, inputCls } from "../components/SchoolRegister/FormField";

// Shared study-level list from createModule so labels stay in sync across the app.
const LEVEL_KEYS = [
  "preparatory", "primary1", "primary2", "primary3", "primary4", "primary5",
  "middle1", "middle2", "middle3", "middle4", "secondary1", "secondary2", "secondary3", "other",
];

export default function Signup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    fullName: "", email: "", Password: "", parentName: "", parentPhone: "", birthDate: "",
  });
  const [level, setLevel] = useState("");
  const [customLevel, setCustomLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const levels = LEVEL_KEYS.map((key) => t(`createModule.levels.${key}`));
  const otherLevelLabel = t("createModule.levels.other");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.fullName || !form.email || !form.Password || !level || !form.parentName || !form.parentPhone || !form.birthDate) {
      return t("signup.errors.fillAll");
    }
    if (form.Password.length < 6) return t("signup.errors.passwordLength");
    if (!/^[0-9+\s\-()]{7,15}$/.test(form.parentPhone)) return t("signup.errors.invalidPhone");
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API_URL}/api/students/register`, {
        fullName: form.fullName,
        email: form.email,
        password: form.Password,
        level: level === otherLevelLabel ? customLevel : level,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        birthDate: form.birthDate, // "YYYY-MM-DD" – matches LocalDate
      });
      navigate("/login");
    } catch (err) {
      const serverMessage = err?.response?.data?.message || err?.response?.data || t("signup.errors.generic");
      setError(typeof serverMessage === "string" ? serverMessage : t("signup.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const features = Array.isArray(t("signup.features")) ? t("signup.features") : [];

  return (
    <PageShell
      links={[
        { to: "/login", label: t("navbar.login") },
        { to: "/signup", label: t("navbar.register") },
      ]}
    >
      <PageHero title={t("signup.title")} subtitle={t("signup.subtitle")} />

      <div className="container relative mx-auto -mt-10 max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal>
          <div className="grid border border-gold/25 bg-white shadow-[0_30px_60px_-40px_rgba(0,0,0,.5)] lg:grid-cols-5">
            <div className="p-6 sm:p-10 lg:col-span-3">
              <p className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gold-deep">
                <Diamond className="size-2" />
                {t("signup.logoSubtext")}
              </p>

              {error && (
                <div className="mb-6">
                  <AlertBanner onClose={() => setError("")}>{error}</AlertBanner>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="fullName" label={t("signup.fullName")} req>
                  <InputIcon icon={User}>
                    <input
                      id="fullName" name="fullName" type="text" autoComplete="name"
                      value={form.fullName} onChange={handleChange}
                      placeholder={t("signup.fullNamePlaceholder")}
                      className={`${inputCls} pe-11`}
                    />
                  </InputIcon>
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="email" label={t("signup.email")} req>
                    <InputIcon icon={Mail} ltr>
                      <input
                        id="email" name="email" type="email" autoComplete="email"
                        value={form.email} onChange={handleChange}
                        placeholder={t("signup.emailPlaceholder")}
                        className={`${inputCls} pe-11 text-start`}
                      />
                    </InputIcon>
                  </Field>

                  <Field id="Password" label={t("signup.password")} req>
                    <PasswordInput
                      id="Password" name="Password" autoComplete="new-password"
                      value={form.Password} onChange={handleChange}
                      placeholder={t("signup.passwordPlaceholder")}
                      toggleLabel={t("signup.togglePassword") || "Show / hide password"}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field id="level" label={t("signup.level")} req>
                    <InputIcon icon={ChevronDown}>
                      <select
                        id="level" value={level}
                        onChange={(e) => {
                          setLevel(e.target.value);
                          if (e.target.value !== otherLevelLabel) setCustomLevel("");
                        }}
                        className={`${inputCls} cursor-pointer appearance-none pe-11`}
                      >
                        <option value="">{t("signup.selectLevel")}</option>
                        {levels.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </InputIcon>
                  </Field>

                  <Field id="birthDate" label={t("signup.birthDate")} req>
                    <input
                      id="birthDate" name="birthDate" type="date"
                      value={form.birthDate} onChange={handleChange}
                      className={`${inputCls} text-start`}
                    />
                  </Field>
                </div>

                {level === otherLevelLabel && (
                  <input
                    aria-label={t("signup.customLevelPlaceholder")}
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value)}
                    placeholder={t("signup.customLevelPlaceholder")}
                    className={inputCls}
                  />
                )}

                <div className="grid grid-cols-1 gap-5 border-t border-gold/25 pt-5 sm:grid-cols-2">
                  <Field id="parentName" label={t("signup.parentName")} req>
                    <InputIcon icon={Users}>
                      <input
                        id="parentName" name="parentName" type="text"
                        value={form.parentName} onChange={handleChange}
                        placeholder={t("signup.parentNamePlaceholder")}
                        className={`${inputCls} pe-11`}
                      />
                    </InputIcon>
                  </Field>

                  <Field id="parentPhone" label={t("signup.parentPhone")} req>
                    <InputIcon icon={Phone} ltr>
                      <input
                        id="parentPhone" name="parentPhone" type="tel" inputMode="tel"
                        value={form.parentPhone} onChange={handleChange}
                        placeholder={t("signup.parentPhonePlaceholder")}
                        className={`${inputCls} pe-11 text-start`}
                      />
                    </InputIcon>
                  </Field>
                </div>

                <NButton
                  type="submit"
                  variant="gold"
                  disabled={loading}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("signup.submitting")}
                    </>
                  ) : (
                    <>
                      {t("signup.submit")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </>
                  )}
                </NButton>

                <p className="border-t border-gold/25 pt-6 text-center text-sm text-green-deep/60">
                  {t("signup.haveAccount")}{" "}
                  <Link to="/login" className="font-bold text-gold-deep transition-colors hover:text-green-deep">
                    {t("signup.signIn")}
                  </Link>
                </p>
              </form>
            </div>

            <div className="lg:col-span-2 lg:flex">
              <AuthSidePanel title={t("signup.rightTitle")} description={t("signup.rightDescription")} features={features} />
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}