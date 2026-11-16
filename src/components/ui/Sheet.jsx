import React, { useEffect, useRef } from "react";
import Button from "./Button";

/**
 * Bottom Sheet for Mobile & Centered Dialog on Desktop
 * - Frosted blur glass surface (`glass-sheet`)
 * - Spring entrance curve (250ms cubic-bezier(0.32, 0.72, 0, 1))
 * - Auto body scroll locking & Escape key listener
 */
export default function Sheet({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
  showClose = true,
  actionButton = null,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog sheet"}
    >
      <div
        ref={sheetRef}
        className={`w-full ${maxWidth} glass-sheet rounded-t-[28px] sm:rounded-3xl border-t sm:border border-hairline p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl transition-transform duration-250 ease-spring`}
      >
        {/* Subtle grab bar for mobile */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-hairline">
          {title ? (
            <h2 className="text-title font-semibold text-primary">{title}</h2>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {actionButton || (showClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                ariaLabel="Close sheet"
                className="text-muted hover:text-primary text-caption font-semibold"
              >
                Done
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 text-body text-primary">{children}</div>
      </div>
    </div>
  );
}
