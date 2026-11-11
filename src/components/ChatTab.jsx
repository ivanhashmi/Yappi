import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "./Icon";
import { SCENARIOS_DATA } from "../data/languages";
import { callAI, extractJson, buildFallbackTutorReply } from "../services/gemini";

/* ============================================================================
 * TAB 1: CHAT — AI Voice Tutor with Live Audio & Smart Corrections
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
  const langName = language === "fr" ? "French" : "Spanish";

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
      let replyMode = "claude";

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
        spanish: replyData.spanish || (language === "fr" ? "Très bien !" : "¡Muy bien!"),
        pronunciation: replyData.pronunciation || "",
        english: replyData.english || "",
        correction: replyData.correction || null,
        suggested_replies: Array.isArray(replyData.suggested_replies) ? replyData.suggested_replies : [],
        mode: replyMode,
        timestamp: Date.now(),
      };

      onUpdateChat(chatKey, (prev) => [...prev, tutorMsg]);
      setIsLoading(false);

      if (settings.autoSpeak) {
        speakSpanish(tutorMsg.spanish);
      }
    },
    [input, isLoading, messages, chatKey, activeScenarioId, scenario, langName, language, settings, onUpdateChat, speakSpanish, recordPractice]
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

      rec.lang = settings.accent || (language === "fr" ? "fr-FR" : "es-ES");
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
          const res = evt.results[i];
          if (res.isFinal) {
            final += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        if (interim) setInterimText(interim);
        if (final) {
          setInput(final);
          setInterimText("");
          setIsListening(false);
          sendMessage(final);
        }
      };

      rec.onerror = (e) => {
        setIsListening(false);
        setInterimText("");
        if (e.error !== "no-speech") {
          setSpeechError(`Speech input error: ${e.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
    } catch (err) {
      setIsListening(false);
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
      if (msg.sender === "tutor" && Array.isArray(msg.suggested_replies) && msg.suggested_replies.length > 0) {
        return msg.suggested_replies;
      }
    }
    return scenario.starters || [];
  }, [messages, scenario.starters]);

  return (
    <div className="flex flex-col h-full flex-1">
      {/* Scenario Picker Carousel Header */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {scenarios.map((sc) => {
            const active = sc.id === activeScenarioId;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setActiveScenarioId(sc.id)}
                className={`press-scale whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-xs"
                    : "bg-black/5 dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/[0.14]"
                }`}
              >
                {sc.title}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#A1A1A6] px-1">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${apiConnected ? "bg-[#34C759] shadow-[0_0_6px_#34C759]" : "bg-[#FF9500]"}`} />
            <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {apiConnected ? "✨ Gemini AI Online" : "Practice Mode (Offline)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleAutoSpeak}
              className="press-scale font-semibold text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
            >
              Voice: {settings.autoSpeak ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={resetScenarioChat}
              className="press-scale text-[#86868B] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
            >
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 space-y-3 overflow-y-auto mb-3 max-h-[calc(100vh-250px)]">
        {!apiConnected && (
          <div
            onClick={onOpenSettings}
            className="press-scale flex items-center justify-between p-2.5 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/30 text-xs cursor-pointer mb-1"
          >
            <span className="text-[#FF9500] font-semibold">
              ⚡ Practice Mode (Pre-set responses)
            </span>
            <span className="text-[11px] font-bold text-[#007AFF] dark:text-[#0A84FF]">Add API Key →</span>
          </div>
        )}

        {apiError && (
          <div className="p-2.5 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A] mb-1 flex items-center justify-between">
            <span>⚠️ {apiError}</span>
            <button onClick={onOpenSettings} className="underline text-[11px] font-bold cursor-pointer">
              Settings
            </button>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-[20px] rounded-br-[4px] px-3.5 py-2.5 shadow-sm">
                  <p className="text-sm font-medium leading-snug">{msg.text}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className="space-y-2 max-w-[92%]">
              {/* Separate Mistake Correction Box */}
              {msg.correction && msg.correction.has_mistake && (
                <div className="bg-[#FF9500]/[0.08] dark:bg-[#FF9F0A]/15 border border-[#FF9500]/30 rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF9500] dark:text-[#FF9F0A]">
                      Correction
                    </span>
                    <button
                      type="button"
                      onClick={() => speakSpanish(msg.correction.corrected_spanish)}
                      className="press-scale px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[10px] font-bold text-[#FF9500] dark:text-[#FF9F0A] flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name="volume" className="w-3 h-3" />
                      Hear
                    </button>
                  </div>
                  <div className="text-xs text-[#86868B] dark:text-[#A1A1A6] line-through mb-0.5">
                    {msg.correction.original}
                  </div>
                  <div className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    ✓ {msg.correction.corrected_spanish}
                  </div>
                  {msg.correction.explanation && (
                    <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] mt-1 leading-snug">
                      {msg.correction.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Tutor Speech Card */}
              <div className="material-card rounded-[20px] rounded-tl-[4px] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] dark:text-[#0A84FF]">
                    {msg.mode === "practice"
                      ? "Tutor · Offline Practice"
                      : msg.mode === "preset"
                      ? (apiConnected ? "Tutor · ✨ Gemini AI" : "Tutor · Scenario Starter")
                      : `Tutor · ${msg.mode === "claude" ? "✨ Claude AI" : "✨ Gemini AI"}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => speakSpanish(msg.spanish)}
                      className="press-scale p-1.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
                      title="Listen"
                    >
                      <Icon name="volume" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakSpanish(msg.spanish, { slow: true })}
                      className="press-scale px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[10px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer"
                      title="Slow audio"
                    >
                      0.7x
                    </button>
                  </div>
                </div>

                <p className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">{msg.spanish}</p>

                {/* Hidden by default: Expandable Translation & Pronunciation */}
                {revealedIds[msg.id] ? (
                  <div className="pt-2 space-y-1.5 border-t border-black/[0.06] dark:border-white/[0.08] mt-2">
                    {msg.pronunciation && (
                      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#007AFF] dark:text-[#64D2FF] bg-[#007AFF]/[0.06] dark:bg-[#0A84FF]/15 px-2.5 py-1.5 rounded-xl">
                        <span className="text-[11px] opacity-70">🗣️</span>
                        <span>{msg.pronunciation}</span>
                      </div>
                    )}

                    {msg.english && (
                      <p className="text-xs text-[#545456] dark:text-[#D1D1D6] font-medium leading-relaxed px-0.5">
                        {msg.english}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleReveal(msg.id)}
                      className="press-scale inline-flex items-center gap-1 text-[10px] font-bold text-[#86868B] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white pt-0.5 cursor-pointer select-none"
                    >
                      <Icon name="chevron-up" className="w-2.5 h-2.5" />
                      <span>Hide translation</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleReveal(msg.id)}
                      className="press-scale inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] dark:hover:bg-white/[0.14] text-[11px] font-semibold text-[#007AFF] dark:text-[#0A84FF] cursor-pointer select-none transition-colors"
                      title="Show pronunciation & English translation"
                    >
                      <Icon name="chevron-down" className="w-3 h-3 text-[#007AFF] dark:text-[#0A84FF]" />
                      <span>Translate</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#16161A] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#86868B] dark:text-[#A1A1A6]">
            <span className="w-2 h-2 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] animate-ping" />
            Tutor is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Mobile Floating Input Bar */}
      <div className="space-y-2 sticky bottom-0 bg-[#F5F5F7] dark:bg-black pt-1">
        {speechError && (
          <div className="text-[11px] text-[#FF3B30] dark:text-[#FF453A] bg-[#FF3B30]/10 px-3 py-1 rounded-xl">
            {speechError}
          </div>
        )}

        {isListening && (
          <div className="p-2.5 rounded-2xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 border border-[#007AFF]/30 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] animate-ping" />
              <span className="text-xs font-bold text-[#007AFF] dark:text-[#64D2FF]">
                {interimText ? `"${interimText}"` : `Listening in ${langName}… speak now`}
              </span>
            </div>
            <button
              type="button"
              onClick={stopVoiceInput}
              className="press-scale text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] px-2 py-0.5 rounded-full bg-white dark:bg-black shadow-xs"
            >
              Done
            </button>
          </div>
        )}

        {/* Dynamic Suggested Replies */}
        {latestSuggestions.length > 0 && !isListening && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {latestSuggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(s)}
                className="press-scale whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-[#111114] border border-black/10 dark:border-white/[0.12] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:border-[#007AFF] hover:text-[#007AFF] shadow-xs cursor-pointer"
              >
                💬 {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2 p-1.5 rounded-[24px] bg-white dark:bg-[#111114] border border-black/[0.08] dark:border-white/[0.12] shadow-sm"
        >
          <button
            type="button"
            onClick={isListening ? stopVoiceInput : startVoiceInput}
            className={`press-scale w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? "bg-[#FF3B30] text-white shadow-md"
                : "bg-black/5 dark:bg-white/10 text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/10 dark:hover:bg-white/15"
            }`}
            title={isListening ? "Stop listening" : `Speak in ${langName}`}
          >
            <Icon name={isListening ? "stop" : "mic"} className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type or speak in ${langName}…`}
            className="flex-1 bg-transparent px-2 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`press-scale w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              input.trim() && !isLoading
                ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white cursor-pointer shadow-xs"
                : "bg-black/5 dark:bg-white/10 text-[#C7C7CC] dark:text-[#48484A] cursor-not-allowed"
            }`}
            title="Send"
          >
            <Icon name="send" className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
