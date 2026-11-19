import { motion } from "framer-motion";

export default function ProgressBar({ value, full = false }) {
  return (
    <div className="h-1.5 overflow-hidden bg-sand">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full ${full ? "bg-algeria-red" : "bg-gold"}`}
      />
    </div>
  );
}