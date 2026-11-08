"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  threshold = 0.05,
  className,
  ...props
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // If IntersectionObserver is not supported, stay visible
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px 80px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const getInitialStyle = () => {
    switch (direction) {
      case "up":
        return "opacity-0 translate-y-6";
      case "down":
        return "opacity-0 -translate-y-6";
      case "left":
        return "opacity-0 translate-x-6";
      case "right":
        return "opacity-0 -translate-x-6";
      case "fade":
      default:
        return "opacity-0";
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? "opacity-100 translate-x-0 translate-y-0" : getInitialStyle(),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
