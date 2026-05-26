import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid gap-2 items-start",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "border-red-500 text-red-500 bg-card",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Alert({
  className,
  variant,
  ...props
}) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant }),
        className
      )}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground text-sm",
        className
      )}
      {...props}
    />
  );
}

export {
  Alert,
  AlertTitle,
  AlertDescription,
};