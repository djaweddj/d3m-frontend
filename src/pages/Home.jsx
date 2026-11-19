import { useState, useEffect } from "react";
import { motion, MotionConfig } from "framer-motion";
import heroLogo from "../assets/herologo.png";
import {
  School, Users, MapPin, ArrowLeft, ArrowRight, Shield,
  TrendingUp, Clock, PresentationIcon, CheckCircle2, Search, X,
  Award, Heart, Mail, Phone,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import Reveal from "../components/home/Reveal";
import AnimatedText from "../components/home/AnimatedText";
import { formatNumber } from "../components/home/useCountUp";
import SectionHeader from "../components/home/SectionHeader";
import NButton from "../components/home/NButton";
import FeatureCard from "../components/home/FeatureCard";
import StatCard from "../components/home/StatCard";
import CtaBand from "../components/home/CtaBand";
import Footer from "../components/home/Footer";
import Hero from "../components/home/Hero";

// ─── API config ───────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ─── Home page ────────────────────────────────────────────
export default function Home() {
  const LOCALE_MAP = {
    en: "en-US",
    ar: "ar-DZ",
    fr: "fr-FR",
  };
  const { t, dir, language } = useLanguage();
  const isRtl = dir === "rtl";
  const locale = LOCALE_MAP[language] || "en-US";
  // Trailing arrow on primary CTAs should point toward reading-end: left in RTL, right in LTR.
  const TrailingArrow = isRtl ? ArrowLeft : ArrowRight;

  const [stats, setStats] = useState({ schools: null, students: null, teachers: null });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(false);
        const res = await fetch(`${API_BASE_URL}/api/home`);
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setStats({
            schools: data.schools ?? 0,
            students: data.students ?? 0,
            teachers: data.teachers ?? 0,
          });
        }
      } catch (err) {
        if (!cancelled) setStatsError(true);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  // "How it works" 3-step section and the scroll-hint copy have no keys yet in the
  // `home` namespace — plugging in a home.howItWorks.* / home.hero.scrollHint shape here.
  const howItWorks = t("home.howItWorks") && typeof t("home.howItWorks") === "object"
    ? t("home.howItWorks")
    : {
        tag: t("home.strategy.question"),
        title: t("home.strategy.title"),
        subtitle: t("home.strategy.subtitle"),
        steps: [
          { title: t("home.strategy.search"), desc: t("home.strategy.searchP") },
          { title: t("home.strategy.compare"), desc: t("home.strategy.compareP") },
          { title: t("home.strategy.register"), desc: t("home.strategy.registerP") },
        ],
      };
  const featureItems = t("home.features.items");
  const featureIcons = [Shield, Clock, TrendingUp, Award, Heart, MapPin];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen overflow-x-hidden bg-ivory font-body text-green-deep" dir={dir}>

      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* ── Hero ── */}
      <Hero
        logo={heroLogo}
        badge={t("home.hero.badge")}
        line1={t("home.hero.titleLine1")}
        highlight={t("home.hero.titleHighlight")}
        line2={t("home.hero.titleLine2")}
        subtitle={t("home.hero.subtitle")}
        loading={statsLoading}
        locale={locale}
        stats={[
          { value: stats.schools, label: t("home.badges.schools") },
          { value: stats.students, label: t("home.badges.students") },
          { value: stats.teachers, label: t("home.badges.teachers") },
        ]}
      >
        <NButton to="/schools" variant="gold" className="h-14">
          <Search className="size-4" />
          {t("home.hero.ctaBrowse")}
          <TrailingArrow className="size-4" />
        </NButton>
        <NButton to="/schoolregister" variant="outlineLight" className="h-14">
          {t("home.hero.ctaRegister")}
        </NButton>
      </Hero>

      {/* ── Features ── */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            tag={t("home.features.tag")}
            title={t("home.features.title")}
            subtitle={t("home.features.subtitle")}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map((item, i) => (
              <FeatureCard
                key={i}
                icon={featureIcons[i] || Shield}
                title={item.title}
                desc={item.desc}
                delay={i * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (live from API) ── */}
      <section className="relative overflow-hidden border-y border-gold/20 bg-white py-20 sm:py-28">
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag={t("home.stats.tag")} title={t("home.stats.title")} />

          {statsError ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-md rounded-2xl border border-[#C53030]/25 bg-[#C53030]/8 px-6 py-5 text-center"
            >
              <div className="mb-2 flex justify-center">
                <X className="h-8 w-8 text-[#C53030]/70" />
              </div>
              <p className="text-sm font-medium text-[#C53030]">
                {t("home.stats.error")}
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={School} value={stats.schools} label={t("home.stats.schools")} loading={statsLoading} delay={0} locale={locale} />
              <StatCard icon={Users} value={stats.students} label={t("home.stats.students")} loading={statsLoading} delay={0.15} locale={locale} />
              <StatCard icon={PresentationIcon} value={stats.teachers} label={t("home.stats.teachers")} loading={statsLoading} delay={0.3} locale={locale} />
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag={howItWorks.tag} title={howItWorks.title} subtitle={howItWorks.subtitle} />

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.steps.map((item, i) => {
              const StepIcon = [Search, TrendingUp, CheckCircle2][i] || Search;
              return (
                <Reveal key={i} delay={i * 0.15} className="group relative text-center">
                  {/* Connector line */}
                  {i < howItWorks.steps.length - 1 && (
                    <div className={`absolute top-12 ${isRtl ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"} hidden h-0.5 w-full md:block`}>
                      <div className="h-full w-full bg-gradient-to-r rtl:bg-gradient-to-l from-[#0F5A46]/25 to-transparent" />
                    </div>
                  )}

                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#0F5A46]/8 to-[#0F5A46]/15 text-[#0F5A46] shadow-lg shadow-[#0F5A46]/20 group-hover:shadow-[#0F5A46]/30 transition-shadow duration-500"
                  >
                    <StepIcon className="h-10 w-10" strokeWidth={1.5} />
                    <div className={`absolute -top-2 ${isRtl ? "-right-2" : "-left-2"} flex h-8 w-8 items-center justify-center rounded-full bg-[#0F5A46] text-xs font-bold text-white shadow-lg`}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </motion.div>
                  <h3 className="mb-2 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">{item.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <CtaBand tag={t("home.cta.tag")} title={t("home.cta.title")} subtitle={t("home.cta.subtitle")}>
        <NButton to="/schools" variant="gold">
          {t("home.cta.button")}
          <TrailingArrow className="size-4" />
        </NButton>
      </CtaBand>

      {/* ── Footer ── */}
      <Footer
        logo={heroLogo}
        name="Numeria Academy"
        rights={t("home.footer.rights")}
        contacts={[
          { href: "mailto:numeria.ac4demy@gmail.com", icon: Mail, label: "numeria.ac4demy@gmail.com" },
          { href: "tel:+213669210305", icon: Phone, label: "0669210305" },
          { href: "tel:+213554050620", icon: Phone, label: "0554050620" },
        ]}
        links={[
          { to: "/", label: t("home.footer.nav.home") },
          { to: "/schools", label: t("home.footer.nav.schools") },
          { to: "/login", label: t("home.footer.nav.login") },
        ]}
      />
    </div>
    </MotionConfig>
  );
}