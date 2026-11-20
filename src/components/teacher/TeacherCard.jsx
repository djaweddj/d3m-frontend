import { Archive, BookOpen, Mail, Pencil, RefreshCw, Wallet } from "lucide-react";
import Reveal from "../Reveal";
import IconButton from "../Requests/IconButton";
import InlineConfirm from "./InlineConfirm";
import { useLanguage } from "../../context/LanguageContext";
import { initials } from "../../utils/payouts";

export default function TeacherCard({
  teacher, index = 0, subjectName, isArchived, busy,
  onArchive, onUnarchive, onEdit,
  confirmingPay, paying, onPayNow, onConfirmPay, onCancelPay,
}) {
  const { t } = useLanguage();

  return (
    <Reveal delay={Math.min(index, 7) * 0.04} className="h-full">
      <div
        className={`group relative flex h-full flex-col items-center gap-3 border p-6 pt-8 text-center transition duration-500 ${
          isArchived ? "border-gold/25 bg-ivory opacity-80" : "border-gold/25 bg-white hover:-translate-y-1 hover:border-gold"
        }`}
      >
        {isArchived ? (
          <span className="absolute end-3 top-3 rounded-full bg-algeria-red/10 px-3 py-1 text-xs font-bold text-algeria-red">
            {t("teachers.archivedBadge")}
          </span>
        ) : (
          <>
            <IconButton icon={Archive} variant="danger" label={t("teachers.archiveTitle")} loading={busy} onClick={() => onArchive(teacher.id)} className="absolute start-3 top-3" />
            <IconButton icon={Pencil} label={t("teachers.editTitle")} onClick={() => onEdit(teacher)} className="absolute end-3 top-3" />
          </>
        )}

        <span
          className={`mt-2 grid size-16 place-items-center rounded-sm font-display text-xl transition-colors ${
            isArchived ? "bg-sand text-green-deep/50" : "bg-green-deep text-gold group-hover:bg-gold group-hover:text-green-deep"
          }`}
        >
          {initials(teacher.fullName)}
        </span>

        <h3 className={`font-display text-lg ${isArchived ? "text-green-deep/50" : "text-green-deep"}`}>{teacher.fullName}</h3>

        <p className="flex items-center gap-2 text-sm text-green-deep/60">
          <BookOpen className="size-4 text-gold-deep" />
          {subjectName || teacher.specialization || "—"}
        </p>

        {teacher.specialization && (
          <span className="border border-gold/30 bg-ivory px-3 py-1 text-xs font-bold text-green-deep">{teacher.specialization}</span>
        )}

        {teacher.bio && <p className="line-clamp-2 max-w-[11rem] text-xs leading-6 text-green-deep/60">{teacher.bio}</p>}

        <div className="mt-auto flex w-full flex-col gap-4 pt-2">
          <p className="flex items-center justify-center gap-2 border-t border-gold/25 pt-4 text-xs text-green-deep/60">
            <Mail className="size-3.5 shrink-0 text-gold-deep" />
            <span dir="ltr" className="truncate">{teacher.email || "—"}</span>
          </p>

          {isArchived ? (
            <IconButton icon={RefreshCw} loading={busy} onClick={() => onUnarchive(teacher.id)} className="w-full">
              {t("teachers.restore")}
            </IconButton>
          ) : (
            <InlineConfirm
              open={confirmingPay}
              busy={paying}
              warning={t("teachers.payoutCard.payNowConfirm")}
              confirmLabel={t("teachers.payoutCard.confirm")}
              cancelLabel={t("teachers.footer.cancel")}
              onConfirm={() => onConfirmPay(teacher.id)}
              onCancel={onCancelPay}
            >
              <IconButton icon={Wallet} onClick={() => onPayNow(teacher.id)} className="w-full">
                {t("teachers.payoutCard.payNow")}
              </IconButton>
            </InlineConfirm>
          )}
        </div>
      </div>
    </Reveal>
  );
}
