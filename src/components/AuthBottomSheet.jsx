import React, { useState } from "react";
import Icon from "./Icon";
import { supabase, isSupabaseConfigured } from "../services/supabase";

export default function AuthBottomSheet({
  user,
  syncStatus,
  streakCount = 0,
  activeDaysCount = 0,
  learnedCount = 0,
  theme = "amoled",
  onToggleTheme,
  onOpenLearnedWords,
  onOpenSettings,
  onClose,
  onForceSync,
  onSignOut,
}) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isDark = theme !== "light";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setLoading(false);
          return;
        }
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (signUpErr) throw signUpErr;
        if (data.user && !data.session) {
          setNotice("Account created! Check your email inbox to confirm, then sign in.");
          setMode("signin");
        } else {
          onClose();
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInErr) throw signInErr;
        onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const avatarInitial = user?.email?.[0]?.toUpperCase() || null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D0D10] dark:border dark:border-white/[0.10] rounded-t-[28px] sm:rounded-3xl p-5 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-1 sm:hidden" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/20 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center text-xs font-black">
              {avatarInitial || <Icon name="user" className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-black text-[#1D1D1F] dark:text-[#F5F5F7]">
              Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Account & Cloud Sync Section */}
        {!isSupabaseConfigured ? (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            Supabase environment variables are missing. Add `VITE_SUPABASE_URL` and
            `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env` and restart the app.
          </div>
        ) : user ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_6px_#34C759]" />
                  <span className="text-xs font-black text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Cloud Sync Active
                  </span>
                </div>
                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] font-medium truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] shrink-0">
                {syncStatus === "syncing" ? "Syncing..." : "Synced"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onForceSync}
                disabled={syncStatus === "syncing"}
                className="press-scale flex-1 py-2.5 rounded-2xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] text-xs font-bold cursor-pointer hover:bg-[#007AFF]/15"
              >
                {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onSignOut();
                  onClose();
                }}
                className="press-scale flex-1 py-2.5 rounded-2xl bg-[#FF3B30]/10 dark:bg-[#FF453A]/15 text-[#FF3B30] dark:text-[#FF453A] text-xs font-bold cursor-pointer hover:bg-[#FF3B30]/15"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#1D1D1F] dark:text-[#F5F5F7]">
                ☁️ Sign In to Sync Progress
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1A6]">
                Guest Mode
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white dark:bg-black/60 border border-black/[0.05] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-[#1D1D1F] dark:bg-white text-white dark:text-black shadow-xs"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-[#1D1D1F] dark:bg-white text-white dark:text-black shadow-xs"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 text-xs font-semibold text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />

              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
              />

              <button
                type="submit"
                disabled={loading}
                className="press-scale w-full py-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                {loading
                  ? mode === "signup"
                    ? "Creating Account..."
                    : "Signing In..."
                  : mode === "signup"
                  ? "Create Account & Sync"
                  : "Sign In & Sync"}
              </button>
            </form>

            <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] text-center leading-snug">
              Local progress merges automatically when you sign in.
            </p>
          </div>
        )}

        {/* Learning Progress Cards: Streak & Learned Words */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-[#FF9600]/[0.08] dark:bg-[#FF9F0A]/15 border border-[#FF9600]/25 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-lg leading-none">🔥</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9600]">
                Streak
              </span>
            </div>
            <div className="text-xl font-black text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight pt-1">
              {streakCount} {streakCount === 1 ? "Day" : "Days"}
            </div>
            <div className="text-[11px] font-medium text-[#86868B] dark:text-[#A1A1A6]">
              {activeDaysCount > 0
                ? `${activeDaysCount} active ${activeDaysCount === 1 ? "day" : "days"} recently`
                : "Practice daily to build"}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLearnedWords}
            className="press-scale p-3.5 rounded-2xl bg-[#58CC02]/[0.08] dark:bg-[#58CC02]/15 border border-[#58CC02]/25 space-y-1 text-left cursor-pointer hover:border-[#58CC02]/60 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-[#58CC02] text-white text-[11px] font-black flex items-center justify-center">
                ✓
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#58CC02]">
                Learned
              </span>
            </div>
            <div className="text-xl font-black text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight pt-1">
              {learnedCount} {learnedCount === 1 ? "Word" : "Words"}
            </div>
            <div className="text-[11px] font-semibold text-[#58CC02] flex items-center gap-1">
              <span>View deck list</span>
              <span>&rarr;</span>
            </div>
          </button>
        </div>

        {/* Menu Options: AMOLED Dark Mode Toggle & Settings */}
        <div className="rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.06] dark:divide-white/[0.08] overflow-hidden">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-black border border-black/[0.06] dark:border-white/[0.10] flex items-center justify-center text-base shadow-xs">
                  {isDark ? "🌑" : "☀️"}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    AMOLED Dark Mode
                  </div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                    {isDark ? "Pure black OLED contrast" : "Classic light appearance"}
                  </div>
                </div>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                  isDark ? "bg-[#34C759] justify-end" : "bg-black/15 justify-start"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
              </span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-black border border-black/[0.06] dark:border-white/[0.10] flex items-center justify-center text-[#86868B] dark:text-[#F5F5F7] shadow-xs">
                  <Icon name="settings" className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Settings
                  </div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                    Language course, AI model, neural voice & speed
                  </div>
                </div>
              </div>
              <Icon name="arrowRight" className="w-4 h-4 text-[#86868B] dark:text-[#A1A1A6]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
