import React from "react";

/**
 * Calm Skeleton Loader
 * - Neutral soft pulsing background (bg-subtle)
 * - Variants: text line, circle (avatar), box (card), button
 */
export default function Skeleton({
  variant = "text", // "text" | "circle" | "card" | "button"
  className = "",
  width,
  height,
}) {
  const baseClasses = "animate-pulse bg-subtle";

  const variantClasses = {
    text: "h-4 rounded-md w-full",
    circle: "rounded-full shrink-0",
    card: "h-28 rounded-2xl w-full border border-hairline",
    button: "h-11 rounded-2xl w-full",
  }[variant] || "h-4 rounded-md";

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      aria-hidden="true"
    />
  );
}
