import { MINI_LEXICON_DATA } from "../data/languages.js";

// In-memory cache for audio playback (speeds up alphabet, cards, and common phrases to 0ms)
export const ttsAudioCache = new Map();

export function pcmToWavDataUri(base64Pcm, sampleRate = 24000, numChannels = 1) {
  const binaryString = atob(base64Pcm);
  const dataLen = binaryString.length;
  const buffer = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataLen, true);

  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < dataLen; i++) {
    bytes[44 + i] = binaryString.charCodeAt(i);
  }

  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export async function checkServerGeminiStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch("/api/gemini", {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return { reachable: false, configured: false };
    const data = await response.json();
    return { reachable: true, configured: Boolean(data?.configured) };
  } catch {
    return { reachable: false, configured: false };
  }
}

async function postGeminiProxy(model, payload, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, payload }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      const err = new Error(`Gemini API (${response.status}): ${bodyText.slice(0, 160) || response.statusText}`);
      err.status = response.status;
      if (response.status === 503) err.code = "NO_API_KEY";
      throw err;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGeminiSpeechAudio(text, voiceName = "Kore") {
  const cacheKey = `${voiceName}::${text.trim().toLowerCase()}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey);
  }

  // Active verified TTS models in priority order
  const ttsModels = [
    "gemini-3.8-flash-tts",
    "gemini-3.1-flash-tts-preview",
    "gemini-3.8-flash-lite-tts",
  ];

  let lastError = null;
  for (const model of ttsModels) {
    try {
      const data = await postGeminiProxy(
        model,
        {
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || "Kore",
                },
              },
            },
          },
        },
        12000
      );

      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;
      if (!base64Audio) throw new Error("No inline audio data returned");

      const mimeType = (inlineData.mimeType || "audio/wav").toLowerCase();
      let dataUri;
      if (mimeType.includes("wav")) {
        dataUri = `data:audio/wav;base64,${base64Audio}`;
      } else {
        dataUri = pcmToWavDataUri(base64Audio, 24000);
      }

      // Keep cache bounded to 100 clips
      if (ttsAudioCache.size > 100) {
        const firstKey = ttsAudioCache.keys().next().value;
        ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, dataUri);

      return dataUri;
    } catch (err) {
      lastError = err;
      if (err.code === "NO_API_KEY") throw err;
      console.warn(`Gemini TTS model ${model} failed, trying next:`, err);
    }
  }

  throw lastError || new Error("All Gemini TTS models failed");
}

export async function callAI({ settings, system, messages, maxTokens = 900 }) {
  const requestedModel = settings?.model && settings.model.startsWith("gemini") ? settings.model : "gemini-3.5-flash-lite";

  let lastError = null;

  // Active verified models in priority order, starting with user's selected model
  const candidateModels = [
    requestedModel,
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.8-flash",
    "gemini-3-flash-preview",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (const model of candidateModels) {
    try {
      const data = await postGeminiProxy(
        model,
        {
          system_instruction: {
            parts: [{ text: system }],
          },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: maxTokens,
          },
        },
        12000
      );

      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidateText) return candidateText;
      lastError = new Error(`Gemini API returned empty content for ${model}`);
    } catch (err) {
      lastError = err;
      if (err.code === "NO_API_KEY") throw err;
    }
  }

  throw lastError || new Error("Failed to connect to Google Gemini API");
}

export function extractJson(text) {
  if (!text || typeof text !== "string") throw new Error("Empty AI response");
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        try {
          const sanitized = candidate.replace(/[\u0000-\u001F]+/g, (m) => (m === "\n" || m === "\r" ? " " : ""));
          return JSON.parse(sanitized);
        } catch {
          // ignore
        }
      }
    }
    throw new Error("Could not parse structured response from AI");
  }
}

export function buildFallbackTutorReply(userInput, scenarioId, lang = "es") {
  const raw = userInput.trim();
  const cleanScId = scenarioId.replace(/^(es|fr|it)_/, "");

  if (lang === "it") {
    const replies = {
      coffee: [
        { spanish: "Certamente! Vuole un caffè espresso al banco o preferisce accomodarsi a un tavolo?", pronunciation: "chehr-tah-MEHN-teh! VWOH-leh oon kahf-FEH ehs-PREHS-soh ahl BAHN-koh...", english: "Certainly! Would you like an espresso at the counter or prefer sitting at a table?", starters: ["Un caffè al banco, grazie", "Al tavolo, per favore"] },
        { spanish: "Benissimo! Sono due euro e cinquanta. Desidera anche un cornetto caldo?", pronunciation: "beh-NEES-see-moh! SOH-noh DOO-eh EH-oo-roh eh cheen-KWAHN-tah...", english: "Very well! That's 2.50 euros. Would you like a warm croissant as well?", starters: ["Sì, un cornetto alla crema", "No grazie, solo il caffè"] },
      ],
      meet: [
        { spanish: "Molto interessante! Da quanto tempo stai studiando l'italiano?", pronunciation: "MOHL-toh een-teh-rehs-SAHN-teh! dah KWAHN-toh TEHM-poh stye stoo-DYAHN-doh leeh-tahl-YAH-noh?", english: "Very interesting! How long have you been studying Italian?", starters: ["Da poche settimane", "Ho iniziato da poco"] },
        { spanish: "Ottimo! Hai un'ottima pronuncia. Qual è la tua città italiana preferita?", pronunciation: "OHT-tee-moh! eye OHT-tee-mah proh-NOON-chah. kwahl eh lah TOO-ah cheet-TAH ee-tahl-YAH-nah pray-feh-REE-tah?", english: "Great! You have great pronunciation. What's your favourite Italian city?", starters: ["Mi piace molto Roma", "Firenze è bellissima"] },
      ],
      airport: [
        { spanish: "Tutto in regola. Il Suo treno parte dal binario numero cinque.", pronunciation: "TOOT-toh een REH-goh-lah. eel SOO-oh TREH-noh PAHR-teh dahl bee-NAH-ryoh NOO-meh-roh CHEEN-kweh.", english: "Everything is in order. Your train departs from platform number five.", starters: ["A che ora parte il treno?", "Grazie mille per l'aiuto!"] },
        { spanish: "Il treno parte tra dieci minuti esatti. Buon viaggio!", pronunciation: "eel TREH-noh PAHR-teh trah DYEH-chee mee-NOO-tee eh-ZAHT-tee. bwon VYAH-joh!", english: "The train departs in exactly ten minutes. Have a good trip!", starters: ["Grazie, arrivederci!", "Perfetto, vado subito"] },
      ],
      free: [
        { spanish: "Eccellente! Sono molto felice di parlare con te. Cosa hai fatto di bello oggi?", pronunciation: "ehch-chehl-LEHN-teh! SOH-noh MOHL-toh feh-LEE-cheh dee pahr-LAH-reh kohn teh...", english: "Excellent! I'm very happy to speak with you. What did you do today?", starters: ["Ho studiato e preso un caffè", "Ho fatto una bella passeggiata"] },
        { spanish: "Fantastico! Fare pratica ogni giorno è il segreto per imparare bene l'italiano.", pronunciation: "fahn-TAHS-tee-koh! FAH-reh PRAH-tee-kah OHN-yee JOHR-noh...", english: "Fantastic! Practicing every day is the secret to learning Italian well.", starters: ["Mi piace ascoltare musica", "Leggere libri in italiano"] },
      ],
      tutor: [
        { spanish: "Ottima domanda! Ricorda che fare pratica ogni giorno e ripassare i vocaboli salvati è il segreto per dominare l'italiano.", pronunciation: "OHT-tee-mah doh-MAHN-dah! ree-KOHR-dah keh FAH-reh PRAH-tee-kah OHN-yee JOHR-noh ee ree-pahs-SAH-reh ee voh-KAH-boh-lee sahl-VAH-tee eh eel seh-GREH-toh PAH-rah doh-mee-NAH-reh leeh-tahl-YAH-noh.", english: "Great question! Remember that regular daily practice and reviewing saved vocabulary is the key to mastering Italian. What doubt or grammar topic can we explore?", starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"] },
        { spanish: "Benissimo! In italiano, fai attenzione all'accordo tra aggettivi e sostantivi: per esempio 'il ragazzo italiano' e 'la ragazza italiana'. Vuoi fare un quiz?", pronunciation: "beh-NEES-see-moh! een ee-tahl-YAH-noh, fye aht-tehn-ZYOH-neh ahl-lahk-KOHR-doh trah ahd-jeht-TEE-vee ee sohs-tahn-TEE-vee...", english: "Very good! In Italian, pay attention to gender and number agreement between nouns and adjectives. Would you like to do a quick quiz?", starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"] },
      ],
    };

    const pool = replies[cleanScId] || (cleanScId === "tutor" ? replies.tutor : replies.free);
    const pick = pool[raw.length % pool.length];

    return {
      spanish: pick.spanish,
      pronunciation: pick.pronunciation,
      english: pick.english,
      correction: {
        has_mistake: false,
        original: raw,
        corrected_spanish: raw,
        explanation: "La tua frase è chiarissima e naturale!",
      },
      suggested_replies: pick.starters,
      mode: "practice",
    };
  }

  if (lang === "fr") {
    const replies = {
      coffee: [
        { spanish: "Parfait ! Vous désirez un café grand ou petit ?", pronunciation: "pahr-FEH! voo day-zee-RAY uhn kah-FAY GRAHN oo puh-TEE?", english: "Perfect! Would you like a large or small coffee?", starters: ["Un grand, s'il vous plaît", "Un petit, merci"] },
        { spanish: "Très bien ! Cela fera trois euros. Sur place ou à emporter ?", pronunciation: "tray byan! suh-lah fuh-RAH trwah z-uh-ROH. soor plahs oo ah ahn-pohr-TAY?", english: "Very good! That will be three euros. For here or to go?", starters: ["Sur place, merci", "À emporter, s'il vous plaît"] },
      ],
      meet: [
        { spanish: "C'est très intéressant ! Depuis combien de temps apprends-tu le français ?", pronunciation: "say tray z-an-tay-reh-SAHN! duh-PWEE kohm-byan duh tahn ah-prahn-TOO luh frahn-SEH?", english: "How interesting! How long have you been learning French?", starters: ["Depuis deux semaines", "Je commence tout juste"] },
        { spanish: "Génial ! Tu as un bon accent. Quel est ton plat français préféré ?", pronunciation: "zhay-NYAHL! too ah uhn bohn ahk-SAHN. kel ay tohn plah frahn-SEH pray-fay-RAY?", english: "Great! You have a good accent. What is your favorite French dish?", starters: ["J'adore les croissants", "La quiche lorraine"] },
      ],
      airport: [
        { spanish: "Tout est en ordre. Votre porte d'embarquement est la numéro cinq.", pronunciation: "too ay ahn NOHR-dr. vohtr pohrt dahm-bahrk-MAHN ay lah noo-may-ROH sank.", english: "Everything is in order. Your gate is number five.", starters: ["À quelle heure part le vol ?", "Merci beaucoup !"] },
        { spanish: "Le vol part à seize heures. Bon voyage !", pronunciation: "luh vohl pahr ah sez uhr. bohn vwah-YAHZH!", english: "The flight leaves at 4:00 PM. Have a good trip!", starters: ["Merci, au revoir !", "Très bien"] },
      ],
      free: [
        { spanish: "Excellent ! Je suis très contente. Qu'as-tu fait aujourd'hui ?", pronunciation: "ehk-seh-LAHN! zhuh swee tray kohn-TAHNT. kah-too feh oh-zhoor-DWEE?", english: "Excellent! I am very glad. What did you do today?", starters: ["J'ai pris un café et étudié", "J'ai travaillé un peu"] },
        { spanish: "C'est super ! Pratiquer un peu chaque jour aide énormément.", pronunciation: "say soo-PEHR! prah-tee-KAY uhn peu shahk zhoor ed ay-nohr-may-MAHN.", english: "That's great! Practicing a little every day helps enormously.", starters: ["J'aime écouter de la musique", "Lire des livres"] },
      ],
      tutor: [
        { spanish: "Excellente question ! N'oubliez pas que pratiquer régulièrement et réviser vos mots enregistrés est la clé pour progresser en français.", pronunciation: "ehk-seh-LAHN-tuh kehs-TYOHN! noo-blee-ay PAH kuh prah-tee-KAY ray-gyoo-lyehr-MAHN ay ray-vee-ZAY voh moh z-ahn-ruh-zhees-TRAY ay lah klay...", english: "Excellent question! Remember that regular practice and reviewing your saved vocabulary is the key to mastering French. What topic or doubt can I help explain?", starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"] },
        { spanish: "Très bien ! Une règle essentielle : on utilise 'c'est' devant un nom ou un groupe nominal, et 'il est' devant un adjectif qualificatif seul. Voulez-vous d'autres exemples ?", pronunciation: "tray byan! oon REG-luh eh-sahn-SYEL: ohn oo-tee-LEEZ say duh-VAHN uhn nohn...", english: "Very well! An essential grammar rule: use 'c'est' before a noun phrase ('C'est un ami'), and 'il est' before a standalone adjective ('Il est gentil'). Would you like more examples?", starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"] },
      ],
    };

    const pool = replies[cleanScId] || (cleanScId === "tutor" ? replies.tutor : replies.free);
    const pick = pool[raw.length % pool.length];

    return {
      spanish: pick.spanish,
      pronunciation: pick.pronunciation,
      english: pick.english,
      correction: {
        has_mistake: false,
        original: raw,
        corrected_spanish: raw,
        explanation: "Votre réponse est bien comprise !",
      },
      suggested_replies: pick.starters,
      mode: "practice",
    };
  }

  // Spanish Fallback
  const lower = raw.toLowerCase();
  let hasMistake = false;
  let corrected = raw;
  let explanation = "";

  if (/\bsoy bien\b/i.test(lower)) {
    hasMistake = true;
    corrected = raw.replace(/soy bien/gi, "estoy bien");
    explanation = "Use 'estar' (estoy) for feelings and states, not 'ser' (soy).";
  } else if (/\byo gusto\b/i.test(lower)) {
    hasMistake = true;
    corrected = raw.replace(/yo gusto/gi, "me gusta");
    explanation = "Use 'me gusta' (it pleases me), not 'yo gusto'.";
  } else if (/\bun cafe\b/i.test(raw) && !/café/i.test(raw)) {
    hasMistake = true;
    corrected = raw.replace(/cafe/gi, "café");
    explanation = "Don't forget the accent on 'café' — stress falls on the end.";
  }

  const replies = {
    coffee: [
      { spanish: "¡Perfecto! ¿Le gustaría el café grande o pequeño?", pronunciation: "pehr-FEHK-toh! leh goo-stah-REE-ah ehl kah-FEH GRAHN-deh oh peh-KEH-nyoh?", english: "Perfect! Would you like the coffee large or small?", starters: ["Grande, por favor", "Pequeño, gracias"] },
      { spanish: "¡Muy bien! Son dos euros. ¿Para tomar aquí o llevar?", pronunciation: "mooy byehn! sohn dohs EH-oo-rohs. PAH-rah toh-MAHR ah-KEE oh yeh-BAHR?", english: "Very good! That is two euros. For here or to go?", starters: ["Para tomar aquí", "Para llevar, por favor"] },
    ],
    meet: [
      { spanish: "¡Qué interesante! ¿Cuánto tiempo llevas aprendiendo español?", pronunciation: "keh een-teh-reh-SAHN-teh! KWAHN-toh TYEHM-poh YEH-bahs ah-prehn-DYEHN-doh ehs-pah-NYOHL?", english: "How interesting! How long have you been learning Spanish?", starters: ["Dos semanas", "Estoy empezando ahora"] },
      { spanish: "¡Genial! Hablas muy bien. ¿Cuál es tu comida favorita?", pronunciation: "heh-NYAHL! AH-blahs mooy byehn. kwahl ehs too koh-MEE-dah fah-boh-REE-tah?", english: "Great! You speak very well. What is your favorite food?", starters: ["Me gustan los tacos", "La paella"] },
    ],
    airport: [
      { spanish: "Todo está en orden. Su puerta es la número cinco.", pronunciation: "TOH-doh ehs-TAH ehn OHR-dehn. soo PWEHR-tah ehs lah NOO-meh-roh SEEN-koh.", english: "Everything is in order. Your gate is number five.", starters: ["¿A qué hora sale?", "Muchas gracias"] },
      { spanish: "El vuelo sale a las cuatro. ¡Que tenga buen viaje!", pronunciation: "ehl BWEH-loh SAH-leh ah lahs KWAH-troh. keh TEHN-gah bwehn BYAH-heh!", english: "The flight leaves at four. Have a good trip!", starters: ["Gracias, hasta luego", "Perfecto"] },
    ],
    free: [
      { spanish: "¡Excelente! Me alegro mucho. ¿Qué hiciste hoy?", pronunciation: "ehk-seh-LEHN-teh! meh ah-LEH-groh MOO-choh. keh ee-SEES-teh oy?", english: "Excellent! I'm very glad. What did you do today?", starters: ["Tomé café y estudié", "Trabajé un poco"] },
      { spanish: "¡Qué bien! Practicar todos los días ayuda mucho. ¿Qué te gusta hacer?", pronunciation: "keh byehn! prahk-tee-KAHR TOH-dohs lohs DEE-ahs ah-YOO-dah MOO-choh.", english: "How nice! Practicing every day helps a lot. What do you like to do?", starters: ["Me gusta escuchar música", "Leer libros"] },
    ],
    tutor: [
      {
        spanish: "¡Excelente pregunta! Mantener tu racha diaria y repasar las palabras guardadas es la clave para dominar el español. ¿Quieres que revisemos tu progreso o tus dudas?",
        pronunciation: "ehk-seh-LEHN-teh preh-GOON-tah! mahn-teh-NEHR too RAH-chah DYAHR-yah ee reh-pah-SAHR lahs pah-LAH-brahs gwahr-DAH-dahs ehs lah KLAH-beh PAH-rah doh-mee-NAHR ehl ehs-pah-NYOHL. ¿KYEH-rehs keh reh-bee-SEH-mohs too proh-GREH-soh oh toos DOO-dahs?",
        english: "Great question! Keeping your daily streak and reviewing your saved words is the secret to mastering Spanish. Would you like to check your progress or ask a grammar question?",
        starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"],
      },
      {
        spanish: "¡Muy bien! Un consejo de oro: usa 'por' para motivos o duración ('por la mañana'), y 'para' para objetivos o destinos ('para ti'). ¿Quieres que veamos más ejemplos?",
        pronunciation: "mooy byehn! oon kohn-SEH-hoh deh OH-roh: OO-sah pohr PAH-rah moh-TEE-bohs oh doo-rah-SYOHN, ee PAH-rah PAH-rah ohb-heh-TEE-bohs oh dehs-TEE-nohs. ¿KYEH-rehs keh beh-AH-mohs MAHS eh-HEHM-plohs?",
        english: "Very good! A golden grammar tip: use 'por' for motives or duration ('por la mañana'), and 'para' for goals or recipients ('para ti'). Would you like to see more examples?",
        starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"],
      },
      {
        spanish: "¡Genial! Tu constancia diaria es excelente. ¿Tienes alguna duda sobre conjugaciones, tiempos verbales o cómo usar alguna palabra guardada?",
        pronunciation: "heh-NYAHL! too kohn-STAHN-syah DYAHR-yah ehs ehk-seh-LEHN-teh. ¿TYEH-nehs ahl-GOO-nah DOO-dah SOH-breh kohn-hoo-gah-SYOH-nehs, TYEHM-pohs behr-BAH-lehs oh KOH-moh oo-SAHR ahl-GOO-nah pah-LAH-brah gwahr-DAH-dah?",
        english: "Awesome! Your daily practice consistency is great. Do you have any doubts about verb conjugations, tenses, or how to use a saved vocabulary word?",
        starters: ["Review my progress", "Explain a grammar rule", "Quiz me on my saved vocab"],
      },
    ],
  };

  const pool = replies[cleanScId] || (cleanScId === "tutor" ? replies.tutor : replies.free);
  const pick = pool[raw.length % pool.length];

  return {
    spanish: pick.spanish,
    pronunciation: pick.pronunciation,
    english: pick.english,
    correction: {
      has_mistake: hasMistake,
      original: raw,
      corrected_spanish: corrected,
      explanation,
    },
    suggested_replies: pick.starters,
    mode: "practice",
  };
}

export function buildFallbackVocabDeck(topic, lang = "es") {
  const cleanTopic = topic.trim();

  if (lang === "it") {
    const words = [
      [`Il tema: ${cleanTopic}`, "eel TEH-mah", `Topic: ${cleanTopic}`, `Oggi studio l'argomento ${cleanTopic}.`, `Today I study about ${cleanTopic}.`],
      ["Imparare", "eem-pah-RAH-reh", "To learn", "Voglio imparare tante cose nuove.", "I want to learn many new things."],
      ["La parola", "lah pah-ROH-lah", "Word", "Questa parola è molto utile.", "This word is very useful."],
      ["Praticare", "prah-tee-KAH-reh", "To practice", "Mi piace praticare l'italiano ogni giorno.", "I like to practice Italian every day."],
      ["Importante", "eem-pohr-TAHN-teh", "Important", "È una frase molto importante.", "It is a very important phrase."],
      ["Facile", "FAH-chee-leh", "Easy", "L'italiano è musicale e divertente.", "Italian is musical and fun."],
      ["Nuovo / Nuova", "NWOH-voh", "New", "Ho comprato un libro nuovo.", "I bought a new book."],
      ["Tutti i giorni", "TOOT-tee ee JOHR-nee", "Every day", "Studio tutti i giorni con costanza.", "I study every day consistently."],
      ["Cosa significa?", "KOH-zah seeg-NEE-fee-kah", "What does it mean?", "Cosa significa questa espressione?", "What does this expression mean?"],
      ["Ho capito!", "oh kah-PEE-toh", "I understand! / I got it!", "Ora ho capito perfettamente.", "Now I understand perfectly."],
    ];

    return {
      title: cleanTopic,
      cards: words.map(([spanish, pronunciation, english, example_es, example_en], idx) => ({
        id: `custom-${Date.now()}-${idx}`,
        spanish,
        pronunciation,
        english,
        example_es,
        example_en,
      })),
    };
  }

  if (lang === "fr") {
    const words = [
      [`Le thème : ${cleanTopic}`, "luh TEHM", `Topic: ${cleanTopic}`, `Aujourd'hui j'étudie ${cleanTopic}.`, `Today I study about ${cleanTopic}.`],
      ["Apprendre", "ah-PRAHN-dr", "To learn", "Je veux apprendre beaucoup.", "I want to learn a lot."],
      ["Le mot", "luh MOH", "Word", "Ce mot est très utile.", "This word is very useful."],
      ["Pratiquer", "prah-tee-KAY", "To practice", "J'aime pratiquer le français.", "I like to practice French."],
      ["Important", "an-pohr-TAHN", "Important", "C'est une phrase importante.", "It is an important phrase."],
      ["Facile", "fah-SEEL", "Easy", "Le français est amusant et facile.", "French is fun and easy."],
      ["Nouveau / Nouvelle", "noo-VOH", "New", "J'ai un nouveau livre.", "I have a new book."],
      ["Tous les jours", "too lay ZHOOR", "Every day", "J'étudie tous les jours.", "I study every day."],
      ["Que signifie... ?", "kuh seeg-nee-FEE", "What does ... mean?", "Que signifie ce mot ?", "What does this word mean?"],
      ["Je comprends !", "zhuh kohm-PRAHN", "I understand!", "Maintenant je comprends parfaitement.", "Now I understand perfectly."],
    ];

    return {
      title: cleanTopic,
      cards: words.map(([spanish, pronunciation, english, example_es, example_en], idx) => ({
        id: `custom-${Date.now()}-${idx}`,
        spanish,
        pronunciation,
        english,
        example_es,
        example_en,
      })),
    };
  }

  const words = [
    [`El tema: ${cleanTopic}`, "ehl TEH-mah", `Topic: ${cleanTopic}`, `Hoy estudio sobre ${cleanTopic}.`, `Today I study about ${cleanTopic}.`],
    ["Aprender", "ah-prehn-DEHR", "To learn", "Quiero aprender mucho.", "I want to learn a lot."],
    ["La palabra", "lah pah-LAH-brah", "Word", "Esta palabra es muy útil.", "This word is very useful."],
    ["Practicar", "prahk-tee-KAHR", "To practice", "Me gusta practicar español.", "I like to practice Spanish."],
    ["Importante", "eem-pohr-TAHN-teh", "Important", "Es una frase importante.", "It is an important phrase."],
    ["Fácil", "FAH-seel", "Easy", "El español es divertido y fácil.", "Spanish is fun and easy."],
    ["Nuevo / Nueva", "NWEH-boh", "New", "Tengo un libro nuevo.", "I have a new book."],
    ["Todos los días", "TOH-dohs lohs DEE-ahs", "Every day", "Estudio todos los días.", "I study every day."],
    ["¿Qué significa?", "keh seeg-nee-FEE-kah", "What does it mean?", "¿Qué significa esta palabra?", "What does this word mean?"],
    ["¡Entiendo!", "ehn-TYEHN-doh", "I understand!", "Ahora entiendo perfectamente.", "Now I understand perfectly."],
  ];

  return {
    title: cleanTopic,
    cards: words.map(([spanish, pronunciation, english, example_es, example_en], idx) => ({
      id: `custom-${Date.now()}-${idx}`,
      spanish,
      pronunciation,
      english,
      example_es,
      example_en,
    })),
  };
}

export function buildFallbackTranslation(text, direction, lang = "es") {
  const clean = text.trim();
  const lexicon = MINI_LEXICON_DATA[lang] || MINI_LEXICON_DATA.es;

  const targetLangName = lang === "fr" ? "French" : lang === "it" ? "Italian" : "Spanish";
  const resolvedDir = direction === "auto" ? "en-to-target" : direction;

  let translatedText = clean;
  let englishText = clean;

  if (lang === "it") {
    if (/ciao/i.test(clean)) englishText = "Hello / Goodbye";
    else if (/buongiorno/i.test(clean)) englishText = "Good morning / Good day";
    else if (/grazie/i.test(clean)) englishText = "Thank you";
    else if (/table for two/i.test(clean)) {
      translatedText = "Un tavolo per due persone, per favore.";
      englishText = "A table for two people, please.";
    } else if (/where is the bathroom/i.test(clean)) {
      translatedText = "Dov'è il bagno, per favore?";
      englishText = "Where is the bathroom, please?";
    } else if (/coffee with milk/i.test(clean) || /espresso/i.test(clean)) {
      translatedText = "Un caffè espresso, per favore.";
      englishText = "An espresso coffee, please.";
    }
  } else if (lang === "fr") {
    if (/bonjour/i.test(clean)) englishText = "Hello / Good day";
    else if (/merci/i.test(clean)) englishText = "Thank you";
    else if (/table for two/i.test(clean)) {
      translatedText = "Une table pour deux, s'il vous plaît.";
      englishText = "A table for two, please.";
    } else if (/where is the bathroom/i.test(clean)) {
      translatedText = "Où sont les toilettes ?";
      englishText = "Where is the restroom?";
    } else if (/coffee with milk/i.test(clean)) {
      translatedText = "Un café au lait, s'il vous plaît.";
      englishText = "A coffee with milk, please.";
    }
  } else {
    if (/dónde está el baño/i.test(clean)) englishText = "Where is the bathroom?";
    else if (/table for two/i.test(clean)) {
      translatedText = "Una mesa para dos, por favor.";
      englishText = "A table for two, please.";
    }
  }

  const tokens = translatedText.replace(/[¿?¡!.,]/g, "").split(/\s+/).filter(Boolean).map((w) => {
    const entry = lexicon[w.toLowerCase()];
    return {
      spanish: w,
      english: entry?.en || w,
      pos: entry?.pos || "Word",
      pronunciation: entry?.pron || w.toLowerCase(),
      note: entry?.note || "",
    };
  });

  return {
    direction: resolvedDir,
    source_language: resolvedDir.startsWith("en") ? "English" : targetLangName,
    target_language: resolvedDir.startsWith("en") ? targetLangName : "English",
    spanish_text: translatedText,
    english_text: englishText,
    pronunciation: tokens.map((t) => t.pronunciation).join(" "),
    tokens,
    grammar_notes: [
      `${targetLangName} nouns have grammatical gender (masculine / feminine) that must agree with articles.`,
      `Listen to native audio for authentic pronunciation and intonation.`,
    ],
    mode: "practice",
  };
}
