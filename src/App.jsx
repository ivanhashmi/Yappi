import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { STORAGE_KEY, LANGUAGES } from "./data/languages";
import {
  CHAR_STORAGE_KEY,
  FAV_STORAGE_KEY,
  createDefaultState,
  loadSavedState,
  loadSavedCharacterChats,
  loadSavedFavourites,
  normalizeLoadedStreak,
  getLocalDateKey,
  getYesterdayKey,
} from "./utils/storage";
import { fetchGeminiSpeechAudio } from "./services/gemini";
import { supabase } from "./services/supabase";
import {
  syncAndMergeOnSignIn,
  syncProfile,
  syncLearnedWord,
  syncCustomDeck,
  syncCharacterFavourite,
  syncCharacterMessages,
  syncTutorMessages,
  syncRecentTranslation,
  resetAllCloudProgress,
} from "./services/sync";
import {
  Icon,
  ChatTab,
  CharactersTab,
  VocabTab,
  TranslateTab,
  SettingsBottomSheet,
  LearnedWordsBottomSheet,
  AuthBottomSheet,
} from "./components";

export default function App() {
  const [appState, setAppState] = useState(loadSavedState);
  const [characterChats, setCharacterChats] = useState(loadSavedCharacterChats);
  const [favouriteKeys, setFavouriteKeys] = useState(loadSavedFavourites);
  const [activeTab, setActiveTab] = useState("chat");
  const [activeScenarioId, setActiveScenarioId] = useState("free");
  const [showSettings, setShowSettings] = useState(false);
  const [showLearnedModal, setShowLearnedModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [voices, setVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentAudioRef = useRef(null);

  const appStateRef = useRef(appState);
  const charChatsRef = useRef(characterChats);
  const favouritesRef = useRef(favouriteKeys);
  const authUserRef = useRef(authUser);
  const syncedUserRef = useRef(null);

  appStateRef.current = appState;
  charChatsRef.current = characterChats;
  favouritesRef.current = favouriteKeys;
  authUserRef.current = authUser;

  const currentLang = appState.selectedLanguage || "es";
  const currentLangConfig = useMemo(() => {
    return LANGUAGES.find((l) => l.id === currentLang) || LANGUAGES[0];
  }, [currentLang]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // ignore
    }
  }, [appState]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(characterChats));
    } catch {
      // ignore
    }
  }, [characterChats]);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favouriteKeys));
    } catch {
      // ignore
    }
  }, [favouriteKeys]);

  // Verify active Supabase JWT claims & listen for auth changes
  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const refreshUserFromClaims = async () => {
      try {
        const { data } = await supabase.auth.getClaims();
        if (!active) return;
        const claims = data?.claims;
        if (claims?.sub) {
          setAuthUser({ id: claims.sub, email: claims.email || "" });
        } else {
          setAuthUser(null);
          syncedUserRef.current = null;
        }
      } catch {
        if (active) setAuthUser(null);
      }
    };

    refreshUserFromClaims();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUserFromClaims();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const runCloudSync = useCallback(async (user) => {
    if (!user?.id || !supabase) return;
    setSyncStatus("syncing");
    try {
      const merged = await syncAndMergeOnSignIn(user.id, user.email, {
        localAppState: appStateRef.current,
        localCharChats: charChatsRef.current,
        localFavourites: favouritesRef.current,
      });
      if (merged) {
        setAppState(merged.appState);
        setCharacterChats(merged.characterChats);
        setFavouriteKeys(merged.favouriteKeys);
      }
      setSyncStatus("synced");
    } catch (err) {
      console.warn("Supabase sync error:", err);
      setSyncStatus("error");
    }
  }, []);

  // Automatically sync when a user signs in
  useEffect(() => {
    if (!authUser?.id) return;
    if (syncedUserRef.current === authUser.id) return;
    syncedUserRef.current = authUser.id;
    runCloudSync(authUser);
  }, [authUser, runCloudSync]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const sync = () => setVoices(window.speechSynthesis.getVoices() || []);
    sync();
    window.speechSynthesis.addEventListener?.("voiceschanged", sync);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", sync);
      window.speechSynthesis.cancel();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const isHighQualityVoice = useCallback((voice) => {
    if (!voice) return false;
    const name = (voice.name || "").toLowerCase();
    return (
      name.includes("enhanced") ||
      name.includes("premium") ||
      name.includes("natural") ||
      name.includes("siri") ||
      name.includes("google")
    );
  }, []);

  const pickNativeVoice = useCallback(
    (preferredLang, voiceURI) => {
      if (!voices.length) return null;
      if (voiceURI) {
        const byURI = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
        if (byURI) return byURI;
      }
      const prefix = (preferredLang || "es").slice(0, 2).toLowerCase();
      const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
      if (!langVoices.length) return null;

      // 1. Highest priority: Enhanced / Studio voice matching the selected accent
      const hqPreferred = langVoices.find(
        (v) => v.lang.toLowerCase() === preferredLang.toLowerCase() && isHighQualityVoice(v)
      );
      if (hqPreferred) return hqPreferred;

      // 2. Next priority: Standard voice matching preferred accent
      const exactPreferred = langVoices.find((v) => v.lang.toLowerCase() === preferredLang.toLowerCase());
      if (exactPreferred) return exactPreferred;

      // 3. Next priority: Any Enhanced voice for that language
      const anyHq = langVoices.find(isHighQualityVoice);
      if (anyHq) return anyHq;

      // 4. Fallback: First available voice for that language
      return langVoices[0] || null;
    },
    [voices, isHighQualityVoice]
  );

  const speakWithDevice = useCallback(
    (text, { slow = false } = {}) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const defaultAcc = currentLang === "fr" ? "fr-FR" : "es-ES";
        const preferred = appState.settings.accent || defaultAcc;
        const voice = pickNativeVoice(preferred, appState.settings.selectedVoiceURI);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || preferred;
        const baseRate = Number(appState.settings.speechRate) || 0.92;
        utterance.rate = slow ? Math.max(0.58, baseRate * 0.72) : baseRate;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsSpeaking(false);
      }
    },
    [currentLang, appState.settings.accent, appState.settings.speechRate, appState.settings.selectedVoiceURI, pickNativeVoice]
  );

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakSpanish = useCallback(
    async (text, { slow = false, forceDevice = false, voiceOverride } = {}) => {
      if (!text) return;
      stopSpeaking();

      const useGemini = !forceDevice && appState.settings.voiceEngine !== "device";
      const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || appState.settings.apiKey || "").replace(/['"\s]/g, "");

      if (useGemini && apiKey) {
        setIsSpeaking(true);
        try {
          const chosenVoice = voiceOverride || appState.settings.geminiVoice || "Kore";
          const dataUri = await fetchGeminiSpeechAudio(text, chosenVoice, apiKey);
          const audio = new Audio(dataUri);
          currentAudioRef.current = audio;
          audio.playbackRate = slow ? 0.8 : 1.0;
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => {
            setIsSpeaking(false);
            currentAudioRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            currentAudioRef.current = null;
            speakWithDevice(text, { slow });
          };
          await audio.play();
          return;
        } catch (err) {
          console.warn("Gemini voice audio error, falling back to device speech:", err);
          currentAudioRef.current = null;
        }
      }

      speakWithDevice(text, { slow });
    },
    [appState.settings.voiceEngine, appState.settings.apiKey, appState.settings.geminiVoice, stopSpeaking, speakWithDevice]
  );

  const runBgSync = useCallback((fn) => {
    const uid = authUserRef.current?.id;
    if (!uid) return;
    Promise.resolve(fn(uid)).catch((err) => {
      console.warn("Background sync failed:", err);
    });
  }, []);

  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CHAR_STORAGE_KEY);
      localStorage.removeItem(FAV_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAppState(createDefaultState());
    setCharacterChats({});
    setFavouriteKeys([]);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    syncedUserRef.current = null;
    setAuthUser(null);
    setSyncStatus("idle");
    clearLocalStorage();
  }, [clearLocalStorage]);

  const recordPractice = useCallback(() => {
    const today = getLocalDateKey();
    const yesterday = getYesterdayKey();
    const current = normalizeLoadedStreak(appStateRef.current.streak);
    if (current.lastActiveDate === today) return;
    const nextCount = current.lastActiveDate === yesterday ? current.count + 1 : 1;
    const nextDays = Array.from(new Set([...current.activeDays, today])).slice(-30);
    const nextStreak = { count: nextCount, lastActiveDate: today, activeDays: nextDays };

    setAppState((prev) => ({
      ...prev,
      streak: nextStreak,
    }));
    runBgSync((uid) => syncProfile(uid, { streak: nextStreak }));
  }, [runBgSync]);

  const toggleLearnedWord = useCallback(
    (card, deckTitle) => {
      recordPractice();
      const key = `${card.spanish.toLowerCase()}::${card.english.toLowerCase()}`;
      const existing = appStateRef.current.learnedWords[key];
      const nextLearned = { ...appStateRef.current.learnedWords };
      let entry = { key };
      let removed = false;

      if (existing) {
        delete nextLearned[key];
        removed = true;
      } else {
        entry = {
          key,
          spanish: card.spanish,
          english: card.english,
          pronunciation: card.pronunciation || "",
          deckTitle,
          learnedAt: Date.now(),
        };
        nextLearned[key] = entry;
      }

      setAppState((prev) => ({ ...prev, learnedWords: nextLearned }));
      runBgSync((uid) => syncLearnedWord(uid, entry, removed));
    },
    [recordPractice, runBgSync]
  );

  const isWordLearned = useCallback(
    (card) => {
      const key = `${card.spanish.toLowerCase()}::${card.english.toLowerCase()}`;
      return Boolean(appState.learnedWords[key]);
    },
    [appState.learnedWords]
  );

  const handleLanguageChange = useCallback(
    (newLang) => {
      const targetConfig = LANGUAGES.find((l) => l.id === newLang) || LANGUAGES[0];
      const nextSettings = {
        ...appStateRef.current.settings,
        accent: targetConfig.defaultAccent,
        selectedVoiceURI: "",
      };
      setAppState((prev) => ({
        ...prev,
        selectedLanguage: newLang,
        settings: nextSettings,
      }));
      setActiveScenarioId("free");
      runBgSync((uid) =>
        syncProfile(uid, { selectedLanguage: newLang, settings: nextSettings })
      );
    },
    [runBgSync]
  );

  const handleUpdateChat = useCallback(
    (key, updater) => {
      const currentThread = appStateRef.current.chats[key] || [];
      const nextThread = typeof updater === "function" ? updater(currentThread) : updater;
      const nextChats = { ...appStateRef.current.chats, [key]: nextThread };
      appStateRef.current = { ...appStateRef.current, chats: nextChats };
      setAppState((prev) => ({
        ...prev,
        chats: { ...prev.chats, [key]: nextThread },
      }));
      const isReset = nextThread.length === 1 && nextThread[0]?.mode === "preset";
      runBgSync((uid) => syncTutorMessages(uid, key, nextThread, isReset));
    },
    [runBgSync]
  );

  const handleUpdateCharacterChat = useCallback(
    (key, nextMsgs, replaceThread = false) => {
      setCharacterChats((prev) => ({ ...prev, [key]: nextMsgs }));
      runBgSync((uid) => syncCharacterMessages(uid, key, nextMsgs, replaceThread));
    },
    [runBgSync]
  );

  const handleToggleFavourite = useCallback(
    (favKey, nextActive) => {
      setFavouriteKeys((prev) =>
        nextActive
          ? prev.includes(favKey)
            ? prev
            : [...prev, favKey]
          : prev.filter((k) => k !== favKey)
      );
      runBgSync((uid) => syncCharacterFavourite(uid, favKey, nextActive));
    },
    [runBgSync]
  );

  const handleChangeTheme = useCallback(
    (nextTheme) => {
      const normalized = nextTheme === "light" ? "light" : "amoled";
      const nextSettings = { ...appStateRef.current.settings, theme: normalized };
      setAppState((prev) => ({ ...prev, settings: nextSettings }));
      runBgSync((uid) => syncProfile(uid, { settings: nextSettings }));
    },
    [runBgSync]
  );

  const toggleTheme = useCallback(() => {
    const isLight = appStateRef.current.settings?.theme === "light";
    handleChangeTheme(isLight ? "amoled" : "light");
  }, [handleChangeTheme]);

  // Apply AMOLED Dark Mode class & theme-color meta tag
  const activeTheme = appState.settings?.theme === "light" ? "light" : "amoled";
  useEffect(() => {
    const isDark = activeTheme !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", isDark ? "#000000" : "#F5F5F7");
    const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBar) statusBar.setAttribute("content", isDark ? "black-translucent" : "default");
  }, [activeTheme]);

  const learnedCount = Object.keys(appState.learnedWords).length;
  const apiConnected = Boolean(
    import.meta.env.VITE_GEMINI_API_KEY ||
      (appState.settings.apiKey || "").trim() ||
      appState.settings.allowProxyWithoutKey
  );

  const tabs = [
    { id: "chat", label: "Tutor", icon: "tab-chat" },
    { id: "characters", label: "Characters", icon: "tab-characters" },
    { id: "vocab", label: "Vocab", icon: "tab-vocab" },
    { id: "translate", label: "Translate", icon: "tab-translate" },
  ];

  const profileInitial = authUser?.email?.[0]?.toUpperCase() || null;

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col items-center">
      {/* Phone App Wrapper: mobile-first max-w-md on desktop, 100% on phone */}
      <div className="w-full max-w-md min-h-screen bg-[#F5F5F7] dark:bg-black flex flex-col relative md:shadow-2xl md:border-x md:border-black/[0.06] dark:md:border-white/[0.08]">
        {/* Yappi Top Navigation Bar */}
        <header className="sticky top-0 z-30 material-thick border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Yappi Brand Wordmark */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] dark:from-[#0A84FF] dark:to-[#5E5CE6] text-white flex items-center justify-center text-sm font-black shadow-xs shrink-0">
                Y
              </div>
              <span className="text-base font-black tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                Yappi
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Compact Active Course Pill */}
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="press-scale flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white dark:bg-[#0D0D10] border border-black/[0.08] dark:border-white/[0.10] shadow-xs cursor-pointer hover:border-[#58CC02]/40 transition-all"
                title="Switch Language & Course Settings"
              >
                <span className="text-base leading-none">{currentLangConfig.flag}</span>
                <span className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {currentLangConfig.name}
                </span>
                <Icon name="chevron-down" className="w-3 h-3 text-[#86868B] dark:text-[#A1A1A6]" />
              </button>

              {/* Stop audio button if speaking */}
              {isSpeaking && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="press-scale px-2 py-1.5 rounded-2xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-[11px] font-black cursor-pointer shadow-xs"
                >
                  Stop
                </button>
              )}

              {/* Profile & Settings button */}
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                aria-label="Profile & Settings"
                className={`press-scale w-9 h-9 rounded-2xl border flex items-center justify-center cursor-pointer relative shadow-xs transition-colors ${
                  authUser
                    ? "bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 border-[#007AFF]/30 dark:border-[#0A84FF]/35 text-[#007AFF] dark:text-[#0A84FF]"
                    : "bg-white dark:bg-[#0D0D10] border-black/[0.08] dark:border-white/[0.10] text-[#86868B] dark:text-[#F5F5F7] hover:text-[#1D1D1F] hover:bg-black/5 dark:hover:bg-white/10"
                }`}
                title={authUser ? `Profile · ${authUser.email}` : "Profile & Settings"}
              >
                {profileInitial ? (
                  <span className="text-xs font-black">{profileInitial}</span>
                ) : (
                  <Icon name="user" className="w-4 h-4" />
                )}
                {authUser ? (
                  <span
                    className={`w-2 h-2 rounded-full absolute top-1 right-1 ${
                      syncStatus === "syncing"
                        ? "bg-[#FF9600] animate-pulse"
                        : syncStatus === "error"
                        ? "bg-[#FF3B30]"
                        : "bg-[#34C759]"
                    }`}
                  />
                ) : (
                  !apiConnected && (
                    <span className="w-2 h-2 rounded-full bg-[#FF9600] absolute top-1 right-1" />
                  )
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Main Phone Viewport Content */}
        <main className="flex-1 px-4 py-3 pb-safe-bottom flex flex-col">
          {activeTab === "chat" && (
            <ChatTab
              language={currentLang}
              chats={appState.chats}
              activeScenarioId={activeScenarioId}
              setActiveScenarioId={setActiveScenarioId}
              settings={appState.settings}
              apiConnected={apiConnected}
              speakSpanish={speakSpanish}
              recordPractice={recordPractice}
              onOpenSettings={() => setShowSettings(true)}
              onUpdateChat={handleUpdateChat}
              onToggleAutoSpeak={() => {
                const nextSettings = {
                  ...appStateRef.current.settings,
                  autoSpeak: !appStateRef.current.settings.autoSpeak,
                };
                setAppState((prev) => ({ ...prev, settings: nextSettings }));
                runBgSync((uid) => syncProfile(uid, { settings: nextSettings }));
              }}
            />
          )}

          {activeTab === "characters" && (
            <CharactersTab
              language={currentLang}
              settings={appState.settings}
              apiConnected={apiConnected}
              speakSpanish={speakSpanish}
              recordPractice={recordPractice}
              onOpenSettings={() => setShowSettings(true)}
              characterChats={characterChats}
              favouriteKeys={favouriteKeys}
              onUpdateCharacterChat={handleUpdateCharacterChat}
              onToggleFavourite={handleToggleFavourite}
            />
          )}

          {activeTab === "vocab" && (
            <VocabTab
              language={currentLang}
              customDecks={appState.customDecks}
              settings={appState.settings}
              apiConnected={apiConnected}
              speakSpanish={speakSpanish}
              recordPractice={recordPractice}
              isWordLearned={isWordLearned}
              onToggleLearned={toggleLearnedWord}
              onOpenSettings={() => setShowSettings(true)}
              onAddCustomDeck={(deck) => {
                setAppState((prev) => ({
                  ...prev,
                  customDecks: [deck, ...prev.customDecks],
                }));
                runBgSync((uid) => syncCustomDeck(uid, deck, false));
              }}
              onDeleteCustomDeck={(deckId) => {
                setAppState((prev) => ({
                  ...prev,
                  customDecks: prev.customDecks.filter((d) => d.id !== deckId),
                }));
                runBgSync((uid) => syncCustomDeck(uid, { id: deckId }, true));
              }}
            />
          )}

          {activeTab === "translate" && (
            <TranslateTab
              language={currentLang}
              settings={appState.settings}
              apiConnected={apiConnected}
              recentTranslations={appState.recentTranslations}
              speakSpanish={speakSpanish}
              recordPractice={recordPractice}
              onOpenSettings={() => setShowSettings(true)}
              onSaveTranslation={(entry) => {
                setAppState((prev) => ({
                  ...prev,
                  recentTranslations: [
                    entry,
                    ...prev.recentTranslations.filter((r) => r.input !== entry.input),
                  ].slice(0, 6),
                }));
                runBgSync((uid) => syncRecentTranslation(uid, entry));
              }}
            />
          )}
        </main>

        {/* iOS-Style Fixed Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 material-bottom-bar bottom-bar-safe">
          <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="press-scale flex flex-col items-center justify-center py-1 cursor-pointer"
                >
                  <div
                    className={`transition-colors ${
                      active ? "text-[#007AFF] dark:text-[#0A84FF]" : "text-[#8E8E93]"
                    }`}
                  >
                    <Icon name={tab.icon} className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] tracking-tight mt-0.5 ${
                      active
                        ? "text-[#007AFF] dark:text-[#0A84FF] font-bold"
                        : "text-[#8E8E93] font-medium"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Settings Bottom Sheet Modal */}
        {showSettings && (
          <SettingsBottomSheet
            currentLanguage={currentLang}
            onChangeLanguage={handleLanguageChange}
            onChangeTheme={handleChangeTheme}
            settings={appState.settings}
            voices={voices}
            authUser={authUser}
            syncStatus={syncStatus}
            onOpenAuth={() => {
              setShowSettings(false);
              setShowAuthModal(true);
            }}
            onClose={() => setShowSettings(false)}
            onTestVoice={(vName) =>
              speakSpanish(currentLangConfig.sampleSpeech, { voiceOverride: vName })
            }
            onSave={(newSettings) => {
              setAppState((prev) => ({ ...prev, settings: newSettings }));
              setShowSettings(false);
              runBgSync((uid) => syncProfile(uid, { settings: newSettings }));
            }}
            onResetProgress={() => {
              clearLocalStorage();
              runBgSync((uid) => resetAllCloudProgress(uid));
              setShowSettings(false);
            }}
          />
        )}

        {/* Profile & Cloud Sync Bottom Sheet Modal */}
        {showAuthModal && (
          <AuthBottomSheet
            user={authUser}
            syncStatus={syncStatus}
            streakCount={appState.streak.count}
            activeDaysCount={(appState.streak.activeDays || []).length}
            learnedCount={learnedCount}
            theme={activeTheme}
            onToggleTheme={toggleTheme}
            onOpenLearnedWords={() => {
              setShowAuthModal(false);
              setShowLearnedModal(true);
            }}
            onOpenSettings={() => {
              setShowAuthModal(false);
              setShowSettings(true);
            }}
            onClose={() => setShowAuthModal(false)}
            onForceSync={() => authUser && runCloudSync(authUser)}
            onSignOut={handleSignOut}
          />
        )}

        {/* Learned Words Bottom Sheet Modal */}
        {showLearnedModal && (
          <LearnedWordsBottomSheet
            learnedWords={appState.learnedWords}
            speakSpanish={speakSpanish}
            onRemove={(key) => {
              setAppState((prev) => {
                const next = { ...prev.learnedWords };
                delete next[key];
                return { ...prev, learnedWords: next };
              });
              runBgSync((uid) => syncLearnedWord(uid, { key }, true));
            }}
            onClose={() => setShowLearnedModal(false)}
          />
        )}
      </div>
    </div>
  );
}
