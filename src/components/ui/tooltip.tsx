"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({
  children,
  open,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>) {
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);

  React.useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        window.matchMedia("(hover: none), (pointer: coarse)").matches ||
        window.innerWidth < 1024;
      setIsTouchDevice(hasTouch);
    };

    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Suppress tooltips completely on touch devices (phones & tablets)
  if (isTouchDevice) {
    return (
      <TooltipPrimitive.Root open={false} {...props}>
        {children}
      </TooltipPrimitive.Root>
    );
  }

  return (
    <TooltipPrimitive.Root open={open} {...props}>
      {children}
    </TooltipPrimitive.Root>
  );
}

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-xl px-3.5 py-1.5 text-xs font-medium shadow-xl backdrop-blur-md",
        "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border border-white/10 dark:border-black/10",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "hidden md:block pointer-events-none select-none",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
