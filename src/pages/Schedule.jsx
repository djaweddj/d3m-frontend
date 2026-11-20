import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, AlertCircle, Calendar, LayoutGrid } from "lucide-react";
import { useAuth } from "../context/authContext";
import { useLanguage } from "../context/LanguageContext";
import { Btn, IconBtn, Spinner, Tabs } from "../components/Schedule/Ui";
import AgendaView from "../components/Schedule/AgendaView";
import WeekGrid from "../components/Schedule/WeekGrid";
import AttendanceModal from "../components/Schedule/AttendeceModal";
import { AddSessionModal, EditTimeModal, ArchiveModal } from "../components/Schedule/ScheduleModals";
import { scheduleApi, errMsg } from "../components/Schedule/scheduleUtils";

export default function Schedule() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const schoolId = user?.schoolId;

  const [view, setView] = useState("agenda");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [addModal, setAddModal] = useState(null);
  const [editSlot, setEditSlot] = useState(null);
  const [archiveSlot, setArchiveSlot] = useState(null);
  const [attendanceSession, setAttendanceSession] = useState(null);

  const loadModules = useCallback(async () => {
    if (!schoolId) { setLoading(false); setError(t("schedule.errors.noSchool")); return; }
    setLoading(true); setError(null);
    try {
      const res = await scheduleApi.getModules();
      const mods = res.data?.content ?? res.data ?? [];
      setModules(mods.filter((m) => !m.archived));
    } catch (err) {
      setError(errMsg(err, t("schedule.errors.loadFailed")));
    } finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { loadModules(); }, [loadModules]);

  const bump = () => setRefreshKey((k) => k + 1);
  const totalSessions = modules.reduce((sum, m) => sum + (m.schedules?.length ?? 0), 0);

  return (
    <div dir={dir} className="flex min-h-screen flex-col gap-5 bg-paper p-4 md:p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand">{t("schedule.title")}</h1>
          <p className="mt-0.5 text-xs text-stone-500">
            {loading ? t("schedule.loading") : t("schedule.subtitle", { sessions: totalSessions, modules: modules.length })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 md:flex-none">
            <Tabs
              value={view}
              onChange={setView}
              options={[
                { key: "agenda", icon: Calendar, label: t("schedule.views.agenda") },
                { key: "grid", icon: LayoutGrid, label: t("schedule.views.grid") },
              ]}
            />
          </div>
          <IconBtn icon={RefreshCw} title={t("schedule.actions.refresh")} onClick={loadModules} className="size-10 !bg-white" />
          <Btn variant="gold" icon={Plus} onClick={() => setAddModal({ defaultDayIdx: null })} className="w-full md:w-auto">
            {t("schedule.actions.addSession")}
          </Btn>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle size={34} className="text-gold" />
          <p className="text-sm text-stone-500">{error}</p>
          <Btn variant="soft" icon={RefreshCw} onClick={loadModules}>{t("schedule.actions.retry")}</Btn>
        </div>
      ) : view === "agenda" ? (
        <div className="rounded-3xl bg-white/60 p-3 md:p-5">
          <AgendaView schoolId={schoolId} onAttendance={setAttendanceSession} refreshKey={refreshKey} />
        </div>
      ) : (
        <WeekGrid
          modules={modules}
          onAddModal={(dayIdx) => setAddModal({ defaultDayIdx: dayIdx })}
          setEditSlot={setEditSlot}
          setArchiveSlot={setArchiveSlot}
        />
      )}

      {addModal && (
        <AddSessionModal
          modules={modules}
          defaultDayIdx={addModal.defaultDayIdx}
          onClose={() => setAddModal(null)}
          onCreated={() => { setAddModal(null); loadModules(); bump(); }}
        />
      )}
      {editSlot && <EditTimeModal slot={editSlot} onClose={() => setEditSlot(null)} onSaved={() => { setEditSlot(null); loadModules(); }} />}
      {archiveSlot && <ArchiveModal slot={archiveSlot} onClose={() => setArchiveSlot(null)} onConfirm={() => { setArchiveSlot(null); loadModules(); bump(); }} />}
      {attendanceSession && <AttendanceModal session={attendanceSession} onClose={() => { setAttendanceSession(null); bump(); }} />}
    </div>
  );
}