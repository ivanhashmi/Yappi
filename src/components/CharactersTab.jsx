import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "./Icon";
import { CHARACTER_CATEGORIES, CHARACTERS_DATA } from "../data/charactersData";
import { callAI, extractJson } from "../services/gemini";
import {
  CHAR_STORAGE_KEY,
  FAV_STORAGE_KEY,
  loadSavedCharacterChats,
  loadSavedFavourites,
} from "../utils/storage";

const CATEGORY_BADGE_STYLES = {
  everyday: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  relationships: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300",
  sports: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  career: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300",
  travel: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
};

function FavouriteButton({ active, onClick, variant = "card" }) {
  const baseClass =
    variant === "header"
      ? "press-scale p-2 rounded-xl border cursor-pointer shadow-xs transition-colors"
      : "press-scale p-1.5 rounded-xl cursor-pointer transition-colors";

  const colorClass =
    variant === "header"
      ? active
        ? "bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-[#FF9500]"
        : "bg-white dark:bg-[#16161A] border-black/[0.08] dark:border-white/[0.10] text-[#86868B] dark:text-[#A1A1A6] hover:text-[#FF9500] hover:bg-amber-50/50 dark:hover:bg-amber-500/15"
      : active
      ? "bg-amber-50 dark:bg-amber-500/20 text-[#FF9500]"
      : "bg-black/[0.04] dark:bg-white/[0.08] text-[#C7C7CC] dark:text-[#636366] hover:text-[#FF9500] hover:bg-amber-50/60 dark:hover:bg-amber-500/15";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove from favourites" : "Mark as favourite"}
      aria-pressed={active}
      title={active ? "Remove from favourites" : "Mark as favourite"}
      className={`${baseClass} ${colorClass}`}
    >
      <Icon name="star" filled={active} className="w-4 h-4" />
    </button>
  );
}

export default function CharactersTab({
  language = "es",
  settings,
  apiConnected,
  speakSpanish,
  recordPractice,
  onOpenSettings,
  characterChats: characterChatsProp,
  favouriteKeys: favouriteKeysProp,
  onUpdateCharacterChat,
  onToggleFavourite,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [revealedIds, setRevealedIds] = useState({});
  const [localCharacterChats, setLocalCharacterChats] = useState(loadSavedCharacterChats);
  const [localFavouriteKeys, setLocalFavouriteKeys] = useState(loadSavedFavourites);

  const characterChats = characterChatsProp ?? localCharacterChats;
  const favouriteKeys = favouriteKeysProp ?? localFavouriteKeys;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [apiError, setApiError] = useState("");
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Sync character chats & favourites to localStorage only when uncontrolled
  useEffect(() => {
    if (characterChatsProp !== undefined) return;
    try {
      localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(localCharacterChats));
    } catch {
      // ignore
    }
  }, [characterChatsProp, localCharacterChats]);

  useEffect(() => {
    if (favouriteKeysProp !== undefined) return;
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(localFavouriteKeys));
    } catch {
      // ignore
    }
  }, [favouriteKeysProp, localFavouriteKeys]);

  // Clean up speech recognition
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
    };
  }, []);

  const langKey = language === "fr" ? "fr" : "es";
  const langName = language === "fr" ? "French" : "Spanish";
  const allCharacters = useMemo(() => CHARACTERS_DATA[langKey] || CHARACTERS_DATA.es, [langKey]);

  const updateChatThread = useCallback(
    (key, nextMsgs, replaceThread = false) => {
      if (onUpdateCharacterChat) {
        onUpdateCharacterChat(key, nextMsgs, replaceThread);
      } else {
        setLocalCharacterChats((prev) => ({ ...prev, [key]: nextMsgs }));
      }
    },
    [onUpdateCharacterChat]
  );

  const isFavourite = useCallback(
    (charId) => favouriteKeys.includes(`${langKey}_${charId}`),
    [favouriteKeys, langKey]
  );

  const toggleFavourite = useCallback(
    (charId, event) => {
      event?.stopPropagation?.();
      const favKey = `${langKey}_${charId}`;
      const nextActive = !favouriteKeys.includes(favKey);
      if (onToggleFavourite) {
        onToggleFavourite(favKey, nextActive);
      } else {
        setLocalFavouriteKeys((prev) =>
          prev.includes(favKey) ? prev.filter((k) => k !== favKey) : [...prev, favKey]
        );
      }
    },
    [langKey, favouriteKeys, onToggleFavourite]
  );

  const favouriteCount = useMemo(
    () => allCharacters.filter((c) => favouriteKeys.includes(`${langKey}_${c.id}`)).length,
    [allCharacters, favouriteKeys, langKey]
  );

  // Active character
  const activeCharacter = useMemo(() => {
    if (!activeCharacterId) return null;
    return allCharacters.find((c) => c.id === activeCharacterId) || null;
  }, [allCharacters, activeCharacterId]);

  // Filtered characters for discovery view
  const filteredCharacters = useMemo(() => {
    let list = allCharacters;
    if (selectedCategory === "favourites") {
      list = list.filter((c) => favouriteKeys.includes(`${langKey}_${c.id}`));
    } else if (selectedCategory !== "all") {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.bio.toLowerCase().includes(q) ||
          c.categoryLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCharacters, selectedCategory, searchQuery, favouriteKeys, langKey]);

  // Featured characters for hero carousel
  const featuredCharacters = useMemo(() => {
    return allCharacters.filter((c) => c.popular);
  }, [allCharacters]);

  // Active conversation
  const chatKey = activeCharacter ? `${langKey}_${activeCharacter.id}` : null;
  const currentMessages = useMemo(() => {
    if (!chatKey || !activeCharacter) return [];
    if (!characterChats[chatKey] || characterChats[chatKey].length === 0) {
      // Initialize with greeting
      return [
        {
          id: `greet-${activeCharacter.id}`,
          sender: "character",
          text: activeCharacter.greeting,
          pronunciation: activeCharacter.greetingPronunciation,
          english: activeCharacter.greetingEnglish,
          correction: null,
          starters: activeCharacter.starters,
          timestamp: Date.now(),
        },
      ];
    }
    return characterChats[chatKey];
  }, [chatKey, activeCharacter, characterChats]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (activeCharacter) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages.length, isLoading, activeCharacter]);

  // Auto-speak initial greeting if just opened
  const greetedRef = useRef(new Set());
  useEffect(() => {
    if (activeCharacter && settings?.autoSpeak && !greetedRef.current.has(activeCharacter.id)) {
      greetedRef.current.add(activeCharacter.id);
      if (currentMessages.length === 1 && currentMessages[0].sender === "character") {
        speakSpanish(currentMessages[0].text, { voiceOverride: activeCharacter.voice });
      }
    }
  }, [activeCharacter, settings?.autoSpeak, currentMessages, speakSpanish]);

  const toggleReveal = useCallback((id) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleResetChat = useCallback(() => {
    if (!chatKey || !activeCharacter) return;
    if (window.confirm(`Reset conversation with ${activeCharacter.name}?`)) {
      const initial = [
        {
          id: `greet-${activeCharacter.id}-${Date.now()}`,
          sender: "character",
          text: activeCharacter.greeting,
          pronunciation: activeCharacter.greetingPronunciation,
          english: activeCharacter.greetingEnglish,
          correction: null,
          starters: activeCharacter.starters,
          timestamp: Date.now(),
        },
      ];
      updateChatThread(chatKey, initial, true);
      setRevealedIds({});
    }
  }, [chatKey, activeCharacter, updateChatThread]);

  // Send message
  const handleSendMessage = useCallback(
    async (textOverride) => {
      const rawText = (textOverride !== undefined ? textOverride : input).trim();
      if (!rawText || isLoading || !activeCharacter) return;

      setInput("");
      setSpeechError("");
      setApiError("");
      recordPractice();

      const userMsg = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: rawText,
        timestamp: Date.now(),
      };

      const updatedHistory = [...currentMessages, userMsg];
      updateChatThread(chatKey, updatedHistory);
      setIsLoading(true);

      const recentForContext = updatedHistory.slice(-8).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.sender === "user" ? m.text : `${m.text} (${m.english || ""})`,
      }));

      const systemPrompt = `You are roleplaying as "${activeCharacter.name}", ${activeCharacter.title}.
Character Persona: ${activeCharacter.personaPrompt}
Language: ${langName}.

Rules:
1. Stay deeply in character at all times. Do not sound like a generic AI or formal language tutor.
2. Reply in natural, spoken conversational ${langName} (1-2 sentences) followed by an engaging question or remark that keeps the conversation flowing.
3. If the user makes a clear language or grammar mistake, gently note the natural phrasing in the "correction" field. If their message is fine or easily understood, set "has_mistake": false.

Respond ONLY with raw JSON matching this structure (no markdown):
{
  "reply": "In-character reply in ${langName}",
  "pronunciation": "Phonetic syllable pronunciation guide with stressed syllables in CAPS",
  "english": "English translation of your reply",
  "correction": {
    "has_mistake": true or false,
    "original": "User's exact words",
    "corrected": "More natural phrasing in ${langName}",
    "tip": "Short 1-sentence friendly tip in English"
  },
  "starters": ["2 short realistic options user could say next"]
}`;

      try {
        const raw = await callAI({
          settings,
          system: systemPrompt,
          messages: recentForContext,
          maxTokens: 600,
        });

        const parsed = extractJson(raw);
        const replyText = parsed.reply || parsed.spanish || activeCharacter.greeting;
        const charMsg = {
          id: `c-${Date.now()}`,
          sender: "character",
          text: replyText,
          pronunciation: parsed.pronunciation || "",
          english: parsed.english || "",
          correction: parsed.correction?.has_mistake ? parsed.correction : null,
          starters: Array.isArray(parsed.starters) ? parsed.starters : activeCharacter.starters,
          timestamp: Date.now(),
        };

        updateChatThread(chatKey, [...updatedHistory, charMsg]);

        if (settings?.autoSpeak) {
          speakSpanish(replyText, { voiceOverride: activeCharacter.voice });
        }
      } catch (err) {
        console.warn("Character AI error, generating persona fallback:", err);
        // Realistic in-character fallback
        const fallbackStarters = activeCharacter.starters || [];
        const fallbackMsg = {
          id: `c-${Date.now()}`,
          sender: "character",
          text:
            langKey === "fr"
              ? `C'est très intéressant ! Dis-moi, qu'en penses-tu vraiment ?`
              : `¡Qué interesante! Cuéntame, ¿qué piensas tú de eso?`,
          pronunciation:
            langKey === "fr"
              ? "say tray z-an-tay-reh-SAHN! dee-mwah, kahn pahn-soo vray-MAHN?"
              : "¡keh een-teh-reh-SAHN-teh! KWEHN-tah-meh, ¿keh PYEHN-sahs too deh EH-soh?",
          english: "How interesting! Tell me, what do you really think about that?",
          correction: null,
          starters: fallbackStarters,
          timestamp: Date.now(),
        };

        updateChatThread(chatKey, [...updatedHistory, fallbackMsg]);

        if (err.code !== "NO_API_KEY") {
          setApiError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, activeCharacter, currentMessages, chatKey, langName, langKey, settings, recordPractice, speakSpanish, updateChatThread]
  );

  // Web Speech recognition for voice input
  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const startVoiceInput = () => {
    if (!speechSupported) {
      setSpeechError("Speech recognition is not supported in this browser.");
      return;
    }
    setSpeechError("");

    try {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechClass();
      recognitionRef.current = rec;

      rec.lang = settings?.accent || (langKey === "fr" ? "fr-FR" : "es-ES");
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => setIsListening(true);
      rec.onresult = (evt) => {
        let transcript = "";
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          transcript += evt.results[i][0].transcript;
        }
        setInput(transcript);
      };
      rec.onerror = (e) => {
        setSpeechError(`Voice error: ${e.error}`);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      rec.start();
    } catch (e) {
      setSpeechError("Microphone permission denied or unavailable.");
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop?.();
    setIsListening(false);
  };

  // --------------------------------------------------------------------------
  // RENDER: Dedicated Character Chat View
  // --------------------------------------------------------------------------
  if (activeCharacter) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#F5F5F7] dark:bg-black animate-fade-in">
        {/* Sticky Chat Header */}
        <div className="sticky top-0 z-20 material-thick border-b border-black/[0.06] dark:border-white/[0.10] -mx-4 -mt-3 px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setActiveCharacterId(null)}
              className="press-scale p-2 rounded-xl bg-white dark:bg-[#16161A] border border-black/[0.08] dark:border-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shadow-xs shrink-0"
              title="Back to Characters"
            >
              <Icon name="arrowLeft" className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`relative w-10 h-10 rounded-2xl bg-gradient-to-br ${activeCharacter.gradient} flex items-center justify-center text-xl shadow-xs shrink-0`}
              >
                {activeCharacter.avatar}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-white dark:border-black" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight truncate">
                    {activeCharacter.name}
                  </h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold text-[#86868B] dark:text-[#A1A1A6] shrink-0">
                    {activeCharacter.categoryLabel.split(" ")[0]}
                  </span>
                </div>
                <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-medium leading-tight truncate">
                  {activeCharacter.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <FavouriteButton
              variant="header"
              active={isFavourite(activeCharacter.id)}
              onClick={() => toggleFavourite(activeCharacter.id)}
            />
            <button
              type="button"
              onClick={() =>
                speakSpanish(activeCharacter.greeting, { voiceOverride: activeCharacter.voice })
              }
              className="press-scale p-2 rounded-xl bg-white dark:bg-[#16161A] border border-black/[0.08] dark:border-white/[0.10] text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/10 cursor-pointer shadow-xs"
              title="Hear character voice"
            >
              <Icon name="volume" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetChat}
              className="press-scale p-2 rounded-xl bg-white dark:bg-[#16161A] border border-black/[0.08] dark:border-white/[0.10] text-[#86868B] dark:text-[#A1A1A6] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 cursor-pointer shadow-xs"
              title="Reset conversation"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Bio Mini Card */}
        <div className="mt-3 mb-2 p-3 rounded-2xl bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] shadow-xs flex items-start gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${activeCharacter.gradient} text-white text-lg`}>
            {activeCharacter.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{activeCharacter.handle}</span>
              <span className="text-[10px] text-[#FF9600] font-black">🔥 {activeCharacter.chatsCount} chats</span>
            </div>
            <p className="text-xs text-[#48484A] dark:text-[#A1A1A6] mt-0.5 leading-relaxed">{activeCharacter.bio}</p>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 px-1">
          {currentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const isRevealed = revealedIds[msg.id];

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end animate-slide-up">
                  <div className="max-w-[85%] rounded-3xl rounded-tr-sm bg-[#007AFF] dark:bg-[#0A84FF] text-white px-4 py-2.5 shadow-xs">
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col items-start gap-1.5 animate-slide-up max-w-[92%]">
                <div className="flex items-end gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl bg-gradient-to-br ${activeCharacter.gradient} flex items-center justify-center text-sm shadow-xs shrink-0`}
                  >
                    {activeCharacter.avatar}
                  </div>

                  <div className="rounded-3xl rounded-tl-sm bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] p-3.5 shadow-xs space-y-2">
                    {/* Character Target Language Speech */}
                    <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-relaxed">
                      {msg.text}
                    </p>

                    {/* Audio Controls */}
                    <div className="flex items-center gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() =>
                          speakSpanish(msg.text, { voiceOverride: activeCharacter.voice })
                        }
                        className="press-scale inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] text-xs font-bold hover:bg-[#007AFF]/20 cursor-pointer"
                      >
                        <Icon name="volume" className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          speakSpanish(msg.text, {
                            slow: true,
                            voiceOverride: activeCharacter.voice,
                          })
                        }
                        className="press-scale px-2 py-1 rounded-xl bg-black/5 dark:bg-white/10 text-[#86868B] dark:text-[#A1A1A6] text-[11px] font-bold hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                        title="Listen at 0.7x slower speed"
                      >
                        0.7x
                      </button>

                      {/* Hidden Translation & Pronunciation Toggle */}
                      {(msg.english || msg.pronunciation) && (
                        <button
                          type="button"
                          onClick={() => toggleReveal(msg.id)}
                          className="press-scale ml-auto text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6] hover:text-[#007AFF] dark:hover:text-[#0A84FF] cursor-pointer"
                        >
                          {isRevealed ? "Hide translation ▲" : "Translate ▾"}
                        </button>
                      )}
                    </div>

                    {/* Expandable Translation & Pronunciation Card */}
                    {isRevealed && (
                      <div className="p-2.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-black/[0.04] dark:border-white/[0.06] space-y-1 animate-fade-in">
                        {msg.pronunciation && (
                          <p className="text-[11px] text-[#007AFF] dark:text-[#64D2FF] font-mono leading-tight">
                            🗣 {msg.pronunciation}
                          </p>
                        )}
                        {msg.english && (
                          <p className="text-xs text-[#48484A] dark:text-[#D1D1D6] leading-snug">
                            🇬🇧 {msg.english}
                          </p>
                        )}
                      </div>
                    )}

                    {/* In-character Gentle Learning Correction (Discreet & Non-intrusive) */}
                    {msg.correction && (
                      <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200/80 dark:border-amber-500/25 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                          <span>💡 Language Tip from {activeCharacter.name}</span>
                        </div>
                        <p className="text-amber-950 dark:text-amber-100 font-medium">
                          Try saying: <span className="font-bold underline">{msg.correction.corrected}</span>
                        </p>
                        {msg.correction.tip && (
                          <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">{msg.correction.tip}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div
                className={`w-7 h-7 rounded-xl bg-gradient-to-br ${activeCharacter.gradient} flex items-center justify-center text-sm shadow-xs shrink-0`}
              >
                {activeCharacter.avatar}
              </div>
              <div className="px-4 py-2.5 rounded-3xl bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#8E8E93] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-[#8E8E93] font-medium ml-1">
                  {activeCharacter.name} is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Starters Suggestions */}
        {activeCharacter.starters && activeCharacter.starters.length > 0 && !isLoading && (
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {activeCharacter.starters.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(starter)}
                className="press-scale shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-[#111114] border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/5 dark:hover:bg-white/10 hover:border-[#007AFF]/40 cursor-pointer shadow-xs transition-colors"
              >
                💬 {starter}
              </button>
            ))}
          </div>
        )}

        {/* Errors */}
        {speechError && (
          <div className="p-2 mb-2 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-xs font-semibold">
            {speechError}
          </div>
        )}
        {apiError && (
          <div className="p-2 mb-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
            <span>{apiError}</span>
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-[#007AFF] dark:text-[#0A84FF] underline font-bold"
            >
              Settings
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="sticky bottom-0 z-20 material-thick border-t border-black/[0.06] dark:border-white/[0.10] -mx-4 px-4 py-2 flex items-center gap-2">
          {speechSupported && (
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              className={`press-scale p-2.5 rounded-2xl cursor-pointer shadow-xs transition-colors ${
                isListening
                  ? "bg-[#FF3B30] text-white animate-pulse"
                  : "bg-white dark:bg-[#16161A] border border-black/[0.08] dark:border-white/[0.10] text-[#86868B] dark:text-[#A1A1A6] hover:text-[#007AFF]"
              }`}
              title={isListening ? "Stop listening" : `Speak in ${langName}`}
            >
              <Icon name="mic" className="w-5 h-5" />
            </button>
          )}

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Reply to ${activeCharacter.name}...`}
            disabled={isLoading}
            className="flex-1 bg-white dark:bg-[#111114] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl px-3.5 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] shadow-xs"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`press-scale p-2.5 rounded-2xl cursor-pointer shadow-xs transition-colors ${
              input.trim() && !isLoading
                ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white"
                : "bg-black/5 dark:bg-white/10 text-[#C7C7CC] dark:text-[#48484A] cursor-not-allowed"
            }`}
            title="Send message"
          >
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Character Discovery Interface (Character.AI Inspired)
  // --------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col space-y-4 pb-2 animate-fade-in">
      {/* Title & Subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <span>AI Characters</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] font-bold">
              {allCharacters.length} Available
            </span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] font-medium mt-0.5">
            Immerse yourself in real conversations with distinct personalities
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#86868B] dark:text-[#A1A1A6]">
          <Icon name="search" className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search characters, roles, or topics..."
          className="w-full bg-white dark:bg-[#0D0D10] border border-black/[0.08] dark:border-white/[0.12] rounded-2xl pl-10 pr-10 py-2.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {CHARACTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const showFavCount = cat.id === "favourites" && favouriteCount > 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`press-scale shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? "bg-[#1D1D1F] dark:bg-white text-white dark:text-black"
                  : "bg-white dark:bg-[#0D0D10] text-[#86868B] dark:text-[#A1A1A6] border border-black/[0.08] dark:border-white/[0.10] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              <span>{cat.label}</span>
              {showFavCount && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected
                      ? "bg-white/20 dark:bg-black/15 text-white dark:text-black"
                      : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {favouriteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Popular & Trending Carousel (When on "All" category & not searching) */}
      {selectedCategory === "all" && !searchQuery.trim() && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6] flex items-center gap-1.5">
              <span>🔥</span>
              <span>Popular & Trending</span>
            </h2>
            <span className="text-[11px] text-[#007AFF] dark:text-[#0A84FF] font-bold">Swipe to explore</span>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {featuredCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => setActiveCharacterId(char.id)}
                className="press-scale shrink-0 w-64 snap-start rounded-3xl bg-white dark:bg-[#0D0D10] border border-black/[0.08] dark:border-white/[0.10] p-4 flex flex-col justify-between shadow-xs cursor-pointer hover:border-[#007AFF]/50 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${char.gradient} flex items-center justify-center text-2xl shadow-sm`}
                    >
                      {char.avatar}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-white dark:border-[#0D0D10]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9600]/10 dark:bg-[#FF9F0A]/15 text-[#FF9600] font-black">
                        🔥 {char.chatsCount}
                      </span>
                      <FavouriteButton
                        active={isFavourite(char.id)}
                        onClick={(e) => toggleFavourite(char.id, e)}
                      />
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors leading-tight">
                    {char.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#86868B] dark:text-[#A1A1A6] leading-tight mt-0.5">
                    {char.title}
                  </p>
                  <p className="text-xs text-[#48484A] dark:text-[#A1A1A6] mt-2 line-clamp-2 leading-snug">
                    "{char.tagline}"
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.08] flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      CATEGORY_BADGE_STYLES[char.category] || char.badgeColor
                    }`}
                  >
                    {char.categoryLabel.split(" ")[0]} {char.category}
                  </span>
                  <span className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Chat &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All / Filtered Characters Grid */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#86868B] dark:text-[#A1A1A6]">
            {searchQuery
              ? `Search Results (${filteredCharacters.length})`
              : selectedCategory === "all"
              ? "All Characters"
              : CHARACTER_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Characters"}
          </h2>
          <span className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] font-semibold">
            {filteredCharacters.length} {filteredCharacters.length === 1 ? "personality" : "personalities"}
          </span>
        </div>

        {filteredCharacters.length === 0 ? (
          selectedCategory === "favourites" && !searchQuery.trim() ? (
            <div className="py-12 text-center rounded-3xl bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] p-6 space-y-2">
              <span className="text-3xl">⭐</span>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No favourite characters yet</h3>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
                Tap the star icon on any character card or inside a chat to save your favourites here.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="press-scale inline-block mt-2 px-4 py-2 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-bold cursor-pointer"
              >
                Browse all characters
              </button>
            </div>
          ) : (
            <div className="py-12 text-center rounded-3xl bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] p-6 space-y-2">
              <span className="text-3xl">🔍</span>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">No characters found</h3>
              <p className="text-xs text-[#86868B] dark:text-[#A1A1A6]">
                Try searching with different keywords or switch categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="press-scale inline-block mt-2 px-4 py-2 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-bold cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => setActiveCharacterId(char.id)}
                className="press-scale p-3.5 rounded-2xl bg-white dark:bg-[#0D0D10] border border-black/[0.06] dark:border-white/[0.10] hover:border-[#007AFF]/40 dark:hover:border-[#0A84FF]/50 flex items-center justify-between gap-3 shadow-xs cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${char.gradient} flex items-center justify-center text-2xl shadow-xs shrink-0`}
                  >
                    {char.avatar}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#34C759] border-2 border-white dark:border-[#0D0D10]" />
                  </div>

                  <div className="min-w-0 text-left flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-black text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors leading-tight">
                        {char.name}
                      </h3>
                      <span className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] font-semibold">
                        {char.handle}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-[#86868B] dark:text-[#A1A1A6] leading-tight truncate">
                      {char.title}
                    </p>
                    <p className="text-xs text-[#48484A] dark:text-[#A1A1A6] leading-snug truncate mt-0.5">
                      {char.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#FF9600] font-black">
                      🔥 {char.chatsCount}
                    </span>
                    <FavouriteButton
                      active={isFavourite(char.id)}
                      onClick={(e) => toggleFavourite(char.id, e)}
                    />
                  </div>
                  <button
                    type="button"
                    className="press-scale px-3 py-1 rounded-xl bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] text-xs font-bold group-hover:bg-[#007AFF] dark:group-hover:bg-[#0A84FF] group-hover:text-white transition-colors"
                  >
                    Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
