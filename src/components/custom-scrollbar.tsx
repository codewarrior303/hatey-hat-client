"use client";

import * as React from "react";

/**
 * CustomScrollbar – Floating Apple / Modern Capsule Scrollbar (Style 3)
 * - Completely replaces the browser's native scrollbar across all OSes (Linux, Windows, macOS)
 * - Proportional capsule pill floating cleanly on the right edge
 * - Auto-hiding: Completely invisible when idle, smoothly reveals on scroll, fades out after 1.2s
 * - Supports dragging and click-to-scroll
 * - Seamlessly syncs with Light (charcoal) and Dark (frosted white) themes
 */
export function CustomScrollbar() {
  const [thumbHeight, setThumbHeight] = React.useState(48);
  const [thumbTop, setThumbTop] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const isDraggingRef = React.useRef(false);
  const startDragYRef = React.useRef(0);
  const startScrollTopRef = React.useRef(0);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollbar = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // If page content fits on screen without scrolling, don't show
    if (docHeight <= winHeight + 10) {
      setThumbHeight(0);
      return;
    }

    // Available track height with 8px top/bottom margin
    const trackHeight = winHeight - 16;
    const calculatedHeight = Math.max(36, Math.min(trackHeight * 0.7, (winHeight / docHeight) * trackHeight));
    setThumbHeight(calculatedHeight);

    const maxScroll = docHeight - winHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const maxTop = trackHeight - calculatedHeight;
    setThumbTop(scrollRatio * maxTop);
  }, []);

  const triggerVisibility = React.useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && !isHovered) {
        setIsVisible(false);
      }
    }, 1200);
  }, [isHovered]);

  React.useEffect(() => {
    updateScrollbar();

    const handleScroll = () => {
      updateScrollbar();
      triggerVisibility();
    };

    const handleResize = () => {
      updateScrollbar();
    };

    // Show when cursor hovers near the rightmost 24px of the screen
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth - e.clientX <= 24) {
        triggerVisibility();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Periodically sync scroll metrics in case of dynamic image/content loading
    const interval = setInterval(updateScrollbar, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [updateScrollbar, triggerVisibility]);

  // Thumb dragging logic
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startDragYRef.current = e.clientY;
    startScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
    setIsVisible(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = moveEvent.clientY - startDragYRef.current;
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const trackHeight = winHeight - 16;
      const maxTop = trackHeight - thumbHeight;
      const maxScroll = docHeight - winHeight;

      if (maxTop > 0 && maxScroll > 0) {
        const scrollDelta = (deltaY / maxTop) * maxScroll;
        window.scrollTo({
          top: startScrollTopRef.current + scrollDelta,
          behavior: "instant" as ScrollBehavior,
        });
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      triggerVisibility();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Track click to jump
  const handleTrackClick = (e: React.MouseEvent) => {
    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = trackRect.height;
    const docHeight = document.documentElement.scrollHeight;
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;

    const targetRatio = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / (trackHeight - thumbHeight)));
    window.scrollTo({
      top: targetRatio * maxScroll,
      behavior: "smooth",
    });
  };

  if (thumbHeight === 0) return null;

  const show = isVisible || isHovered || isDraggingRef.current;

  return (
    <div
      role="scrollbar"
      aria-controls="main-content"
      aria-valuenow={thumbTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        triggerVisibility();
      }}
      onClick={handleTrackClick}
      className={`fixed right-1.5 top-2 bottom-2 w-3 z-[9999] pointer-events-auto transition-opacity duration-300 select-none ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Floating Capsule Thumb (Style 3: rounded pill with light/dark theme reactive styling) */}
      <div
        onMouseDown={handleThumbMouseDown}
        style={{
          height: `${thumbHeight}px`,
          transform: `translateY(${thumbTop}px)`,
        }}
        className="w-1.5 hover:w-2 mx-auto rounded-full cursor-pointer transition-all duration-150 shadow-sm
          bg-neutral-800/40 hover:bg-neutral-900/70 active:bg-neutral-950/90
          dark:bg-white/40 dark:hover:bg-white/70 dark:active:bg-white/90
          backdrop-blur-md"
      />
    </div>
  );
}
