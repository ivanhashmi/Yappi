import React from "react";

/**
 * Standard 3-Variant Button System
 * - Variants: "primary", "secondary", "ghost"
 * - Sizes: "sm" (36px h, 44px touch-safe), "md" (44px h), "lg" (48px h), "icon" (44x44px)
 * - Full states: hover, pressed (scale 0.98), focus-visible ring, disabled, loading
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ariaLabel,
  ...rest
}) {
  const baseClasses =
    "press-scale relative inline-flex items-center justify-center font-medium rounded-2xl cursor-pointer select-none transition-all " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizeClasses = {
    sm: "min-h-[44px] px-3.5 py-1.5 text-caption",
    md: "min-h-[44px] px-4 py-2.5 text-body font-medium",
    lg: "min-h-[48px] px-5 py-3 text-body font-semibold",
    icon: "w-11 h-11 min-h-[44px] min-w-[44px] p-2.5",
  }[size] || "min-h-[44px] px-4 py-2.5 text-body";

  const variantClasses = {
    primary:
      "bg-accent text-accent-contrast hover:bg-accent-hover shadow-xs border border-transparent",
    secondary:
      "bg-subtle text-primary hover:bg-muted border border-hairline",
    ghost:
      "bg-transparent text-primary hover:bg-subtle border border-transparent",
  }[variant] || "bg-accent text-accent-contrast";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="sr-only">Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
