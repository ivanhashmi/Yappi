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
import { fetchGeminiSpeechAudio, checkServerGeminiStatus } from "./services/gemini";
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
  TabBar,
  Avatar,
  Button,
  DesktopSidebar,
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
  const [serverApiConfigured, setServerApiConfigured] = useState(true);
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

  useEffect(() => {
    let active = true;
    checkServerGeminiStatus().then((status) => {
      if (active) {
        setServerApiConfigured(Boolean(status?.configured));
      }
    });
    return () => {
      active = false;
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
        const defaultAcc = currentLangConfig?.defaultAccent || (currentLang === "fr" ? "fr-FR" : currentLang === "it" ? "it-IT" : "es-ES");
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

      if (useGemini && serverApiConfigured) {
        setIsSpeaking(true);
        try {
          const chosenVoice = voiceOverride || appState.settings.geminiVoice || "Kore";
          const dataUri = await fetchGeminiSpeechAudio(text, chosenVoice);
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
    [appState.settings.voiceEngine, appState.settings.geminiVoice, serverApiConfigured, stopSpeaking, speakWithDevice]
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

  const activeTheme = appState.settings?.theme || "system";

  const toggleTheme = useCallback(() => {
    const current = appStateRef.current.settings?.theme || "system";
    const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
    handleChangeTheme(next);
  }, [handleChangeTheme]);

  // Dark Mode: follows system preference by default, with manual light/dark/system override
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const computeIsDark = () => {
      if (activeTheme === "light") return false;
      if (activeTheme === "dark" || activeTheme === "amoled") return true;
      return mediaQuery.matches;
    };

    const applyTheme = () => {
      const isDark = computeIsDark();
      document.documentElement.classList.toggle("dark", isDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute("content", isDark ? "#000000" : "#FBFBFD");
      const statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBar) statusBar.setAttribute("content", isDark ? "black-translucent" : "default");
    };

    applyTheme();

    if (activeTheme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [activeTheme]);

  const learnedCount = Object.keys(appState.learnedWords).length;
  const apiConnected = Boolean(
    serverApiConfigured || appState.settings.allowProxyWithoutKey
  );

  const navTabs = useMemo(
    () => [
      { id: "chat", label: "Tutor", icon: <Icon name="tab-chat" className="w-5 h-5" /> },
      { id: "characters", label: "Characters", icon: <Icon name="tab-characters" className="w-5 h-5" /> },
      { id: "vocab", label: "Vocab", icon: <Icon name="tab-vocab" className="w-5 h-5" /> },
      { id: "translate", label: "Translate", icon: <Icon name="tab-translate" className="w-5 h-5" /> },
    ],
    []
  );

  const profileInitial = authUser?.email?.[0]?.toUpperCase() || null;

  return (
    <div className="w-full min-h-screen bg-canvas text-primary flex">
      {/* Desktop Sidebar (visible on lg: screens ≥1024px) */}
      <DesktopSidebar
        tabs={navTabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentLanguage={currentLang}
        currentLangConfig={currentLangConfig}
        onOpenLanguageSelector={() => setShowSettings(true)}
        authUser={authUser}
        syncStatus={syncStatus}
        apiConnected={apiConnected}
        streakCount={appState.streak?.count ?? 0}
        learnedCount={learnedCount}
        onOpenProfile={() => setShowAuthModal(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content Area: centered column with desktop sidebar margin */}
      <div className="flex-1 lg:pl-64 flex flex-col items-center w-full min-h-screen">
        <div className="w-full max-w-2xl lg:max-w-4xl min-h-screen flex flex-col relative">
          {/* Mobile Top Navigation Bar (Hidden on desktop because sidebar owns header & switcher) */}
          <header className="sticky top-0 z-30 glass-header px-4 sm:px-6 py-3 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              {/* Minimal Brand Wordmark */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-title font-semibold tracking-tight text-primary">
                  Yappi
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Course Switcher Pill */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="press-scale inline-flex items-center gap-2 min-h-[44px] px-3.5 py-1.5 rounded-full bg-surface text-primary border border-hairline hover:border-accent/40 shadow-xs cursor-pointer select-none transition-colors"
                  title="Switch Language & Course Settings"
                  aria-label={`Current language: ${currentLangConfig.name}. Tap to change language.`}
                >
                  <span className="text-body leading-none">{currentLangConfig.flag}</span>
                  <span className="text-caption font-semibold">
                    {currentLangConfig.name}
                  </span>
                  <Icon name="chevron-down" className="w-3.5 h-3.5 text-muted" />
                </button>

                {/* Stop audio button if speaking */}
                {isSpeaking && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={stopSpeaking}
                    ariaLabel="Stop audio playback"
                  >
                    Stop
                  </Button>
                )}

                {/* Profile & Settings button */}
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  aria-label={authUser ? `Profile: ${authUser.email}` : "Profile & Settings"}
                  className="press-scale relative w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-surface border border-hairline flex items-center justify-center text-primary hover:bg-subtle transition-colors cursor-pointer select-none"
                  title={authUser ? `Profile · ${authUser.email}` : "Profile & Settings"}
                >
                  {profileInitial ? (
                    <span className="text-caption font-bold text-primary">{profileInitial}</span>
                  ) : (
                    <Icon name="user" className="w-4 h-4 text-muted" />
                  )}
                  {authUser ? (
                    <span
                      className={`w-2 h-2 rounded-full absolute top-1.5 right-1.5 ${
                        syncStatus === "syncing"
                          ? "bg-status-warning animate-pulse"
                          : syncStatus === "error"
                          ? "bg-status-error"
                          : "bg-status-success"
                      }`}
                    />
                  ) : (
                    !apiConnected && (
                      <span className="w-2 h-2 rounded-full bg-status-warning absolute top-1.5 right-1.5" />
                    )
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Desktop Floating Audio Stop Pill if Speaking */}
          {isSpeaking && (
            <div className="hidden lg:block fixed top-5 right-6 z-50 animate-fade-in">
              <Button
                variant="primary"
                size="sm"
                onClick={stopSpeaking}
                ariaLabel="Stop audio playback"
              >
                Stop Audio
              </Button>
            </div>
          )}

          {/* Main Viewport Content */}
          <main className="flex-1 px-4 sm:px-6 py-4 pb-24 lg:pb-8 flex flex-col w-full">
          {activeTab === "chat" && (
            <ChatTab
              language={currentLang}
              chats={appState.chats}
              settings={appState.settings}
              streak={appState.streak}
              learnedWords={appState.learnedWords}
              customDecks={appState.customDecks}
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
              learnedWords={appState.learnedWords}
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

        {/* Apple-Style Minimal Fixed Bottom Tab Bar */}
        <TabBar
          tabs={navTabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* Settings Bottom Sheet Modal */}
        {showSettings && (
          <SettingsBottomSheet
            currentLanguage={currentLang}
            onChangeLanguage={handleLanguageChange}
            onChangeTheme={handleChangeTheme}
            settings={appState.settings}
            apiConnected={apiConnected}
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
  </div>
  );
}
