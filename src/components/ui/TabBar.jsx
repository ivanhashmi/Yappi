import React from "react";
import { triggerHaptic } from "../../utils/haptics";

/**
 * Mobile-First Bottom Tab Bar
 * - Fixed bottom navigation with glass blur (`glass-bottom-bar`)
 * - Visible on mobile & tablet (<1024px), hidden on desktop (≥1024px) where sidebar takes over
 * - 44px min touch target per tab
 * - Line icons with 12px min caption typography (no emojis)
 */
export default function TabBar({
  tabs = [],
  activeTab,
  onSelectTab,
  className = "",
}) {
  const handleTabClick = (tabId) => {
    triggerHaptic("selection");
    onSelectTab(tabId);
  };

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-bottom-bar bottom-bar-safe ${className}`}
      aria-label="Mobile Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
              className="press-scale flex flex-col items-center justify-center min-h-[44px] py-1 cursor-pointer select-none"
            >
              <div
                className={`transition-colors duration-150 ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-overline mt-1 tracking-tight transition-colors duration-150 ${
                  isActive ? "text-accent font-semibold" : "text-muted font-medium"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
