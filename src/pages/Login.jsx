// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

import { useAuth } from "../context/authContext";
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

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (user?.role === "SCHOOL_ADMIN") navigate("/dashboard");
    else if (user?.role === "STUDENT") navigate("/studentdashboard");
    else if (user?.role === "TEACHER") navigate("/teacherhome");
    else if (user?.role === "SUPER_ADMIN") navigate("/superadmindashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      const status = err?.response?.status;

      if (status === 429) {
        const retryAfter =
          Number(err?.response?.data?.retryAfter) ||
          parseInt(err?.response?.headers?.["retry-after"]) ||
          60;
        setError("too_many");
        startCooldown(retryAfter);
      } else if (status === 403 || status === 401) {
        setError(t("login.errors.invalidCredentials"));
      } else {
        setError(t("login.errors.connectionError"));
      }
    }
  };

  const features = ["analytics", "management", "security"].map((k) => ({
    title: t(`login.features.${k}.title`),
    desc: t(`login.features.${k}.desc`),
  }));

  return (
    <PageShell
      links={[
        { to: "/login", label: t("navbar.login") },
        { to: "/signup", label: t("navbar.register") },
      ]}
    >
      <PageHero title={t("login.welcomeTitle")} subtitle={t("login.welcomeSubtitle")} />

      <div className="container relative mx-auto -mt-10 max-w-5xl px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal>
          <div className="grid border border-gold/25 bg-white shadow-[0_30px_60px_-40px_rgba(0,0,0,.5)] lg:grid-cols-5">
            <div className="p-6 sm:p-10 lg:col-span-3">
              <p className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-gold-deep">
                <Diamond className="size-2" />
                {t("login.logoSubtext")}
              </p>

              {error && (
                <div className="mb-6">
                  <AlertBanner onClose={cooldown === 0 ? () => setError("") : undefined}>
                    {error === "too_many" ? (
                      <>
                        {t("login.errors.tooManyPrefix")}{" "}
                        {cooldown > 0 && (
                          <strong className="tabular-nums">
                            {t("login.errors.waitBeforeRetry", { seconds: cooldown })}
                          </strong>
                        )}
                      </>
                    ) : (
                      error
                    )}
                  </AlertBanner>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Field id="email" label={t("login.emailLabel")}>
                  <InputIcon icon={Mail} ltr>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("login.emailPlaceholder")}
                      className={`${inputCls} pe-11 text-start`}
                    />
                  </InputIcon>
                </Field>

                <Field id="password" label={t("login.passwordLabel")}>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    toggleLabel={t("login.togglePassword") || "Show / hide password"}
                  />
                </Field>

                <Link
                  to="/forgot-password"
                  className="inline-block text-sm font-bold text-gold-deep transition-colors hover:text-green-deep"
                >
                  {t("login.forgotPassword")}
                </Link>

                <NButton
                  type="submit"
                  variant="gold"
                  disabled={loading || cooldown > 0}
                  className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("login.signingIn")}
                    </>
                  ) : cooldown > 0 ? (
                    <span className="tabular-nums">{t("login.waitSeconds", { seconds: cooldown })}</span>
                  ) : (
                    <>
                      {t("login.signIn")}
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </>
                  )}
                </NButton>

                <p className="border-t border-gold/25 pt-6 text-center text-sm text-green-deep/60">
                  {t("login.noAccount")}{" "}
                  <Link to="/signup" className="font-bold text-gold-deep transition-colors hover:text-green-deep">
                    {t("login.signUp")}
                  </Link>
                </p>
              </form>
            </div>

            <div className="lg:col-span-2 lg:flex">
              <AuthSidePanel title={t("login.rightTitle")} description={t("login.rightDescription")} features={features} />
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}