"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";

import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

/* ------------------ CONSTANTS ------------------ */

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/* ------------------ CONTEXT ------------------ */

const SidebarContext = React.createContext(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

/* ------------------ PROVIDER ------------------ */

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const open = openProp ?? internalOpen;
  const setOpen = React.useCallback(
    (value) => {
      const next =
        typeof value === "function" ? value(open) : value;

      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${next}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [open, onOpenChange]
  );

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v);
    else setOpen((v) => !v);
  }, [isMobile, setOpen]);

  const state = open ? "expanded" : "collapsed";

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
      state,
    }),
    [open, openMobile, isMobile, toggleSidebar, state]
  );

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider>
        <div
          className={cn("flex min-h-screen w-full", className)}
          style={style}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

/* ------------------ SIDEBAR ------------------ */

function Sidebar({ children }) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="sr-only">Sidebar</SheetHeader>
          <div className="h-full flex flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden md:flex h-full w-64 flex-col border-r">
      {children}
    </div>
  );
}

/* ------------------ TRIGGER ------------------ */

function SidebarTrigger({ className, ...props }) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={toggleSidebar}
      {...props}
    >
      <PanelLeftIcon />
    </Button>
  );
}

/* ------------------ MENU BUTTON ------------------ */

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 rounded-md p-2 text-sm transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-accent",
        outline: "border",
      },
      size: {
        default: "h-8",
        sm: "h-7",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  tooltip,
  className,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const { state, isMobile } = useSidebar();

  const button = (
    <Comp
      className={cn(
        sidebarMenuButtonVariants(),
        isActive && "bg-accent",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        hidden={state !== "collapsed" || isMobile}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------ EXPORTS ------------------ */

export {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuButton,
  useSidebar,
};