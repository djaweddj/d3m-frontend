import { User, Mail, Phone, Home, MapPin } from "lucide-react";
import Reveal from "../home/Reveal";
import BlockHeading from "./BlockHeading";
import { useLanguage } from "../../context/LanguageContext";

export default function SchoolInfo({ school }) {
  const { t } = useLanguage();
  const items = [
    { icon: User, label: t("schoolDetails.info.owner"), value: school.ownerName },
    { icon: Mail, label: t("schoolDetails.info.email"), value: school.email, ltr: true },
    { icon: Phone, label: t("schoolDetails.info.phone"), value: school.phone, ltr: true },
    { icon: Home, label: t("schoolDetails.info.address"), value: school.address },
    { icon: MapPin, label: t("schoolDetails.info.wilaya"), value: `${school.wilaya} — ${school.commune}` },
  ];

  return (
    <Reveal>
      <div className="border border-gold/25 bg-white p-6 sm:p-8">
        <BlockHeading title={t("schoolDetails.info.title")} />
        <dl className="grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, label, value, ltr }) => (
            <div key={label} className="flex items-start gap-4 border border-gold/25 bg-ivory p-4 sm:last:col-span-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-green-deep text-gold">
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <dt className="text-xs font-bold text-green-deep/50">{label}</dt>
                <dd dir={ltr ? "ltr" : undefined} className="mt-1 break-words text-start text-sm font-semibold text-green-deep">
                  {value || "—"}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}