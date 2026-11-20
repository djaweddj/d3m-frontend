import { useState, useRef, useEffect } from "react";
import { Upload, School, Loader2, X, Lock, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import { useSchool } from "../context/SchoolContext";
import api, { uploadSchoolLogo } from "../api";

import NButton from "../components/home/NButton";
import Reveal from "../components/home/Reveal";
import FormSection from "../components/SchoolRegister/FromSection";
import { Field } from "../components/SchoolRegister/FormField";
import PasswordInput from "../components/Enroll/PasswordInput";
import StrengthMeter from "../components/Enroll/StrengthMeter";

// Keep these in sync with the backend's FileValidator
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/png", "image/svg+xml"];

const CARD = "border border-gold/25 bg-white";

export default function Settings() {
  const { t, dir } = useLanguage();

  // useAuth gives: { user, school, updateSchool }
  const { user, updateSchool } = useAuth();
  const { school } = useSchool();

  const changePassword = (data) => api.put("/auth/change-password", data);

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
    <div dir={dir} className="min-h-screen bg-ivory p-4 font-body sm:p-8">
      {/* Page title */}
      <Reveal className="mb-8">
        <h1 className="font-display text-2xl text-green-deep sm:text-3xl">{t("settings.pageTitle")}</h1>
        <p className="mt-2 text-sm text-green-deep/60">{t("settings.pageSubtitle")}</p>
        <span className="nm-rule mt-4 block w-24" />
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Reveal>
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
        </Reveal>

        <Reveal delay={0.1}>
          <PasswordCard changePassword={changePassword} />
        </Reveal>
      </div>
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
    <div className={CARD}>
      <FormSection icon={School} label={t("settings.logo.title")} sub={t("settings.logo.subtitle")}>
        {/* Current logo preview strip */}
        <div className="flex items-center gap-4 border border-gold/25 bg-ivory p-4">
          <span
            className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-sm ${
              logoUrl ? "border border-gold/25 bg-white" : "bg-green-deep text-gold"
            }`}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={t("settings.logo.altText")} className="size-full object-contain" />
            ) : (
              <School className="size-6" strokeWidth={1.5} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-green-deep">{schoolName}</p>
            <p className="mt-0.5 text-xs text-green-deep/60">
              {logoUrl ? t("settings.logo.currentLogo") : t("settings.logo.noLogoYet")}
            </p>
          </div>

          {logoUrl && !uploading && (
            <button
              type="button"
              onClick={onRemove}
              title={t("settings.logo.removeTitle")}
              aria-label={t("settings.logo.removeTitle")}
              className="grid size-9 shrink-0 place-items-center rounded-sm border border-algeria-red/40 text-algeria-red transition-colors hover:bg-algeria-red/10"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropzone */}
        <button
          type="button"
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`w-full border border-dashed px-4 py-8 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-70 ${
            dragActive ? "border-gold bg-gold/10" : "border-gold/50 bg-white hover:border-gold hover:bg-gold/5"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="mx-auto mb-3 size-6 animate-spin text-gold-deep" />
              <p className="text-sm font-bold tabular-nums text-green-deep">
                {t("settings.logo.dropzoneUploading", { percent: uploadProgress })}
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
                className="mx-auto mt-4 h-1.5 w-3/5 bg-sand"
              >
                <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </>
          ) : (
            <>
              <span className="mx-auto mb-4 grid size-12 place-items-center rounded-sm bg-green-deep text-gold">
                <Upload className="size-5" strokeWidth={1.5} />
              </span>
              <p className="text-sm font-bold text-green-deep">{t("settings.logo.dropzoneIdleTitle")}</p>
              <p className="mt-1 text-xs text-green-deep/60">{t("settings.logo.dropzoneHint")}</p>
            </>
          )}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/svg+xml"
          className="hidden"
          onChange={onFile}
          disabled={uploading}
        />
      </FormSection>
    </div>
  );
}

/* ───────────────────────── Password card ───────────────────────── */

function PasswordCard({ changePassword }) {
  const { t } = useLanguage();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const MIN_LEN = 8;
  const toggleLabel = t("settings.password.togglePassword") || "Show / hide password";

  const strength = (() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= MIN_LEN) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score; // 0..4
  })();

  const strengthLabel = [
    t("settings.password.strength.veryWeak"),
    t("settings.password.strength.weak"),
    t("settings.password.strength.medium"),
    t("settings.password.strength.good"),
    t("settings.password.strength.strong"),
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

  const clearError = (key) => errors[key] && setErrors((p) => ({ ...p, [key]: undefined }));

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

  const fieldProps = (id, key) => ({
    id,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-error` : undefined,
    toggleLabel,
  });

  return (
    <div className={CARD}>
      <FormSection icon={Lock} label={t("settings.password.title")} sub={t("settings.password.subtitle")}>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field id="old-password" label={t("settings.password.currentLabel")} error={errors.oldPassword}>
            <PasswordInput
              {...fieldProps("old-password", "oldPassword")}
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => { setOldPassword(e.target.value); clearError("oldPassword"); }}
              placeholder={t("settings.password.currentPlaceholder")}
            />
          </Field>

          <div className="space-y-3">
            <Field id="new-password" label={t("settings.password.newLabel")} error={errors.newPassword}>
              <PasswordInput
                {...fieldProps("new-password", "newPassword")}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); clearError("newPassword"); }}
                placeholder={t("settings.password.newPlaceholder")}
              />
            </Field>
            {newPassword && <StrengthMeter score={strength} label={strengthLabel} />}
          </div>

          <div className="space-y-3">
            <Field id="confirm-password" label={t("settings.password.confirmLabel")} error={errors.confirmPassword}>
              <PasswordInput
                {...fieldProps("confirm-password", "confirmPassword")}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                placeholder={t("settings.password.confirmPlaceholder")}
              />
            </Field>
            {confirmPassword && confirmPassword === newPassword && !errors.confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-green-deep">
                <CheckCircle2 className="size-3.5 text-gold-deep" />
                {t("settings.password.matchLabel")}
              </p>
            )}
          </div>

          <NButton
            type="submit"
            variant="gold"
            disabled={submitting}
            className="w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {submitting ? t("settings.password.submitting") : t("settings.password.submit")}
          </NButton>
        </form>
      </FormSection>
    </div>
  );
}