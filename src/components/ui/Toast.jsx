import React, { useEffect } from "react";

/**
 * Calm Minimalist Floating Toast
 * - Floating status pill with glass blur & hairline border
 * - Smooth spring entrance & exit
 * - WCAG AA compliant typography & status indicators
 */
export default function Toast({
  message,
  type = "info", // "info" | "success" | "warning" | "error"
  isVisible,
  onDismiss,
  duration = 3200,
}) {
  useEffect(() => {
    if (!isVisible || !onDismiss) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss, duration]);

  if (!isVisible || !message) return null;

  const dotClasses = {
    info: "bg-accent",
    success: "bg-status-success",
    warning: "bg-status-warning",
    error: "bg-status-error",
  }[type] || "bg-accent";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface/95 dark:bg-surface/90 text-primary border border-hairline shadow-lg backdrop-blur-md transition-all duration-200"
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dotClasses}`} />
      <span className="text-caption font-medium">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 text-muted hover:text-primary text-overline font-bold p-1 cursor-pointer"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
