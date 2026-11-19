import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "./Icon";
import { Button, Avatar } from "./ui";
import { callAI, extractJson, buildFallbackTutorReply } from "../services/gemini";
import { triggerHaptic } from "../utils/haptics";

/* ============================================================================
 * TAB 1: TUTOR — Personal Language Mentor, Grammar & Progress Guide
 * ========================================================================== */
export default function ChatTab({
  language = "es",
  chats = {},
  settings = {},
  streak = { count: 0, lastActiveDate: null },
  learnedWords = {},
  customDecks = [],
  apiConnected,
  speakSpanish,
  recordPractice,
  onOpenSettings,
  onUpdateChat,
  onToggleAutoSpeak,
}) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [apiError, setApiError] = useState("");
  const [revealedIds, setRevealedIds] = useState({});

  const toggleReveal = useCallback((id) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const langName = language === "fr" ? "French" : language === "it" ? "Italian" : "Spanish";
  const tutorName = language === "fr" ? "Amélie" : language === "it" ? "Chiara" : "Sofía";

  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  // Normalize student streak and saved vocabulary progress stats
  const streakCount = typeof streak?.count === "number" ? streak.count : 0;
  const savedWordsList = useMemo(() => Object.values(learnedWords || {}), [learnedWords]);
  const learnedCount = savedWordsList.length;

  const progressContext = useMemo(() => {
    const wordsPreview = savedWordsList
      .slice(0, 30)
      .map((w) => `${w.spanish || w.word || ""}${w.english ? ` (${w.english})` : ""}`)
      .filter(Boolean)
      .join(", ");

    const customCardsTotal = (customDecks || []).reduce(
      (sum, d) => sum + (Array.isArray(d.cards) ? d.cards.length : 0),
      0
    );

    return `
[STUDENT REAL-TIME PROGRESS CONTEXT]
- Active Course: ${langName} (${language})
- Current Streak: ${streakCount} ${streakCount === 1 ? "day" : "days"} (Last practiced: ${streak?.lastActiveDate || "Today"})
- Total Saved / Learned Words: ${learnedCount}
${learnedCount > 0 ? `- Saved Words List (sample of up to 30 words): ${wordsPreview}` : "- Saved Words List: Currently 0 saved words (encourage the student to save cards from Flashcards)."}
${customCardsTotal > 0 ? `- Custom Flashcard Decks: ${customDecks.length} deck(s) with ${customCardsTotal} custom cards` : ""}`;
  }, [language, langName, streakCount, streak?.lastActiveDate, learnedCount, savedWordsList, customDecks]);

  // Initial greeting welcoming user to ask doubts or review progress
  const defaultOpening = useMemo(() => {
    if (language === "fr") {
      return {
        id: `init-tutor-fr`,
        sender: "tutor",
        spanish:
          "Bonjour ! Je suis Amélie, votre tutrice personnelle de français. Avez-vous une question de grammaire, ou voulez-vous réviser votre vocabulaire et vos progrès aujourd'hui ?",
        pronunciation:
          "bohn-ZHOOR! zhuh swee ah-may-LEE, vohtr too-TREES pehr-sohn-NEHL duh frahn-SAY. ah-vay-VOO oon kehs-TYOHN duh grah-MEHR, oo voo-lay-VOO ray-vee-ZAY vohtr voh-kah-boo-LEHR ay voh proh-GREH oh-zhoor-DWEE?",
        english:
          "Hello! I am Amélie, your personal French tutor. Do you have a grammar question, or would you like to review your saved vocabulary and progress today?",
        correction: null,
        suggested_replies: [
          "Review my progress",
          "Explain a grammar rule",
          "Quiz me on my saved vocab",
          "When to use 'c'est' vs 'il est'?",
        ],
        mode: "preset",
        timestamp: Date.now(),
      };
    }
    if (language === "it") {
      return {
        id: `init-tutor-it`,
        sender: "tutor",
        spanish:
          "Ciao! Sono Chiara, la tua tutor personale di italiano. Hai un dubbio di grammatica, o vuoi ripassare i vocaboli salvati e i tuoi progressi oggi?",
        pronunciation:
          "CHOW! SOH-noh KYAH-rah, lah TOO-ah TOO-tohr pehr-soh-NAH-lay dee ee-tahl-YAH-noh. eye oon DOOB-byoh dee grahm-MAH-tee-kah, oh vwoy reep-pah-SAH-ray ee voh-KAH-boh-lee sahl-VAH-tee ay ee TWO-ee proh-GREHS-see OH-jee?",
        english:
          "Hello! I am Chiara, your personal Italian tutor. Do you have a grammar doubt, or would you like to review your saved vocabulary and progress today?",
        correction: null,
        suggested_replies: [
          "Review my progress",
          "Explain a grammar rule",
          "Quiz me on my saved vocab",
          "When to use 'essere' vs 'avere'?",
        ],
        mode: "preset",
        timestamp: Date.now(),
      };
    }
    return {
      id: `init-tutor-es`,
      sender: "tutor",
      spanish:
        "¡Hola! Soy Sofía, tu tutora personal de español. ¿Tienes alguna duda de gramática, quieres repasar tu vocabulario guardado o revisar tu progreso hoy?",
      pronunciation:
        "¡OH-lah! soy soh-FEE-ah, too too-TOH-rah pehr-soh-NAHL deh ehs-pah-NYOHL. ¿TYEH-nehs ahl-GOO-nah DOO-dah deh grah-MAH-tee-kah, KYEH-rehs reh-pah-SAHR too boh-kah-boo-LAH-ryoh gwahr-DAH-doh oh reh-bee-SAHR too proh-GREH-soh oy?",
      english:
        "Hello! I'm Sofía, your personal Spanish tutor. Do you have a grammar question, want to review your saved vocabulary, or check your progress today?",
      correction: null,
      suggested_replies: [
        "Review my progress",
        "Explain a grammar rule",
        "Quiz me on my saved vocab",
        "Why use 'por' vs 'para'?",
      ],
      mode: "preset",
      timestamp: Date.now(),
    };
  }, [language]);

  const defaultStarters = useMemo(() => {
    return [
      "Review my progress",
      "Explain a grammar rule",
      "Quiz me on my saved vocab",
      language === "es"
        ? "Why use 'por' vs 'para'?"
        : language === "fr"
        ? "When to use 'c'est' vs 'il est'?"
        : "When to use 'essere' vs 'avere'?",
    ];
  }, [language]);

  const chatKey = `${language}_tutor`;
  const messages =
    chats[chatKey] && chats[chatKey].length > 0 ? chats[chatKey] : [defaultOpening];

  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading, interimText]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  const sendMessage = useCallback(
    async (textOverride) => {
      const rawText = (textOverride !== undefined ? textOverride : input).trim();
      if (!rawText || isLoading) return;

      setInput("");
      setSpeechError("");
      recordPractice();
      triggerHaptic("light");

      const userMsg = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: rawText,
        timestamp: Date.now(),
      };

      const nextHistory = [...messages, userMsg];
      onUpdateChat(chatKey, nextHistory);
      setIsLoading(true);

      let replyData = null;
      let replyMode = "gemini";

      try {
        const recentForContext = nextHistory.slice(-8).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.sender === "user" ? m.text : `${m.spanish} (${m.english})`,
        }));

        const systemPrompt = `You are ${tutorName}, a warm, patient, and expert personal ${langName} tutor and mentor speaking with a student.
You do NOT do roleplays here (roleplay scenarios belong in the Characters tab). Your sole mission is:
1. Clearing student doubts about ${langName} grammar, word usage, idioms, pronunciation, and syntax.
2. Explaining grammar rules clearly in simple English, providing natural ${langName} examples with pronunciation and English translations.
3. Reviewing student learning progress, praising their streak, and quizzing them on their saved vocabulary when requested.
4. Answering questions asked in either English or ${langName}. If the student asks in English, answer warmly in English while providing ${langName} examples with phonetics. If they write in ${langName}, praise them and gently correct any grammar mistakes.

${progressContext}

Respond ONLY with raw JSON (no markdown):
{
  "spanish": "Your spoken reply in ${langName} (1-3 sentences with natural examples or encouraging guidance)",
  "pronunciation": "Syllable phonetic guide for the ${langName} text with CAPS on stressed syllables",
  "english": "Comprehensive English explanation or direct answer to the student's doubt/progress inquiry",
  "correction": {
    "has_mistake": true or false,
    "original": "Student text if there was a grammar/spelling error in ${langName}",
    "corrected_spanish": "Natural correct ${langName} phrasing",
    "explanation": "Brief 1-sentence grammar rule explanation in English"
  },
  "suggested_replies": ["3 short, relevant doubt/progress quick-prompts (e.g. 'Review my progress', 'Give another example', 'Quiz me on my vocab')"]
}`;

        const raw = await callAI({
          settings,
          system: systemPrompt,
          messages: recentForContext,
          maxTokens: 600,
        });
        replyData = extractJson(raw);
        replyMode = settings.provider || "gemini";
        setApiError("");
      } catch (err) {
        replyMode = "practice";
        replyData = buildFallbackTutorReply(rawText, "tutor", language);
        if (err.code !== "NO_API_KEY") {
          setApiError(err.message);
        }
      }

      const tutorMsg = {
        id: `t-${Date.now()}`,
        sender: "tutor",
        spanish:
          replyData.spanish ||
          (language === "fr"
            ? "Très bien !"
            : language === "it"
            ? "Benissimo!"
            : "¡Muy bien!"),
        pronunciation: replyData.pronunciation || "",
        english: replyData.english || "",
        correction: replyData.correction || null,
        suggested_replies: Array.isArray(replyData.suggested_replies)
          ? replyData.suggested_replies
          : [],
        mode: replyMode,
        timestamp: Date.now(),
      };

      onUpdateChat(chatKey, (prev) => [...prev, tutorMsg]);
      setIsLoading(false);

      if (settings.autoSpeak) {
        speakSpanish(tutorMsg.spanish);
      }
    },
    [
      input,
      isLoading,
      messages,
      chatKey,
      tutorName,
      langName,
      language,
      progressContext,
      settings,
      onUpdateChat,
      speakSpanish,
      recordPractice,
    ]
  );

  const startVoiceInput = () => {
    if (!speechSupported) {
      setSpeechError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    setSpeechError("");

    try {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechClass();
      recognitionRef.current = rec;

      const langPrefix = language === "fr" ? "fr" : language === "it" ? "it" : "es";
      const accentValid = settings?.accent && settings.accent.startsWith(langPrefix);
      rec.lang = accentValid
        ? settings.accent
        : (language === "fr" ? "fr-FR" : language === "it" ? "it-IT" : "es-ES");
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsListening(true);
        setInterimText("");
      };

      rec.onresult = (evt) => {
        let interim = "";
        let final = "";
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          const item = evt.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        if (final) {
          setInput((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          setInterimText("");
        } else {
          setInterimText(interim);
        }
      };

      rec.onerror = (err) => {
        setIsListening(false);
        setInterimText("");
        if (err.error === "no-speech") {
          return;
        }
        if (err.error === "not-allowed" || err.error === "service-not-allowed") {
          setSpeechError("Microphone permission was denied. Please allow microphone access in your browser.");
          return;
        }
        if (err.error === "network") {
          setSpeechError("Network error during speech recognition. Please check your internet connection.");
          return;
        }
        setSpeechError(`Voice error: ${err.error || "Could not recognize audio"}`);
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      rec.start();
    } catch {
      setIsListening(false);
      setInterimText("");
      setSpeechError("Microphone access could not be started.");
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
    setInterimText("");
  };

  const resetTutorChat = () => {
    triggerHaptic("medium");
    onUpdateChat(chatKey, [
      {
        ...defaultOpening,
        id: `init-${chatKey}-${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
    if (settings.autoSpeak) {
      speakSpanish(defaultOpening.spanish);
    }
  };

  const latestSuggestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (
        msg.sender === "tutor" &&
        Array.isArray(msg.suggested_replies) &&
        msg.suggested_replies.length > 0
      ) {
        return msg.suggested_replies;
      }
    }
    return defaultStarters;
  }, [messages, defaultStarters]);

  return (
    <div className="flex flex-col h-full flex-1 max-w-2xl mx-auto w-full">
      {/* Tutor Identity Header & Controls */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={tutorName} role="tutor" size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-headline font-semibold text-primary truncate leading-tight">
                  {tutorName}
                </h2>
                <span className="text-overline font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  Personal Tutor
                </span>
              </div>
              <p className="text-caption text-muted truncate mt-0.5">
                Progress mentor, grammar explanations & doubts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              className="press-scale min-h-[36px] px-2.5 rounded-xl border border-hairline bg-surface hover:bg-subtle inline-flex items-center gap-1.5 text-caption font-medium text-muted hover:text-primary cursor-pointer transition-colors"
              title="Toggle automatic speech synthesis"
            >
              <Icon name="volume" className="w-3.5 h-3.5" />
              <span>Audio {settings.autoSpeak ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              onClick={resetTutorChat}
              className="press-scale min-h-[36px] px-2.5 rounded-xl border border-hairline bg-surface hover:bg-subtle inline-flex items-center gap-1.5 text-caption font-medium text-muted hover:text-primary cursor-pointer transition-colors"
              title="Restart conversation"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>

        {/* Quiet Sub-bar: Real-time Stats & AI status */}
        <div className="flex items-center justify-between text-caption text-muted px-1 pt-1.5 border-t border-hairline">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                apiConnected ? "bg-status-success" : "bg-status-warning"
              }`}
            />
            <span className="font-medium text-primary">
              {apiConnected ? "Gemini AI" : "Practice Mode"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-caption text-muted font-medium">
            <span>🔥 {streakCount}d streak</span>
            <span>·</span>
            <span>📚 {learnedCount} saved words</span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-1 min-h-[300px]">
        {apiError && (
          <div className="p-3.5 rounded-2xl bg-subtle border border-status-error/30 text-caption text-status-error flex items-center justify-between">
            <span>{apiError}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="underline font-semibold cursor-pointer ml-2"
            >
              Settings
            </button>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="flex flex-col items-end gap-1">
                <div className="max-w-[85%] sm:max-w-[75%] bg-accent text-accent-contrast rounded-2xl rounded-br-xs px-4 py-2.5 shadow-xs">
                  <p className="text-body font-normal leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="space-y-2 max-w-[92%] sm:max-w-[85%]">
              {/* Tutor Message Card */}
              <div className="bg-surface border border-hairline rounded-2xl rounded-tl-xs p-4 sm:p-5 space-y-2 shadow-xs">
                {/* Header: Persona Name & Audio Controls */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-overline tracking-wider text-accent font-semibold">
                    {tutorName} · Personal Tutor
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => speakSpanish(msg.spanish)}
                      aria-label="Listen to message"
                      className="press-scale p-1.5 rounded-xl text-muted hover:text-primary hover:bg-subtle cursor-pointer transition-colors"
                      title="Listen"
                    >
                      <Icon name="volume" className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakSpanish(msg.spanish, { slow: true })}
                      aria-label="Listen to message slowly"
                      className="press-scale px-2 py-1 rounded-xl bg-subtle text-caption font-medium text-muted hover:text-primary cursor-pointer transition-colors"
                      title="Listen at 0.7x speed"
                    >
                      0.7×
                    </button>
                  </div>
                </div>

                {/* Foreign Speech Text */}
                <p className="text-body font-medium text-primary leading-relaxed">
                  {msg.spanish}
                </p>

                {/* Inline Grammar Correction Annotation (if student made a mistake) */}
                {msg.correction && msg.correction.has_mistake && (
                  <div className="mt-3 p-3 rounded-xl bg-subtle border border-hairline space-y-1">
                    <div className="flex items-center justify-between text-caption">
                      <span className="text-overline tracking-wider text-muted font-semibold">
                        Correction Tip
                      </span>
                      <button
                        type="button"
                        onClick={() => speakSpanish(msg.correction.corrected_spanish)}
                        aria-label="Listen to correction"
                        className="press-scale inline-flex items-center gap-1 text-caption text-accent font-medium hover:underline cursor-pointer"
                      >
                        <Icon name="volume" className="w-3 h-3" />
                        <span>Hear</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5 text-caption">
                      <span className="line-through text-muted">{msg.correction.original}</span>
                      <span className="text-muted">→</span>
                      <span className="text-primary font-semibold">
                        {msg.correction.corrected_spanish}
                      </span>
                    </div>
                    {msg.correction.explanation && (
                      <p className="text-status-warning text-caption leading-relaxed pt-0.5">
                        {msg.correction.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Translation & Phonetic Guide Toggle */}
                {revealedIds[msg.id] ? (
                  <div className="pt-2 space-y-1.5 border-t border-hairline mt-2">
                    {msg.pronunciation && (
                      <div className="flex items-center gap-2 text-caption font-mono text-muted bg-subtle px-3 py-1.5 rounded-xl">
                        <span>{msg.pronunciation}</span>
                      </div>
                    )}

                    {msg.english && (
                      <p className="text-caption text-muted leading-relaxed px-0.5">
                        {msg.english}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleReveal(msg.id)}
                      className="press-scale inline-flex items-center gap-1 text-caption font-medium text-muted hover:text-primary pt-1 cursor-pointer select-none"
                    >
                      <Icon name="chevron-up" className="w-3 h-3" />
                      <span>Hide translation</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleReveal(msg.id)}
                      className="press-scale inline-flex items-center gap-1 text-caption font-medium text-muted hover:text-primary cursor-pointer select-none"
                      title="Show pronunciation & English translation"
                    >
                      <Icon name="chevron-down" className="w-3 h-3" />
                      <span>Translate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thoughtful Skeleton Loader when Tutor is thinking */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3.5 max-w-[200px] rounded-2xl rounded-tl-xs bg-surface border border-hairline text-caption text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:400ms]" />
            </span>
            <span>{tutorName} is thinking…</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="space-y-2 sticky bottom-0 bg-canvas/80 backdrop-blur-md pt-2 pb-1">
        {speechError && (
          <div className="text-caption text-status-error bg-status-error/10 px-3.5 py-1.5 rounded-xl border border-status-error/20 flex items-center justify-between">
            <span>{speechError}</span>
            <button
              type="button"
              onClick={() => setSpeechError("")}
              className="text-status-error font-semibold ml-2 cursor-pointer hover:underline text-caption"
            >
              Dismiss
            </button>
          </div>
        )}

        {isListening && (
          <div className="p-3 rounded-2xl bg-subtle border border-hairline flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="w-2 h-2 rounded-full bg-status-error animate-ping shrink-0" />
              <span className="text-caption font-medium text-primary truncate">
                {interimText ? `"${interimText}"` : `Listening in ${langName}… speak now`}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={stopVoiceInput}
            >
              Done
            </Button>
          </div>
        )}

        {/* Dynamic Suggested Doubt & Progress Quick-Prompts */}
        {latestSuggestions.length > 0 && !isListening && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {latestSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(s)}
                className="press-scale whitespace-nowrap min-h-[44px] px-3.5 py-1.5 rounded-full bg-surface border border-hairline text-caption font-medium text-primary hover:border-accent hover:text-accent shadow-xs cursor-pointer select-none transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Floating Input Dock */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="rounded-full bg-surface border border-hairline shadow-md p-1.5 flex items-center gap-1.5"
        >
          {speechSupported && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                if (isListening) {
                  stopVoiceInput();
                } else {
                  startVoiceInput();
                }
              }}
              aria-label={isListening ? "Stop listening" : `Speak in ${langName}`}
              className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isListening
                  ? "bg-status-error text-white animate-pulse"
                  : "text-muted hover:text-primary hover:bg-subtle"
              }`}
              title={isListening ? "Stop listening" : `Speak in ${langName}`}
            >
              <Icon name={isListening ? "stop" : "mic"} className="w-5 h-5" />
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={`Ask a ${langName} doubt in English or ${langName}…`}
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-body text-primary placeholder:text-muted focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors shrink-0 ${
              input.trim() && !isLoading
                ? "bg-accent text-accent-contrast cursor-pointer"
                : "text-muted/40 cursor-not-allowed"
            }`}
          >
            <Icon name="send" className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
