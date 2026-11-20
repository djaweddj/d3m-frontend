import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Check, Edit3, GraduationCap, School, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import DashCard from "../components/dash/DashCard";
import DashStat from "../components/dash/DashStat";
import FormSection from "../components/SchoolRegister/FromSection";
import NButton from "../components/home/NButton";
import { Avatar, ErrorNote, Pill, Spinner } from "../components/home/ui";
import ProfileField from "../components/studentdash/ProfileField";
import StatGrid from "../components/studentdash/StatGrid";
import { studentApi } from "../components/studentdash/studentApi";
import { schoolIdOf, weeklyCount } from "../components/studentdash/studentUtils";

const toForm = (p) => ({
  fullName: p?.fullName || "",
  parentName: p?.parentName || "",
  parentPhone: p?.parentPhone || "",
});

export default function ProfilePage({ profile, enrollments, moduleMap, onSaved }) {
  const { t, locale } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => toForm(profile));

  useEffect(() => { setForm(toForm(profile)); }, [profile]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const cancel = () => {
    setEditing(false);
    setError(null);
    setForm(toForm(profile));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await studentApi.updateProfile(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || t("studentDashboard.profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const schoolCount = new Set(enrollments.map(schoolIdOf)).size;

  return (
    <div className="max-w-3xl space-y-5">
      <DashCard>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={form.fullName} className="size-16" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-ink">{form.fullName || "—"}</h2>
            <p className="mt-1 text-sm text-ink/60">{profile?.email || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile?.level && <Pill tone="gold"><GraduationCap className="size-3" />{profile.level}</Pill>}
              {saved && <Pill tone="green"><Check className="size-3" />{t("studentDashboard.profile.savedSuccess")}</Pill>}
            </div>
          </div>
          <NButton variant={editing ? "outline" : "green"} onClick={editing ? cancel : () => setEditing(true)}>
            <Edit3 className="size-4" />
            {editing ? t("studentDashboard.profile.cancel") : t("studentDashboard.profile.edit")}
          </NButton>
        </div>
      </DashCard>

      <div className="rounded-sm bg-white">
        <FormSection icon={User} label={t("studentDashboard.profile.personalInfoTitle")}>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField id="sd-email" label={t("studentDashboard.profile.emailLabel")} value={profile?.email} ltr />
            <ProfileField id="sd-level" label={t("studentDashboard.profile.levelLabel")} value={profile?.level} />
          </div>
          <ProfileField
            id="sd-name"
            label={t("studentDashboard.profile.fullNameLabel")}
            value={form.fullName}
            editing={editing}
            onChange={set("fullName")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileField
              id="sd-parent"
              label={t("studentDashboard.profile.parentNameLabel")}
              value={form.parentName}
              editing={editing}
              onChange={set("parentName")}
            />
            <ProfileField
              id="sd-phone"
              label={t("studentDashboard.profile.parentPhoneLabel")}
              value={form.parentPhone}
              editing={editing}
              onChange={set("parentPhone")}
              type="tel"
              ltr
            />
          </div>

          <ErrorNote msg={error} />

          {editing && (
            <div className="flex justify-end gap-3">
              <NButton variant="outline" onClick={cancel}>{t("studentDashboard.profile.cancel")}</NButton>
              <NButton variant="gold" onClick={save} disabled={saving} className="disabled:opacity-60">
                {saving ? <Spinner /> : <Check className="size-4" />}
                {saving ? t("studentDashboard.profile.saving") : t("studentDashboard.profile.saveChanges")}
              </NButton>
            </div>
          )}
        </FormSection>
      </div>

      <StatGrid>
        <DashStat icon={School} label={t("studentDashboard.profile.statSchools")} value={schoolCount} locale={locale} />
        <DashStat icon={BookOpen} label={t("studentDashboard.profile.statModules")} value={enrollments.length} locale={locale} delay={0.07} />
        <DashStat icon={CalendarDays} label={t("studentDashboard.profile.statWeeklySessions")} value={weeklyCount(enrollments, moduleMap)} locale={locale} delay={0.14} />
      </StatGrid>
    </div>
  );
}
