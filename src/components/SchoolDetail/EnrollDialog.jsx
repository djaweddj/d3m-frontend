import { ClipboardList, Ticket } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";
import { getDateLocale, hhmm, nextUpcomingSession} from "../SchoolDetail/CourseSessions"

// Builds the confirm dialog for either a weekly module or a course (event)
export default function EnrollDialog({ kind, item, schoolName, loading, onConfirm, onCancel }) {
  const { t, locale } = useLanguage();
  const isCourse = kind === "course";

  let rows;
  if (isCourse) {
    const count = item.sessions?.length || 0;
    const first = nextUpcomingSession(item.sessions);
    rows = [
      [t("schoolDetails.modal.subject"), item.subjectName],
      [t("schoolDetails.modal.teacher"), item.teacherName],
      [t("schoolDetails.modal.sessionCount"), t("schoolDetails.modal.sessionCountValue", { count })],
    ];
    if (first) {
      const day = first.date
        ? new Date(first.date).toLocaleDateString(getDateLocale(locale), { day: "numeric", month: "long" })
        : "—";
      rows.push([t("schoolDetails.modal.firstSession"), `${day} · ${hhmm(first.startTime)}–${hhmm(first.endTime)}`]);
    }
  } else {
    rows = [
      [t("schoolDetails.modal.subject"), item.subjectName],
      [t("schoolDetails.modal.teacher"), item.teacherName],
      [t("schoolDetails.modal.time"), `${hhmm(item.startTime)} – ${hhmm(item.endTime)}`],
    ];
  }

  return (
    <ConfirmModal
      icon={isCourse ? Ticket : ClipboardList}
      title={t(isCourse ? "schoolDetails.modal.courseTitle" : "schoolDetails.modal.moduleTitle")}
      description={
        <>
          {isCourse
            ? t("schoolDetails.modal.courseQuestion", { courseName: item.name })
            : t("schoolDetails.modal.moduleQuestion", { moduleName: item.moduleName })}
          <br />
          {t("schoolDetails.modal.awaitingApproval", { schoolName })}
        </>
      }
      rows={rows}
      priceLabel={t("schoolDetails.modal.price")}
      priceValue={
        isCourse
          ? t("schoolDetails.modal.priceTotal", { price: item.totalPrice?.toLocaleString() })
          : t("schoolDetails.modal.priceMonthly", { price: item.monthlyPrice?.toLocaleString() })
      }
      confirmLabel={t(isCourse ? "schoolDetails.modal.confirmBooking" : "schoolDetails.modal.confirmRequest")}
      confirmVariant={isCourse ? "gold" : "green"}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}