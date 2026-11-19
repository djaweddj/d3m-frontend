import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

import PageShell from "../components/Enroll/PageShell";
import PageHero from "../components/BrowseSchools/PageHero";
import NButton from "../components/home/NButton";
import Reveal from "../components/home/Reveal";
import AlertBanner from "../components/Enroll/AlertBanner";
import PasswordInput from "../components/Enroll/PasswordInput";
import { Field, InputIcon, inputCls } from "../components/SchoolRegister/FormField";

const API_BASE = import.meta.env.VITE_API_URL;

const SUBMIT_CLS = "w-full disabled:cursor-not-allowed disabled:opacity-60";

// ─────────────────────────────────────────────
//  Shared layout: Navbar + hero (step title) + card + Footer
// ─────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuenow={current}
      className="flex items-center justify-center gap-2"
    >
      {[1, 2, 3].map((s) => (
        <span
          key={s}
          className={`h-1.5 transition-all duration-300 ${
            s === current ? "w-8 bg-gold" : s < current ? "w-4 bg-gold/60" : "w-4 bg-ivory/20"
          }`}
        />
      ))}
    </div>
  );
}

function StepLayout({ step, title, subtitle, children }) {
  const { t } = useLanguage();
  return (
    <PageShell links={[{ to: "/login", label: t("navbar.login") }]}>
      <PageHero title={title} subtitle={subtitle}>
        {step && <StepDots current={step} />}
      </PageHero>

      <div className="container relative mx-auto -mt-10 max-w-lg px-4 pb-20 sm:px-6 sm:pb-28">
        <Reveal>
          <div className="border border-gold/25 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,0,0,.5)] sm:p-10">
            {children}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────
//  STEP 1 — Forgot Password (request OTP)
// ─────────────────────────────────────────────

function ForgotPasswordPage({ onSuccess }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const validate = () => {
    if (!email.trim()) return t("passwordReset.step1.errorRequired");
    if (!/\S+@\S+\.\S+/.test(email)) return t("passwordReset.step1.errorInvalid");
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFieldError(err); return; }
    setFieldError("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || t("passwordReset.step1.genericError"));
      }
      onSuccess(email);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout step={1} title={t("passwordReset.step1.title")} subtitle={t("passwordReset.step1.subtitle")}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <AlertBanner>{error}</AlertBanner>}

        <Field id="reset-email" label={t("passwordReset.step1.emailLabel")} error={fieldError}>
          <InputIcon icon={Mail} ltr>
            <input
              id="reset-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
              placeholder={t("passwordReset.step1.emailPlaceholder")}
              disabled={loading}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? "reset-email-error" : undefined}
              className={`${inputCls} pe-11 text-start disabled:opacity-60`}
            />
          </InputIcon>
        </Field>

        <NButton type="submit" variant="gold" disabled={loading} className={SUBMIT_CLS}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t("passwordReset.step1.submitButton")}
        </NButton>

        <p className="border-t border-gold/25 pt-6 text-center text-sm text-green-deep/60">
          {t("passwordReset.step1.rememberedText")}{" "}
          <Link to="/login" className="font-bold text-gold-deep transition-colors hover:text-green-deep">
            {t("passwordReset.step1.backToLogin")}
          </Link>
        </p>
      </form>
    </StepLayout>
  );
}

// ─────────────────────────────────────────────
//  STEP 2 — OTP input with individual cells
// ─────────────────────────────────────────────

function OtpCell({ value, inputRef, onChange, onKeyDown, onPaste, disabled, invalid, label }) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      disabled={disabled}
      aria-label={label}
      aria-invalid={invalid ? true : undefined}
      className="size-11 rounded-sm border border-gold/40 bg-ivory text-center font-display text-xl tabular-nums text-green-deep caret-transparent outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/40 disabled:opacity-50 aria-[invalid=true]:border-algeria-red sm:h-16 sm:w-14"
    />
  );
}

function VerifyOtpPage({ email, onSuccess, onBack }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(null); // "rate_limit" | "invalid" | null

  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t2 = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t2);
  }, [resendCooldown]);

  useEffect(() => {
    if (submitCooldown <= 0) return;
    const t2 = setTimeout(() => {
      setSubmitCooldown((c) => {
        if (c <= 1) {
          setError("");
          setErrorType(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearTimeout(t2);
  }, [submitCooldown]);

  const focusAt = (i) => inputRefs.current[i]?.focus();

  const handleChange = (i, val) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    if (errorType !== "rate_limit") {
      setError("");
      setErrorType(null);
    }
    if (char && i < 5) focusAt(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        focusAt(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focusAt(i - 1);
    if (e.key === "ArrowRight" && i < 5) focusAt(i + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    focusAt(Math.min(pasted.length, 5));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (submitCooldown > 0) return;

    const otp = digits.join("");
    if (otp.length < 6) {
      setErrorType("invalid");
      setError(t("passwordReset.step2.incompleteOtp"));
      return;
    }

    setError("");
    setErrorType(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retryAfter =
          Number(data.retryAfter) || parseInt(res.headers.get("Retry-After")) || 120;

        setErrorType("rate_limit");
        setError("rate_limit");
        setSubmitCooldown(retryAfter);
        setDigits(Array(6).fill(""));
        focusAt(0);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorType("invalid");
        setError(data.message || t("passwordReset.step2.invalidOtp"));
        setDigits(Array(6).fill(""));
        focusAt(0);
        return;
      }

      onSuccess(data.resetToken);
    } catch {
      setErrorType("invalid");
      setError(t("passwordReset.step2.connectionError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setError("");
    setErrorType(null);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retryAfter =
          Number(data.retryAfter) || parseInt(res.headers.get("Retry-After")) || 900;

        setErrorType("rate_limit");
        setError("resend_rate_limit");
        setResendCooldown(retryAfter);
        return;
      }

      setResendCooldown(60);
      setDigits(Array(6).fill(""));
      setSubmitCooldown(0);
      focusAt(0);
    } finally {
      setResending(false);
    }
  };

  const isSubmitBlocked = submitCooldown > 0;
  const otpComplete = digits.join("").length === 6;
  const plainError = error && error !== "rate_limit" && error !== "resend_rate_limit";

  return (
    <StepLayout step={2} title={t("passwordReset.step2.title")} subtitle={t("passwordReset.step2.subtitleSentTo")}>
      <p
        dir="ltr"
        className="mb-3 break-all border border-gold/40 bg-gold/10 px-4 py-2.5 text-center text-sm font-bold text-gold-deep"
      >
        {email}
      </p>
      <p className="mb-8 text-center text-xs leading-6 text-green-deep/60">{t("passwordReset.step2.spamNotice")}</p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-4">
          {error === "rate_limit" && (
            <AlertBanner title={t("passwordReset.step2.rateLimitTitle")}>
              {submitCooldown > 0 && (
                <span className="tabular-nums">
                  {t("passwordReset.step2.rateLimitWait", { seconds: submitCooldown })}
                </span>
              )}
            </AlertBanner>
          )}

          {error === "resend_rate_limit" && (
            <AlertBanner tone="warning" title={t("passwordReset.step2.resendRateLimitTitle")}>
              <span className="tabular-nums">
                {Math.floor(resendCooldown / 60) > 0
                  ? t("passwordReset.step2.resendRateLimitWaitMinutes", {
                      minutes: Math.floor(resendCooldown / 60),
                      seconds: resendCooldown % 60,
                    })
                  : t("passwordReset.step2.resendRateLimitWait", { seconds: resendCooldown })}
              </span>
            </AlertBanner>
          )}

          {plainError && <AlertBanner>{error}</AlertBanner>}
        </div>

        <p className="mb-3 mt-5 text-sm font-bold text-green-deep">{t("passwordReset.step2.otpLabel")}</p>

        <div
          dir="ltr"
          role="group"
          aria-label={t("passwordReset.step2.otpLabel")}
          className={`mb-6 flex justify-between gap-1.5 transition-opacity sm:gap-2 ${isSubmitBlocked ? "opacity-50" : ""}`}
        >
          {digits.map((d, i) => (
            <OtpCell
              key={i}
              value={d}
              label={`${t("passwordReset.step2.otpLabel")} ${i + 1}`}
              inputRef={(el) => (inputRefs.current[i] = el)}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={isSubmitBlocked}
              invalid={isSubmitBlocked || errorType === "invalid"}
            />
          ))}
        </div>

        <NButton
          type="submit"
          variant="gold"
          disabled={loading || isSubmitBlocked || !otpComplete}
          className={SUBMIT_CLS}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("passwordReset.step2.verifying")}
            </>
          ) : isSubmitBlocked ? (
            <span className="tabular-nums">{t("passwordReset.step2.waitSeconds", { seconds: submitCooldown })}</span>
          ) : (
            t("passwordReset.step2.verifyButton")
          )}
        </NButton>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gold/25 pt-6 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 font-bold text-green-deep/60 transition-colors hover:text-green-deep"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          {t("passwordReset.step2.changeEmail")}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="font-bold tabular-nums text-gold-deep transition-colors hover:text-green-deep disabled:cursor-default disabled:text-green-deep/40"
        >
          {resending
            ? t("passwordReset.step2.resending")
            : resendCooldown > 0
            ? resendCooldown > 60
              ? t("passwordReset.step2.resendInMinutes", {
                  minutes: Math.floor(resendCooldown / 60),
                  seconds: String(resendCooldown % 60).padStart(2, "0"),
                })
              : t("passwordReset.step2.resendIn", { seconds: resendCooldown })
            : t("passwordReset.step2.resendButton")}
        </button>
      </div>
    </StepLayout>
  );
}

// ─────────────────────────────────────────────
//  STEP 3 — Set new password
// ─────────────────────────────────────────────

function PasswordStrengthBar({ password }) {
  const { t } = useLanguage();
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = [
    "",
    t("passwordReset.step3.strengthWeak"),
    t("passwordReset.step3.strengthFair"),
    t("passwordReset.step3.strengthGood"),
    t("passwordReset.step3.strengthStrong"),
  ];
  const barColors = ["bg-sand", "bg-algeria-red", "bg-gold", "bg-green-deep/60", "bg-green-deep"];
  const textColors = ["text-green-deep/40", "text-algeria-red", "text-gold-deep", "text-green-deep/80", "text-green-deep"];

  return (
    <div>
      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 transition-colors duration-300 ${i <= score ? barColors[score] : "bg-sand"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-bold ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
}

function ResetPasswordPage({ resetToken, onSuccess }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const toggleLabel = t("passwordReset.step3.togglePassword") || "Show / hide password";

  const validate = () => {
    const errs = {};
    if (!password) errs.password = t("passwordReset.step3.errorPasswordRequired");
    else if (password.length < 8) errs.password = t("passwordReset.step3.errorPasswordLength");
    if (!confirm) errs.confirm = t("passwordReset.step3.errorConfirmRequired");
    else if (password !== confirm) errs.confirm = t("passwordReset.step3.errorPasswordMismatch");
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword: password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || t("passwordReset.step3.genericError"));
      onSuccess();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout step={3} title={t("passwordReset.step3.title")} subtitle={t("passwordReset.step3.subtitle")}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <AlertBanner>{error}</AlertBanner>}

        <Field id="new-password" label={t("passwordReset.step3.newPasswordLabel")} error={fieldErrors.password}>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
            placeholder={t("passwordReset.step3.passwordPlaceholder")}
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "new-password-error" : undefined}
            toggleLabel={toggleLabel}
          />
        </Field>

        <PasswordStrengthBar password={password} />

        <Field id="confirm-password" label={t("passwordReset.step3.confirmLabel")} error={fieldErrors.confirm}>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setFieldErrors((f) => ({ ...f, confirm: "" })); }}
            placeholder={t("passwordReset.step3.confirmPlaceholder")}
            disabled={loading}
            aria-invalid={fieldErrors.confirm ? true : undefined}
            aria-describedby={fieldErrors.confirm ? "confirm-password-error" : undefined}
            toggleLabel={toggleLabel}
          />
        </Field>

        <NButton type="submit" variant="gold" disabled={loading} className={SUBMIT_CLS}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {t("passwordReset.step3.submitButton")}
        </NButton>
      </form>
    </StepLayout>
  );
}

// ─────────────────────────────────────────────
//  Success screen
// ─────────────────────────────────────────────

function SuccessPage() {
  const { t } = useLanguage();
  return (
    <StepLayout title={t("passwordReset.success.title")} subtitle={t("passwordReset.success.subtitle")}>
      <div className="text-center">
        <span className="mx-auto mb-8 grid size-16 place-items-center rounded-sm bg-green-deep text-gold">
          <CheckCircle2 className="size-8" strokeWidth={1.5} />
        </span>
        <NButton to="/login" variant="green" className="w-full">
          {t("passwordReset.success.goToLogin")}
        </NButton>
      </div>
    </StepLayout>
  );
}

// ─────────────────────────────────────────────
//  Root — orchestrates the 3-step flow
// ─────────────────────────────────────────────

export default function PasswordResetFlow() {
  const [step, setStep] = useState(1); // 1 | 2 | 3 | "done"
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  if (step === "done") return <SuccessPage />;

  if (step === 3)
    return <ResetPasswordPage resetToken={resetToken} onSuccess={() => setStep("done")} />;

  if (step === 2)
    return (
      <VerifyOtpPage
        email={email}
        onSuccess={(token) => { setResetToken(token); setStep(3); }}
        onBack={() => setStep(1)}
      />
    );

  return <ForgotPasswordPage onSuccess={(e) => { setEmail(e); setStep(2); }} />;
}