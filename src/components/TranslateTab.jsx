import React, { useState } from "react";
import Icon from "./Icon";
import { callAI, extractJson, buildFallbackTranslation } from "../services/gemini";

/* ============================================================================
 * TAB 4: TRANSLATE — Phone-First Apple Translate Experience
 * ========================================================================== */
export default function TranslateTab({
  language = "es",
  settings,
  apiConnected,
  recentTranslations,
  speakSpanish,
  recordPractice,
  onOpenSettings,
  onSaveTranslation,
}) {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState("auto");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const langName = language === "fr" ? "French" : "Spanish";

  const runTranslate = async (overrideText) => {
    const query = (overrideText !== undefined ? overrideText : input).trim();
    if (!query || isLoading) return;

    setInput(query);
    setIsLoading(true);
    recordPractice();

    let translated = null;
    try {
      const systemPrompt = `You are Apple Translate for ${langName} learners.
Direction: "${direction}" (if auto, detect language: English or ${langName}).
Translate accurately into natural conversational tone.
Respond ONLY with raw JSON:
{
  "direction": "target-to-en" or "en-to-target",
  "source_language": "${langName}" or "English",
  "target_language": "${langName}" or "English",
  "spanish_text": "${langName} version",
  "english_text": "English version",
  "pronunciation": "Full phonetic guide for ${langName} text",
  "tokens": [
    {
      "spanish": "Word",
      "english": "Meaning",
      "pos": "Part of speech",
      "pronunciation": "Phonetic",
      "note": "1-sentence grammar note"
    }
  ],
  "grammar_notes": ["1 or 2 concise beginner takeaways"]
}`;
      const raw = await callAI({
        settings,
        system: systemPrompt,
        messages: [{ role: "user", content: query }],
        maxTokens: 1000,
      });
      translated = extractJson(raw);
    } catch {
      translated = buildFallbackTranslation(query, direction, language);
    }

    setResult(translated);
    onSaveTranslation({ input: query, result: translated, savedAt: Date.now() });
    setIsLoading(false);
  };

  const handleSwap = () => {
    if (direction === "auto") setDirection("target-to-en");
    else if (direction === "target-to-en") setDirection("en-to-target");
    else setDirection("auto");
  };

  const quickStarters =
    language === "fr"
      ? [
          "Où sont les toilettes ?",
          "A table for two, please",
          "Combien coûte ce café au lait ?",
          "I would like to practice French",
        ]
      : [
          "¿Dónde está el baño?",
          "A table for two, please",
          "¿Cuánto cuesta este café?",
          "I would like to practice Spanish",
        ];

  return (
    <div className="space-y-4">
      {/* Direction Header Bar */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-white dark:bg-[#0D0D10] border border-black/[0.08] dark:border-white/[0.10] shadow-xs">
        <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] px-2">
          {direction === "auto"
            ? "Auto Detect"
            : direction === "target-to-en"
            ? langName
            : "English"}
        </span>

        <button
          type="button"
          onClick={handleSwap}
          className="press-scale p-1.5 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] text-[#007AFF] dark:text-[#0A84FF] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-1 text-xs font-bold"
        >
          <Icon name="swap" className="w-4 h-4" />
          <span>Switch</span>
        </button>

        <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] px-2">
          {direction === "auto"
            ? `English / ${langName}`
            : direction === "target-to-en"
            ? "English"
            : langName}
        </span>
      </div>

      {/* Input Translation Box */}
      <div className="material-card rounded-3xl p-4 space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter English or ${langName} text to translate…`}
          rows={3}
          className="w-full bg-transparent text-base text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none resize-none font-medium leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.08]">
          <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
            {input.trim().length} characters
          </div>
          <div className="flex items-center gap-2">
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs text-[#86868B] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => runTranslate()}
              disabled={!input.trim() || isLoading}
              className={`press-scale px-4 py-2 rounded-full text-xs font-bold transition-all ${
                input.trim() && !isLoading
                  ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs cursor-pointer"
                  : "bg-black/5 dark:bg-white/10 text-[#C7C7CC] dark:text-[#48484A] cursor-not-allowed"
              }`}
            >
              {isLoading ? "Translating…" : "Translate"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Starters */}
      {!result && (
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider px-1">
            Quick Examples
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickStarters.map((qs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => runTranslate(qs)}
                className="press-scale p-3 rounded-2xl material-card text-left text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:border-[#007AFF] dark:hover:border-[#0A84FF] cursor-pointer"
              >
                {qs}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result Display Card */}
      {result && (
        <div className="space-y-3 animate-fadeIn">
          {/* Target Language Card */}
          <div className="material-card rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] dark:text-[#0A84FF]">
                {result.target_language || "Translation"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => speakSpanish(result.spanish_text)}
                  className="press-scale p-1.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
                  title={`Listen ${langName}`}
                >
                  <Icon name="volume" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => speakSpanish(result.spanish_text, { slow: true })}
                  className="press-scale px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer"
                  title="Slow audio"
                >
                  0.7x
                </button>
              </div>
            </div>

            <p className="text-xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">
              {result.target_language === "English" ? result.english_text : result.spanish_text}
            </p>

            {result.pronunciation && (
              <p className="text-xs font-mono font-medium text-[#007AFF] dark:text-[#64D2FF] bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/15 px-2.5 py-1.5 rounded-xl">
                🗣️ {result.pronunciation}
              </p>
            )}

            <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] block mb-0.5">
                {result.source_language || "Original"}
              </span>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
                {result.source_language === "English" ? result.english_text : result.spanish_text}
              </p>
            </div>
          </div>

          {/* Interactive Tokenized Word Breakdown */}
          {Array.isArray(result.tokens) && result.tokens.length > 0 && (
            <div className="material-card rounded-3xl p-4 space-y-2.5">
              <h3 className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider">
                Grammar & Word Breakdown
              </h3>
              <div className="space-y-1.5">
                {result.tokens.map((tok, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-transparent dark:border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{tok.spanish}</span>
                        <span className="text-[10px] font-mono text-[#007AFF] dark:text-[#64D2FF]">
                          {tok.pronunciation}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-black text-[9px] font-semibold text-[#86868B] dark:text-[#A1A1A6]">
                          {tok.pos}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                        → {tok.english} {tok.note ? `· ${tok.note}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakSpanish(tok.spanish)}
                      className="p-1.5 text-[#007AFF] dark:text-[#0A84FF] hover:bg-white dark:hover:bg-white/10 rounded-full cursor-pointer"
                      title="Pronounce word"
                    >
                      <Icon name="volume" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Takeaways */}
          {Array.isArray(result.grammar_notes) && result.grammar_notes.length > 0 && (
            <div className="p-3.5 rounded-3xl bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/15 border border-[#007AFF]/15 dark:border-[#0A84FF]/25 space-y-1.5">
              <span className="text-xs font-bold text-[#007AFF] dark:text-[#64D2FF] block">
                💡 Key Grammar Notes
              </span>
              <ul className="text-xs text-[#1D1D1F] dark:text-[#F5F5F7] space-y-1 list-disc list-inside">
                {result.grammar_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recent History List */}
      {recentTranslations.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider px-1">
            Recent Translations
          </h3>
          <div className="space-y-1.5">
            {recentTranslations.map((entry, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInput(entry.input);
                  setResult(entry.result);
                }}
                className="press-scale w-full p-3 rounded-2xl material-card text-left flex items-center justify-between cursor-pointer"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                    {entry.result.spanish_text}
                  </div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] truncate">
                    {entry.result.english_text}
                  </div>
                </div>
                <Icon name="arrowRight" className="w-3.5 h-3.5 text-[#86868B] dark:text-[#A1A1A6] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
