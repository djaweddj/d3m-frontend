import { useState } from "react";
import { Plus, Check, ChevronDown, Trash2, CalendarDays, Clock } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Btn, ErrorBox, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "./Ui";
import { scheduleApi, IDX_TO_DAY, fmtTime, toneFor, errMsg } from "./scheduleUtils";

function ModulePicker({ modules, value, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex w-full items-center justify-between rounded-xl bg-paper px-3 py-2.5 text-start text-sm ring-1 transition ${open ? "ring-brand/40" : "ring-transparent"}`}
      >
        <span className={value ? "text-ink" : "text-stone-400"}>{value?.name || t("schedule.addModal.modulePlaceholder")}</span>
        <ChevronDown size={14} className={`text-stone-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl bg-white p-1 shadow-xl">
          {modules.length === 0 && <p className="p-3 text-xs text-stone-400">{t("schedule.addModal.noModules")}</p>}
          {modules.map((m) => {
            const tone = toneFor(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm transition hover:bg-paper ${value?.id === m.id ? tone.soft : ""}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{m.name}</span>
                  {m.teacherName && <span className="block text-[11px] text-stone-400">{t("schedule.attendance.teacherLabel", { name: m.teacherName })}</span>}
                </span>
                {value?.id === m.id && <Check size={13} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AddSessionModal({ modules, defaultDayIdx, onClose, onCreated }) {
  const { t, locale } = useLanguage();
  const [mod, setMod] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:30");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pickModule = (m) => {
    setMod(m);
    if (defaultDayIdx == null) return;
    const sched = (m.schedules ?? []).find((s) => s.day === IDX_TO_DAY[defaultDayIdx]);
    if (sched) { setStart(fmtTime(sched.startTime)); setEnd(fmtTime(sched.endTime)); }
  };

  const save = async () => {
    if (!mod) return setError(t("schedule.addModal.errors.selectModule"));
    if (!date) return setError(t("schedule.addModal.errors.enterDate"));
    if (!start || !end) return setError(t("schedule.addModal.errors.enterTimes"));
    if (start >= end) return setError(t("schedule.addModal.errors.startBeforeEnd"));
    setSaving(true); setError("");
    try {
      const res = await scheduleApi.createSession({
        moduleId: mod.id, date, startTime: start + ":00", endTime: end + ":00",
        price: price !== "" ? Number(price) : null,
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(errMsg(err, t("schedule.addModal.errors.createFailed")));
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={t("schedule.addModal.title")} onClose={onClose} />
      <ModalBody>
        <Field label={t("schedule.addModal.moduleLabel")}><ModulePicker modules={modules} value={mod} onChange={pickModule} /></Field>
        <Field label={t("schedule.addModal.dateLabel")}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("schedule.addModal.startLabel")}><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label={t("schedule.addModal.endLabel")}><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
        <Field label={t("schedule.addModal.priceLabel") ?? "Price"}>
          <Input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("schedule.addModal.pricePlaceholder") ?? "0.00"} />
        </Field>
        {mod && (
          <div className={`rounded-xl px-4 py-3 ${toneFor(mod.id).soft}`}>
            <p className="text-sm font-bold">{mod.name}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 text-xs opacity-75">
              <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{date ? new Date(date).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) : "—"}</span>
              <span className="inline-flex items-center gap-1"><Clock size={12} />{start} – {end}</span>
            </p>
          </div>
        )}
        <ErrorBox msg={error} />
      </ModalBody>
      <ModalFooter>
        <Btn variant="ghost" onClick={onClose} className="flex-1">{t("schedule.addModal.cancel")}</Btn>
        <Btn onClick={save} loading={saving} icon={Plus} className="flex-[2]">{saving ? t("schedule.addModal.saving") : t("schedule.addModal.save")}</Btn>
      </ModalFooter>
    </Modal>
  );
}

export function EditTimeModal({ slot, onClose, onSaved }) {
  const { t } = useLanguage();
  const [start, setStart] = useState(fmtTime(slot.startTime));
  const [end, setEnd] = useState(fmtTime(slot.endTime));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!start || !end) return setError(t("schedule.editModal.errors.fillAll"));
    if (start >= end) return setError(t("schedule.editModal.errors.startBeforeEnd"));
    setSaving(true); setError("");
    try {
      await scheduleApi.updateSchedule(slot.moduleId, slot.day, { startTime: start + ":00", endTime: end + ":00" });
      onSaved({ ...slot, startTime: start + ":00", endTime: end + ":00" });
      onClose();
    } catch (err) {
      setError(errMsg(err, t("schedule.editModal.errors.updateFailed")));
    } finally { setSaving(false); }
  };

  return (
    <Modal onClose={onClose} width="sm:max-w-sm">
      <ModalHeader title={t("schedule.editModal.title")} subtitle={slot.subjectName ?? slot.moduleName} onClose={onClose} className={toneFor(slot.moduleId).soft} />
      <ModalBody>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("schedule.editModal.startLabel")}><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label={t("schedule.editModal.endLabel")}><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
        <p className="rounded-xl bg-paper px-3 py-2 text-xs text-stone-500">{t("schedule.editModal.note")}</p>
        <ErrorBox msg={error} />
      </ModalBody>
      <ModalFooter>
        <Btn variant="ghost" onClick={onClose} className="flex-1">{t("schedule.editModal.cancel")}</Btn>
        <Btn onClick={save} loading={saving} icon={Check} className="flex-[2]">{saving ? t("schedule.editModal.saving") : t("schedule.editModal.save")}</Btn>
      </ModalFooter>
    </Modal>
  );
}

export function ArchiveModal({ slot, onClose, onConfirm }) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setSaving(true); setError("");
    try {
      await scheduleApi.archiveModule(slot.moduleId);
      onConfirm(slot);
    } catch (err) {
      setError(errMsg(err, t("schedule.archiveModal.errors.archiveFailed")));
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} width="sm:max-w-sm">
      <ModalHeader title={t("schedule.archiveModal.title")} onClose={onClose} />
      <ModalBody>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-danger/10 text-danger"><Trash2 size={22} /></div>
          <p className="text-sm leading-7 text-stone-600">
            {t("schedule.archiveModal.confirmQuestion", { name: slot.subjectName ?? slot.moduleName })}
            <span className="block text-xs text-stone-400">{t("schedule.archiveModal.note")}</span>
          </p>
        </div>
        <ErrorBox msg={error} />
      </ModalBody>
      <ModalFooter>
        <Btn variant="ghost" onClick={onClose} className="flex-1">{t("schedule.archiveModal.cancel")}</Btn>
        <Btn variant="danger" onClick={confirm} loading={saving} icon={Trash2} className="flex-[2]">{saving ? t("schedule.archiveModal.archiving") : t("schedule.archiveModal.confirm")}</Btn>
      </ModalFooter>
    </Modal>
  );
}