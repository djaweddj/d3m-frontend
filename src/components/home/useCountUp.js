import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export function useCountUp(value, duration = 2000) {
  const [display, setDisplay] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (value == null || !isInView) return;
    setHasStarted(true);
    let start = null;
    let raf;

    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setDisplay(value);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, isInView]);

  return { display, ref, hasStarted };
}

export function formatNumber(n, locale = "en-US") {
  if (n == null) return "—";
  return n.toLocaleString(locale);
}