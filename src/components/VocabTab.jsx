import React, { useState, useMemo, useEffect } from "react";
import Icon from "./Icon";
import { PRESET_DECKS_DATA } from "../data/languages";
import { callAI, extractJson, buildFallbackVocabDeck } from "../services/gemini";

/* ============================================================================
 * TAB 3: VOCAB — Phone-First 3D Flip Flashcards & AI Generator
 * ========================================================================== */
export default function VocabTab({
  language = "es",
  customDecks,
  settings,
  apiConnected,
  speakSpanish,
  recordPractice,
  isWordLearned,
  onToggleLearned,
  onOpenSettings,
  onAddCustomDeck,
  onDeleteCustomDeck,
}) {
  const presetDecks = PRESET_DECKS_DATA[language] || PRESET_DECKS_DATA.es;
  const langName = language === "fr" ? "French" : "Spanish";
  const langCodeTitle = language === "fr" ? "Français" : "Español";

  // Filter custom decks by language tag if any or keep all
  const filteredCustomDecks = useMemo(() => {
    return customDecks.filter((d) => !d.language || d.language === language);
  }, [customDecks, language]);

  const allDecks = useMemo(() => [...presetDecks, ...filteredCustomDecks], [presetDecks, filteredCustomDecks]);
  const [activeDeckId, setActiveDeckId] = useState(presetDecks[0].id);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGenCard, setShowGenCard] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setActiveDeckId(presetDecks[0].id);
    setCardIndex(0);
    setIsFlipped(false);
  }, [language, presetDecks]);

  const activeDeck = useMemo(() => {
    return allDecks.find((d) => d.id === activeDeckId) || allDecks[0];
  }, [allDecks, activeDeckId]);

  const cards = activeDeck?.cards || [];
  const currentCard = cards[cardIndex] || cards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    const topic = genTopic.trim();
    if (!topic || isGenerating) return;

    setIsGenerating(true);

    let generated = null;
    try {
      const systemPrompt = `You create 10 beginner ${langName} flashcards.
Respond ONLY with raw JSON:
{
  "title": "Short English title",
  "cards": [
    {
      "spanish": "${langName} word/phrase",
      "pronunciation": "Phonetic guide",
      "english": "English meaning",
      "example_es": "Short ${langName} example sentence",
      "example_en": "English example translation"
    }
  ]
}`;
      const raw = await callAI({
        settings,
        system: systemPrompt,
        messages: [{ role: "user", content: `Generate 10 ${langName} cards for: ${topic}` }],
        maxTokens: 1100,
      });
      const parsed = extractJson(raw);
      generated = {
        id: `custom-${language}-${Date.now()}`,
        language,
        title: parsed.title || topic,
        spanishTitle: `Deck ${langCodeTitle}`,
        isCustom: true,
        cards: parsed.cards.slice(0, 10).map((c, i) => ({
          id: `c-${Date.now()}-${i}`,
          spanish: c.spanish || "",
          pronunciation: c.pronunciation || "",
          english: c.english || "",
          example_es: c.example_es || "",
          example_en: c.example_en || "",
        })),
      };
    } catch {
      const fallback = buildFallbackVocabDeck(topic, language);
      generated = {
        id: `custom-${language}-${Date.now()}`,
        language,
        title: fallback.title,
        spanishTitle: `Deck ${langCodeTitle} (Offline)`,
        isCustom: true,
        cards: fallback.cards,
      };
    }

    if (generated && generated.cards.length > 0) {
      onAddCustomDeck(generated);
      setActiveDeckId(generated.id);
      setCardIndex(0);
      setIsFlipped(false);
      setGenTopic("");
      setShowGenCard(false);
      recordPractice();
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      {/* Deck Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {allDecks.map((d) => {
          const active = d.id === activeDeckId;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setActiveDeckId(d.id);
                setCardIndex(0);
                setIsFlipped(false);
              }}
              className={`press-scale whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs"
                  : "bg-black/5 dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/[0.14]"
              }`}
            >
              {d.title}
              {d.isCustom && <span className="ml-1 text-[10px] opacity-75">✨</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowGenCard((prev) => !prev)}
          className="press-scale whitespace-nowrap px-3 py-1.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] text-xs font-bold hover:bg-[#007AFF]/20 cursor-pointer flex items-center gap-1"
        >
          <Icon name="sparkles" className="w-3.5 h-3.5" />
          New Deck
        </button>
      </div>

      {/* AI Deck Generator Card (Collapsible) */}
      {showGenCard && (
        <form
          onSubmit={handleGenerateDeck}
          className="material-card rounded-3xl p-4 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              <Icon name="sparkles" className="w-4 h-4 text-[#007AFF] dark:text-[#0A84FF]" />
              <span>Generate Custom {langName} Deck with AI</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGenCard(false)}
              className="text-xs text-[#86868B] dark:text-[#A1A1A6] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {!apiConnected && (
            <div className="p-2 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/20 text-[11px] text-[#FF9500]">
              ⚡ No API key added. AI deck will use built-in template words.{" "}
              <button
                type="button"
                onClick={onOpenSettings}
                className="font-bold underline cursor-pointer"
              >
                Add Key
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder={language === "fr" ? "e.g. Boulangerie, Métro parisien, Commander au restaurant" : "e.g. Airport, Hotel check-in, Doctor visit, Ordering tapas"}
              className="flex-1 px-3 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#16161A] dark:border dark:border-white/[0.08] text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!genTopic.trim() || isGenerating}
              className={`press-scale px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                genTopic.trim() && !isGenerating
                  ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white cursor-pointer shadow-xs"
                  : "bg-black/5 dark:bg-white/10 text-[#C7C7CC] dark:text-[#48484A] cursor-not-allowed"
              }`}
            >
              {isGenerating ? "Creating…" : "Generate"}
            </button>
          </div>
        </form>
      )}

      {/* 3D Flip Flashcard */}
      {currentCard && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 text-xs text-[#86868B] dark:text-[#A1A1A6]">
            <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {activeDeck.title}{" "}
              <span className="text-[#86868B] dark:text-[#A1A1A6] font-normal">({activeDeck.spanishTitle})</span>
            </span>
            <span>
              Card {cardIndex + 1} of {cards.length}
            </span>
          </div>

          {/* Flip Container */}
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className="perspective-1000 cursor-pointer select-none"
          >
            <div
              className={`relative w-full min-h-[260px] rounded-3xl transition-transform duration-500 transform-style-preserve-3d shadow-md ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT OF CARD (Target Language) */}
              <div className="absolute inset-0 backface-hidden bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[11px] font-bold text-[#007AFF] dark:text-[#0A84FF]">
                    {langCodeTitle}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        recordPractice();
                        speakSpanish(currentCard.spanish);
                      }}
                      className="press-scale p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
                      title="Listen"
                    >
                      <Icon name="volume" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLearned(currentCard, activeDeck.title)}
                      className={`press-scale p-2 rounded-full cursor-pointer transition-colors ${
                        isWordLearned(currentCard)
                          ? "bg-[#34C759] text-white"
                          : "bg-black/5 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1A6]"
                      }`}
                      title={
                        isWordLearned(currentCard)
                          ? "Marked as learned"
                          : "Mark as learned"
                      }
                    >
                      <Icon name="check" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4 space-y-2">
                  <h3 className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
                    {currentCard.spanish}
                  </h3>
                  <div className="text-xs font-mono text-[#007AFF] dark:text-[#64D2FF] font-medium">
                    🗣️ {currentCard.pronunciation}
                  </div>
                </div>

                <div className="text-center text-[11px] text-[#86868B] dark:text-[#A1A1A6] flex items-center justify-center gap-1">
                  <span>Tap card to reveal English meaning</span>
                  <Icon name="swap" className="w-3 h-3" />
                </div>
              </div>

              {/* BACK OF CARD (English + Example) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-linear-to-br from-[#007AFF]/[0.08] to-white dark:from-[#0A84FF]/20 dark:to-[#0D0D10] border border-[#007AFF]/20 dark:border-[#0A84FF]/30 rounded-3xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    English
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        recordPractice();
                        speakSpanish(currentCard.example_es);
                      }}
                      className="press-scale p-2 rounded-full bg-white dark:bg-white/10 text-[#007AFF] dark:text-[#0A84FF] shadow-xs cursor-pointer"
                      title="Listen example"
                    >
                      <Icon name="volume" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-2 space-y-3">
                  <h3 className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{currentCard.english}</h3>
                  {currentCard.example_es && (
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-black/60 border border-black/[0.04] dark:border-white/[0.08] text-left space-y-1">
                      <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {currentCard.example_es}
                      </div>
                      <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                        {currentCard.example_en}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-[#86868B] dark:text-[#A1A1A6]">
                  Tap card to flip back to {langCodeTitle}
                </div>
              </div>
            </div>
          </div>

          {/* Flashcard Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handlePrev}
              className="press-scale px-4 py-2 rounded-full bg-white dark:bg-[#111114] border border-black/10 dark:border-white/[0.10] text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="arrowLeft" className="w-3.5 h-3.5" />
              Prev
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleLearned(currentCard, activeDeck.title);
                handleNext();
              }}
              className={`press-scale px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isWordLearned(currentCard)
                  ? "bg-[#34C759] text-white shadow-xs"
                  : "bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/15"
              }`}
            >
              <Icon name="check" className="w-3.5 h-3.5" />
              {isWordLearned(currentCard) ? "Learned ✓" : "Mark Learned"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="press-scale px-4 py-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              Next
              <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Deck Overview List */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#86868B] dark:text-[#A1A1A6] uppercase tracking-wider">
            All Cards in Deck ({cards.length})
          </h2>
          {activeDeck.isCustom && (
            <button
              type="button"
              onClick={() => {
                onDeleteCustomDeck(activeDeck.id);
                setActiveDeckId(presetDecks[0].id);
              }}
              className="text-[11px] font-semibold text-[#FF3B30] dark:text-[#FF453A] cursor-pointer"
            >
              Delete Deck
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {cards.map((c, idx) => {
            const learned = isWordLearned(c);
            return (
              <div
                key={c.id || idx}
                onClick={() => {
                  setCardIndex(idx);
                  setIsFlipped(false);
                }}
                className={`press-scale p-3 rounded-2xl material-card flex items-center justify-between cursor-pointer transition-all ${
                  idx === cardIndex ? "border-[#007AFF] dark:border-[#0A84FF] bg-[#007AFF]/[0.03] dark:bg-[#0A84FF]/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-[#86868B] dark:text-[#A1A1A6]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{c.spanish}</div>
                    <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">{c.english}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      recordPractice();
                      speakSpanish(c.spanish);
                    }}
                    className="p-1 text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
                  >
                    <Icon name="volume" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLearned(c, activeDeck.title)}
                    className={`p-1 rounded-full cursor-pointer ${
                      learned ? "text-[#34C759]" : "text-[#C7C7CC] dark:text-[#48484A]"
                    }`}
                  >
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
