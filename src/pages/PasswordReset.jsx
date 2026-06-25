import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL; // ← change to your base URL

// ─────────────────────────────────────────────
//  Shared UI atoms
// ─────────────────────────────────────────────

function Card({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-blue-100 p-8">
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <span className="font-semibold text-slate-700 tracking-tight text-sm">School SaaS</span>
    </div>
  );
}

function Button({ children, loading, disabled, onClick, variant = "primary" }) {
  const base = "w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2";
  const styles = {
    primary: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed",
    ghost: "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 disabled:opacity-50",
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
        className={`w-full px-4 py-3 rounded-xl border text-slate-800 text-sm placeholder-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400
          ${error ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "border-slate-200"}`}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-green-50 border-green-200 text-green-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
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
          className={`h-1.5 rounded-full transition-all duration-300 ${s === current ? "w-6 bg-blue-600" : s < current ? "w-3 bg-blue-300" : "w-3 bg-slate-200"}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  STEP 1 — Forgot Password (request OTP)
// ─────────────────────────────────────────────

function ForgotPasswordPage({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");

  const validate = () => {
    if (!email.trim()) return "Please enter your email address.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
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
        throw new Error(data.message || "Something went wrong.");
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
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Forgot your password?</h1>
      <p className="text-sm text-slate-500 mb-6">Enter your account email and we'll send you a 6-digit code.</p>
      <Alert type="error" message={error} />
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
        placeholder="you@school.dz"
        autoFocus
        error={fieldError}
        disabled={loading}
      />
      <Button loading={loading} onClick={handleSubmit}>Send OTP code</Button>
      <p className="text-center text-sm text-slate-400 mt-5">
        Remembered it?{" "}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">Back to login</Link>
      </p>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Step 2 — OTP input with individual cells
// ─────────────────────────────────────────────

function OtpCell({ value, inputRef, onChange, onKeyDown, onPaste }) {
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
      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all caret-transparent"
    />
  );
}

function VerifyOtpPage({ email, onSuccess, onBack }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const focusAt = (i) => inputRefs.current[i]?.focus();

  const handleChange = (i, val) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError("");
    if (char && i < 5) focusAt(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; setDigits(next);
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

  const handleSubmit = async () => {
    const otp = digits.join("");
    if (otp.length < 6) { setError("Enter all 6 digits of your code."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      onSuccess(data.resetToken);
    } catch (e) {
      setError(e.message);
      setDigits(Array(6).fill(""));
      focusAt(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError("");
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendCooldown(60);
      setDigits(Array(6).fill(""));
      focusAt(0);
    } finally {
      setResending(false);
    }
  };

  return (
    <Card>
      <Logo />
      <StepDots current={2} />
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Check your inbox</h1>
      <p className="text-sm text-slate-500 mb-1">
        We sent a 6-digit code to
      </p>
      <p className="text-sm font-semibold text-blue-600 mb-6 break-all">{email} </p>
        <p className="text-sm text-slate-500 mb-1">
       check your spam !
      </p>

      <Alert type="error" message={error} />

      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Verification code</label>
      <div className="flex gap-2 justify-between mb-6">
        {digits.map((d, i) => (
          <OtpCell
            key={i}
            value={d}
            inputRef={(el) => (inputRefs.current[i] = el)}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
          />
        ))}
      </div>

      <Button loading={loading} onClick={handleSubmit} disabled={digits.join("").length < 6}>Verify code</Button>

      <div className="flex items-center justify-between mt-5 text-sm">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">← Change email</button>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-default transition-colors font-medium"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Step 3 — Set new password
// ─────────────────────────────────────────────

function PasswordStrengthBar({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-slate-200", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];
  if (!password) return null;
  return (
    <div className="mb-5">
      <div className="flex gap-1 mb-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? colors[score] : "bg-slate-200"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${["text-slate-400", "text-red-500", "text-yellow-600", "text-blue-500", "text-green-600"][score]}`}>
        {password ? labels[score] : ""}
      </p>
    </div>
  );
}

function ResetPasswordPage({ resetToken, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!password) errs.password = "Enter a new password.";
    else if (password.length < 8) errs.password = "Must be at least 8 characters.";
    if (!confirm) errs.confirm = "Please confirm your password.";
    else if (password !== confirm) errs.confirm = "Passwords don't match.";
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
      if (!res.ok) throw new Error(data.message || "Could not reset password.");
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
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Set a new password</h1>
      <p className="text-sm text-slate-500 mb-6">Choose something strong — at least 8 characters.</p>
      <Alert type="error" message={error} />

      <div className="mb-0">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">New password</label>
        <div className="relative mb-1.5">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: "" })); }}
            placeholder="Min. 8 characters"
            autoFocus
            className={`w-full px-4 py-3 pr-11 rounded-xl border text-slate-800 text-sm placeholder-slate-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${fieldErrors.password ? "border-red-400 focus:ring-red-400 focus:border-red-400" : "border-slate-200"}`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
        {fieldErrors.password && <p className="text-xs text-red-500 mb-1">{fieldErrors.password}</p>}
      </div>

      <PasswordStrengthBar password={password} />

      <Input
        label="Confirm password"
        type="password"
        value={confirm}
        onChange={(e) => { setConfirm(e.target.value); setFieldErrors((f) => ({ ...f, confirm: "" })); }}
        placeholder="Repeat your password"
        error={fieldErrors.confirm}
        disabled={loading}
      />

      <Button loading={loading} onClick={handleSubmit}>Reset password</Button>
    </Card>
  );
}

// ─────────────────────────────────────────────
//  Success screen
// ─────────────────────────────────────────────

function SuccessPage() {
  return (
    <Card>
      <Logo />
      <div className="flex flex-col items-center text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-green-600" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Password updated!</h1>
        <p className="text-sm text-slate-500 mb-8">Your password has been changed. You can now log in with your new credentials.</p>
        <Link
          to="/login"
          className="inline-block w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm text-center transition-colors shadow-sm shadow-blue-200"
        >
          Go to login
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