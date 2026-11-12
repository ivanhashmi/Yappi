import React, { useState, useCallback, useMemo } from "react";
import { GEMINI_MODELS, GEMINI_VOICES, LANGUAGES } from "../data/languages";

/* ============================================================================
 * BOTTOM SHEET: iOS Style Settings Sheet
 * ========================================================================== */
export default function SettingsBottomSheet({
  currentLanguage = "es",
  onChangeLanguage,
  onChangeTheme,
  settings,
  apiConnected = true,
  voices,
  authUser,
  syncStatus,
  onOpenAuth,
  onClose,
  onTestVoice,
  onSave,
  onResetProgress,
}) {
  const [draft, setDraft] = useState(settings);

  const langConfig = useMemo(() => {
    return LANGUAGES.find((l) => l.id === currentLanguage) || LANGUAGES[0];
  }, [currentLanguage]);

  const isHighQuality = useCallback((name = "") => {
    const lower = name.toLowerCase();
    return (
      lower.includes("enhanced") ||
      lower.includes("premium") ||
      lower.includes("natural") ||
      lower.includes("siri") ||
      lower.includes("google")
    );
  }, []);

  const sortedVoices = useMemo(() => {
    const prefix = currentLanguage.toLowerCase();
    const list = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
    return list.sort((a, b) => {
      const aHq = isHighQuality(a.name);
      const bHq = isHighQuality(b.name);
      if (aHq && !bHq) return -1;
      if (!aHq && bHq) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [voices, isHighQuality, currentLanguage]);

  const currentTheme = draft.theme === "light" ? "light" : "amoled";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D0D10] dark:border dark:border-white/[0.10] rounded-t-[28px] sm:rounded-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Grabber Bar */}
        <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-1 sm:hidden" />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">Settings</h2>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
          >
            Done
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Cloud Sync / Account Card */}
          {onOpenAuth && (
            <div
              onClick={onOpenAuth}
              className="press-scale p-3.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 cursor-pointer hover:border-[#007AFF]/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-black border border-black/[0.06] dark:border-white/[0.10] flex items-center justify-center text-lg shadow-xs shrink-0">
                  {authUser ? "☁️" : "👤"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {authUser ? "Cloud Sync Active" : "Guest Mode (Local Only)"}
                    </span>
                    {authUser && <span className="w-2 h-2 rounded-full bg-[#34C759]" />}
                  </div>
                  <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-medium truncate">
                    {authUser
                      ? `${authUser.email} · ${syncStatus === "syncing" ? "Syncing..." : "Synced"}`
                      : "Sign in or create account to sync across devices"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] shrink-0">
                {authUser ? "Profile" : "Sign In"}
              </span>
            </div>
          )}

          {/* Appearance Theme Switcher */}
          <div>
            <label className="block text-xs font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider mb-1.5">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.05] dark:border-white/[0.08] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setDraft((prev) => ({ ...prev, theme: "amoled" }));
                  onChangeTheme?.("amoled");
                }}
                className={`press-scale py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === "amoled"
                    ? "bg-white dark:bg-white text-[#1D1D1F] dark:text-black shadow-sm"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                🌑 AMOLED Dark
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft((prev) => ({ ...prev, theme: "light" }));
                  onChangeTheme?.("light");
                }}
                className={`press-scale py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === "light"
                    ? "bg-white text-[#1D1D1F] shadow-sm"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                ☀️ Light
              </button>
            </div>
          </div>

          {/* Duolingo-Style Course Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider">
                My Language Courses
              </label>
              <span className="text-[10px] font-bold text-[#58CC02] bg-[#58CC02]/10 dark:bg-[#58CC02]/15 px-2 py-0.5 rounded-full">
                Tap to Switch
              </span>
            </div>
            <div className="space-y-2">
              {LANGUAGES.map((l) => {
                const active = currentLanguage === l.id;
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      if (onChangeLanguage) onChangeLanguage(l.id);
                      setDraft((prev) => ({
                        ...prev,
                        accent: l.defaultAccent,
                        selectedVoiceURI: "",
                      }));
                    }}
                    className={`press-scale p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? "bg-[#58CC02]/[0.08] dark:bg-[#58CC02]/15 border-[#58CC02] shadow-sm"
                        : "bg-white dark:bg-[#16161A] border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] dark:bg-black border border-black/[0.06] dark:border-white/[0.10] flex items-center justify-center text-2xl shadow-xs">
                        {l.flag}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {l.name}
                          </span>
                          <span className="text-xs text-[#86868B] dark:text-[#A1A1A6] font-semibold">
                            ({l.nativeName})
                          </span>
                        </div>
                        <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-medium leading-tight mt-0.5">
                          {l.id === "es"
                            ? "Castilian & Mexican Spanish · 27 Letters"
                            : "Parisian & Canadian French · 26 Letters & Accents"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {active ? (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#58CC02] text-white text-[11px] font-black shadow-xs">
                          <span>✓</span> Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1A6] text-[11px] font-bold hover:text-[#1D1D1F] dark:hover:text-white">
                          Switch
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Status Card (Server-side proxy) */}
          <div
            className={`flex items-center justify-between p-3 rounded-2xl border ${
              apiConnected
                ? "bg-[#34C759]/10 dark:bg-[#34C759]/15 border-[#34C759]/20"
                : "bg-[#FF9500]/10 dark:bg-[#FF9500]/15 border-[#FF9500]/25"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  apiConnected
                    ? "bg-[#34C759] shadow-[0_0_8px_#34C759]"
                    : "bg-[#FF9500] shadow-[0_0_8px_#FF9500]"
                }`}
              />
              <div>
                <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {apiConnected ? "Google Gemini AI Active" : "Gemini AI Unavailable"}
                </div>
                <div
                  className={`text-[11px] font-semibold ${
                    apiConnected ? "text-[#34C759]" : "text-[#FF9500]"
                  }`}
                >
                  {apiConnected
                    ? "Protected via server-side API proxy"
                    : "Server GEMINI_API_KEY not configured"}
                </div>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full bg-white dark:bg-black text-[10px] font-bold shadow-xs ${
                apiConnected ? "text-[#34C759]" : "text-[#FF9500]"
              }`}
            >
              {apiConnected ? "Connected" : "Offline"}
            </span>
          </div>

          {/* Gemini Model Selector */}
          <div>
            <label className="block text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase mb-1">
              Gemini Model
            </label>
            <select
              value={draft.model || "gemini-3.5-flash-lite"}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className="w-full px-2.5 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] dark:text-[#F5F5F7] dark:border dark:border-white/[0.08] text-xs font-semibold focus:outline-none"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Engine Selector */}
          <div>
            <label className="block text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase mb-1">
              Voice Audio Engine
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F5F7] dark:bg-[#16161A] rounded-xl mb-2.5">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, voiceEngine: "gemini" })}
                className={`press-scale py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  draft.voiceEngine !== "device"
                    ? "bg-white dark:bg-white text-[#1D1D1F] dark:text-black shadow-sm"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                ✨ Google Neural Voice
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, voiceEngine: "device" })}
                className={`press-scale py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  draft.voiceEngine === "device"
                    ? "bg-white dark:bg-white text-[#1D1D1F] dark:text-black shadow-sm"
                    : "text-[#86868B] dark:text-[#A1A1A6]"
                }`}
              >
                📱 Device Voice
              </button>
            </div>

            {draft.voiceEngine !== "device" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase">
                  <span>Google AI Persona</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSave(draft);
                      setTimeout(() => onTestVoice(draft.geminiVoice || "Kore"), 50);
                    }}
                    className="text-[#007AFF] dark:text-[#0A84FF] font-semibold lowercase cursor-pointer"
                  >
                    play sample
                  </button>
                </div>
                <select
                  value={draft.geminiVoice || "Kore"}
                  onChange={(e) => setDraft({ ...draft, geminiVoice: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] dark:text-[#F5F5F7] dark:border dark:border-white/[0.08] text-xs font-semibold focus:outline-none"
                >
                  {GEMINI_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <div className="p-2 rounded-xl bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/15 border border-[#007AFF]/15 dark:border-[#0A84FF]/25 text-[11px] text-[#007AFF] dark:text-[#64D2FF] font-medium leading-relaxed">
                  🎙️ <strong>Studio Neural Audio:</strong> Authentic native pronunciation with natural pacing for both Spanish and French.
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase mb-1">
                  <span>Device {langConfig.name} Voice</span>
                  <button
                    type="button"
                    onClick={() => {
                      onSave(draft);
                      setTimeout(onTestVoice, 50);
                    }}
                    className="text-[#007AFF] dark:text-[#0A84FF] font-semibold lowercase cursor-pointer"
                  >
                    play sample
                  </button>
                </div>
                <select
                  value={draft.selectedVoiceURI || ""}
                  onChange={(e) => {
                    setDraft({
                      ...draft,
                      selectedVoiceURI: e.target.value,
                    });
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] dark:text-[#F5F5F7] dark:border dark:border-white/[0.08] text-xs font-semibold focus:outline-none"
                >
                  <option value="">Auto (Default {langConfig.name} Voice)</option>
                  {sortedVoices.map((v) => {
                    const hq = isHighQuality(v.name);
                    return (
                      <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                        {hq ? "⭐ " : ""}{v.name} ({v.lang}){hq ? " · Studio" : ""}
                      </option>
                    );
                  })}
                </select>

                <div className="mt-1.5 p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-[#86868B] dark:text-[#A1A1A6] leading-relaxed">
                  💡 macOS includes free neural Siri voices for Spanish & French! In Mac <strong>System Settings → Accessibility → Spoken Content → Manage Voices</strong> download Enhanced versions.
                </div>
              </div>
            )}
          </div>

          {/* Regional Accent Selection */}
          <div>
            <label className="block text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase mb-1">
              Accent Region ({langConfig.name})
            </label>
            <select
              value={draft.accent || langConfig.defaultAccent}
              onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
              className="w-full px-2.5 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] dark:text-[#F5F5F7] dark:border dark:border-white/[0.08] text-xs font-semibold focus:outline-none"
            >
              {langConfig.accents.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speech Speed */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase mb-1">
              <span>Speech Speed</span>
              <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-mono">{draft.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.15"
              step="0.05"
              value={draft.speechRate}
              onChange={(e) => setDraft({ ...draft, speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#007AFF] dark:accent-[#0A84FF]"
            />
            <div className="flex justify-between text-[10px] text-[#86868B] dark:text-[#A1A1A6] px-0.5">
              <span>Slower (Beginner)</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Auto-Speak Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-transparent dark:border-white/[0.08]">
            <div>
              <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Auto-Speak Responses
              </div>
              <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                Play tutor voice automatically
              </div>
            </div>
            <input
              type="checkbox"
              checked={draft.autoSpeak}
              onChange={(e) => setDraft({ ...draft, autoSpeak: e.target.checked })}
              className="w-5 h-5 accent-[#007AFF] dark:accent-[#0A84FF] cursor-pointer"
            />
          </div>

          {/* Reset App Progress */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Reset all streak, learned words, and custom decks?")) {
                  onResetProgress();
                }
              }}
              className="text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] cursor-pointer"
            >
              Reset All Progress
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="press-scale px-4 py-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-bold cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
