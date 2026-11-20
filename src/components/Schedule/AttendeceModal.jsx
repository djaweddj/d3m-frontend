import { useState, useEffect } from "react";
import { Check, XCircle, Users, Wallet, Search, X, ArrowDownAZ, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useLanguage } from "../../context/LanguageContext";
import { Avatar, Badge, Btn, Empty, ErrorBox, Input, Modal, ModalHeader, Spinner } from "./Ui";
import { scheduleApi, INVOICE_TONE, fmtDA, fmtTime, toneFor, errMsg } from "./scheduleUtils";

const STATUS_BTNS = [
  { key: "PRESENT", Icon: Check,   on: "bg-brand/10 text-brand",   titleKey: "presentTitle" },
  { key: "ABSENT",  Icon: XCircle, on: "bg-danger/10 text-danger", titleKey: "absentTitle" },
];
const ROW_TONE = { PRESENT: "bg-brand/5", ABSENT: "bg-danger/5" };

function PayButton({ student, paying, onPay }) {
  const { t } = useLanguage();
  const { invoiceId, invoiceStatus, invoiceAmount } = student;
  const payable = !!invoiceId && (invoiceStatus === "PENDING" || invoiceStatus === "OVERDUE");
  const tone = INVOICE_TONE[invoiceStatus] ?? "bg-stone-100 text-stone-400";
  const amount = fmtDA(invoiceAmount);
  const label = !invoiceId ? t("schedule.attendance.noInvoice")
    : invoiceStatus === "PAID" ? t("schedule.attendance.paidLabel")
    : invoiceStatus === "CANCELLED" ? t("schedule.attendance.invoiceCancelled")
    : t("schedule.attendance.payLabel");
  const title = !invoiceId ? t("schedule.attendance.noInvoiceTitle")
    : invoiceStatus === "PAID" ? t("schedule.attendance.alreadyPaid")
    : t("schedule.attendance.markPaid");

  return (
    <div className="flex items-center gap-1.5">
      {amount && <span className={`whitespace-nowrap text-[11px] font-bold ${tone.split(" ")[1]}`}>{amount}</span>}
      <button
        title={title}
        disabled={!payable || paying}
        onClick={() => onPay(student.studentId, invoiceId)}
        className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-bold transition sm:px-3 ${tone} ${payable && !paying ? "hover:brightness-95" : "cursor-default"}`}
      >
        {paying ? <Spinner size="sm" /> : invoiceStatus === "PAID" ? <Check size={12} /> : <Wallet size={12} />}
        <span className="hidden sm:inline">{label}</span>
      </button>
    </div>
  );
}

function StudentRow({ student, status, onMark, payingId, onPay }) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-3 transition sm:flex-nowrap sm:px-5 ${ROW_TONE[status] ?? ""}`}>
      <Avatar name={student.fullName} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
          {student.fullName}
          {student.isMakeup && <Badge className="bg-gold/20 text-amber-900">{t("schedule.makeup.tag")}</Badge>}
        </p>
        <p className="text-[11px] text-stone-400">{student.level ?? student.parentPhone ?? ""}</p>
      </div>
      <div className="ms-auto flex items-center gap-1.5">
        <PayButton student={student} paying={payingId === student.studentId} onPay={onPay} />
        {STATUS_BTNS.map(({ key, Icon, on, titleKey }) => (
          <button
            key={key}
            title={t(`schedule.attendance.${titleKey}`)}
            onClick={() => onMark(student.studentId, key)}
            className={`grid size-8 place-items-center rounded-lg transition ${status === key ? on : "bg-stone-100 text-stone-300 hover:text-stone-500"}`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

function CycleProgress({ sheet, tone }) {
  const { t } = useLanguage();
  const { sessionOrdinalInMonth: ord, totalSessionsInMonth: total } = sheet;
  return (
    <div className="mt-3 rounded-xl bg-white/60 px-3 py-2">
      <div className="mb-1.5 flex justify-between text-xs font-bold">
        <span>{t("schedule.attendance.sessionOfMonth", { ordinal: ord, total })}</span>
        <span className="opacity-70">{Math.round((ord / total) * 100)}%</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < ord ? tone.bar : "bg-white"}`} />
        ))}
      </div>
    </div>
  );
}

export default function AttendanceModal({ session, onClose }) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const tone = toneFor(session.moduleId);

  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [marks, setMarks] = useState({});
  const [search, setSearch] = useState("");
  const [sortAlpha, setSortAlpha] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    scheduleApi.getAttendanceSheet(session.id)
      .then((r) => {
        setSheet(r.data);
        const init = {};
        (r.data.students ?? []).forEach((s) => { if (s.status) init[s.studentId] = s.status; });
        setMarks(init);
      })
      .catch((err) => setError(errMsg(err, t("schedule.attendance.loadFailed"))))
      .finally(() => setLoading(false));
  }, [session.id]);

  const students = sheet?.students ?? [];
  let visible = students;
  if (search.trim()) visible = visible.filter((s) => (s.fullName ?? "").toLowerCase().includes(search.trim().toLowerCase()));
  if (sortAlpha) visible = [...visible].sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", locale));

  const count = (status) => Object.values(marks).filter((v) => v === status).length;
  const markedCount = Object.values(marks).filter(Boolean).length;
  const paidCount = students.filter((s) => s.invoiceStatus === "PAID").length;

  const mark = (id, status) => setMarks((p) => ({ ...p, [id]: p[id] === status ? null : status }));
  const markAll = (status) => setMarks(Object.fromEntries(students.map((s) => [s.studentId, status])));

  const pay = async (studentId, invoiceId) => {
    if (!invoiceId) return;
    setPayingId(studentId); setPayError("");
    try {
      await scheduleApi.payInvoice(invoiceId);
      setSheet((p) => ({ ...p, students: p.students.map((s) => (s.studentId === studentId ? { ...s, invoiceStatus: "PAID" } : s)) }));
    } catch (err) {
      setPayError(errMsg(err, t("schedule.attendance.paymentFailed")));
    } finally { setPayingId(null); }
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const entries = students.filter((s) => marks[s.studentId]).map((s) => ({ studentId: s.studentId, status: marks[s.studentId] }));
      await scheduleApi.submitAttendance(session.id, entries, user);
      setSubmitted(true);
      try {
        // invoices for extra sessions are created on save — refresh so "pay" appears without reopening
        const fresh = await scheduleApi.getAttendanceSheet(session.id);
        const byId = Object.fromEntries((fresh.data?.students ?? []).map((s) => [s.studentId, s]));
        setSheet((p) => ({
          ...p,
          students: p.students.map((s) => {
            const f = byId[s.studentId];
            return f ? { ...s, invoiceId: f.invoiceId, invoiceStatus: f.invoiceStatus, invoiceAmount: f.invoiceAmount } : s;
          }),
        }));
      } catch { /* non-fatal */ }
    } catch (err) {
      setError(errMsg(err, t("schedule.attendance.saveFailed")));
    } finally { setSaving(false); }
  };

  const subtitle = [
    t("schedule.attendance.teacherLabel", { name: sheet?.teacherName ?? session.teacherName ?? "—" }),
    `${fmtTime(sheet?.startTime ?? session.startTime)} – ${fmtTime(sheet?.endTime ?? session.endTime)}`,
    sheet?.date ? new Date(sheet.date).toLocaleDateString(locale, { day: "numeric", month: "long" }) : null,
  ].filter(Boolean).join("  •  ");

  return (
    <Modal onClose={onClose} width="sm:max-w-2xl">
      <ModalHeader title={sheet?.subjectName ?? session.subjectName ?? session.moduleName} subtitle={subtitle} onClose={onClose} className={tone.soft}>
        {!loading && sheet?.totalSessionsInMonth > 0 && <CycleProgress sheet={sheet} tone={tone} />}
        {!loading && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge className="bg-white/60">{t("schedule.attendance.studentsCount", { count: students.length })}</Badge>
            <Badge className="bg-brand/15 text-brand">{t("schedule.attendance.presentCount", { count: count("PRESENT") })}</Badge>
            <Badge className="bg-danger/10 text-danger">{t("schedule.attendance.absentCount", { count: count("ABSENT") })}</Badge>
            <Badge className="bg-white/60 text-brand"><Wallet size={10} />{t("schedule.attendance.paidCount", { count: paidCount })}</Badge>
            {students.length > 0 && (
              <>
                <button onClick={() => markAll("PRESENT")} className="rounded-full bg-brand px-3 py-0.5 text-[11px] font-semibold text-white">{t("schedule.attendance.markAllPresent")}</button>
                <button onClick={() => markAll("ABSENT")} className="rounded-full bg-danger px-3 py-0.5 text-[11px] font-semibold text-white">{t("schedule.attendance.markAllAbsent")}</button>
              </>
            )}
          </div>
        )}
        {!loading && students.length > 0 && (
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("schedule.attendance.searchPlaceholder")} className="!bg-white/80 ps-9 pe-8" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-stone-400"><X size={13} /></button>
              )}
            </div>
            <button
              onClick={() => setSortAlpha((p) => !p)}
              title={t("schedule.attendance.sortAlpha")}
              className={`grid size-10 shrink-0 place-items-center rounded-xl transition ${sortAlpha ? "bg-brand text-white" : "bg-white/80 text-stone-500"}`}
            >
              <ArrowDownAZ size={15} />
            </button>
          </div>
        )}
      </ModalHeader>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : error && !sheet ? (
          <Empty icon={AlertCircle} title={error} />
        ) : students.length === 0 ? (
          <Empty icon={Users} title={t("schedule.attendance.noStudents")} />
        ) : visible.length === 0 ? (
          <Empty icon={Search} title={t("schedule.attendance.noSearchResults")} />
        ) : (
          visible.map((s) => <StudentRow key={s.studentId} student={s} status={marks[s.studentId]} onMark={mark} payingId={payingId} onPay={pay} />)
        )}
      </div>

      {sheet && (error || payError) && <div className="px-5 pt-3"><ErrorBox msg={error || payError} /></div>}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-paper px-5 py-3.5">
        <span className="text-xs text-stone-400">{t("schedule.attendance.markedCount", { marked: markedCount, total: students.length })}</span>
        <Btn variant={submitted ? "gold" : "primary"} onClick={save} loading={saving} disabled={submitted || students.length === 0} icon={submitted ? Check : undefined}>
          {submitted ? t("schedule.attendance.saved") : t("schedule.attendance.save")}
        </Btn>
      </div>
    </Modal>
  );
}