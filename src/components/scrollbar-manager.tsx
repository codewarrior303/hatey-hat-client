"use client";

import * as React from "react";

/**
 * ScrollbarManager manages the auto-hiding behavior of the custom floating scrollbar.
 * - Remains invisible when idle (no scroll, no interaction).
 * - Smoothly appears when user starts scrolling.
 * - Fades away smoothly after scrolling stops (1.2s timeout).
 * - Also becomes visible when user hovers near the right scroll area for easy dragging.
 */
export function ScrollbarManager() {
  React.useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const htmlEl = document.documentElement;

    const showScrollbar = () => {
      htmlEl.classList.add("is-scrolling");
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        htmlEl.classList.remove("is-scrolling");
      }, 1200);
    };

    const handleScroll = () => {
      showScrollbar();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // If cursor is within 16px of the right edge, reveal the scrollbar thumb for easy clicking/dragging
      if (window.innerWidth - e.clientX <= 16) {
        showScrollbar();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
      htmlEl.classList.remove("is-scrolling");
    };
  }, []);

  return null;
}
