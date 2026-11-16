import React from "react";

/**
 * Monochrome Persona Avatar
 * - Neutral circle surface with subtle hairline border
 * - Displays clean initials or a monochrome line icon
 * - Replaces multi-colored saturated badges with Apple/Google editorial style
 */
export default function Avatar({
  name = "",
  icon = null,
  size = "md", // "sm" (32px), "md" (44px), "lg" (56px)
  className = "",
  ariaLabel,
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-caption font-semibold",
    md: "w-11 h-11 text-body font-semibold",
    lg: "w-14 h-14 text-title font-semibold",
  }[size] || "w-11 h-11 text-body font-semibold";

  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <div
      aria-label={ariaLabel || name}
      className={`rounded-full bg-subtle text-primary border border-hairline flex items-center justify-center shrink-0 select-none ${sizeClasses} ${className}`}
    >
      {icon ? (
        <span className="text-primary opacity-90">{icon}</span>
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
