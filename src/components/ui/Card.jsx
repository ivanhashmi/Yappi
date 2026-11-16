import React from "react";

/**
 * Calm Minimalist Surface Card
 * - Generous 4/8px padding (p-5 / p-6)
 * - 1px hairline border at low opacity, zero loud drop shadows
 * - Optional interactive state with subtle press feedback
 */
export default function Card({
  children,
  interactive = false,
  onClick,
  className = "",
  padding = "p-5 sm:p-6",
  role,
  ariaLabel,
  ...rest
}) {
  const interactiveClasses = interactive
    ? "press-scale cursor-pointer hover:border-hairline hover:bg-subtle/40 active:scale-[0.99] transition-all"
    : "";

  return (
    <div
      onClick={onClick}
      role={interactive ? role || "button" : role}
      aria-label={ariaLabel}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      className={`bg-surface border border-hairline rounded-[18px] text-primary ${padding} ${interactiveClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
