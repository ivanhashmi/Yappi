import React from "react";
import Icon from "../Icon";
import Avatar from "./Avatar";
import { triggerHaptic } from "../../utils/haptics";

/**
 * Desktop Left Sidebar Navigation (≥1024px)
 * - Apple / Google editorial style: quiet, spacious, highly refined
 * - Houses brand mark, course switcher, primary nav tabs, streak stats, and profile
 */
export default function DesktopSidebar({
  tabs = [],
  activeTab,
  onSelectTab,
  currentLanguage,
  currentLangConfig,
  onOpenLanguageSelector,
  authUser,
  syncStatus,
  apiConnected,
  streakCount = 0,
  learnedCount = 0,
  onOpenProfile,
  onOpenSettings,
}) {
  const profileInitial = authUser?.email?.[0]?.toUpperCase() || null;
  const streakDisplay = typeof streakCount === "object" ? (streakCount?.count ?? 0) : (streakCount ?? 0);

  const handleTabClick = (tabId) => {
    triggerHaptic("selection");
    onSelectTab(tabId);
  };

  return (
    <aside
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-surface border-r border-hairline flex-col justify-between p-5 z-40 select-none"
      aria-label="Desktop Navigation Sidebar"
    >
      {/* Top Section: Brand & Language Course Selector */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-title font-semibold tracking-tight text-primary">
              Yappi
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-subtle transition-colors cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <Icon name="settings" className="w-4 h-4" />
          </button>
        </div>

        {/* Course Switcher Card */}
        <button
          type="button"
          onClick={onOpenLanguageSelector}
          className="press-scale w-full p-2.5 rounded-2xl bg-subtle border border-hairline flex items-center justify-between gap-2.5 text-left hover:border-accent/30 transition-all cursor-pointer"
          title="Switch Language Course"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl leading-none shrink-0" role="img" aria-label={currentLangConfig.name}>
              {currentLangConfig.flag}
            </span>
            <div className="min-w-0">
              <span className="text-caption font-semibold text-primary block truncate leading-tight">
                {currentLangConfig.name}
              </span>
              <span className="text-overline text-muted block truncate">
                {currentLangConfig.nativeName}
              </span>
            </div>
          </div>
          <Icon name="chevronDown" className="w-3.5 h-3.5 text-muted shrink-0" />
        </button>

        {/* Primary Navigation Links */}
        <nav className="space-y-1.5 pt-2" aria-label="Main Views">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                aria-selected={isActive}
                role="tab"
                className={`press-scale w-full min-h-[44px] px-3.5 py-2.5 rounded-2xl flex items-center gap-3 text-caption font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-contrast shadow-xs"
                    : "text-muted hover:text-primary hover:bg-subtle"
                }`}
              >
                <span className={isActive ? "text-accent-contrast" : "text-muted"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Learning Streak & Profile Card */}
      <div className="space-y-3 pt-4 border-t border-hairline">
        {/* Subtle Stats Pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-subtle text-overline text-muted font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>{streakDisplay} day streak</span>
          </span>
          <span>{learnedCount} words</span>
        </div>

        {/* Profile Card Button */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="press-scale w-full p-2.5 rounded-2xl hover:bg-subtle border border-transparent hover:border-hairline transition-all flex items-center justify-between gap-3 text-left cursor-pointer"
          aria-label={authUser ? `Profile: ${authUser.email}` : "Guest Profile"}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={authUser?.email || "Guest"}
              icon={authUser ? null : <Icon name="user" className="w-4 h-4" />}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-primary truncate leading-tight">
                {authUser ? authUser.email.split("@")[0] : "Guest Learner"}
              </p>
              <p className="text-overline text-muted truncate">
                {authUser ? (syncStatus === "syncing" ? "Syncing…" : "Cloud Synced") : "Local mode"}
              </p>
            </div>
          </div>

          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              authUser
                ? syncStatus === "syncing"
                  ? "bg-status-warning animate-pulse"
                  : "bg-status-success"
                : apiConnected
                ? "bg-status-success"
                : "bg-status-warning"
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
