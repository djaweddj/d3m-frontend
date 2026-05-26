"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";

/* ---------------- Context ---------------- */

const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within ChartContainer");
  }
  return context;
}

/* ---------------- Container ---------------- */

export function ChartContainer({
  id,
  className,
  children,
  config = {},
  ...props
}) {
  const chartId = React.useId();

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart-id={id || chartId}
        className={cn("flex justify-center text-xs", className)}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height={300}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/* ---------------- Tooltip ---------------- */

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "rounded-md border bg-background p-2 text-xs shadow",
        className
      )}
    >
      {label && (
        <div className="mb-1 font-medium">{label}</div>
      )}

      <div className="grid gap-1">
        {payload.map((item, i) => (
          <div
            key={i}
            className="flex justify-between gap-4"
          >
            <span className="text-muted-foreground">
              {item.name}
            </span>
            <span className="font-mono font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Legend ---------------- */

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex justify-center gap-4 pt-2 text-xs">
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Style (safe version) ---------------- */

export function ChartStyle() {
  return null;
}