"use client";

import * as React from "react";

/**
 * InteractionProtection
 * - Prevents dragging any element (images, links, text) to other tabs/windows or desktop
 * - Preserves standard mouse text drag-selection and keyboard text copy (Ctrl+C / Cmd+C)
 * - Disables context-menu / copying / saving on all images (img)
 */
export function InteractionProtection() {
  React.useEffect(() => {
    // Prevent dragging elements across or out of the browser tab
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent dropping dragged external items
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent context menu (right click) on images to protect photos from being copied/saved
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "IMG" ||
          target.closest("img") ||
          target.tagName === "PICTURE" ||
          target.getAttribute("role") === "img")
      ) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener("dragstart", handleDragStart, { capture: true });
    window.addEventListener("drop", handleDrop, { capture: true });
    document.addEventListener("contextmenu", handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
      window.removeEventListener("drop", handleDrop, { capture: true });
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true });
    };
  }, []);

  return null;
}
