import React, { useState } from "react";
import Icon from "./Icon";
import { Chip, Button, Card } from "./ui";
import { callAI, extractJson, buildFallbackTranslation } from "../services/gemini";
import { triggerHaptic } from "../utils/haptics";

/* ============================================================================
 * TAB 4: TRANSLATE — Phone-First Apple Translate Minimal Experience
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

  const langName = language === "fr" ? "French" : language === "it" ? "Italian" : "Spanish";

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
    triggerHaptic("selection");
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
      : language === "it"
      ? [
          "Dov'è il bagno, per favore?",
          "A table for two, please",
          "Quanto costa questo cappuccino?",
          "I would like to practice Italian",
        ]
      : [
          "¿Dónde está el baño?",
          "A table for two, please",
          "¿Cuánto cuesta este café?",
          "I would like to practice Spanish",
        ];

  return (
    <div className="flex-1 flex flex-col space-y-6 pb-24 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-primary">
            Translate
          </h1>
          <p className="text-caption text-muted mt-0.5">
            Natural translation with pronunciation and word-by-word grammar breakdown
          </p>
        </div>
      </div>

      {/* Language Direction Segment Bar */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-surface border border-hairline shadow-xs">
        <span className="text-caption font-semibold text-primary px-3 py-1">
          {direction === "auto"
            ? "Auto Detect"
            : direction === "target-to-en"
            ? langName
            : "English"}
        </span>

        <button
          type="button"
          onClick={handleSwap}
          aria-label="Switch translation direction"
          className="press-scale min-h-[44px] px-3.5 rounded-xl bg-subtle text-accent hover:bg-muted cursor-pointer inline-flex items-center gap-1.5 text-caption font-semibold transition-colors"
        >
          <Icon name="swap" className="w-4 h-4" />
          <span>Switch</span>
        </button>

        <span className="text-caption font-semibold text-primary px-3 py-1">
          {direction === "auto"
            ? `English / ${langName}`
            : direction === "target-to-en"
            ? "English"
            : langName}
        </span>
      </div>

      {/* Input Translation Box */}
      <Card className="p-5 space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Enter English or ${langName} text to translate…`}
          rows={3}
          className="w-full bg-transparent text-body font-normal text-primary placeholder:text-muted focus:outline-none resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-3 border-t border-hairline">
          <span className="text-overline text-muted">
            {input.trim().length} characters
          </span>
          <div className="flex items-center gap-2">
            {input && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInput("")}
              >
                Clear
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => runTranslate()}
              disabled={!input.trim() || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Translating…" : "Translate"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Starter Chips */}
      {!result && (
        <section className="space-y-3">
          <h2 className="text-overline font-semibold uppercase tracking-wider text-muted">
            Quick Examples
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickStarters.map((qs, i) => (
              <Card
                key={i}
                interactive
                onClick={() => {
                  triggerHaptic("selection");
                  runTranslate(qs);
                }}
                className="p-3.5 text-left text-caption font-medium text-primary hover:border-accent/40"
              >
                {qs}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Result Display Card */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Translation Output Card */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-overline font-semibold uppercase tracking-wide text-accent">
                {result.target_language || "Translation"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => speakSpanish(result.spanish_text)}
                  className="press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-subtle cursor-pointer transition-colors"
                  aria-label={`Listen in ${langName}`}
                >
                  <Icon name="volume" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => speakSpanish(result.spanish_text, { slow: true })}
                  className="press-scale px-2.5 py-1 rounded-full text-overline font-medium text-muted hover:text-primary hover:bg-subtle cursor-pointer transition-colors"
                  aria-label="Listen at 0.7x slower speed"
                >
                  0.7×
                </button>
              </div>
            </div>

            <p className="text-display font-semibold text-primary leading-snug">
              {result.target_language === "English" ? result.english_text : result.spanish_text}
            </p>

            {result.pronunciation && (
              <div className="p-3 rounded-xl bg-subtle text-caption font-mono text-muted">
                {result.pronunciation}
              </div>
            )}

            <div className="pt-3 border-t border-hairline">
              <span className="text-overline font-semibold uppercase tracking-wide text-muted block mb-1">
                {result.source_language || "Original"}
              </span>
              <p className="text-caption text-muted">
                {result.source_language === "English" ? result.english_text : result.spanish_text}
              </p>
            </div>
          </Card>

          {/* Interactive Tokenized Word Breakdown */}
          {Array.isArray(result.tokens) && result.tokens.length > 0 && (
            <Card className="p-5 space-y-3">
              <h3 className="text-overline font-semibold uppercase tracking-wider text-muted">
                Grammar & Word Breakdown
              </h3>
              <div className="space-y-2">
                {result.tokens.map((tok, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-subtle border border-hairline flex items-center justify-between text-caption"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary">{tok.spanish}</span>
                        {tok.pronunciation && (
                          <span className="text-overline font-mono text-muted">
                            [{tok.pronunciation}]
                          </span>
                        )}
                        {tok.pos && (
                          <span className="px-1.5 py-0.5 rounded-md bg-surface text-overline font-medium text-muted border border-hairline">
                            {tok.pos}
                          </span>
                        )}
                      </div>
                      <p className="text-caption text-muted">
                        → {tok.english} {tok.note ? `· ${tok.note}` : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakSpanish(tok.spanish)}
                      className="press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-surface cursor-pointer shrink-0 transition-colors"
                      aria-label={`Pronounce ${tok.spanish}`}
                    >
                      <Icon name="volume" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Grammar Takeaways */}
          {Array.isArray(result.grammar_notes) && result.grammar_notes.length > 0 && (
            <Card className="p-4 bg-accent/5 border border-accent/20 space-y-2">
              <span className="text-overline font-semibold uppercase tracking-wider text-accent block">
                Grammar Takeaways
              </span>
              <ul className="text-caption text-primary space-y-1.5 list-disc list-inside">
                {result.grammar_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Recent History List */}
      {recentTranslations.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-overline font-semibold uppercase tracking-wider text-muted">
            Recent Translations
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {recentTranslations.map((entry, idx) => (
              <Card
                key={idx}
                interactive
                onClick={() => {
                  setInput(entry.input);
                  setResult(entry.result);
                }}
                className="p-3.5 flex items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-body font-medium text-primary truncate">
                    {entry.result.spanish_text}
                  </p>
                  <p className="text-caption text-muted truncate mt-0.5">
                    {entry.result.english_text}
                  </p>
                </div>
                <Icon name="arrowRight" className="w-4 h-4 text-muted shrink-0" />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
