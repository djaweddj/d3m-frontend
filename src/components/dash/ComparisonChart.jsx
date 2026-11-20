import { useEffect, useRef } from "react";
import { parseYM, fmtMoneyShort } from "./dashUtils";

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Any CSS colour (hex, oklch, ...) -> rgba string with the given alpha
const toRgba = (color, a) => {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgba(${r},${g},${b},${a})`;
};

// Collected vs school part, per month
export default function ComparisonChart({ data, highlightIndex, t, months, locale, dir }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  const ymShortLabel = ({ m }) => months[m - 1].slice(0, 4);

  useEffect(() => {
    if (!ref.current || !window.Chart || !data.length) return;
    chartRef.current?.destroy();

    const labels = data.map((d) => ymShortLabel(parseYM(d.period)));
    const collected = data.map((d) => d.totalCollected ?? 0);
    const schoolPart = data.map((d) => d.schoolPart ?? 0);
    const isRTL = dir === "rtl";
    const isMobile = window.innerWidth < 640;

    // Site tokens (fallbacks only if the variables are missing)
    const green = css("--color-green-deep") || "#0B3D2E";
    const gold = css("--color-gold") || "#C9A24B";
    const family = getComputedStyle(document.body).fontFamily;

    chartRef.current = new window.Chart(ref.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: t("dashboard.chart.incomeLabel"),
            data: collected,
            backgroundColor: collected.map((_, i) => (i === highlightIndex ? green : toRgba(green, 0.25))),
            borderRadius: 2,
            borderSkipped: false,
            maxBarThickness: isMobile ? 18 : 26,
          },
          {
            label: t("dashboard.schoolInfo.monthIncome"),
            data: schoolPart,
            backgroundColor: schoolPart.map((_, i) => (i === highlightIndex ? gold : toRgba(gold, 0.4))),
            borderRadius: 2,
            borderSkipped: false,
            maxBarThickness: isMobile ? 18 : 26,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { family, size: isMobile ? 10 : 11 },
              boxWidth: 10,
              boxHeight: 10,
              padding: isMobile ? 10 : 14,
              usePointStyle: true,
              pointStyle: "rectRot",
            },
          },
          tooltip: {
            rtl: isRTL,
            titleFont: { family },
            bodyFont: { family },
            callbacks: {
              label: (v) => `${v.dataset.label}: ${v.raw.toLocaleString(locale)}${t("dashboard.currencySuffix")}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { family, size: isMobile ? 9 : 11 } },
            grid: { display: false },
            border: { display: false },
          },
          y: {
            ticks: { font: { family, size: 10 }, callback: (v) => fmtMoneyShort(v, locale) },
            grid: { color: toRgba(green, 0.08) },
            border: { display: false },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data, highlightIndex, locale, dir]); // eslint-disable-line

  return <div className="relative h-52 w-full sm:h-64"><canvas ref={ref} /></div>;
}