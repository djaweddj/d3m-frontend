import { useEffect } from "react";

export default function useAccent(color) {
  useEffect(() => {
    if (!color) return;
    document.documentElement.style.setProperty("--color-accent", color);
    return () => document.documentElement.style.removeProperty("--color-accent");
  }, [color]);
}