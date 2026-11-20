import { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { Badge, Btn, Empty, IconBtn, Input, Spinner } from "./Ui";
import SessionRow from "./SessionRow";
import { scheduleApi, toLocalDate, fmtTime } from "./scheduleUtils";

export default function AgendaView({ schoolId, onAttendance, refreshKey }) {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await scheduleApi.getSessionsByDate(schoolId, toLocalDate(date));
      setSessions(res.data ?? []);
    } catch {
      setSessions([]);
    } finally { setLoading(false); }
  }, [schoolId, date]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const shiftDay = (n) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d); };
  const isToday = toLocalDate(date) === toLocalDate(new Date());
  const marked = sessions.filter((s) => s.attendanceMarked).length;
  const sorted = [...sessions].sort((a, b) => fmtTime(a.startTime).localeCompare(fmtTime(b.startTime)));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBtn icon={ChevronLeft} onClick={() => shiftDay(-1)} className="rtl:rotate-180 !bg-white" />
          <div className="min-w-36 text-center">
            <p className="text-sm font-bold text-ink">{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</p>
            {isToday && <Badge className="bg-brand/10 text-brand">{t("schedule.agenda.today")}</Badge>}
          </div>
          <IconBtn icon={ChevronRight} onClick={() => shiftDay(1)} className="rtl:rotate-180 !bg-white" />
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {!isToday && <Btn variant="soft" onClick={() => setDate(new Date())} className="!py-2 text-xs">{t("schedule.agenda.backToToday")}</Btn>}
          <Input type="date" value={toLocalDate(date)} onChange={(e) => setDate(new Date(e.target.value + "T00:00:00"))} className="!bg-white sm:w-auto" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : sessions.length === 0 ? (
        <Empty icon={Calendar} title={t("schedule.agenda.noSessions")} />
      ) : (
        <>
          <p className="flex flex-wrap gap-x-4 text-xs text-stone-500">
            <span>{t("schedule.agenda.sessionsCount", { count: sessions.length })}</span>
            <span className="text-brand">{t("schedule.agenda.markedCount", { count: marked })}</span>
            <span className="text-amber-700">{t("schedule.agenda.pendingCount", { count: sessions.length - marked })}</span>
          </p>
          <div className="flex flex-col gap-2.5">
            {sorted.map((s) => <SessionRow key={s.id} session={s} onAttendance={onAttendance} />)}
          </div>
        </>
      )}
    </section>
  );
}