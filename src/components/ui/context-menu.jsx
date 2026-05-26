"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

/* ---------------- Root ---------------- */

export function ContextMenu(props) {
  return <ContextMenuPrimitive.Root {...props} />;
}

export function ContextMenuTrigger(props) {
  return <ContextMenuPrimitive.Trigger {...props} />;
}

export function ContextMenuGroup(props) {
  return <ContextMenuPrimitive.Group {...props} />;
}

export function ContextMenuPortal(props) {
  return <ContextMenuPrimitive.Portal {...props} />;
}

export function ContextMenuSub(props) {
  return <ContextMenuPrimitive.Sub {...props} />;
}

export function ContextMenuRadioGroup(props) {
  return <ContextMenuPrimitive.RadioGroup {...props} />;
}

/* ---------------- Sub Trigger ---------------- */

export function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

/* ---------------- Sub Content ---------------- */

export function ContextMenuSubContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.SubContent
      className={cn(
        "min-w-[180px] rounded-md border bg-popover p-1 shadow-md",
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Content ---------------- */

export function ContextMenuContent({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        className={cn(
          "z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}

/* ---------------- Item ---------------- */

export function ContextMenuItem({
  className,
  inset,
  variant,
  ...props
}) {
  return (
    <ContextMenuPrimitive.Item
      data-variant={variant}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
        inset && "pl-8",
        variant === "destructive" && "text-red-500",
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Checkbox ---------------- */

export function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-accent",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

/* ---------------- Radio ---------------- */

export function ContextMenuRadioItem({
  className,
  children,
  ...props
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-accent",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="h-2 w-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

/* ---------------- Label ---------------- */

export function ContextMenuLabel({ className, inset, ...props }) {
  return (
    <ContextMenuPrimitive.Label
      className={cn(
        "px-2 py-1.5 text-sm font-medium",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Separator ---------------- */

export function ContextMenuSeparator({ className, ...props }) {
  return (
    <ContextMenuPrimitive.Separator
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/* ---------------- Shortcut ---------------- */

export function ContextMenuShortcut({ className, ...props }) {
  return (
    <span
      className={cn(
        "ml-auto text-xs text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}