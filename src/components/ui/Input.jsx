import React from "react";

/**
 * Minimal, Calm 44px Input
 * - 16px base font prevents mobile iOS auto-zoom
 * - Neutral hairline border, subtle focus ring
 * - Dedicated error state with accessible aria-invalid
 */
export default function Input({
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  disabled = false,
  className = "",
  leftIcon = null,
  rightSlot = null,
  id,
  ariaLabel,
  ...rest
}) {
  return (
    <div className="w-full space-y-1.5">
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 flex items-center pointer-events-none text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          className={`w-full min-h-[44px] rounded-2xl bg-subtle text-primary text-body placeholder:text-muted border transition-all ${
            leftIcon ? "pl-10" : "pl-3.5"
          } ${rightSlot ? "pr-12" : "pr-3.5"} py-2.5 focus:outline-none ${
            error
              ? "border-status-error focus:ring-2 focus:ring-status-error/20"
              : "border-hairline focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
          } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
          {...rest}
        />
        {rightSlot && (
          <div className="absolute right-2 flex items-center">{rightSlot}</div>
        )}
      </div>
      {error && (
        <p className="text-caption text-status-error px-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
