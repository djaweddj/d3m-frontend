import { motion } from "framer-motion";
import AnimatedText from "./AnimatedText";
import { Diamond, ColumnMark, CrescentStar } from "./Marks";
import { useCountUp, formatNumber } from "./useCountUp";

const rise = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

function Stat({ value, label, loading, locale }) {
  const { display, ref } = useCountUp(loading ? null : value);
  return (
    <div ref={ref}>
      <dt className="font-display text-2xl tabular-nums text-gold sm:text-3xl">
        {loading ? "…" : <>{formatNumber(display, locale)}+</>}
      </dt>
      <dd className="mt-1 text-xs text-ivory/55">{label}</dd>
    </div>
  );
}

export default function Hero({
  logo, badge, line1, highlight, line2, subtitle,
  stats = [], loading, locale, children,
}) {
  return (
    <section className="relative overflow-hidden bg-green-deep pb-24 pt-32 sm:pb-32">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.10]" />
      <div className="pointer-events-none absolute -top-40 start-1/4 size-[36rem] rounded-full bg-gold/10 blur-[130px]" />
      <ColumnMark className="pointer-events-none absolute -bottom-6 start-6 h-64 text-gold/10" />

      <div className="container relative mx-auto grid items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="text-center lg:text-start">
          <motion.span
            {...rise(0.1)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs text-gold"
          >
            <Diamond className="size-2" />
            {badge}
          </motion.span>

          <h1 className="mt-7 font-display text-4xl leading-[1.25] text-ivory sm:text-6xl lg:text-[4.2rem]">
            <AnimatedText text={line1} delay={0.2} />
            <AnimatedText text={highlight} delay={0.4} className="text-gold" />
            <br />
            <AnimatedText text={line2} delay={0.6} />
          </h1>

          <motion.p
            {...rise(0.7)}
            className="mx-auto mt-6 max-w-xl text-base leading-9 text-ivory/70 sm:text-lg lg:mx-0"
          >
            {subtitle}
          </motion.p>

          <motion.div
            {...rise(0.85)}
            className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
          >
            {children}
          </motion.div>

          <motion.dl
            {...rise(1)}
            className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ivory/10 pt-8 lg:mx-0"
          >
            {stats.map((s) => (
              <Stat key={s.label} {...s} loading={loading} locale={locale} />
            ))}
          </motion.dl>
        </div>

        <motion.div {...rise(0.3)} className="relative mx-auto w-full max-w-md">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="relative bg-ivory p-10 shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] ring-1 ring-gold/30"
          >
            <div className="absolute inset-3 border border-gold/25" />
            <img src={logo} alt="Numeria Academy" className="relative mx-auto w-full object-contain" />
          </motion.div>
          <CrescentStar className="absolute -top-6 -start-6 size-16 text-algeria-red/70" />
        </motion.div>
      </div>
    </section>
  );
}