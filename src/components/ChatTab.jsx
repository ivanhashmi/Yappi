import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "./Icon";
import { Chip, Button } from "./ui";
import { SCENARIOS_DATA } from "../data/languages";
import { callAI, extractJson, buildFallbackTutorReply } from "../services/gemini";
import { triggerHaptic } from "../utils/haptics";

/* ============================================================================
 * TAB 1: CHAT — Apple / Google Minimal AI Voice Tutor
 * ========================================================================== */
export default function ChatTab({
  language = "es",
  chats,
  activeScenarioId,
  setActiveScenarioId,
  settings,
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

  const scenarios = SCENARIOS_DATA[language] || SCENARIOS_DATA.es;
  const langName = language === "fr" ? "French" : language === "it" ? "Italian" : "Spanish";

  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    [scenarios, activeScenarioId]
  );

  const chatKey = `${language}_${activeScenarioId}`;
  const messages = chats[chatKey] || chats[activeScenarioId] || [];

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

        const systemPrompt = `You are a warm, patient ${langName} tutor speaking with an A1 BEGINNER student on mobile.
Scenario: "${scenario.title}" (${scenario.role}).
Respond ONLY with raw JSON (no markdown):
{
  "spanish": "Natural beginner ${langName} reply (1-2 sentences + 1 simple question)",
  "pronunciation": "Syllable phonetic guide with CAPS on stressed syllables",
  "english": "Clear English translation",
  "correction": {
    "has_mistake": true or false,
    "original": "User text",
    "corrected_spanish": "Natural beginner ${langName} phrasing",
    "explanation": "Short 1-sentence beginner grammar explanation in English"
  },
  "suggested_replies": ["2 short beginner replies in ${langName}"]
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
        replyData = buildFallbackTutorReply(rawText, activeScenarioId, language);
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
      activeScenarioId,
      scenario,
      langName,
      language,
      settings,
      onUpdateChat,
      speakSpanish,
      recordPractice,
    ]
  );

  const startVoiceInput = () => {
    if (!speechSupported) {
      setSpeechError("Speech recognition is not supported in this browser. Try Chrome or Safari.");
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
  };

  const resetScenarioChat = () => {
    onUpdateChat(chatKey, [
      {
        id: `init-${chatKey}-${Date.now()}`,
        sender: "tutor",
        spanish: scenario.opening.spanish,
        pronunciation: scenario.opening.pronunciation,
        english: scenario.opening.english,
        correction: null,
        mode: "preset",
        timestamp: Date.now(),
      },
    ]);
    if (settings.autoSpeak) {
      speakSpanish(scenario.opening.spanish);
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
    return scenario.starters || [];
  }, [messages, scenario.starters]);

  return (
    <div className="flex flex-col h-full flex-1 max-w-2xl mx-auto w-full">
      {/* Scenario Picker Strip */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {scenarios.map((sc) => {
            const active = sc.id === activeScenarioId;
            return (
              <Chip
                key={sc.id}
                active={active}
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveScenarioId(sc.id);
                }}
              >
                {sc.title}
              </Chip>
            );
          })}
        </div>

        {/* Quiet Sub-bar: Status & Controls */}
        <div className="flex items-center justify-between text-caption text-muted px-1">
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              className="press-scale inline-flex items-center gap-1 font-medium text-muted hover:text-primary cursor-pointer"
              title="Toggle automatic speech synthesis"
            >
              <Icon name="volume" className="w-3.5 h-3.5" />
              <span>Audio {settings.autoSpeak ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              onClick={resetScenarioChat}
              className="press-scale inline-flex items-center gap-1 font-medium text-muted hover:text-primary cursor-pointer"
              title="Restart conversation"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
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
                    {scenario.role}
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
            <span>Tutor is thinking…</span>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="space-y-2 sticky bottom-0 bg-canvas/80 backdrop-blur-md pt-2 pb-1">
        {speechError && (
          <div className="text-caption text-status-error bg-status-error/10 px-3.5 py-1.5 rounded-xl border border-status-error/20">
            {speechError}
          </div>
        )}

        {isListening && (
          <div className="p-3 rounded-2xl bg-subtle border border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-error animate-ping" />
              <span className="text-caption font-medium text-primary">
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

        {/* Dynamic Suggested Replies */}
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

        {/* Floating Input Dock (Matching Characters tab) */}
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
            placeholder={`Type or speak in ${langName}…`}
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
