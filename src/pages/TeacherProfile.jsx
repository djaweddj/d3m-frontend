import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Pencil, Check, X, BookOpen } from "lucide-react";
import PageHeader from "../components/dash/PageHeader";
import DashCard from "../components/dash/DashCard";
import NButton from "../components/home/NButton";
import { Avatar, Pill, TextInput, TextArea, ErrorNote } from "../components/home/ui";
import { Page, InfoTile } from "../components/teacherdash/teacherBits";
import { teacherApi } from "../components/teacherdash/api";

export default function TeacherProfile() {
  const { profile, setProfile } = useOutletContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => setDraft(profile), [profile]);

  const set = (k) => (v) => setDraft((d) => ({ ...d, [k]: v }));
  const cancel = () => { setDraft(profile); setEditing(false); setError(null); };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // Backend only accepts fullName + bio from the teacher.
      setProfile(await teacherApi.updateProfile({ fullName: draft.fullName, bio: draft.bio }));
      setEditing(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <PageHeader title="بروفايلي" subtitle="اعرض وعدّل معلوماتك الشخصية.">
        {editing ? (
          <>
            <NButton onClick={save} disabled={saving}><Check className="size-4" />{saving ? "جاري الحفظ..." : "حفظ"}</NButton>
            <NButton variant="outline" onClick={cancel}><X className="size-4" />إلغاء</NButton>
          </>
        ) : (
          <NButton variant="gold" onClick={() => setEditing(true)}><Pencil className="size-4" />تعديل</NButton>
        )}
      </PageHeader>

      <ErrorNote msg={error} />

      <DashCard>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={profile.fullName} className="size-20 text-2xl" />
          <div className="min-w-56 flex-1 space-y-2">
            {editing
              ? <TextInput value={draft.fullName || ""} onChange={set("fullName")} placeholder="الاسم الكامل" />
              : <h2 className="font-display text-2xl text-ink">{profile.fullName}</h2>}
            <Pill tone="gold"><BookOpen className="size-3" />{profile.specialization || "—"}</Pill>
            <p className="text-xs text-ink/45">التخصص يُعدّل من طرف إدارة المدرسة فقط.</p>
          </div>
        </div>
      </DashCard>

      <DashCard title="معلومات التواصل">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile label="البريد الإلكتروني" value={profile.email} />
          <InfoTile label="المعرف" value={`#${profile.id}`} />
          <InfoTile label="نسبتك من الإيرادات" value={profile.percentage != null ? `${profile.percentage}%` : "—"} />
        </div>
      </DashCard>

      {profile.subjectNames?.length > 0 && (
        <DashCard title="المواد التي تُدرّسها">
          <div className="flex flex-wrap gap-2">
            {profile.subjectNames.map((s) => <Pill key={s} tone="green">{s}</Pill>)}
          </div>
        </DashCard>
      )}

      <DashCard title="نبذة شخصية">
        {editing
          ? <TextArea rows={4} value={draft.bio || ""} onChange={set("bio")} placeholder="اكتب نبذة عنك..." />
          : <p className="text-sm leading-8 text-ink/70">{profile.bio || "لم تتم إضافة نبذة بعد."}</p>}
      </DashCard>
    </Page>
  );
}
