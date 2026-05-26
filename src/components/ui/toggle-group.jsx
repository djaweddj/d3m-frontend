"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "./utils";
import { toggleVariants } from "./toggle";

/* ---------------- Context ---------------- */

const ToggleGroupContext = React.createContext({
  variant: "default",
  size: "default",
});

/* ---------------- Group ---------------- */

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn(
        "flex w-fit items-center rounded-md",
        className
      )}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

/* ---------------- Item ---------------- */

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}) {
  const context = React.useContext(ToggleGroupContext);

  const finalVariant = variant || context.variant;
  const finalSize = size || context.size;

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        toggleVariants({
          variant: finalVariant,
          size: finalSize,
        }),
        "min-w-0 flex-1 rounded-none shadow-none",
        className
      )}
      data-variant={finalVariant}
      data-size={finalSize}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };