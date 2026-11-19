import React, { useState, useMemo, useEffect } from "react";
import Icon from "./Icon";
import { Chip, Button, Card } from "./ui";
import { PRESET_DECKS_DATA } from "../data/languages";
import { callAI, extractJson, buildFallbackVocabDeck } from "../services/gemini";
import { triggerHaptic } from "../utils/haptics";

/* ============================================================================
 * TAB 3: FLASHCARDS / VOCAB — Minimal Apple/Google 3D Flip Card Experience
 * ========================================================================== */
export default function VocabTab({
  language = "es",
  customDecks,
  settings,
  apiConnected,
  isSpeaking = false,
  speakSpanish,
  recordPractice,
  isWordLearned,
  onToggleLearned,
  onOpenSettings,
  onAddCustomDeck,
  onDeleteCustomDeck,
}) {
  const presetDecks = PRESET_DECKS_DATA[language] || PRESET_DECKS_DATA.es;
  const langName = language === "fr" ? "French" : language === "it" ? "Italian" : "Spanish";
  const langCodeTitle = language === "fr" ? "Français" : language === "it" ? "Italiano" : "Español";

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
    triggerHaptic("selection");
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    triggerHaptic("selection");
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleFlip = () => {
    triggerHaptic("light");
    setIsFlipped((prev) => !prev);
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
    <div className="flex-1 flex flex-col space-y-6 pb-24 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-primary">
            Flashcards
          </h1>
          <p className="text-caption text-muted mt-0.5">
            Master {langName} vocabulary with active recall and audio pronunciation
          </p>
        </div>
      </div>

      {/* Deck Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {allDecks.map((d) => {
          const active = d.id === activeDeckId;
          return (
            <Chip
              key={d.id}
              active={active}
              onClick={() => {
                setActiveDeckId(d.id);
                setCardIndex(0);
                setIsFlipped(false);
              }}
            >
              {d.title}
            </Chip>
          );
        })}

        <Chip
          active={showGenCard}
          onClick={() => setShowGenCard((prev) => !prev)}
          icon={<Icon name="sparkles" className="w-3.5 h-3.5" />}
        >
          New Deck
        </Chip>
      </div>

      {/* AI Deck Generator Card (Collapsible) */}
      {showGenCard && (
        <Card className="p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="sparkles" className="w-4 h-4 text-accent" />
              <h2 className="text-headline font-semibold text-primary">
                Generate Custom {langName} Deck
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowGenCard(false)}
              className="text-caption text-muted hover:text-primary cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {!apiConnected && (
            <div className="p-3 rounded-xl bg-status-warning/10 text-status-warning text-caption font-medium flex items-center justify-between">
              <span>Server AI is offline. Will generate from curated vocabulary templates.</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-accent underline font-semibold ml-2 cursor-pointer"
              >
                Settings
              </button>
            </div>
          )}

          <form onSubmit={handleGenerateDeck} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={genTopic}
              onChange={(e) => setGenTopic(e.target.value)}
              placeholder={
                language === "fr"
                  ? "e.g. Boulangerie, Métro parisien, Commander au café…"
                  : language === "it"
                  ? "e.g. Colosseo, Bar italiano, Ordinare una pizza…"
                  : "e.g. Airport check-in, Ordering tapas, At the museum…"
              }
              className="flex-1 min-h-[44px] bg-subtle border border-hairline rounded-xl px-3.5 py-2 text-body text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!genTopic.trim() || isGenerating}
              loading={isGenerating}
              className="shrink-0"
            >
              {isGenerating ? "Creating…" : "Generate"}
            </Button>
          </form>
        </Card>
      )}

      {/* Single Large Centered Flashcard */}
      {currentCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-overline text-muted px-1">
            <span className="font-medium text-primary">
              {activeDeck.title}{" "}
              <span className="text-muted font-normal">({activeDeck.spanishTitle})</span>
            </span>
            <span>
              {cardIndex + 1} of {cards.length}
            </span>
          </div>

          {/* 3D Flip Container */}
          <div
            onClick={handleFlip}
            className="perspective-1000 cursor-pointer select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleFlip();
              }
            }}
            aria-label="Flashcard. Tap or press space to flip."
          >
            <div
              className={`relative w-full min-h-[300px] sm:min-h-[340px] rounded-3xl card-flip-transition transform-style-3d shadow-xs ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* FRONT OF CARD (Target Language) */}
              <div className="absolute inset-0 backface-hidden bg-surface border border-hairline rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-subtle border border-hairline text-overline font-semibold text-muted tracking-wide uppercase">
                    {langCodeTitle}
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isSpeaking}
                      onClick={() => {
                        recordPractice();
                        speakSpanish(currentCard.spanish);
                      }}
                      className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors ${
                        isSpeaking
                          ? "opacity-50 cursor-not-allowed text-muted"
                          : "text-muted hover:text-accent hover:bg-subtle cursor-pointer"
                      }`}
                      aria-label="Listen to pronunciation"
                      title={isSpeaking ? "Audio playing…" : "Listen"}
                    >
                      <Icon name="volume" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleLearned(currentCard, activeDeck.title)}
                      className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isWordLearned(currentCard)
                          ? "text-status-success bg-status-success/10"
                          : "text-muted hover:text-primary hover:bg-subtle"
                      }`}
                      aria-label={
                        isWordLearned(currentCard)
                          ? "Marked as learned"
                          : "Mark as learned"
                      }
                    >
                      <Icon name="check" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-6 space-y-2">
                  <h3 className="text-display font-semibold text-primary tracking-tight">
                    {currentCard.spanish}
                  </h3>
                  {currentCard.pronunciation && (
                    <p className="text-caption font-mono text-muted">
                      {currentCard.pronunciation}
                    </p>
                  )}
                </div>

                <div className="text-center text-overline text-muted flex items-center justify-center gap-1.5">
                  <Icon name="swap" className="w-3.5 h-3.5 opacity-60" />
                  <span>Tap to reveal translation</span>
                </div>
              </div>

              {/* BACK OF CARD (English + Context Example) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface border border-hairline rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-subtle border border-hairline text-overline font-semibold text-muted tracking-wide uppercase">
                    English
                  </span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isSpeaking}
                      onClick={() => {
                        recordPractice();
                        speakSpanish(currentCard.example_es);
                      }}
                      className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors ${
                        isSpeaking
                          ? "opacity-50 cursor-not-allowed text-muted"
                          : "text-muted hover:text-accent hover:bg-subtle cursor-pointer"
                      }`}
                      aria-label="Listen to example sentence"
                      title={isSpeaking ? "Audio playing…" : "Listen"}
                    >
                      <Icon name="volume" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-center py-4 space-y-4">
                  <h3 className="text-display font-semibold text-primary">
                    {currentCard.english}
                  </h3>
                  {currentCard.example_es && (
                    <div className="p-3.5 rounded-2xl bg-subtle border border-hairline text-left space-y-1">
                      <p className="text-body font-medium text-primary">
                        {currentCard.example_es}
                      </p>
                      <p className="text-caption text-muted">
                        {currentCard.example_en}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center text-overline text-muted flex items-center justify-center gap-1.5">
                  <Icon name="swap" className="w-3.5 h-3.5 opacity-60" />
                  <span>Tap to flip back</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Controls Beneath Flashcard */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              onClick={handlePrev}
              icon={<Icon name="arrowLeft" className="w-4 h-4" />}
              aria-label="Previous card"
            >
              Prev
            </Button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                onToggleLearned(currentCard, activeDeck.title);
                handleNext();
              }}
              className={`press-scale min-h-[44px] px-4 rounded-full text-caption font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-hairline ${
                isWordLearned(currentCard)
                  ? "bg-status-success/10 text-status-success border-status-success/30"
                  : "bg-surface text-muted hover:text-primary hover:bg-subtle"
              }`}
            >
              <Icon name="check" className="w-4 h-4" />
              <span>{isWordLearned(currentCard) ? "Learned" : "Mark Learned"}</span>
            </button>

            <Button
              variant="primary"
              onClick={handleNext}
              aria-label="Next card"
            >
              <span>Next</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Deck Overview List */}
      <section className="space-y-3 pt-4 border-t border-hairline">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-semibold uppercase tracking-wider text-muted">
            All Cards in Deck ({cards.length})
          </h2>
          {activeDeck.isCustom && (
            <button
              type="button"
              onClick={() => {
                onDeleteCustomDeck(activeDeck.id);
                setActiveDeckId(presetDecks[0].id);
              }}
              className="text-overline font-semibold text-status-error hover:underline cursor-pointer"
            >
              Delete Deck
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {cards.map((c, idx) => {
            const learned = isWordLearned(c);
            const isCurrent = idx === cardIndex;
            return (
              <Card
                key={c.id || idx}
                interactive
                onClick={() => {
                  setCardIndex(idx);
                  setIsFlipped(false);
                }}
                className={`p-3.5 flex items-center justify-between gap-3 ${
                  isCurrent ? "border-accent bg-accent/5" : ""
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-center text-overline font-semibold text-muted">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-body font-medium text-primary truncate">
                      {c.spanish}
                    </p>
                    <p className="text-caption text-muted truncate">
                      {c.english}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    disabled={isSpeaking}
                    onClick={() => {
                      recordPractice();
                      speakSpanish(c.spanish);
                    }}
                    className={`press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-colors ${
                      isSpeaking
                        ? "opacity-50 cursor-not-allowed text-muted"
                        : "text-muted hover:text-accent hover:bg-subtle cursor-pointer"
                    }`}
                    aria-label={`Listen to ${c.spanish}`}
                    title={isSpeaking ? "Audio playing…" : `Listen to ${c.spanish}`}
                  >
                    <Icon name="volume" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLearned(c, activeDeck.title)}
                    className={`press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      learned ? "text-status-success" : "text-muted/40 hover:text-muted"
                    }`}
                    aria-label={learned ? "Learned" : "Mark learned"}
                  >
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
