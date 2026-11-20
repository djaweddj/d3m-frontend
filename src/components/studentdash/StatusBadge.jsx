import { useLanguage } from "../../context/LanguageContext";
import Badge from "../dash/Badge";

const TONE = { ACTIVE: "ok", ACCEPTED: "ok", PAID: "ok", PENDING: "warn", REJECTED: "bad", OVERDUE: "bad" };

const KEYS = {
  enrollment: {
    ACTIVE: "studentDashboard.enrollmentStatus.ACTIVE",
    ACCEPTED: "studentDashboard.enrollmentStatus.ACTIVE",
    PENDING: "studentDashboard.enrollmentStatus.PENDING",
    REJECTED: "studentDashboard.courses.rejected",
  },
  invoice: {
    PAID: "studentDashboard.invoiceStatus.PAID",
    PENDING: "studentDashboard.invoiceStatus.PENDING",
    OVERDUE: "studentDashboard.invoiceStatus.OVERDUE",
  },
};

// kind: "enrollment" | "invoice"
export default function StatusBadge({ kind, status }) {
  const { t } = useLanguage();
  const key = KEYS[kind][status];
  return <Badge tone={TONE[status] ?? "neutral"}>{key ? t(key) : status || "—"}</Badge>;
}
