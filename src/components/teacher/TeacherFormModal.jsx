import { useState } from "react";
import { AlertCircle, Pencil, UserPlus } from "lucide-react";
import ConfirmModal from "./ConfiemModalt";
import PayoutInfoCard from "./PayoutInfoCard";
import { FormField, FormSection, PasswordInput, inputClass } from "./FormField";
import { useLanguage } from "../../context/LanguageContext";
import { teacherApi } from "./teacherApi";
import useTeacherPayout from "./useTeacherPayout";

// One modal for both "add" (no teacher) and "edit" (teacher given)
export default function TeacherFormModal({ teacher, subjects, onClose, onSaved }) {
  const { t } = useLanguage();
  const isEdit = !!teacher;

  const [form, setForm] = useState(
    isEdit
      ? {
          fullName: teacher.fullName || "", email: teacher.email || "", password: "",
          percentage: teacher.percentage != null ? String(teacher.percentage) : "0",
          specialization: teacher.specialization || "", bio: teacher.bio || "",
          subjectId: teacher.subjectIds?.[0] != null ? String(teacher.subjectIds[0]) : "",
        }
      : { fullName: "", email: "", password: "Teacher@123", percentage: "20", specialization: "", bio: "", subjectId: "" }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const payout = useTeacherPayout(teacher?.id, t, isEdit);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.fullName.trim()) return setError(t("teachers.errors.nameRequired"));
    if (!form.email.trim()) return setError(t("teachers.errors.emailRequired"));
    if (!isEdit && !form.password.trim()) return setError(t("teachers.errors.passwordRequired"));
    const pct = parseFloat(form.percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) return setError(t("teachers.errors.percentageRange"));

    setSaving(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName, email: form.email, percentage: pct,
        specialization: form.specialization, bio: form.bio,
        subjectId: form.subjectId ? Number(form.subjectId) : null,
      };
      if (!isEdit || form.password.trim()) payload.password = form.password;

      const res = isEdit ? await teacherApi.update(teacher.id, payload) : await teacherApi.create(payload);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || t("teachers.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfirmModal
      icon={isEdit ? Pencil : UserPlus}
      title={t(isEdit ? "teachers.editModal.title" : "teachers.addModal.title")}
      description={isEdit ? t("teachers.editModal.subtitleFor", { name: teacher.fullName }) : t("teachers.addModal.subtitle")}
      confirmLabel={t(isEdit ? "teachers.editModal.submit" : "teachers.addModal.submit")}
      cancelLabel={t("teachers.footer.cancel")}
      loadingLabel={t("teachers.footer.saving")}
      loading={saving}
      onConfirm={handleSave}
      onCancel={onClose}
    >
      <div className="space-y-4 text-start">
        <FormSection>{t("teachers.form.accountSection")}</FormSection>

        <FormField label={`${t("teachers.form.fullName")} *`}>
          <input className={inputClass} type="text" placeholder={t("teachers.form.fullNamePlaceholder")} value={form.fullName} onChange={set("fullName")} />
        </FormField>

        <FormField label={`${t("teachers.form.email")} *`}>
          <input className={inputClass} dir="ltr" type="email" placeholder="example@mail.com" value={form.email} onChange={set("email")} />
        </FormField>

        <FormField
          label={isEdit ? t("teachers.form.newPassword") : `${t("teachers.form.password")} *`}
          hint={!isEdit ? t("teachers.form.passwordNote") : undefined}
        >
          <PasswordInput
            placeholder={isEdit ? t("teachers.form.passwordPlaceholderEdit") : t("teachers.form.passwordPlaceholder")}
            value={form.password}
            onChange={set("password")}
          />
        </FormField>

        <FormSection>{t("teachers.form.revenueSection")}</FormSection>

        {isEdit && (
          <PayoutInfoCard payout={payout} previousPercentage={teacher.percentage} currentPercentage={form.percentage} />
        )}

        <FormField label={`${t("teachers.form.percentageLabel")} *`} hint={t("teachers.form.percentageNote", { pct: form.percentage || 0 })}>
          <div className="flex items-center gap-4">
            <input
              className={`${inputClass} w-24 text-center font-display text-lg`}
              type="number" min="0" max="100" step="1"
              value={form.percentage} onChange={set("percentage")}
            />
            <input
              type="range" min="0" max="100" step="1"
              value={form.percentage} onChange={set("percentage")}
              className="w-full accent-green-deep"
            />
          </div>
        </FormField>

        <FormSection>{t("teachers.form.professionalSection")}</FormSection>

        <FormField label={t("teachers.form.subjectLabel")}>
          <select className={`${inputClass} cursor-pointer`} value={form.subjectId} onChange={set("subjectId")}>
            <option value="">{`-- ${t("teachers.form.subjectPlaceholder")} --`}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </FormField>

        <FormField label={t("teachers.form.specializationLabel")}>
          <input className={inputClass} type="text" placeholder={t("teachers.form.specializationPlaceholder")} value={form.specialization} onChange={set("specialization")} />
        </FormField>

        <FormField label={t("teachers.form.bioLabel")}>
          <input className={inputClass} type="text" placeholder={t("teachers.form.bioPlaceholder")} value={form.bio} onChange={set("bio")} />
        </FormField>

        {error && (
          <p role="alert" className="flex items-start gap-2 border border-algeria-red/30 bg-algeria-red/10 p-3 text-sm text-algeria-red">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />{error}
          </p>
        )}
      </div>
    </ConfirmModal>
  );
}
