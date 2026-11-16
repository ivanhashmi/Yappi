import React, { useState, useCallback, useMemo } from "react";
import Icon from "./Icon";
import { Sheet, Button, Card, Avatar } from "./ui";
import { GEMINI_MODELS, GEMINI_VOICES, LANGUAGES } from "../data/languages";

/* ============================================================================
 * BOTTOM SHEET: Minimal Settings & Preferences Sheet
 * ========================================================================== */
export default function SettingsBottomSheet({
  currentLanguage = "es",
  onChangeLanguage,
  onChangeTheme,
  settings,
  apiConnected = true,
  voices = [],
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

  const currentTheme = draft.theme || "system";

  const handleThemeChange = (newTheme) => {
    setDraft((prev) => ({ ...prev, theme: newTheme }));
    if (onChangeTheme) onChangeTheme(newTheme);
  };

  const handleSaveAndClose = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Sheet
      isOpen={true}
      onClose={handleSaveAndClose}
      title="Settings"
      actionButton={
        <Button variant="ghost" size="sm" onClick={handleSaveAndClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-6 pt-2">
        {/* Account / Cloud Sync Card */}
        {onOpenAuth && (
          <Card
            interactive
            onClick={onOpenAuth}
            className="p-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar
                name={authUser?.email || "Guest"}
                icon={authUser ? null : <Icon name="user" className="w-5 h-5" />}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body font-semibold text-primary">
                    {authUser ? "Cloud Sync Active" : "Guest Mode"}
                  </span>
                  {authUser && (
                    <span className="w-2 h-2 rounded-full bg-status-success" />
                  )}
                </div>
                <p className="text-caption text-muted truncate mt-0.5">
                  {authUser
                    ? `${authUser.email} · ${syncStatus === "syncing" ? "Syncing…" : "Synced"}`
                    : "Sign in to sync streak and vocabulary across devices"}
                </p>
              </div>
            </div>
            <span className="text-caption font-semibold text-accent shrink-0">
              {authUser ? "Profile" : "Sign In"}
            </span>
          </Card>
        )}

        {/* Appearance Theme Switcher (System / Light / Dark) */}
        <section className="space-y-2">
          <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
            Appearance
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-subtle border border-hairline rounded-2xl">
            {[
              { id: "system", label: "System" },
              { id: "light", label: "Light" },
              { id: "amoled", label: "Dark" },
            ].map((t) => {
              const active = currentTheme === t.id || (t.id === "amoled" && currentTheme === "dark");
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  className={`press-scale min-h-[40px] rounded-xl text-caption font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-surface text-primary shadow-xs font-semibold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Course Switcher */}
        <section className="space-y-2">
          <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
            Active Language
          </label>
          <div className="space-y-2">
            {LANGUAGES.map((l) => {
              const active = currentLanguage === l.id;
              return (
                <Card
                  key={l.id}
                  interactive
                  onClick={() => {
                    if (onChangeLanguage) onChangeLanguage(l.id);
                    setDraft((prev) => ({
                      ...prev,
                      accent: l.defaultAccent,
                      selectedVoiceURI: "",
                    }));
                  }}
                  className={`p-3.5 flex items-center justify-between gap-3 ${
                    active ? "border-accent bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0" role="img" aria-label={l.name}>
                      {l.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-body font-semibold text-primary">
                          {l.name}
                        </span>
                        <span className="text-caption text-muted">
                          ({l.nativeName})
                        </span>
                      </div>
                      <p className="text-overline text-muted truncate mt-0.5">
                        {l.id === "es"
                          ? "Castilian & Mexican Spanish"
                          : l.id === "it"
                          ? "Standard Italian"
                          : "Standard French"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-caption font-semibold px-3 py-1 rounded-full ${
                      active
                        ? "bg-accent text-accent-contrast"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    {active ? "Active" : "Select"}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>

        {/* AI Engine Status */}
        <Card className="p-3.5 flex items-center justify-between gap-3 bg-subtle/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                apiConnected ? "bg-status-success" : "bg-status-warning"
              }`}
            />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-primary truncate">
                {apiConnected ? "Google Gemini AI Connected" : "Gemini AI Offline"}
              </p>
              <p className="text-overline text-muted truncate">
                {apiConnected
                  ? "Server-side proxy active"
                  : "Using offline vocabulary templates"}
              </p>
            </div>
          </div>
          <span
            className={`text-overline font-semibold px-2 py-0.5 rounded-full border border-hairline shrink-0 ${
              apiConnected
                ? "bg-status-success/10 text-status-success"
                : "bg-status-warning/10 text-status-warning"
            }`}
          >
            {apiConnected ? "Online" : "Offline"}
          </span>
        </Card>

        {/* Gemini Model Selector */}
        <section className="space-y-1.5">
          <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
            Gemini Model
          </label>
          <select
            value={draft.model || "gemini-3.5-flash-lite"}
            onChange={(e) => setDraft({ ...draft, model: e.target.value })}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface border border-hairline text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </section>

        {/* Voice Audio Engine */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
              Voice Engine
            </label>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                setTimeout(() => onTestVoice(draft.geminiVoice || "Kore"), 50);
              }}
              className="text-caption font-semibold text-accent hover:underline cursor-pointer"
            >
              Play sample
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-subtle border border-hairline rounded-2xl mb-2">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, voiceEngine: "gemini" })}
              className={`press-scale min-h-[40px] rounded-xl text-caption font-medium transition-all cursor-pointer ${
                draft.voiceEngine !== "device"
                  ? "bg-surface text-primary font-semibold shadow-xs"
                  : "text-muted hover:text-primary"
              }`}
            >
              Google Neural Voice
            </button>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, voiceEngine: "device" })}
              className={`press-scale min-h-[40px] rounded-xl text-caption font-medium transition-all cursor-pointer ${
                draft.voiceEngine === "device"
                  ? "bg-surface text-primary font-semibold shadow-xs"
                  : "text-muted hover:text-primary"
              }`}
            >
              Device Voice
            </button>
          </div>

          {draft.voiceEngine !== "device" ? (
            <select
              value={draft.geminiVoice || "Kore"}
              onChange={(e) => setDraft({ ...draft, geminiVoice: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface border border-hairline text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              {GEMINI_VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={draft.selectedVoiceURI || ""}
              onChange={(e) => setDraft({ ...draft, selectedVoiceURI: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface border border-hairline text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="">Auto (Default {langConfig.name} Voice)</option>
              {sortedVoices.map((v) => (
                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          )}
        </section>

        {/* Accent Region */}
        <section className="space-y-1.5">
          <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
            Accent Region
          </label>
          <select
            value={draft.accent || langConfig.defaultAccent}
            onChange={(e) => setDraft({ ...draft, accent: e.target.value })}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-surface border border-hairline text-body text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          >
            {langConfig.accents.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.label}
              </option>
            ))}
          </select>
        </section>

        {/* Speech Speed */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-overline font-semibold uppercase tracking-wider text-muted">
              Speech Speed
            </label>
            <span className="text-caption font-mono font-medium text-primary">
              {draft.speechRate}×
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.15"
            step="0.05"
            value={draft.speechRate}
            onChange={(e) => setDraft({ ...draft, speechRate: parseFloat(e.target.value) })}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-overline text-muted">
            <span>0.7× Slow</span>
            <span>1.0× Normal</span>
            <span>1.15× Fast</span>
          </div>
        </section>

        {/* Auto-Speak Toggle */}
        <Card className="p-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-caption font-semibold text-primary">
              Auto-Speak Responses
            </p>
            <p className="text-overline text-muted">
              Automatically play tutor audio on new message
            </p>
          </div>
          <input
            type="checkbox"
            checked={draft.autoSpeak}
            onChange={(e) => setDraft({ ...draft, autoSpeak: e.target.checked })}
            className="w-5 h-5 accent-accent cursor-pointer"
          />
        </Card>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-hairline flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset all streak, learned words, and custom decks?")) {
                onResetProgress();
              }
            }}
            className="text-caption font-semibold text-status-error hover:underline cursor-pointer"
          >
            Reset All Progress
          </button>
          <Button variant="primary" onClick={handleSaveAndClose}>
            Save Changes
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
