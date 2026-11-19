import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function AnimatedText({ text, className = "", delay = 0 }) {
  const words = text.split(" ");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.08, ease: [0.215, 0.61, 0.355, 1] }}
          className="inline-block me-[0.25em]"
          style={{ transformOrigin: "bottom" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}