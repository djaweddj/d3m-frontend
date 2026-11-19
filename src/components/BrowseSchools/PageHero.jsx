import { motion } from "framer-motion";
import AnimatedText from "../home/AnimatedText";
import { ColumnMark } from "../home/Marks";

// Compact dark hero for inner pages (title, subtitle, slot for a search bar / actions)
export default function PageHero({ title, subtitle, children }) {
  return (
    <section className="relative overflow-hidden bg-green-deep pb-16 pt-32 text-center sm:pb-24">
      <div className="nm-pattern pointer-events-none absolute inset-0 opacity-[0.10]" />
      <div className="pointer-events-none absolute -top-40 start-1/4 size-[30rem] rounded-full bg-gold/10 blur-[130px]" />
      <ColumnMark className="pointer-events-none absolute -bottom-6 start-6 h-52 text-gold/10" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="mx-auto max-w-3xl font-display text-4xl leading-[1.25] text-ivory sm:text-6xl">
          <AnimatedText text={title} delay={0.1} />
        </h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-xl text-base leading-9 text-ivory/70 sm:text-lg"
          >
            {subtitle}
          </motion.p>
        )}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 max-w-2xl"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}