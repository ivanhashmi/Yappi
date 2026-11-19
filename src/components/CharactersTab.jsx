import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Icon from "./Icon";
import { Chip, Button, Avatar, Card } from "./ui";
import { CHARACTER_CATEGORIES, CHARACTERS_DATA } from "../data/charactersData";
import { callAI, extractJson } from "../services/gemini";
import {
  CHAR_STORAGE_KEY,
  FAV_STORAGE_KEY,
  loadSavedCharacterChats,
  loadSavedFavourites,
} from "../utils/storage";
import { triggerHaptic } from "../utils/haptics";

function FavouriteButton({ active, onClick, ariaLabel = "Favourite" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={active}
      className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors cursor-pointer ${
        active
          ? "text-accent bg-accent/10"
          : "text-muted hover:text-primary hover:bg-muted"
      }`}
    >
      <Icon name="star" filled={active} className="w-4 h-4" />
    </button>
  );
}

/* ============================================================================
 * TAB 2: CHARACTERS — Minimal Apple/Google Discovery & Roleplay View
 * ========================================================================== */
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
  const [interimText, setInterimText] = useState("");
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

  const langKey = language === "fr" ? "fr" : language === "it" ? "it" : "es";
  const langName = language === "fr" ? "French" : language === "it" ? "Italian" : "Spanish";
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
      triggerHaptic("success");
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

  // Featured characters for trending strip
  const featuredCharacters = useMemo(() => {
    return allCharacters.filter((c) => c.popular);
  }, [allCharacters]);

  // Active conversation
  const chatKey = activeCharacter ? `${langKey}_${activeCharacter.id}` : null;
  const currentMessages = useMemo(() => {
    if (!chatKey || !activeCharacter) return [];
    if (!characterChats[chatKey] || characterChats[chatKey].length === 0) {
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
        const fallbackStarters = activeCharacter.starters || [];
        const fallbackMsg = {
          id: `c-${Date.now()}`,
          sender: "character",
          text:
            langKey === "fr"
              ? `C'est très intéressant ! Dis-moi, qu'en penses-tu vraiment ?`
              : langKey === "it"
              ? `È molto interessante! Dimmi, tu cosa ne pensi veramente?`
              : `¡Qué interesante! Cuéntame, ¿qué piensas tú de eso?`,
          pronunciation:
            langKey === "fr"
              ? "say tray z-an-tay-reh-SAHN! dee-mwah, kahn pahn-soo vray-MAHN?"
              : langKey === "it"
              ? "eh MOHL-toh een-teh-rehs-SAHN-teh! DEEM-mee, too KOH-zah neh PEHN-see veh-rah-MEHN-teh?"
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
      setSpeechError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    setSpeechError("");

    try {
      const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechClass();
      recognitionRef.current = rec;

      const langPrefix = langKey;
      const accentMatches = settings?.accent && settings.accent.startsWith(langPrefix);
      rec.lang = accentMatches
        ? settings.accent
        : (langKey === "fr" ? "fr-FR" : langKey === "it" ? "it-IT" : "es-ES");
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

  // --------------------------------------------------------------------------
  // RENDER: Dedicated In-Character Chat View
  // --------------------------------------------------------------------------
  if (activeCharacter) {
    return (
      <div className="flex-1 flex flex-col h-full animate-fade-in">
        {/* Sticky Chat Header */}
        <div className="glass sticky top-0 z-20 -mx-4 -mt-4 px-4 py-3 flex items-center justify-between border-b border-hairline mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                stopVoiceInput();
                setActiveCharacterId(null);
              }}
              className="press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-subtle cursor-pointer transition-colors"
              aria-label="Back to Characters"
              title="Back"
            >
              <Icon name="arrowLeft" className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar character={activeCharacter} size="sm" />
              <div className="min-w-0">
                <h2 className="text-headline font-semibold text-primary truncate leading-tight">
                  {activeCharacter.name}
                </h2>
                <p className="text-overline text-muted truncate">
                  {activeCharacter.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <FavouriteButton
              active={isFavourite(activeCharacter.id)}
              onClick={() => toggleFavourite(activeCharacter.id)}
            />
            <button
              type="button"
              onClick={() =>
                speakSpanish(activeCharacter.greeting, { voiceOverride: activeCharacter.voice })
              }
              className="press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-subtle cursor-pointer transition-colors"
              aria-label="Listen to character voice"
              title="Listen"
            >
              <Icon name="volume" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetChat}
              className="press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-muted hover:text-status-error hover:bg-subtle cursor-pointer transition-colors"
              aria-label="Reset conversation"
              title="Reset"
            >
              <Icon name="refresh" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Bio Card */}
        <Card className="mb-4 p-4 flex items-start gap-3 bg-subtle/50">
          <Avatar character={activeCharacter} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-semibold text-primary">
                {activeCharacter.handle}
              </span>
              <span className="text-overline text-muted">
                {activeCharacter.chatsCount} practices
              </span>
            </div>
            <p className="text-caption text-muted mt-1 leading-relaxed">
              {activeCharacter.bio}
            </p>
          </div>
        </Card>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 py-1 px-0.5">
          {currentMessages.map((msg) => {
            const isUser = msg.sender === "user";
            const isRevealed = revealedIds[msg.id];

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end animate-fade-in">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-accent text-accent-contrast px-4 py-2.5 shadow-xs">
                    <p className="text-body font-normal leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col items-start gap-1.5 animate-fade-in max-w-[92%] sm:max-w-[85%]">
                <div className="w-full rounded-2xl rounded-tl-xs bg-surface border border-hairline p-4 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-overline font-semibold text-accent tracking-wide uppercase">
                      {activeCharacter.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          speakSpanish(msg.text, { voiceOverride: activeCharacter.voice })
                        }
                        className="press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-subtle cursor-pointer transition-colors"
                        aria-label="Listen"
                      >
                        <Icon name="volume" className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          speakSpanish(msg.text, {
                            slow: true,
                            voiceOverride: activeCharacter.voice,
                          })
                        }
                        className="press-scale px-2 py-1 rounded-full text-overline font-medium text-muted hover:text-primary hover:bg-subtle cursor-pointer transition-colors"
                        aria-label="Listen at 0.7x speed"
                      >
                        0.7×
                      </button>
                    </div>
                  </div>

                  <p className="text-body font-normal text-primary leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Expandable Translation */}
                  {(msg.english || msg.pronunciation) && (
                    <div className="pt-2 border-t border-hairline">
                      <button
                        type="button"
                        onClick={() => toggleReveal(msg.id)}
                        className="press-scale inline-flex items-center gap-1 text-caption text-muted hover:text-primary cursor-pointer select-none"
                      >
                        <Icon
                          name="chevronDown"
                          className={`w-3.5 h-3.5 transition-transform duration-fast ${
                            isRevealed ? "rotate-180" : ""
                          }`}
                        />
                        <span>{isRevealed ? "Hide translation" : "Translate"}</span>
                      </button>

                      {isRevealed && (
                        <div className="mt-2 p-3 rounded-xl bg-subtle space-y-1.5 animate-fade-in">
                          {msg.pronunciation && (
                            <p className="text-caption font-mono text-muted">
                              {msg.pronunciation}
                            </p>
                          )}
                          {msg.english && (
                            <p className="text-caption text-primary">
                              {msg.english}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Gentle Learning Correction (Inline Annotation) */}
                  {msg.correction && (
                    <div className="pt-2.5 mt-2 border-t border-hairline text-caption space-y-1">
                      <div className="text-overline font-semibold text-status-warning uppercase tracking-wide">
                        Language Note
                      </div>
                      <p className="text-primary">
                        <span className="line-through text-muted mr-1.5">{msg.correction.original}</span>
                        <span className="font-medium text-primary">→ {msg.correction.corrected}</span>
                      </p>
                      {msg.correction.tip && (
                        <p className="text-overline text-muted">{msg.correction.tip}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 animate-fade-in py-1">
              <Avatar character={activeCharacter} size="sm" />
              <div className="px-4 py-2.5 rounded-2xl bg-surface border border-hairline flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse [animation-delay:300ms]" />
                <span className="text-overline text-muted ml-1">
                  {activeCharacter.name} is thinking…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Starters Suggestions */}
        {activeCharacter.starters && activeCharacter.starters.length > 0 && !isLoading && !isListening && (
          <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {activeCharacter.starters.map((starter, i) => (
              <Chip
                key={i}
                active={false}
                onClick={() => handleSendMessage(starter)}
                className="shrink-0"
              >
                {starter}
              </Chip>
            ))}
          </div>
        )}

        {/* Floating Input Dock Area (Sticky Bottom) */}
        <div className="space-y-2 sticky bottom-0 bg-canvas/80 backdrop-blur-md pt-2 pb-1 z-20">
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

          {apiError && (
            <div className="p-3 rounded-xl bg-status-warning/10 text-status-warning text-caption font-medium flex items-center justify-between">
              <span>{apiError}</span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-accent underline font-semibold ml-2 cursor-pointer"
              >
                Settings
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

          <div className="rounded-full bg-surface border border-hairline shadow-md p-1.5 flex items-center gap-1.5">
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
                  handleSendMessage();
                }
              }}
              placeholder={`Reply to ${activeCharacter.name}…`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-body text-primary placeholder:text-muted focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Send reply"
              className={`press-scale min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-colors shrink-0 ${
                input.trim() && !isLoading
                  ? "bg-accent text-accent-contrast cursor-pointer"
                  : "text-muted/40 cursor-not-allowed"
              }`}
            >
              <Icon name="send" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Characters Discovery Interface (Grid & Search)
  // --------------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col space-y-6 pb-24 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-primary">
            Characters
          </h1>
          <p className="text-caption text-muted mt-0.5">
            Practice conversational {langName} with dedicated roleplay personas
          </p>
        </div>
        <span className="text-caption text-muted px-2.5 py-1 rounded-full bg-subtle border border-hairline font-medium">
          {allCharacters.length}
        </span>
      </div>

      {/* Search Bar (Clean 44px min touch, 16px text to avoid zoom) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <Icon name="search" className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search characters or topics…"
          className="w-full min-h-[44px] bg-surface border border-hairline rounded-2xl pl-10 pr-10 py-2.5 text-body text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-primary cursor-pointer"
            aria-label="Clear search"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {CHARACTER_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const showFavCount = cat.id === "favourites" && favouriteCount > 0;
          return (
            <Chip
              key={cat.id}
              active={isSelected}
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat.id);
              }}
              count={showFavCount ? favouriteCount : null}
            >
              {cat.label}
            </Chip>
          );
        })}
      </div>

      {/* Popular & Trending Carousel (When on "All" category & not searching) */}
      {selectedCategory === "all" && !searchQuery.trim() && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-overline font-semibold uppercase tracking-wider text-muted">
              Trending
            </h2>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 snap-x snap-mandatory pb-1">
            {featuredCharacters.map((char) => (
              <Card
                key={char.id}
                interactive
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveCharacterId(char.id);
                }}
                className="shrink-0 w-64 snap-start p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3.5">
                    <Avatar character={char} size="md" />
                    <div className="flex items-center gap-1">
                      <FavouriteButton
                        active={isFavourite(char.id)}
                        onClick={(e) => toggleFavourite(char.id, e)}
                      />
                    </div>
                  </div>

                  <h3 className="text-headline font-semibold text-primary leading-tight">
                    {char.name}
                  </h3>
                  <p className="text-caption text-muted mt-0.5">
                    {char.title}
                  </p>
                  <p className="text-caption text-muted mt-2.5 line-clamp-2 leading-relaxed">
                    "{char.tagline}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                  <span className="text-overline font-medium text-muted">
                    {char.chatsCount} practices
                  </span>
                  <span className="text-caption font-semibold text-accent">
                    Chat →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All / Filtered Characters List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-overline font-semibold uppercase tracking-wider text-muted">
            {searchQuery
              ? `Results (${filteredCharacters.length})`
              : selectedCategory === "all"
              ? "All Personas"
              : CHARACTER_CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Personas"}
          </h2>
          <span className="text-overline text-muted">
            {filteredCharacters.length} {filteredCharacters.length === 1 ? "character" : "characters"}
          </span>
        </div>

        {filteredCharacters.length === 0 ? (
          <Card className="py-12 text-center p-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-subtle flex items-center justify-center text-muted">
              <Icon name="search" className="w-5 h-5" />
            </div>
            <h3 className="text-headline font-semibold text-primary">
              {selectedCategory === "favourites"
                ? "No favourite characters yet"
                : "No characters found"}
            </h3>
            <p className="text-caption text-muted max-w-xs mx-auto">
              {selectedCategory === "favourites"
                ? "Tap the star icon on any character to save your favourites here."
                : "Try searching with different keywords or switch categories."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredCharacters.map((char) => (
              <Card
                key={char.id}
                interactive
                onClick={() => {
                  triggerHaptic("selection");
                  setActiveCharacterId(char.id);
                }}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Avatar character={char} size="md" />

                  <div className="min-w-0 text-left flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-headline font-semibold text-primary leading-tight truncate">
                        {char.name}
                      </h3>
                      <span className="text-overline text-muted">
                        {char.handle}
                      </span>
                    </div>
                    <p className="text-caption text-muted leading-tight truncate mt-0.5">
                      {char.title}
                    </p>
                    <p className="text-caption text-muted leading-relaxed truncate mt-1">
                      {char.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2">
                  <FavouriteButton
                    active={isFavourite(char.id)}
                    onClick={(e) => toggleFavourite(char.id, e)}
                  />
                  <span className="text-caption font-semibold text-accent">
                    Chat →
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
