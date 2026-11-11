import { supabase } from "./supabase";
import { createInitialChats, normalizeLoadedStreak } from "../utils/storage";

function splitScopedKey(scopedKey, fallbackLang = "es") {
  const idx = scopedKey.indexOf("_");
  if (idx === -1) return { language: fallbackLang, targetId: scopedKey };
  const lang = scopedKey.slice(0, idx);
  return {
    language: lang === "fr" ? "fr" : "es",
    targetId: scopedKey.slice(idx + 1),
  };
}

function sanitizeSettingsForCloud(settings = {}) {
  const copy = { ...settings };
  delete copy.apiKey;
  return copy;
}

function dedupeMessages(baseList, extraList) {
  const seen = new Set(baseList.map((m) => m.id));
  const merged = [...baseList];
  for (const m of extraList) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      merged.push(m);
    }
  }
  return merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

function mergeStreaks(localStreak, cloudStreak) {
  const a = normalizeLoadedStreak(localStreak);
  const b = normalizeLoadedStreak(cloudStreak);
  const activeDays = Array.from(new Set([...(a.activeDays || []), ...(b.activeDays || [])]))
    .sort()
    .slice(-30);

  if (!a.lastActiveDate) return { ...b, activeDays };
  if (!b.lastActiveDate) return { ...a, activeDays };

  if (a.lastActiveDate > b.lastActiveDate) {
    return { count: a.count, lastActiveDate: a.lastActiveDate, activeDays };
  }
  if (b.lastActiveDate > a.lastActiveDate) {
    return { count: b.count, lastActiveDate: b.lastActiveDate, activeDays };
  }
  return {
    count: Math.max(a.count, b.count),
    lastActiveDate: a.lastActiveDate,
    activeDays,
  };
}

export async function fetchCloudState(userId) {
  if (!supabase || !userId) return null;

  const [
    profileRes,
    learnedRes,
    decksRes,
    favsRes,
    charMsgRes,
    tutorMsgRes,
    transRes,
  ] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("learned_words").select("*").eq("user_id", userId),
    supabase.from("custom_decks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("character_favourites").select("*").eq("user_id", userId),
    supabase
      .from("character_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("tutor_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
    supabase
      .from("recent_translations")
      .select("*")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false })
      .limit(6),
  ]);

  const firstError =
    profileRes.error ||
    learnedRes.error ||
    decksRes.error ||
    favsRes.error ||
    charMsgRes.error ||
    tutorMsgRes.error ||
    transRes.error;

  if (firstError) {
    throw firstError;
  }

  const profile = profileRes.data;

  const learnedWords = {};
  for (const row of learnedRes.data || []) {
    learnedWords[row.word_key] = {
      key: row.word_key,
      spanish: row.spanish,
      english: row.english,
      pronunciation: row.pronunciation || "",
      deckTitle: row.deck_title || "",
      learnedAt: new Date(row.learned_at).getTime(),
    };
  }

  const customDecks = (decksRes.data || []).map((row) => ({
    id: row.client_deck_id,
    language: row.language,
    title: row.title,
    spanishTitle: row.spanish_title || "",
    isCustom: true,
    cards: Array.isArray(row.cards) ? row.cards : [],
  }));

  const favouriteKeys = (favsRes.data || []).map(
    (row) => `${row.language}_${row.character_id}`
  );

  const characterChats = {};
  for (const row of charMsgRes.data || []) {
    const key = `${row.language}_${row.character_id}`;
    if (!characterChats[key]) characterChats[key] = [];
    characterChats[key].push({
      id: row.client_msg_id,
      sender: row.sender,
      text: row.text,
      pronunciation: row.pronunciation || "",
      english: row.english || "",
      correction: row.correction || null,
      starters: Array.isArray(row.starters) ? row.starters : [],
      timestamp: new Date(row.created_at).getTime(),
    });
  }

  const tutorThreads = {};
  for (const row of tutorMsgRes.data || []) {
    const key = `${row.language}_${row.scenario_id}`;
    if (!tutorThreads[key]) tutorThreads[key] = [];
    tutorThreads[key].push({
      id: row.client_msg_id,
      sender: row.sender,
      text: row.text || undefined,
      spanish: row.spanish || undefined,
      pronunciation: row.pronunciation || "",
      english: row.english || "",
      correction: row.correction || null,
      suggested_replies: Array.isArray(row.suggested_replies) ? row.suggested_replies : [],
      mode: row.mode || "gemini",
      timestamp: new Date(row.created_at).getTime(),
    });
  }

  const recentTranslations = (transRes.data || []).map((row) => ({
    input: row.input_text,
    result: row.result,
    savedAt: new Date(row.saved_at).getTime(),
  }));

  return {
    profile,
    learnedWords,
    customDecks,
    favouriteKeys,
    characterChats,
    tutorThreads,
    recentTranslations,
  };
}

export async function syncAndMergeOnSignIn(
  userId,
  userEmail,
  { localAppState, localCharChats, localFavourites }
) {
  const cloud = await fetchCloudState(userId);
  if (!cloud) return null;

  const cloudProfile = cloud.profile;
  const hasCloudSettings =
    cloudProfile &&
    cloudProfile.settings &&
    Object.keys(cloudProfile.settings).length > 0;

  const selectedLanguage = hasCloudSettings
    ? cloudProfile.selected_language || localAppState.selectedLanguage
    : localAppState.selectedLanguage;

  const mergedSettings = {
    ...localAppState.settings,
    ...(hasCloudSettings ? cloudProfile.settings : {}),
    apiKey: localAppState.settings.apiKey || "",
  };

  const mergedStreak = mergeStreaks(
    localAppState.streak,
    cloudProfile
      ? {
          count: cloudProfile.streak_count,
          lastActiveDate: cloudProfile.last_active_date,
          activeDays: cloudProfile.active_days,
        }
      : null
  );

  const mergedLearned = { ...localAppState.learnedWords, ...cloud.learnedWords };

  const deckMap = new Map();
  for (const d of cloud.customDecks) deckMap.set(d.id, d);
  for (const d of localAppState.customDecks || []) {
    if (!deckMap.has(d.id)) deckMap.set(d.id, d);
  }
  const mergedDecks = Array.from(deckMap.values());

  const mergedFavourites = Array.from(
    new Set([...(localFavourites || []), ...(cloud.favouriteKeys || [])])
  );

  const mergedCharChats = { ...cloud.characterChats };
  for (const [key, localMsgs] of Object.entries(localCharChats || {})) {
    const cloudMsgs = mergedCharChats[key] || [];
    mergedCharChats[key] = dedupeMessages(cloudMsgs, localMsgs);
  }

  const mergedChats = createInitialChats(selectedLanguage);
  for (const [key, msgs] of Object.entries(localAppState.chats || {})) {
    const base = mergedChats[key] || [];
    const nonPreset = (msgs || []).filter((m) => m.mode !== "preset");
    if (nonPreset.length > 0) {
      mergedChats[key] = dedupeMessages(base, nonPreset);
    }
  }
  for (const [key, msgs] of Object.entries(cloud.tutorThreads || {})) {
    const base = mergedChats[key] || [];
    mergedChats[key] = dedupeMessages(base, msgs);
  }

  const transMap = new Map();
  for (const t of [...(cloud.recentTranslations || []), ...(localAppState.recentTranslations || [])]) {
    const existing = transMap.get(t.input);
    if (!existing || (t.savedAt || 0) > (existing.savedAt || 0)) {
      transMap.set(t.input, t);
    }
  }
  const mergedTranslations = Array.from(transMap.values())
    .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))
    .slice(0, 6);

  // Push local-only additions back up to Supabase in background
  await pushMergedAdditionsToCloud(userId, userEmail, {
    selectedLanguage,
    streak: mergedStreak,
    settings: mergedSettings,
    learnedWords: mergedLearned,
    customDecks: mergedDecks,
    favouriteKeys: mergedFavourites,
    characterChats: mergedCharChats,
    chats: mergedChats,
    recentTranslations: mergedTranslations,
    cloud,
  });

  return {
    appState: {
      ...localAppState,
      selectedLanguage,
      streak: mergedStreak,
      learnedWords: mergedLearned,
      customDecks: mergedDecks,
      chats: mergedChats,
      recentTranslations: mergedTranslations,
      settings: mergedSettings,
    },
    characterChats: mergedCharChats,
    favouriteKeys: mergedFavourites,
  };
}

async function pushMergedAdditionsToCloud(
  userId,
  userEmail,
  {
    selectedLanguage,
    streak,
    settings,
    learnedWords,
    customDecks,
    favouriteKeys,
    characterChats,
    chats,
    recentTranslations,
    cloud,
  }
) {
  if (!supabase || !userId) return;

  const ops = [];

  ops.push(
    supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        email: userEmail || cloud.profile?.email || null,
        selected_language: selectedLanguage,
        streak_count: streak.count,
        last_active_date: streak.lastActiveDate,
        active_days: streak.activeDays || [],
        settings: sanitizeSettingsForCloud(settings),
      },
      { onConflict: "user_id" }
    )
  );

  const learnedRows = Object.values(learnedWords)
    .filter((w) => !cloud.learnedWords[w.key])
    .map((w) => ({
      user_id: userId,
      word_key: w.key,
      spanish: w.spanish,
      english: w.english,
      pronunciation: w.pronunciation || "",
      deck_title: w.deckTitle || "",
      learned_at: new Date(w.learnedAt || Date.now()).toISOString(),
    }));
  if (learnedRows.length > 0) {
    ops.push(
      supabase
        .from("learned_words")
        .upsert(learnedRows, { onConflict: "user_id,word_key" })
    );
  }

  const cloudDeckIds = new Set(cloud.customDecks.map((d) => d.id));
  const deckRows = customDecks
    .filter((d) => !cloudDeckIds.has(d.id))
    .map((d) => ({
      user_id: userId,
      client_deck_id: d.id,
      language: d.language === "fr" ? "fr" : "es",
      title: d.title,
      spanish_title: d.spanishTitle || "",
      cards: d.cards || [],
    }));
  if (deckRows.length > 0) {
    ops.push(
      supabase
        .from("custom_decks")
        .upsert(deckRows, { onConflict: "user_id,client_deck_id" })
    );
  }

  const cloudFavSet = new Set(cloud.favouriteKeys);
  const favRows = favouriteKeys
    .filter((k) => !cloudFavSet.has(k))
    .map((k) => {
      const { language, targetId } = splitScopedKey(k);
      return { user_id: userId, language, character_id: targetId };
    });
  if (favRows.length > 0) {
    ops.push(
      supabase
        .from("character_favourites")
        .upsert(favRows, { onConflict: "user_id,language,character_id" })
    );
  }

  const charRows = [];
  for (const [scopedKey, msgs] of Object.entries(characterChats)) {
    const { language, targetId } = splitScopedKey(scopedKey);
    const existingIds = new Set((cloud.characterChats[scopedKey] || []).map((m) => m.id));
    for (const m of msgs) {
      if (!existingIds.has(m.id)) {
        charRows.push({
          user_id: userId,
          language,
          character_id: targetId,
          client_msg_id: m.id,
          sender: m.sender === "user" ? "user" : "character",
          text: m.text,
          pronunciation: m.pronunciation || "",
          english: m.english || "",
          correction: m.correction || null,
          starters: Array.isArray(m.starters) ? m.starters : [],
          created_at: new Date(m.timestamp || Date.now()).toISOString(),
        });
      }
    }
  }
  if (charRows.length > 0) {
    ops.push(
      supabase
        .from("character_messages")
        .upsert(charRows, { onConflict: "user_id,language,character_id,client_msg_id" })
    );
  }

  const tutorRows = [];
  for (const [scopedKey, msgs] of Object.entries(chats)) {
    const { language, targetId } = splitScopedKey(scopedKey);
    const existingIds = new Set((cloud.tutorThreads[scopedKey] || []).map((m) => m.id));
    for (const m of msgs) {
      if (m.mode === "preset" || existingIds.has(m.id)) continue;
      tutorRows.push({
        user_id: userId,
        language,
        scenario_id: targetId,
        client_msg_id: m.id,
        sender: m.sender === "user" ? "user" : "tutor",
        text: m.text || null,
        spanish: m.spanish || null,
        pronunciation: m.pronunciation || "",
        english: m.english || "",
        correction: m.correction || null,
        suggested_replies: Array.isArray(m.suggested_replies) ? m.suggested_replies : [],
        mode: m.mode || null,
        created_at: new Date(m.timestamp || Date.now()).toISOString(),
      });
    }
  }
  if (tutorRows.length > 0) {
    ops.push(
      supabase
        .from("tutor_messages")
        .upsert(tutorRows, { onConflict: "user_id,language,scenario_id,client_msg_id" })
    );
  }

  const cloudInputs = new Set(cloud.recentTranslations.map((t) => t.input));
  const transRows = recentTranslations
    .filter((t) => !cloudInputs.has(t.input))
    .map((t) => ({
      user_id: userId,
      input_text: t.input,
      result: t.result,
      saved_at: new Date(t.savedAt || Date.now()).toISOString(),
    }));
  if (transRows.length > 0) {
    ops.push(
      supabase
        .from("recent_translations")
        .upsert(transRows, { onConflict: "user_id,input_text" })
    );
  }

  await Promise.allSettled(ops);
}

// Granular incremental sync helpers
export async function syncProfile(userId, { selectedLanguage, streak, settings }) {
  if (!supabase || !userId) return;
  const payload = { user_id: userId };
  if (selectedLanguage) payload.selected_language = selectedLanguage;
  if (streak) {
    payload.streak_count = streak.count;
    payload.last_active_date = streak.lastActiveDate;
    payload.active_days = streak.activeDays || [];
  }
  if (settings) {
    payload.settings = sanitizeSettingsForCloud(settings);
  }
  await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" });
}

export async function syncLearnedWord(userId, entry, removed = false) {
  if (!supabase || !userId) return;
  if (removed) {
    await supabase
      .from("learned_words")
      .delete()
      .eq("user_id", userId)
      .eq("word_key", entry.key);
    return;
  }
  await supabase.from("learned_words").upsert(
    {
      user_id: userId,
      word_key: entry.key,
      spanish: entry.spanish,
      english: entry.english,
      pronunciation: entry.pronunciation || "",
      deck_title: entry.deckTitle || "",
      learned_at: new Date(entry.learnedAt || Date.now()).toISOString(),
    },
    { onConflict: "user_id,word_key" }
  );
}

export async function syncCustomDeck(userId, deck, removed = false) {
  if (!supabase || !userId) return;
  if (removed) {
    await supabase
      .from("custom_decks")
      .delete()
      .eq("user_id", userId)
      .eq("client_deck_id", deck.id);
    return;
  }
  await supabase.from("custom_decks").upsert(
    {
      user_id: userId,
      client_deck_id: deck.id,
      language: deck.language === "fr" ? "fr" : "es",
      title: deck.title,
      spanish_title: deck.spanishTitle || "",
      cards: deck.cards || [],
    },
    { onConflict: "user_id,client_deck_id" }
  );
}

export async function syncCharacterFavourite(userId, scopedKey, active) {
  if (!supabase || !userId) return;
  const { language, targetId } = splitScopedKey(scopedKey);
  if (!active) {
    await supabase
      .from("character_favourites")
      .delete()
      .eq("user_id", userId)
      .eq("language", language)
      .eq("character_id", targetId);
    return;
  }
  await supabase.from("character_favourites").upsert(
    { user_id: userId, language, character_id: targetId },
    { onConflict: "user_id,language,character_id" }
  );
}

export async function syncCharacterMessages(userId, scopedKey, messages, replaceThread = false) {
  if (!supabase || !userId) return;
  const { language, targetId } = splitScopedKey(scopedKey);
  if (replaceThread) {
    await supabase
      .from("character_messages")
      .delete()
      .eq("user_id", userId)
      .eq("language", language)
      .eq("character_id", targetId);
  }
  if (!messages || messages.length === 0) return;
  const rows = messages.map((m) => ({
    user_id: userId,
    language,
    character_id: targetId,
    client_msg_id: m.id,
    sender: m.sender === "user" ? "user" : "character",
    text: m.text,
    pronunciation: m.pronunciation || "",
    english: m.english || "",
    correction: m.correction || null,
    starters: Array.isArray(m.starters) ? m.starters : [],
    created_at: new Date(m.timestamp || Date.now()).toISOString(),
  }));
  await supabase
    .from("character_messages")
    .upsert(rows, { onConflict: "user_id,language,character_id,client_msg_id" });
}

export async function syncTutorMessages(userId, scopedKey, messages, replaceThread = false) {
  if (!supabase || !userId) return;
  const { language, targetId } = splitScopedKey(scopedKey);
  if (replaceThread) {
    await supabase
      .from("tutor_messages")
      .delete()
      .eq("user_id", userId)
      .eq("language", language)
      .eq("scenario_id", targetId);
  }
  const nonPreset = (messages || []).filter((m) => m.mode !== "preset");
  if (nonPreset.length === 0) return;
  const rows = nonPreset.map((m) => ({
    user_id: userId,
    language,
    scenario_id: targetId,
    client_msg_id: m.id,
    sender: m.sender === "user" ? "user" : "tutor",
    text: m.text || null,
    spanish: m.spanish || null,
    pronunciation: m.pronunciation || "",
    english: m.english || "",
    correction: m.correction || null,
    suggested_replies: Array.isArray(m.suggested_replies) ? m.suggested_replies : [],
    mode: m.mode || null,
    created_at: new Date(m.timestamp || Date.now()).toISOString(),
  }));
  await supabase
    .from("tutor_messages")
    .upsert(rows, { onConflict: "user_id,language,scenario_id,client_msg_id" });
}

export async function syncRecentTranslation(userId, entry) {
  if (!supabase || !userId || !entry?.input) return;
  await supabase.from("recent_translations").upsert(
    {
      user_id: userId,
      input_text: entry.input,
      result: entry.result,
      saved_at: new Date(entry.savedAt || Date.now()).toISOString(),
    },
    { onConflict: "user_id,input_text" }
  );
}

export async function resetAllCloudProgress(userId) {
  if (!supabase || !userId) return;
  await Promise.allSettled([
    supabase.from("learned_words").delete().eq("user_id", userId),
    supabase.from("custom_decks").delete().eq("user_id", userId),
    supabase.from("character_favourites").delete().eq("user_id", userId),
    supabase.from("character_messages").delete().eq("user_id", userId),
    supabase.from("tutor_messages").delete().eq("user_id", userId),
    supabase.from("recent_translations").delete().eq("user_id", userId),
    supabase
      .from("user_profiles")
      .update({
        selected_language: "es",
        streak_count: 0,
        last_active_date: null,
        active_days: [],
      })
      .eq("user_id", userId),
  ]);
}
