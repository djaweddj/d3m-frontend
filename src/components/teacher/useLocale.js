import { useLanguage } from "../../context/LanguageContext";
import { LOCALE_MAP } from "../../i18n/translations"; // adjust path if needed

export default function useLocale() {
  const { lang } = useLanguage();
  return LOCALE_MAP[lang] ?? "en-US";
}
