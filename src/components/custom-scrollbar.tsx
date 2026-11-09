"use client";

import * as React from "react";

/**
 * CustomScrollbar – Floating Capsule Scrollbar (Style 3)
 * - Completely replaces the browser's native scrollbar across all OSes (Linux, Windows, macOS)
 * - Proportional capsule pill floating cleanly on the right edge
 * - Auto-hiding: Completely invisible when idle, smoothly reveals on scroll, fades out after 1.2s
 * - Supports dragging and click-to-scroll with wide, responsive grab target
 * - Seamlessly syncs with Light (charcoal) and Dark (frosted white) themes
 */
export function CustomScrollbar() {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [thumbHeight, setThumbHeight] = React.useState(48);
  const [thumbTop, setThumbTop] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const startDragYRef = React.useRef(0);
  const startScrollTopRef = React.useRef(0);
  const didDragRef = React.useRef(false);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    // Mount custom scrollbar across all screens
    if (typeof window !== "undefined") {
      setIsDesktop(true);
    }
  }, []);

  const updateScrollbar = React.useCallback(() => {
    if (typeof window === "undefined" || !isDesktop) return;

    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const winHeight = window.innerHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // If page content fits on screen without meaningful scrolling (within 40px), don't show
    if (docHeight <= winHeight + 40) {
      setThumbHeight(0);
      return;
    }

    // Available track height with 12px top/bottom margin
    const trackHeight = winHeight - 24;
    const calculatedHeight = Math.max(40, Math.min(trackHeight * 0.7, (winHeight / docHeight) * trackHeight));
    setThumbHeight(calculatedHeight);

    const maxScroll = docHeight - winHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const maxTop = trackHeight - calculatedHeight;
    setThumbTop(scrollRatio * maxTop);
  }, [isDesktop]);

  const triggerVisibility = React.useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isDragging && !isHovered) {
        setIsVisible(false);
      }
    }, 1200);
  }, [isDragging, isHovered]);

  React.useEffect(() => {
    updateScrollbar();

    const handleScroll = () => {
      updateScrollbar();
      triggerVisibility();
    };

    const handleResize = () => {
      updateScrollbar();
    };

    // Show when cursor hovers near the rightmost 32px of the screen
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth - e.clientX <= 32) {
        triggerVisibility();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Periodically sync scroll metrics in case of dynamic image/content loading
    const interval = setInterval(updateScrollbar, 800);

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
    didDragRef.current = false;
    setIsDragging(true);
    startDragYRef.current = e.clientY;
    startScrollTopRef.current = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    setIsVisible(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      didDragRef.current = true;
      const deltaY = moveEvent.clientY - startDragYRef.current;
      const winHeight = window.innerHeight;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const trackHeight = winHeight - 24;
      const maxTop = trackHeight - thumbHeight;
      const maxScroll = docHeight - winHeight;

      if (maxTop > 0 && maxScroll > 0) {
        const scrollDelta = (deltaY / maxTop) * maxScroll;
        const targetScroll = Math.max(0, Math.min(maxScroll, startScrollTopRef.current + scrollDelta));
        window.scrollTo(0, targetScroll);
        document.documentElement.scrollTop = targetScroll;
        document.body.scrollTop = targetScroll;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      triggerVisibility();
      setTimeout(() => {
        didDragRef.current = false;
      }, 60);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Track click to jump
  const handleTrackClick = (e: React.MouseEvent) => {
    // If mouse was dragging, ignore track click
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const trackRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = trackRect.height;
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const winHeight = window.innerHeight;
    const maxScroll = docHeight - winHeight;

    if (maxScroll <= 0) return;

    const targetRatio = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / (trackHeight - thumbHeight)));
    window.scrollTo({
      top: targetRatio * maxScroll,
      behavior: "smooth",
    });
  };

  if (!isDesktop || thumbHeight === 0) return null;

  const show = isVisible || isHovered || isDragging;

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
      className={`fixed right-0.5 sm:right-1.5 top-2 bottom-2 w-3 sm:w-4 z-[9999] pointer-events-auto transition-opacity duration-300 select-none flex flex-col justify-start items-center ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Floating Capsule Thumb with forgiving grab hit-area */}
      <div
        onMouseDown={handleThumbMouseDown}
        style={{
          height: `${thumbHeight}px`,
          transform: `translateY(${thumbTop}px)`,
        }}
        className="w-full flex items-center justify-center cursor-pointer group"
      >
        <div
          className="w-1 sm:w-1.5 group-hover:w-2 h-full rounded-full transition-all duration-150 shadow-sm
            bg-neutral-800/40 group-hover:bg-neutral-900/70 group-active:bg-neutral-950/90
            dark:bg-white/40 dark:group-hover:bg-white/70 dark:group-active:bg-white/90
            backdrop-blur-md"
        />
      </div>
    </div>
  );
}
