import { useState, useRef, useEffect } from "react";
import { Upload, School, Save, Loader2, X, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import api, { uploadSchoolLogo } from "../api";
import { toast } from "sonner";
import { useSchool } from "../context/SchoolContext";

// Keep these in sync with the backend's FileValidator
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/svg+xml"];

const BRAND = "#185FA5";

export default function Settings() {
  const { t, dir } = useLanguage();

  // useAuth gives: { user, school, updateSchool }
  const { user, updateSchool } = useAuth();
  const { school } = useSchool();

  const changePassword = (data) =>
    api.put("/auth/change-password", data);

  // ── Logo upload state — driven by the backend ──
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState(null); // temp blob preview while uploading
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);

  const logoUrl = localPreview ?? school?.logoUrl ?? null;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("settings.logo.toasts.invalidFormat"));
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("settings.logo.toasts.fileTooLarge"));
      return false;
    }
    return true;
  };

  const processFile = async (file) => {
    if (!file) return;
    if (!validateFile(file)) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setUploading(true);
    setUploadProgress(0);

    try {
      const res = await uploadSchoolLogo(file, setUploadProgress);
      const updatedLogoUrl = res.data.logoUrl;

      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      updateSchool?.({ logoUrl: updatedLogoUrl });

      toast.success(t("settings.logo.toasts.uploadSuccess"));
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);

      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.error;

      if (status === 413) {
        toast.error(t("settings.logo.toasts.tooLarge413"));
      } else if (status === 400) {
        toast.error(serverMessage || t("settings.logo.toasts.invalidFile400"));
      } else if (status === 401 || status === 403) {
        toast.error(t("settings.logo.toasts.unauthorized"));
      } else {
        toast.error(t("settings.logo.toasts.uploadFailedGeneric"));
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const removeLogo = () => {
    // NOTE: this only clears local UI state. For real deletion on the backend
    // (removing the Cloudinary asset + clearing logoUrl), wire this to a
    // DELETE /schools/logo endpoint instead.
    toast.info(t("settings.logo.toasts.removeInfo"));
  };

  const schoolName = school?.schoolName ?? user?.fullName ?? t("settings.logo.schoolFallback");

  return (
    <div dir={dir} style={{ padding: "1.25rem", fontFamily: "'Cairo', sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>

      {/* Page title */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("settings.pageTitle")}</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 3, margin: 0 }}>
          {t("settings.pageSubtitle")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" }}>

        <LogoCard
          schoolName={schoolName}
          logoUrl={logoUrl}
          uploading={uploading}
          uploadProgress={uploadProgress}
          dragActive={dragActive}
          setDragActive={setDragActive}
          fileRef={fileRef}
          onFile={handleFile}
          onDrop={handleDrop}
          onRemove={removeLogo}
        />

        <PasswordCard changePassword={changePassword} />

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── Logo card ───────────────────────── */

function LogoCard({
  schoolName, logoUrl, uploading, uploadProgress,
  dragActive, setDragActive, fileRef, onFile, onDrop, onRemove,
}) {
  const { t } = useLanguage();

  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #E8EEF6",
      padding: "1.4rem", boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: `${BRAND}14`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <School size={15} color={BRAND} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("settings.logo.title")}</p>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{t("settings.logo.subtitle")}</p>
        </div>
      </div>

      {/* Current logo preview strip */}
      <div style={{
        marginTop: 16, display: "flex", alignItems: "center", gap: 12,
        background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)", borderRadius: 12,
        padding: "14px 14px", border: "1px solid #E8EEF6",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: logoUrl ? "#fff" : BRAND,
          border: logoUrl ? "1px solid #E8EEF6" : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", boxShadow: logoUrl ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt={t("settings.logo.altText")} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <School size={22} color="#fff" />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {schoolName}
          </p>
          <p style={{ fontSize: 10.5, color: "#94A3B8", margin: 0 }}>
            {logoUrl ? t("settings.logo.currentLogo") : t("settings.logo.noLogoYet")}
          </p>
        </div>
        {logoUrl && !uploading && (
          <button
            onClick={onRemove}
            title={t("settings.logo.removeTitle")}
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: "#fff", border: "1px solid #FECACA", color: "#DC2626",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropzone */}
      <button
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        disabled={uploading}
        style={{
          width: "100%", marginTop: 12, borderRadius: 12, padding: "1.6rem 0",
          border: `2px dashed ${dragActive ? BRAND : "#E2E8F0"}`,
          background: dragActive ? `${BRAND}0A` : "transparent",
          cursor: uploading ? "not-allowed" : "pointer", textAlign: "center",
          transition: "border-color .15s, background .15s",
          opacity: uploading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => { if (!uploading && !dragActive) { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.background = `${BRAND}0A`; } }}
        onMouseLeave={(e) => { if (!dragActive) { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "transparent"; } }}
      >
        {uploading ? (
          <>
            <Loader2 size={24} color={BRAND} style={{ margin: "0 auto 8px", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 12, color: BRAND, margin: 0, fontWeight: 700 }}>
              {t("settings.logo.dropzoneUploading", { percent: uploadProgress })}
            </p>
            <div style={{ width: "60%", margin: "10px auto 0", height: 5, borderRadius: 4, background: "#E8EEF6", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uploadProgress}%`, background: BRAND, transition: "width .2s ease", borderRadius: 4 }} />
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: "#F1F5F9",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
            }}>
              <Upload size={18} color="#94A3B8" />
            </div>
            <p style={{ fontSize: 12.5, color: "#334155", margin: 0, fontWeight: 600 }}>{t("settings.logo.dropzoneIdleTitle")}</p>
            <p style={{ fontSize: 10.5, color: "#CBD5E1", margin: "3px 0 0" }}>{t("settings.logo.dropzoneHint")}</p>
          </>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/svg+xml"
        style={{ display: "none" }}
        onChange={onFile}
        disabled={uploading}
      />
    </div>
  );
}

/* ───────────────────────── Password card ───────────────────────── */

function PasswordField({ label, value, onChange, show, toggleShow, placeholder, error }) {
  return (
    <div>
      <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          style={{
            width: "100%", boxSizing: "border-box", fontFamily: "inherit",
            padding: "10px 40px 10px 12px", borderRadius: 10, fontSize: 12.5,
            border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`,
            outline: "none", color: "#0F172A", background: "#F8FAFC",
            transition: "border-color .15s, background .15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = error ? "#FCA5A5" : BRAND; e.currentTarget.style.background = "#fff"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#FCA5A5" : "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; }}
        />
        <button
          type="button"
          onClick={toggleShow}
          tabIndex={-1}
          style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#94A3B8",
            display: "flex", padding: 2,
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p style={{ fontSize: 10.5, color: "#DC2626", margin: "5px 0 0" }}>{error}</p>}
    </div>
  );
}

function PasswordCard({ changePassword }) {
  const { t } = useLanguage();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const MIN_LEN = 8;

  const strength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= MIN_LEN) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score; // 0..4
  })();

  const strengthMeta = [
    { label: t("settings.password.strength.veryWeak"), color: "#DC2626" },
    { label: t("settings.password.strength.weak"), color: "#DC2626" },
    { label: t("settings.password.strength.medium"), color: "#D97706" },
    { label: t("settings.password.strength.good"), color: "#059669" },
    { label: t("settings.password.strength.strong"), color: "#059669" },
  ][strength];

  const validate = () => {
    const next = {};
    if (!oldPassword) next.oldPassword = t("settings.password.errors.oldRequired");
    if (!newPassword) {
      next.newPassword = t("settings.password.errors.newRequired");
    } else if (newPassword.length < MIN_LEN) {
      next.newPassword = t("settings.password.errors.newTooShort", { min: MIN_LEN });
    } else if (newPassword === oldPassword) {
      next.newPassword = t("settings.password.errors.newSameAsOld");
    }
    if (!confirmPassword) {
      next.confirmPassword = t("settings.password.errors.confirmRequired");
    } else if (confirmPassword !== newPassword) {
      next.confirmPassword = t("settings.password.errors.confirmMismatch");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Expected to POST/PUT to /auth/change-password with
      // { oldPassword, newPassword } and return 200 on success —
      // matches ChangePassword DTO + AuthController#changePassword.
      await changePassword({ oldPassword, newPassword });
      toast.success(t("settings.password.successToast"));
      reset();
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = typeof err?.response?.data === "string" ? err.response.data : err?.response?.data?.error;

      if (status === 400) {
        // Backend returns "Old password is incorrect" as plain text on 400
        setErrors({ oldPassword: t("settings.password.errors.wrongOldPassword") });
      } else if (status === 401) {
        toast.error(t("settings.password.errors.sessionExpired"));
      } else {
        toast.error(serverMessage || t("settings.password.errors.genericError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: "1px solid #E8EEF6",
      padding: "1.4rem", boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: `${BRAND}14`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Lock size={14} color={BRAND} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>{t("settings.password.title")}</p>
          <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{t("settings.password.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <PasswordField
          label={t("settings.password.currentLabel")}
          value={oldPassword}
          onChange={(e) => { setOldPassword(e.target.value); if (errors.oldPassword) setErrors((p) => ({ ...p, oldPassword: undefined })); }}
          show={showOld}
          toggleShow={() => setShowOld((s) => !s)}
          placeholder={t("settings.password.currentPlaceholder")}
          error={errors.oldPassword}
        />

        <div>
          <PasswordField
            label={t("settings.password.newLabel")}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined })); }}
            show={showNew}
            toggleShow={() => setShowNew((s) => !s)}
            placeholder={t("settings.password.newPlaceholder")}
            error={errors.newPassword}
          />
          {newPassword && (
            <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 8, animation: "fadeSlideIn .15s ease" }}>
              <div style={{ flex: 1, height: 4, borderRadius: 4, background: "#E8EEF6", overflow: "hidden", display: "flex", gap: 3 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 4,
                    background: i < strength ? strengthMeta.color : "#E8EEF6",
                    transition: "background .2s",
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: strengthMeta.color, whiteSpace: "nowrap" }}>
                {strengthMeta.label}
              </span>
            </div>
          )}
        </div>

        <PasswordField
          label={t("settings.password.confirmLabel")}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
          show={showConfirm}
          toggleShow={() => setShowConfirm((s) => !s)}
          placeholder={t("settings.password.confirmPlaceholder")}
          error={errors.confirmPassword}
        />
        {confirmPassword && confirmPassword === newPassword && !errors.confirmPassword && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: -8, animation: "fadeSlideIn .15s ease" }}>
            <CheckCircle2 size={12} color="#059669" />
            <span style={{ fontSize: 10.5, color: "#059669", fontWeight: 600 }}>{t("settings.password.matchLabel")}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10, border: "none", marginTop: 4,
            background: BRAND, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "opacity .15s", opacity: submitting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = ".88"; }}
          onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.opacity = "1"; }}
        >
          {submitting ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
          {submitting ? t("settings.password.submitting") : t("settings.password.submit")}
        </button>
      </form>
    </div>
  );
}