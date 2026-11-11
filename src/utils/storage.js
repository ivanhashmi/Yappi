import { STORAGE_KEY, SCENARIOS_DATA, LANGUAGES } from "../data/languages";

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

export function normalizeLoadedStreak(streak) {
  const today = getLocalDateKey();
  const yesterday = getYesterdayKey();
  if (!streak || typeof streak !== "object") {
    return { count: 0, lastActiveDate: null, activeDays: [] };
  }
  const activeDays = Array.isArray(streak.activeDays) ? streak.activeDays : [];
  const last = streak.lastActiveDate || null;
  if (last === today || last === yesterday) {
    return { count: Number(streak.count) || 0, lastActiveDate: last, activeDays };
  }
  return { count: 0, lastActiveDate: last, activeDays };
}

export function createInitialChats(lang = "es") {
  const chats = {};
  for (const l of LANGUAGES) {
    const scenarios = SCENARIOS_DATA[l.id] || SCENARIOS_DATA.es;
    for (const sc of scenarios) {
      const key = `${l.id}_${sc.id}`;
      chats[key] = [
        {
          id: `init-${key}`,
          sender: "tutor",
          spanish: sc.opening.spanish,
          pronunciation: sc.opening.pronunciation,
          english: sc.opening.english,
          correction: null,
          mode: "preset",
          timestamp: Date.now(),
        },
      ];
    }
  }
  return chats;
}

export const CHAR_STORAGE_KEY = "hola_character_chats_v1";
export const FAV_STORAGE_KEY = "hola_character_favourites_v1";

export function createDefaultState() {
  return {
    selectedLanguage: "es",
    streak: { count: 0, lastActiveDate: null, activeDays: [] },
    learnedWords: {},
    customDecks: [],
    chats: createInitialChats("es"),
    recentTranslations: [],
    settings: {
      provider: "gemini",
      apiKey: "",
      endpoint: "",
      model: "gemini-3.5-flash-lite",
      voiceEngine: "gemini",
      geminiVoice: "Kore",
      accent: "es-ES",
      selectedVoiceURI: "",
      speechRate: 0.92,
      autoSpeak: true,
      allowProxyWithoutKey: false,
      theme: "amoled",
    },
  };
}

export function loadSavedCharacterChats() {
  try {
    const saved = localStorage.getItem(CHAR_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadSavedFavourites() {
  try {
    const saved = localStorage.getItem(FAV_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadSavedState() {
  const defaults = createDefaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);

    const selectedLanguage = parsed.selectedLanguage === "fr" ? "fr" : "es";
    const mergedChats = createInitialChats(selectedLanguage);

    if (parsed.chats && typeof parsed.chats === "object") {
      // Restore backwards-compatible chats (e.g. "free" -> "es_free")
      for (const [k, v] of Object.entries(parsed.chats)) {
        if (Array.isArray(v) && v.length > 0) {
          const namespacedKey = k.includes("_") ? k : `es_${k}`;
          mergedChats[namespacedKey] = v;
        }
      }
    }

    const savedSettings = parsed.settings || {};
    const key = (savedSettings.apiKey || "").trim();
    let provider = savedSettings.provider;
    if (!provider || (key && !key.startsWith("sk-ant") && (key.startsWith("AQ") || key.startsWith("AIza")))) {
      provider = "gemini";
    }

    let model = savedSettings.model;
    if (provider === "gemini" && (!model || model.startsWith("claude") || model.includes("2.5") || model.includes("2.0") || model.includes("1.5"))) {
      model = "gemini-3.5-flash-lite";
    }

    const voiceEngine = savedSettings.voiceEngine || "gemini";
    const geminiVoice = savedSettings.geminiVoice || "Kore";
    const defaultAcc = selectedLanguage === "fr" ? "fr-FR" : "es-ES";
    const accent = savedSettings.accent || defaultAcc;
    const theme = savedSettings.theme === "light" ? "light" : "amoled";

    return {
      selectedLanguage,
      streak: normalizeLoadedStreak(parsed.streak),
      learnedWords: parsed.learnedWords && typeof parsed.learnedWords === "object" ? parsed.learnedWords : {},
      customDecks: Array.isArray(parsed.customDecks) ? parsed.customDecks : [],
      chats: mergedChats,
      recentTranslations: Array.isArray(parsed.recentTranslations) ? parsed.recentTranslations : [],
      settings: {
        ...defaults.settings,
        ...savedSettings,
        provider,
        model,
        voiceEngine,
        geminiVoice,
        accent,
        theme,
      },
    };
  } catch {
    return defaults;
  }
}
