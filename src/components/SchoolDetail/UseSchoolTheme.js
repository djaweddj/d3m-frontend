import { useEffect, useState } from "react";
import { extractDominantColor, schoolThemeVars } from "../SchoolDetail/SchoolTheme";

// Returns a CSS-variable style object derived from the school logo (or undefined)
export default function useSchoolTheme(logoUrl) {
  const [vars, setVars] = useState(null);

  useEffect(() => {
    if (!logoUrl) { setVars(null); return; }
    let cancelled = false;
    extractDominantColor(logoUrl)
      .then((rgb) => !cancelled && setVars(schoolThemeVars(rgb)))
      .catch(() => !cancelled && setVars(null)); // e.g. CORS-blocked image -> brand default
    return () => { cancelled = true; };
  }, [logoUrl]);

  return vars ?? undefined;
}