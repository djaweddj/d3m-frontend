import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext"; // ← adjust path to your actual file

const API_BASE = import.meta.env.VITE_API_URL; // ← change to your base URL

// ─────────────────────────────────────────────
//  Shared UI atoms
// ─────────────────────────────────────────────

function Card({ children }) {
  const { dir } = useLanguage();
  return (
    <div
      dir={dir}
      className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#0F5A46]/10 p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Logo() {
  const { t } = useLanguage();
  return (
    <Link to="/" className="flex items-center gap-2 mb-6 sm:mb-8 w-fit">
      <div className="w-8 h-8 rounded-lg bg-[#0F5A46] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <span className="font-semibold text-[#0F5A46] tracking-tight text-sm">
        Numeria Academy
      </span>
    </Link>
  );
}

function Button({ children, loading, disabled, onClick, variant = "primary" }) {
  const base = "w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-[#0F5A46] hover:bg-[#0c4a3a] active:bg-[#0a3f31] text-white shadow-sm shadow-[#0F5A46]/20 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-[#0F5A46] hover:bg-[#0F5A46]/5 border border-[#0F5A46]/25 disabled:opacity-50",
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant]}`}>
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, disabled, autoFocus, error }) {
  return (
    <div className="mb-5">
      {label && <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full px-4 py-3 rounded-xl border text-slate-800 text-sm placeholder-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-[#0F5A46] focus:border-[#0F5A46] disabled:bg-slate-50 disabled:text-slate-400
          ${error ? "border-[#C53030] focus:ring-[#C53030] focus:border-[#C53030]" : "border-slate-200"}`}
      />
      {error && <p className="mt-1.5 text-xs text-[#C53030]">{error}</p>}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    error: "bg-[#C53030]/5 border-[#C53030]/20 text-[#C53030]",
    success: "bg-[#0F5A46]/5 border-[#0F5A46]/20 text-[#0F5A46]",
    info: "bg-[#C8A24B]/10 border-[#C8A24B]/30 text-[#8a6d2f]",
  };
  const icons = {
    error: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" />
      </svg>
    ),
    success: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" />
      </svg>
    ),
  };
  return (
    <div className={`flex gap-2.5 border rounded-xl px-4 py-3 text-sm mb-5 ${styles[type]}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Step indicator
// ─────────────────────────────────────────────

function StepDots({ current }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s === current ? "w-6 bg-[#0F5A46]" : s < current ? "w-3 bg-[#C8A24B]" : "w-3 bg-slate-200"
          }`}
        />
      ))}
    </div>
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

  const handleSubmit = async () => {
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Logo />
      <StepDots current={1} />
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {t("passwordReset.step1.title")}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {t("passwordReset.step1.subtitle")}
      </p>
      <Alert type="error" message={error} />
      <Input
        label={t("passwordReset.step1.emailLabel")}
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
        placeholder={t("passwordReset.step1.emailPlaceholder")}
        autoFocus
        error={fieldError}
        disabled={loading}
      />
      <Button loading={loading} onClick={handleSubmit}>
        {t("passwordReset.step1.submitButton")}
      </Button>
      <p className="text-center text-sm text-slate-400 mt-5">
        {t("passwordReset.step1.rememberedText")}{" "}
        <Link to="/login" className="text-[#0F5A46] hover:underline font-medium">
          {t("passwordReset.step1.backToLogin")}
        </Link>
      </p>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Step 2 — OTP input with individual cells
// ─────────────────────────────────────────────

function OtpCell({ value, inputRef, onChange, onKeyDown, onPaste, disabled, invalid }) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      disabled={disabled}
      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border-2 text-slate-800 bg-white outline-none focus:border-[#0F5A46] focus:ring-2 focus:ring-[#0F5A46]/10 transition-all caret-transparent disabled:opacity-50
        ${invalid ? "border-[#C53030]/60" : "border-slate-200"}`}
    />
  );
}

function VerifyOtpPage({ email, onSuccess, onBack }) {
  const { t, dir } = useLanguage();
  const [digits,         setDigits]         = useState(Array(6).fill(""));
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [errorType,      setErrorType]      = useState(null);   // "rate_limit" | "resend_rate_limit" | "invalid" | null

  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending,      setResending]      = useState(false);
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
    if (e.key === "ArrowLeft"  && i > 0) focusAt(i - 1);
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

  const handleSubmit = async () => {
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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, otp }),
      });

      if (res.status === 429) {
        const data       = await res.json().catch(() => ({}));
        const retryAfter = data.retryAfter
          ?? parseInt(res.headers.get("Retry-After"))
          ?? 120;

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
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const data       = await res.json().catch(() => ({}));
        const retryAfter = data.retryAfter
          ?? parseInt(res.headers.get("Retry-After"))
          ?? 900;

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
  const otpComplete     = digits.join("").length === 6;
  const backArrow       = dir === "rtl" ? "→" : "←";

  return (
    <Card>
      <Logo />
      <StepDots current={2} />

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {t("passwordReset.step2.title")}
      </h1>
      <p className="text-sm text-slate-500 mb-1">
        {t("passwordReset.step2.subtitleSentTo")}
      </p>
      <p className="text-sm font-semibold text-[#0F5A46] mb-1 break-all">
        {email}
      </p>
      <p className="text-sm text-slate-400 mb-6">
        {t("passwordReset.step2.spamNotice")}
      </p>

      {error === "rate_limit" && (
        <div className="bg-[#C53030]/5 border border-[#C53030]/20 rounded-xl px-4 py-3 mb-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base">⛔</span>
            <span className="text-[13px] font-bold text-[#C53030]">
              {t("passwordReset.step2.rateLimitTitle")}
            </span>
          </div>
          {submitCooldown > 0 && (
            <p className="text-xs text-[#C53030]/90 m-0 pe-6">
              {t("passwordReset.step2.rateLimitWait", { seconds: submitCooldown })}
            </p>
          )}
        </div>
      )}

      {error === "resend_rate_limit" && (
        <div className="bg-[#C8A24B]/10 border border-[#C8A24B]/30 rounded-xl px-4 py-3 mb-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span className="text-[13px] font-bold text-[#8a6d2f]">
              {t("passwordReset.step2.resendRateLimitTitle")}
            </span>
          </div>
          <p className="text-xs text-[#8a6d2f] m-0 pe-6">
            {Math.floor(resendCooldown / 60) > 0
              ? t("passwordReset.step2.resendRateLimitWaitMinutes", {
                  minutes: Math.floor(resendCooldown / 60),
                  seconds: resendCooldown % 60,
                })
              : t("passwordReset.step2.resendRateLimitWait", { seconds: resendCooldown })}
          </p>
        </div>
      )}

      {error && error !== "rate_limit" && error !== "resend_rate_limit" && (
        <Alert type="error" message={error} />
      )}

      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {t("passwordReset.step2.otpLabel")}
      </label>

      <div
        dir="ltr"
        className="flex gap-1.5 sm:gap-2 justify-between mb-6"
        style={{ opacity: isSubmitBlocked ? 0.5 : 1, transition: "opacity .3s" }}
      >
        {digits.map((d, i) => (
          <OtpCell
            key={i}
            value={d}
            inputRef={(el) => (inputRefs.current[i] = el)}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={isSubmitBlocked}
            invalid={isSubmitBlocked || errorType === "invalid"}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || isSubmitBlocked || !otpComplete}
        className="w-full h-12 rounded-xl border-none text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        style={{
          background: isSubmitBlocked ? "#94a3b8" : !otpComplete ? "#cbd5e1" : "#0F5A46",
          cursor: loading || isSubmitBlocked || !otpComplete ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <>
            <span
              className="w-4 h-4 rounded-full inline-block"
              style={{
                border: "2px solid rgba(255,255,255,.4)",
                borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {t("passwordReset.step2.verifying")}
          </>
        ) : isSubmitBlocked ? (
          t("passwordReset.step2.waitSeconds", { seconds: submitCooldown })
        ) : (
          t("passwordReset.step2.verifyButton")
        )}
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-5 text-[13px]">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer transition-colors"
        >
          {backArrow} {t("passwordReset.step2.changeEmail")}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="bg-transparent border-none font-semibold text-[13px] transition-colors"
          style={{
            cursor: resendCooldown > 0 || resending ? "default" : "pointer",
            color: resendCooldown > 0 || resending ? "#94a3b8" : "#0F5A46",
          }}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Step 3 — Set new password
// ─────────────────────────────────────────────

function PasswordStrengthBar({ password }) {
  const { t } = useLanguage();
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", t("passwordReset.step3.strengthWeak"), t("passwordReset.step3.strengthFair"), t("passwordReset.step3.strengthGood"), t("passwordReset.step3.strengthStrong")];
  const barColors = ["bg-slate-200", "bg-[#C53030]", "bg-[#C8A24B]", "bg-[#0F5A46]/60", "bg-[#0F5A46]"];
  const textColors = ["text-slate-400", "text-[#C53030]", "text-[#8a6d2f]", "text-[#0F5A46]/80", "text-[#0F5A46]"];
  if (!password) return null;
  return (
    <div className="mb-5">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? barColors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>
        {password ? labels[score] : ""}
      </p>
    </div>
  );
}

function ResetPasswordPage({ resetToken, onSuccess }) {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!password) errs.password = t("passwordReset.step3.errorPasswordRequired");
    else if (password.length < 8) errs.password = t("passwordReset.step3.errorPasswordLength");
    if (!confirm) errs.confirm = t("passwordReset.step3.errorConfirmRequired");
    else if (password !== confirm) errs.confirm = t("passwordReset.step3.errorPasswordMismatch");
    return errs;
  };

  const handleSubmit = async () => {
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Logo />
      <StepDots current={3} />
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {t("passwordReset.step3.title")}
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        {t("passwordReset.step3.subtitle")}
      </p>
      <Alert type="error" message={error} />

      <div className="mb-0">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {t("passwordReset.step3.newPasswordLabel")}
        </label>
        <div className="relative mb-1.5">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
            placeholder={t("passwordReset.step3.passwordPlaceholder")}
            autoFocus
            className={`w-full px-4 py-3 rtl:pl-11 ltr:pr-11 rounded-xl border text-slate-800 text-sm placeholder-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-[#0F5A46] focus:border-[#0F5A46]
              ${fieldErrors.password ? "border-[#C53030] focus:ring-[#C53030] focus:border-[#C53030]" : "border-slate-200"}`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPw ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.09C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.28 2.22zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .817 0 1.612-.09 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && <p className="text-xs text-[#C53030] mb-1">{fieldErrors.password}</p>}
      </div>

      <PasswordStrengthBar password={password} />

      <Input
        label={t("passwordReset.step3.confirmLabel")}
        type="password"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setFieldErrors((f) => ({ ...f, confirm: "" })); }}
        placeholder={t("passwordReset.step3.confirmPlaceholder")}
        error={fieldErrors.confirm}
        disabled={loading}
      />

      <Button loading={loading} onClick={handleSubmit}>
        {t("passwordReset.step3.submitButton")}
      </Button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Success screen
// ─────────────────────────────────────────────

function SuccessPage() {
  const { t } = useLanguage();
  return (
    <Card>
      <Logo />
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#0F5A46]/10 flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-[#0F5A46]" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          {t("passwordReset.success.title")}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {t("passwordReset.success.subtitle")}
        </p>
        <Link
          to="/login"
          className="inline-block w-full py-3 px-4 rounded-xl bg-[#0F5A46] hover:bg-[#0c4a3a] text-white font-medium text-sm text-center transition-colors shadow-sm shadow-[#0F5A46]/20"
        >
          {t("passwordReset.success.goToLogin")}
        </Link>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Root — orchestrates the 3-step flow
// ─────────────────────────────────────────────

export default function PasswordResetFlow() {
  const [step, setStep] = useState(1);         // 1 | 2 | 3 | "done"
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  if (step === "done") return <SuccessPage />;

  if (step === 3)
    return (
      <ResetPasswordPage
        resetToken={resetToken}
        onSuccess={() => setStep("done")}
      />
    );

  if (step === 2)
    return (
      <VerifyOtpPage
        email={email}
        onSuccess={(token) => { setResetToken(token); setStep(3); }}
        onBack={() => setStep(1)}
      />
    );

  return (
    <ForgotPasswordPage
      onSuccess={(e) => { setEmail(e); setStep(2); }}
    />
  );
}