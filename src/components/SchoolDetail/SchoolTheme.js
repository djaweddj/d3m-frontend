const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** Samples a logo and returns its average "meaningful" colour as [r, g, b]
 *  (ignores transparent, near-white and near-black pixels). */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue;
          const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          if (lum > 240 || lum < 15) continue;
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        if (!n) return reject(new Error("No usable pixels in logo"));
        resolve([r / n, g / n, b / n]);
      } catch (e) {
        reject(e); // CORS-tainted canvas
      }
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h / 6, s, l };
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Turns a sampled logo colour into overrides for the design-system tokens that
 *  drive the dark surfaces. Gold / ivory / red stay untouched.
 *  Returns null for near-grayscale logos (hue is meaningless) -> brand default. */
export function schoolThemeVars([r, g, b]) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 0.06) return null;
  const sat = clamp(s, 0.28, 0.7);
  const deep = clamp(l * 0.45, 0.09, 0.15);
  return {
    "--color-green-deep": hslToHex(h, sat, deep),
    "--color-green-soft": hslToHex(h, sat, deep + 0.07),
  };
}