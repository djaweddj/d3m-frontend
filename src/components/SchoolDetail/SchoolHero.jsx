import { motion } from "framer-motion";
import { Landmark, MapPin } from "lucide-react";
import AnimatedText from "../home/AnimatedText";
import { ColumnMark } from "../home/Marks";
import StatusPill from "./StatusPill";

const rise = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function SchoolHero({ school }) {
  return (
    <section className="relative overflow-hidden bg-green-deep pb-16 pt-32 sm:pb-24">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.10]" />
      <div className="pointer-events-none absolute -top-40 start-1/4 size-[30rem] rounded-full bg-gold/10 blur-[130px]" />
      <ColumnMark className="pointer-events-none absolute -bottom-6 start-6 h-52 text-gold/10" />

      <div className="container relative mx-auto flex flex-wrap items-end justify-between gap-10 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-3xl">
          <motion.div {...rise(0.1)} className="flex flex-wrap items-center gap-3">
            <StatusPill status={school.subscriptionStatus} onDark />
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs text-gold">
              <MapPin className="size-3.5" />
              {school.wilaya}
            </span>
          </motion.div>

          <h1 className="mt-7 break-words font-display text-4xl leading-[1.25] text-ivory sm:text-6xl">
            <AnimatedText text={school.schoolName} delay={0.2} />
          </h1>

          <motion.p {...rise(0.5)} className="mt-5 flex items-center gap-2 text-base text-ivory/70">
            <Landmark className="size-5 shrink-0 text-gold" strokeWidth={1.5} />
            {school.wilaya} — {school.commune}
          </motion.p>
        </div>

        {school.logoUrl && (
          <motion.div
            {...rise(0.3)}
            className="relative hidden bg-ivory p-4 shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] ring-1 ring-gold/30 sm:block"
          >
            <div className="absolute inset-2 border border-gold/25" />
            <img src={school.logoUrl} alt={school.schoolName} className="relative size-28 object-contain" />
          </motion.div>
        )}
      </div>
    </section>
  );
}