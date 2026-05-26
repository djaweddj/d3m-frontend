"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue = [50],
  value,
  min = 0,
  max = 100,
  step = 1,
  ...props
}) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className
      )}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full bg-black" />
      </SliderPrimitive.Track>

      {Array.from({ length: (value ?? defaultValue).length }).map(
        (_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className="block h-4 w-4 rounded-full border bg-white shadow"
          />
        )
      )}
    </SliderPrimitive.Root>
  );
}

export { Slider };