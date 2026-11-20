import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, Check, ChevronDown, DollarSign, GraduationCap, Layers, Mail, MessageSquare, Phone, User, X,
} from "lucide-react";
import Reveal from "../home/Reveal";
import NButton from "../home/NButton";
import IconButton from "./IconButton";
import RequestStatusBadge from "./RequestStatusBadge";
import { InfoGroup, InfoRow } from "./InfoGroup";
import { useLanguage } from "../../context/LanguageContext";
import { LOCALE_MAP } from "../../i18n/translations"; // adjust path if needed

const Spinner = () => <span className="size-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />;

export default function RequestRow({ enrollment, index = 0, onApprove, onReject, approving }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((v) => !v);

  const name = enrollment.studentFullName ?? t("requests.studentFallback");
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const isPending = enrollment.status === "PENDING";

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString(LOCALE_MAP[lang] ?? "en-US", { year: "numeric", month: "long", day: "numeric" })
      : null;
  const requestedDate = formatDate(enrollment.createdAt);
  const reviewedDate = formatDate(enrollment.reviewedAt);

  // Never show the raw id: try the likely name fields, then fall back to subject + level
  const moduleLabel =
    enrollment.moduleName ??
    enrollment.groupName ??
    enrollment.module?.name ??
    ([enrollment.subjectName, enrollment.level].filter(Boolean).join(" · ") || null);
  const contactNumber = enrollment.parentPhone ?? enrollment.studentPhone;

  return (
    <Reveal delay={Math.min(index, 5) * 0.04}>
      <div className={`border bg-white transition duration-300 ${expanded ? "border-gold" : "border-gold/25 hover:border-gold/60"}`}>
        {/* Summary bar */}
        <div className="flex items-center gap-2 pe-3">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-4 p-4 text-start"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-green-deep font-display text-lg text-gold">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="truncate font-display text-lg text-green-deep">{name}</span>
                <RequestStatusBadge status={enrollment.status} />
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-green-deep/60">
                {moduleLabel && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-gold-deep" />{moduleLabel}
                  </span>
                )}
                {contactNumber && (
                  <span dir="ltr" className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-gold-deep" />{contactNumber}
                  </span>
                )}
              </span>
            </span>
          </button>

          {isPending && !expanded && (
            <div className="hidden gap-2 sm:flex">
              <IconButton icon={Check} variant="solid" label={t("requests.approve")} loading={approving} onClick={() => onApprove(enrollment.id)} />
              <IconButton icon={X} variant="danger" label={t("requests.reject")} onClick={() => onReject(enrollment)} />
            </div>
          )}

          <button type="button" onClick={toggle} tabIndex={-1} aria-hidden="true" className="grid size-8 shrink-0 place-items-center text-green-deep/50">
            <ChevronDown className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-6 border-t border-gold/25 bg-ivory p-4 sm:p-6">
                <InfoGroup title={t("requests.sectionStudentInfo")}>
                  <InfoRow icon={Mail} label={t("requests.fields.email")} value={enrollment.studentEmail} ltr />
                  <InfoRow icon={Layers} label={t("requests.fields.level")} value={enrollment.studentLevel} />
                </InfoGroup>

                {(enrollment.parentName || enrollment.parentPhone) && (
                  <InfoGroup title={t("requests.sectionParentInfo")}>
                    <InfoRow icon={User} label={t("requests.fields.parentName")} value={enrollment.parentName} />
                    <InfoRow icon={Phone} label={t("requests.fields.parentPhone")} value={enrollment.parentPhone} ltr />
                  </InfoGroup>
                )}

                <InfoGroup title={t("requests.sectionRequestDetails")}>
                  <InfoRow icon={BookOpen} label={t("requests.fields.module")} value={moduleLabel} />
                  <InfoRow icon={GraduationCap} label={t("requests.fields.subject")} value={enrollment.subjectName} />
                  <InfoRow icon={Layers} label={t("requests.fields.moduleLevel")} value={enrollment.level} />
                  <InfoRow
                    icon={DollarSign}
                    label={t("requests.fields.monthlyPrice")}
                    value={enrollment.monthlyPrice != null ? `${enrollment.monthlyPrice} ${t("requests.currency")}` : null}
                  />
                </InfoGroup>

                {enrollment.reviewComment && (
                  <p className="flex items-start gap-3 border border-algeria-red/30 bg-algeria-red/10 p-3 text-sm leading-7 text-algeria-red">
                    <MessageSquare className="mt-1 size-4 shrink-0" />
                    {enrollment.reviewComment}
                  </p>
                )}

                {(requestedDate || reviewedDate) && (
                  <p className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-green-deep/50">
                    {requestedDate && <span>{t("requests.requestedDate")} {requestedDate}</span>}
                    {reviewedDate && <span>{t("requests.reviewedDate")} {reviewedDate}</span>}
                  </p>
                )}

                {isPending && (
                  <div className="flex gap-3">
                    <NButton type="button" onClick={() => onApprove(enrollment.id)} disabled={approving} className="flex-1 px-4 disabled:cursor-not-allowed disabled:opacity-60">
                      {approving ? <Spinner /> : <Check className="size-4" />}
                      {t("requests.approve")}
                    </NButton>
                    <NButton type="button" variant="danger" onClick={() => onReject(enrollment)} className="flex-1 px-4">
                      <X className="size-4" />
                      {t("requests.reject")}
                    </NButton>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}