"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

export function Calendar({
  className,
  classNames = {},
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption:
          "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",

        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",

        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",

        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",

        day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",

        day_range_start:
          "bg-primary text-primary-foreground rounded-l-md",
        day_range_end:
          "bg-primary text-primary-foreground rounded-r-md",

        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "bg-accent text-accent-foreground",

        day_hidden: "invisible",

        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}