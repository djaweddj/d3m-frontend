import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export default function Toast({ message, type = "success" }) {
  const ok = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role="status" aria-live="polite"
      className={`fixed inset-x-4 bottom-8 z-[400] mx-auto w-fit max-w-full overflow-hidden border border-gold/40 text-ivory shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)] ${
        ok ? "bg-green-deep" : "bg-algeria-red"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3.5 text-sm">
        <span className={`grid size-6 shrink-0 place-items-center rounded-sm ${ok ? "bg-gold text-green-deep" : "bg-ivory text-algeria-red"}`}>
          {ok ? <Check className="size-4" /> : <X className="size-4" />}
        </span>
        {message}
      </div>
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: 3.5, ease: "linear" }}
        className="h-0.5 origin-left bg-gold rtl:origin-right"
      />
    </motion.div>
  );
}