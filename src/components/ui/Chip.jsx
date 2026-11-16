import React from "react";

/**
 * Filter Chip & Scenario Tag
 * - Active / Inactive states with subtle 1px hairline border
 * - Minimum 44px touch target area
 * - Typography strictly 13px minimum (text-caption)
 */
export default function Chip({
  children,
  active = false,
  onClick,
  icon = null,
  className = "",
  ariaLabel,
  count = null,
  ...rest
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`press-scale inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-1.5 rounded-full text-caption font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
        active
          ? "bg-accent text-accent-contrast shadow-xs border border-transparent"
          : "bg-subtle text-muted hover:text-primary hover:bg-muted border border-hairline"
      } ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {count !== null && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-overline ${
            active
              ? "bg-white/20 text-accent-contrast"
              : "bg-muted text-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
