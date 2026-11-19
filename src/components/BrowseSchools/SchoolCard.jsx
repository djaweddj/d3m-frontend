import { useState } from "react";
import { Building2, MapPin, Mail, Phone, Users, BookOpen } from "lucide-react";
import Reveal from "../home/Reveal";
import NButton from "../home/NButton"
import StatusBadge from "./StatusBadge";
import { useLanguage } from "../../context/LanguageContext";

export default function SchoolCard({ school, delay = 0 }) {
  const { t } = useLanguage();
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = school.logoUrl && !logoFailed;

  return (
    <Reveal delay={delay} className="h-full">
      <article className="group flex h-full flex-col border border-gold/25 bg-white p-6 transition duration-500 hover:-translate-y-1 hover:border-gold">
        <div className="mb-5 flex items-start justify-between gap-3">
          {showLogo ? (
            <span className="grid size-16 shrink-0 place-items-center rounded-sm border border-gold/25 bg-ivory">
              <img
                src={school.logoUrl}
                alt={school.schoolName}
                onError={() => setLogoFailed(true)}
                className="size-14 object-contain"
              />
            </span>
          ) : (
            <span className="grid size-16 shrink-0 place-items-center rounded-sm bg-green-deep text-gold transition-colors group-hover:bg-gold group-hover:text-green-deep">
              <Building2 className="size-7" strokeWidth={1.5} />
            </span>
          )}
          <StatusBadge status={school.status} />
        </div>

        <h3 className="mb-3 font-display text-xl text-green-deep">{school.schoolName}</h3>

        <ul className="mb-6 space-y-2 text-sm text-green-deep/60">
          <li className="flex items-center gap-2 font-semibold text-green-deep/80">
            <MapPin className="size-4 shrink-0 text-gold-deep" />
            <span className="truncate">{[school.wilaya, school.commune].filter(Boolean).join(" - ")}</span>
          </li>
          {school.email && (
            <li className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-gold-deep" />
              <span dir="ltr" className="truncate">{school.email}</span>
            </li>
          )}
          {school.phone && (
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-gold-deep" />
              <span dir="ltr">{school.phone}</span>
            </li>
          )}
        </ul>

        <div className="mt-auto flex flex-col gap-4 border-t border-gold/25 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 text-sm font-bold text-green-deep">
            <p className="flex items-center gap-2">
              <Users className="size-4 text-gold-deep" />
              {t("browseSchools.card.teachersCount", { count: school.totalTeachers })}
            </p>
            <p className="flex items-center gap-2">
              <BookOpen className="size-4 text-gold-deep" />
              {t("browseSchools.card.modulesCount", { count: school.totalModules })}
            </p>
          </div>
          <NButton to={`/schools/${school.schoolId}`} className="w-full sm:w-auto">
            {t("browseSchools.card.viewDetails")}
          </NButton>
        </div>
      </article>
    </Reveal>
  );
}