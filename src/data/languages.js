export const STORAGE_KEY = "hola_spanish_studio_v2";

export const LANGUAGES = [
  {
    id: "es",
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    appTitle: "Yappi",
    subtitle: "Beginner · Español",
    logoBadge: "¡Ñ!",
    defaultAccent: "es-ES",
    accents: [
      { id: "es-ES", label: "Spain (Castilian — Madrid)" },
      { id: "es-MX", label: "Latin America (Mexican standard)" },
    ],
    sampleSpeech: "¡Hola! Bienvenido a tu clase de español.",
    aiTutorPersona: "Sofía",
  },
  {
    id: "fr",
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    appTitle: "Yappi",
    subtitle: "Débutant · Français",
    logoBadge: "Ç!",
    defaultAccent: "fr-FR",
    accents: [
      { id: "fr-FR", label: "France (Parisian standard)" },
      { id: "fr-CA", label: "Canada (Québécois)" },
    ],
    sampleSpeech: "Bonjour ! Bienvenue à votre cours de français.",
    aiTutorPersona: "Amélie",
  },
];

export const GEMINI_MODELS = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite (⚡ Fastest · Recommended)" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Latest Flagship)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite (Ultra Fast)" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Balanced)" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview" },
];

export const GEMINI_VOICES = [
  { id: "Kore", label: "Kore (Female · Warm & Patient · Recommended)" },
  { id: "Aoede", label: "Aoede (Female · Melodic & Soft)" },
  { id: "Zephyr", label: "Zephyr (Female · Bright & Lively)" },
  { id: "Puck", label: "Puck (Male · Friendly & Upbeat)" },
  { id: "Charon", label: "Charon (Male · Deep & Informative)" },
  { id: "Fenrir", label: "Fenrir (Male · Energetic)" },
];

// Spanish 27 Letters
const SPANISH_ALPHABET = [
  { letter: "A", lower: "a", name: "a", tts: "a", phonetic: "ah", word: "agua", wordPhonetic: "AH-gwah", meaning: "water", tip: "Pure 'ah' like in 'father', never 'ay'." },
  { letter: "B", lower: "b", name: "be", tts: "be", phonetic: "beh", word: "barco", wordPhonetic: "BAHR-koh", meaning: "boat", tip: "Crisp at start; softer between vowels." },
  { letter: "C", lower: "c", name: "ce", tts: "ce", phonetic: "seh / theh", word: "casa", wordPhonetic: "KAH-sah", meaning: "house", tip: "Hard 'k' before a, o, u. Soft 's' before e, i." },
  { letter: "D", lower: "d", name: "de", tts: "de", phonetic: "deh", word: "dado", wordPhonetic: "DAH-doh", meaning: "dice", tip: "Tongue touches upper teeth; soft between vowels." },
  { letter: "E", lower: "e", name: "e", tts: "e", phonetic: "eh", word: "elefante", wordPhonetic: "eh-leh-FAHN-teh", meaning: "elephant", tip: "Short clean 'eh' as in 'met'." },
  { letter: "F", lower: "f", name: "efe", tts: "efe", phonetic: "EH-feh", word: "fruta", wordPhonetic: "FROO-tah", meaning: "fruit", tip: "Same as English 'f'." },
  { letter: "G", lower: "g", name: "ge", tts: "ge", phonetic: "heh", word: "gato", wordPhonetic: "GAH-toh", meaning: "cat", tip: "Hard 'g' before a, o, u; breathy 'h' before e, i." },
  { letter: "H", lower: "h", name: "hache", tts: "hache", phonetic: "AH-cheh", word: "hola", wordPhonetic: "OH-lah", meaning: "hello", tip: "100% silent! Never pronounce the H in hola." },
  { letter: "I", lower: "i", name: "i", tts: "i", phonetic: "ee", word: "isla", wordPhonetic: "EES-lah", meaning: "island", tip: "Always 'ee' like 'machine', never 'eye'." },
  { letter: "J", lower: "j", name: "jota", tts: "jota", phonetic: "HOH-tah", word: "jugo", wordPhonetic: "HOO-goh", meaning: "juice", tip: "Breathy 'h' from the back of the throat." },
  { letter: "K", lower: "k", name: "ka", tts: "ka", phonetic: "kah", word: "kilo", wordPhonetic: "KEE-loh", meaning: "kilogram", tip: "Used mainly in loanwords." },
  { letter: "L", lower: "l", name: "ele", tts: "ele", phonetic: "EH-leh", word: "luna", wordPhonetic: "LOO-nah", meaning: "moon", tip: "Light, crisp 'l' with tongue near top teeth." },
  { letter: "M", lower: "m", name: "eme", tts: "eme", phonetic: "EH-meh", word: "mesa", wordPhonetic: "MEH-sah", meaning: "table", tip: "Same as English 'm'." },
  { letter: "N", lower: "n", name: "ene", tts: "ene", phonetic: "EH-neh", word: "noche", wordPhonetic: "NOH-cheh", meaning: "night", tip: "Same as English 'n'." },
  { letter: "Ñ", lower: "ñ", name: "eñe", tts: "eñe", phonetic: "EH-nyeh", word: "niño", wordPhonetic: "NEE-nyoh", meaning: "child / boy", tip: "Unique letter! Sounds like 'ny' in 'canyon'." },
  { letter: "O", lower: "o", name: "o", tts: "o", phonetic: "oh", word: "oso", wordPhonetic: "OH-soh", meaning: "bear", tip: "Clean rounded 'oh' with no glide." },
  { letter: "P", lower: "p", name: "pe", tts: "pe", phonetic: "peh", word: "pan", wordPhonetic: "pahn", meaning: "bread", tip: "Softer than English 'p' with less air." },
  { letter: "Q", lower: "q", name: "cu", tts: "cu", phonetic: "koo", word: "queso", wordPhonetic: "KEH-soh", meaning: "cheese", tip: "Paired with silent 'u' (que, qui), sounds like 'k'." },
  { letter: "R", lower: "r", name: "ere", tts: "ere", phonetic: "EH-reh", word: "ratón", wordPhonetic: "rah-TOHN", meaning: "mouse", tip: "Tap between vowels (pero); rolled at start (ratón)." },
  { letter: "S", lower: "s", name: "ese", tts: "ese", phonetic: "EH-seh", word: "sol", wordPhonetic: "sohl", meaning: "sun", tip: "Crisp 's' as in 'sun', never turns into 'z'." },
  { letter: "T", lower: "t", name: "te", tts: "te", phonetic: "teh", word: "taza", wordPhonetic: "TAH-sah", meaning: "cup", tip: "Tongue touches back of upper teeth." },
  { letter: "U", lower: "u", name: "u", tts: "u", phonetic: "oo", word: "uva", wordPhonetic: "OO-bah", meaning: "grape", tip: "Always 'oo' as in 'moon'." },
  { letter: "V", lower: "v", name: "uve", tts: "uve", phonetic: "OO-beh", word: "vaca", wordPhonetic: "BAH-kah", meaning: "cow", tip: "V and B sound almost identical in Spanish!" },
  { letter: "W", lower: "w", name: "uve doble", tts: "uve doble", phonetic: "OO-beh DOH-bleh", word: "wifi", wordPhonetic: "WEE-fee", meaning: "Wi-Fi", tip: "Used only in borrowed words." },
  { letter: "X", lower: "x", name: "equis", tts: "equis", phonetic: "EH-kees", word: "xilófono", wordPhonetic: "see-LOH-foh-noh", meaning: "xylophone", tip: "'ks' in examen, 's' at start, 'h' in México." },
  { letter: "Y", lower: "y", name: "ye", tts: "ye", phonetic: "yeh", word: "yo", wordPhonetic: "yoh", meaning: "I (me)", tip: "Like 'y' in 'yes'; alone as 'y' (and) it sounds like 'ee'." },
  { letter: "Z", lower: "z", name: "zeta", tts: "zeta", phonetic: "SEH-tah", word: "zapato", wordPhonetic: "sah-PAH-toh", meaning: "shoe", tip: "'s' in Latin America, 'th' in Spain." },
];

const SPANISH_SPECIAL_SOUNDS = [
  { letter: "CH", name: "che", tts: "che", word: "chocolate", meaning: "chocolate", tip: "Like 'ch' in 'church'." },
  { letter: "LL", name: "elle", tts: "elle", word: "llave", meaning: "key", tip: "Usually like 'y' in 'yes'." },
  { letter: "RR", name: "doble ere", tts: "doble ere", word: "perro", meaning: "dog", tip: "Rolled R! Distinguishes pero from perro." },
  { letter: "Á É Í Ó Ú", name: "tildes", tts: "café", word: "café", meaning: "coffee", tip: "Marks stressed syllable." },
  { letter: "Ü", name: "diéresis", tts: "pingüino", word: "pingüino", meaning: "penguin", tip: "Tells you to pronounce the 'u' in güe/güi." },
];

// French 26 Letters
const FRENCH_ALPHABET = [
  { letter: "A", lower: "a", name: "a", tts: "a", phonetic: "ah", word: "avion", wordPhonetic: "ah-VYOHN", meaning: "airplane", tip: "Pure open 'ah', like 'papa'." },
  { letter: "B", lower: "b", name: "bé", tts: "bé", phonetic: "beh", word: "bateau", wordPhonetic: "bah-TOH", meaning: "boat", tip: "Crisp 'b' with lips firmly together." },
  { letter: "C", lower: "c", name: "cé", tts: "cé", phonetic: "seh", word: "café", wordPhonetic: "kah-FAY", meaning: "coffee", tip: "Hard 'k' before a, o, u. Soft 's' before e, i, y." },
  { letter: "D", lower: "d", name: "dé", tts: "dé", phonetic: "deh", word: "danse", wordPhonetic: "dahns", meaning: "dance", tip: "Tongue touches upper teeth." },
  { letter: "E", lower: "e", name: "e", tts: "e", phonetic: "euh", word: "enfant", wordPhonetic: "ahn-FAHN", meaning: "child", tip: "Relaxed central sound; often silent at word ends." },
  { letter: "F", lower: "f", name: "effe", tts: "effe", phonetic: "ehf", word: "fromage", wordPhonetic: "froh-MAHZH", meaning: "cheese", tip: "Clean 'f' sound like English." },
  { letter: "G", lower: "g", name: "gé", tts: "gé", phonetic: "zheh", word: "gare", wordPhonetic: "gahr", meaning: "train station", tip: "Hard 'g' before a, o, u. Soft 'zh' before e, i." },
  { letter: "H", lower: "h", name: "hache", tts: "hache", phonetic: "ahsh", word: "hôtel", wordPhonetic: "oh-TEHL", meaning: "hotel", tip: "Always silent in French! Never pronounce the H." },
  { letter: "I", lower: "i", name: "i", tts: "i", phonetic: "ee", word: "île", wordPhonetic: "eel", meaning: "island", tip: "Crisp tight 'ee' as in 'meet'." },
  { letter: "J", lower: "j", name: "ji", tts: "ji", phonetic: "zhee", word: "jardin", wordPhonetic: "zhar-DAN", meaning: "garden", tip: "Soft buzzing 'zh' like in 'measure'." },
  { letter: "K", lower: "k", name: "ka", tts: "ka", phonetic: "kah", word: "kilo", wordPhonetic: "kee-LOH", meaning: "kilogram", tip: "Found in borrowed international words." },
  { letter: "L", lower: "l", name: "elle", tts: "elle", phonetic: "ehl", word: "lune", wordPhonetic: "lyoon", meaning: "moon", tip: "Light clear 'l' against upper teeth." },
  { letter: "M", lower: "m", name: "emme", tts: "emme", phonetic: "ehm", word: "maison", wordPhonetic: "may-ZOHN", meaning: "house", tip: "Standard 'm'; causes nasal sound when closing vowels." },
  { letter: "N", lower: "n", name: "enne", tts: "enne", phonetic: "ehn", word: "nuit", wordPhonetic: "nwee", meaning: "night", tip: "Standard 'n' alone; nasalizes preceding vowel." },
  { letter: "O", lower: "o", name: "o", tts: "o", phonetic: "oh", word: "orange", wordPhonetic: "oh-RAHNZH", meaning: "orange", tip: "Clean rounded 'oh' with no dipthong glide." },
  { letter: "P", lower: "p", name: "pé", tts: "pé", phonetic: "peh", word: "pain", wordPhonetic: "pan", meaning: "bread", tip: "Softer than English 'p' with minimal breath." },
  { letter: "Q", lower: "q", name: "qu", tts: "qu", phonetic: "koo", word: "quiche", wordPhonetic: "keesh", meaning: "quiche", tip: "Always followed by silent 'u' (qu = 'k')." },
  { letter: "R", lower: "r", name: "erre", tts: "erre", phonetic: "ehr", word: "rue", wordPhonetic: "ryoo", meaning: "street", tip: "Guttural French 'r' produced in the throat." },
  { letter: "S", lower: "s", name: "esse", tts: "esse", phonetic: "ehs", word: "soleil", wordPhonetic: "soh-LAY", meaning: "sun", tip: "Crisp 's' at start; sounds like 'z' between two vowels." },
  { letter: "T", lower: "t", name: "té", tts: "té", phonetic: "teh", word: "table", wordPhonetic: "tahbl", meaning: "table", tip: "Clean, non-aspirated 't' against teeth." },
  { letter: "U", lower: "u", name: "u", tts: "u", phonetic: "oo (rounded)", word: "usine", wordPhonetic: "oo-ZEEN", meaning: "factory", tip: "Say 'ee' with lips tightly rounded into an 'o'." },
  { letter: "V", lower: "v", name: "vé", tts: "vé", phonetic: "veh", word: "vin", wordPhonetic: "van", meaning: "wine", tip: "Distinct buzzing 'v' with top teeth on lower lip." },
  { letter: "W", lower: "w", name: "double vé", tts: "double vé", phonetic: "DOO-bluh veh", word: "wagon", wordPhonetic: "vah-GOHN", meaning: "train car", tip: "Usually pronounced 'v' in French loanwords." },
  { letter: "X", lower: "x", name: "ixe", tts: "ixe", phonetic: "eeks", word: "xylophone", wordPhonetic: "gzee-loh-FOHN", meaning: "xylophone", tip: "Can be 'ks' (taxi), 'gz' (examen), or silent at end (deux)." },
  { letter: "Y", lower: "y", name: "i grec", tts: "i grec", phonetic: "ee-GREHK", word: "yeux", wordPhonetic: "yeu", meaning: "eyes", tip: "Sounds like 'ee' or 'y' in 'yes'." },
  { letter: "Z", lower: "z", name: "zède", tts: "zède", phonetic: "zehd", word: "zèbre", wordPhonetic: "ZEH-br", meaning: "zebra", tip: "Buzzing 'z' as in English." },
];

const FRENCH_SPECIAL_SOUNDS = [
  { letter: "É", name: "accent aigu", tts: "café", word: "café", meaning: "coffee", tip: "Sharp closed 'ay' like in 'day'." },
  { letter: "È / Ê", name: "accent grave / circonflexe", tts: "fête", word: "fête", meaning: "party / holiday", tip: "Open 'eh' like in 'bed'." },
  { letter: "Ç", name: "cédille", tts: "français", word: "français", meaning: "French", tip: "Always soft 's' before a, o, u." },
  { letter: "Œ / Æ", name: "e-dans-l'o", tts: "cœur", word: "cœur", meaning: "heart", tip: "Unique French tied vowels (cœur, sœur)." },
  { letter: "AN / ON / IN", name: "voyelles nasales", tts: "bonjour", word: "bonjour", meaning: "hello", tip: "Air flows through the nose without pronouncing the N!" },
];

export const ALPHABET_DATA = {
  es: SPANISH_ALPHABET,
  fr: FRENCH_ALPHABET,
};

export const SPECIAL_SOUNDS_DATA = {
  es: SPANISH_SPECIAL_SOUNDS,
  fr: FRENCH_SPECIAL_SOUNDS,
};

// Spanish Scenarios
const SPANISH_SCENARIOS = [
  {
    id: "free",
    title: "Free Chat",
    role: "Sofía · Tutor",
    description: "Everyday beginner chat",
    opening: {
      spanish: "¡Hola! Soy Sofía. ¿Cómo te llamas y cómo estás hoy?",
      pronunciation: "OH-lah! soy soh-FEE-ah. KOH-moh teh YAH-mahs ee KOH-moh ehs-TAHS oy?",
      english: "Hi! I'm Sofía. What is your name and how are you today?",
    },
    starters: ["Hola, me llamo Alex", "Estoy muy bien, gracias", "Quiero aprender español"],
  },
  {
    id: "coffee",
    title: "Order Coffee",
    role: "Carlos · Barista",
    description: "Order drinks and snacks at a café",
    opening: {
      spanish: "¡Buenos días! Bienvenido al Café Sol. ¿Qué le gustaría tomar hoy?",
      pronunciation: "BWEH-nohs DEE-ahs! byehn-beh-NEE-doh ahl kah-FEH sohl. keh leh goo-stah-REE-ah toh-MAHR oy?",
      english: "Good morning! Welcome to Café Sol. What would you like to drink today?",
    },
    starters: ["Un café con leche, por favor", "Quiero un té y un pan", "¿Cuánto cuesta?"],
  },
  {
    id: "meet",
    title: "Meet Someone",
    role: "Mateo · Friend",
    description: "Introduce yourself and make friends",
    opening: {
      spanish: "¡Hola! Mucho gusto, soy Mateo. ¿De dónde eres y qué te gusta hacer?",
      pronunciation: "OH-lah! MOO-choh GOO-stoh, soy mah-TEH-oh. deh DOHN-deh EH-rehs ee keh teh GOO-stah ah-SEHR?",
      english: "Hi! Nice to meet you, I'm Mateo. Where are you from and what do you like to do?",
    },
    starters: ["¡Mucho gusto! Soy de Canadá", "Me gusta viajar y la música", "¿Y tú?"],
  },
  {
    id: "airport",
    title: "Airport",
    role: "Elena · Agent",
    description: "Check in and find your gate",
    opening: {
      spanish: "¡Buenas tardes! ¿Puedo ver su pasaporte y boleto, por favor?",
      pronunciation: "BWEH-nahs TAHR-dehs! PWEH-doh behr soo pah-sah-POHR-teh ee boh-LEH-toh, pohr fah-BOHR?",
      english: "Good afternoon! May I see your passport and ticket, please?",
    },
    starters: ["Aquí está mi pasaporte", "¿Dónde está la puerta cinco?", "¿A qué hora sale el vuelo?"],
  },
];

// French Scenarios
const FRENCH_SCENARIOS = [
  {
    id: "free",
    title: "Discussion Libre",
    role: "Amélie · Tutrice",
    description: "Conversation courante pour débutant",
    opening: {
      spanish: "Bonjour ! Je m'appelle Amélie. Comment tu t'appelles et comment ça va aujourd'hui ?",
      pronunciation: "bohn-ZHOOR! zhuh mah-PEHL ah-may-LEE. koh-mahn too tah-PEHL ay koh-mahn sah VAH oh-zhoor-DWEE?",
      english: "Hello! My name is Amélie. What is your name and how are you today?",
    },
    starters: ["Bonjour, je m'appelle Alex", "Ça va très bien, merci", "Je veux apprendre le français"],
  },
  {
    id: "coffee",
    title: "Commander un Café",
    role: "Julien · Serveur au Café",
    description: "Commander au café ou à la boulangerie",
    opening: {
      spanish: "Bonjour ! Bienvenue au Café de Flore. Que désirez-vous prendre aujourd'hui ?",
      pronunciation: "bohn-ZHOOR! byan-vuh-NOO oh kah-FAY duh FLOAR. kuh day-zee-ray VOO PRAHN-dr oh-zhoor-DWEE?",
      english: "Good day! Welcome to Café de Flore. What would you like to have today?",
    },
    starters: ["Un café au lait et un croissant, s'il vous plaît", "Je voudrais un thé", "Combien ça coûte ?"],
  },
  {
    id: "meet",
    title: "Faire Connaissance",
    role: "Lucas · Ami",
    description: "Se présenter et parler de ses loisirs",
    opening: {
      spanish: "Salut ! Enchanté, je m'appelle Lucas. D'où viens-tu et qu'est-ce que tu aimes faire ?",
      pronunciation: "sah-LOO! ahn-shahn-TAY, zhuh mah-PEHL loo-KAH. doo vyahn TOO ay kes-kuh too EM FAIR?",
      english: "Hi! Nice to meet you, I'm Lucas. Where are you from and what do you like to do?",
    },
    starters: ["Enchanté ! Je viens des États-Unis", "J'aime la musique et voyager", "Et toi ?"],
  },
  {
    id: "airport",
    title: "Gare & Aéroport",
    role: "Chloé · Agente",
    description: "Prendre le train ou l'avion",
    opening: {
      spanish: "Bonjour ! Puis-je voir votre billet et votre passeport, s'il vous plaît ?",
      pronunciation: "bohn-ZHOOR! pweezh VWAHR vohtr bee-YEH ay vohtr pahs-POHR, seel voo PLEH?",
      english: "Good day! May I see your ticket and your passport, please?",
    },
    starters: ["Voici mon passeport", "Où est la voie numéro cinq ?", "À quelle heure part le train ?"],
  },
];

export const SCENARIOS_DATA = {
  es: SPANISH_SCENARIOS,
  fr: FRENCH_SCENARIOS,
};

// Spanish Preset Decks
const SPANISH_DECKS = [
  {
    id: "greetings",
    title: "Greetings",
    spanishTitle: "Saludos",
    cards: [
      { id: "gr-1", spanish: "¡Hola!", pronunciation: "OH-lah", english: "Hello!", example_es: "¡Hola! ¿Cómo estás hoy?", example_en: "Hello! How are you today?" },
      { id: "gr-2", spanish: "Buenos días", pronunciation: "BWEH-nohs DEE-ahs", english: "Good morning", example_es: "Buenos días, señora García.", example_en: "Good morning, Mrs. García." },
      { id: "gr-3", spanish: "Buenas tardes", pronunciation: "BWEH-nahs TAHR-dehs", english: "Good afternoon", example_es: "Buenas tardes, ¿cómo te va?", example_en: "Good afternoon, how's it going?" },
      { id: "gr-4", spanish: "Buenas noches", pronunciation: "BWEH-nahs NOH-chehs", english: "Good evening / night", example_es: "Buenas noches, hasta mañana.", example_en: "Good night, see you tomorrow." },
      { id: "gr-5", spanish: "¿Cómo estás?", pronunciation: "KOH-moh ehs-TAHS", english: "How are you?", example_es: "¡Hola amigo! ¿Cómo estás?", example_en: "Hi friend! How are you?" },
      { id: "gr-6", spanish: "Muy bien, gracias", pronunciation: "mooy byehn, GRAH-syahs", english: "Very well, thank you", example_es: "Estoy muy bien, gracias.", example_en: "I'm very well, thanks." },
      { id: "gr-7", spanish: "Mucho gusto", pronunciation: "MOO-choh GOO-stoh", english: "Nice to meet you", example_es: "Me llamo Ana. ¡Mucho gusto!", example_en: "My name is Ana. Nice to meet you!" },
      { id: "gr-8", spanish: "Por favor", pronunciation: "pohr fah-BOHR", english: "Please", example_es: "Un vaso de agua, por favor.", example_en: "A glass of water, please." },
      { id: "gr-9", spanish: "De nada", pronunciation: "deh NAH-dah", english: "You're welcome", example_es: "—¡Muchas gracias! —De nada.", example_en: "—Thank you! —You're welcome." },
      { id: "gr-10", spanish: "Hasta luego", pronunciation: "AHS-tah LWEH-goh", english: "See you later", example_es: "Tengo que irme. ¡Hasta luego!", example_en: "I have to go. See you later!" },
    ],
  },
  {
    id: "food",
    title: "Food",
    spanishTitle: "Comida",
    cards: [
      { id: "fd-1", spanish: "El café con leche", pronunciation: "ehl kah-FEH kohn LEH-cheh", english: "Coffee with milk", example_es: "Quiero un café con leche caliente.", example_en: "I want a hot coffee with milk." },
      { id: "fd-2", spanish: "El agua", pronunciation: "ehl AH-gwah", english: "Water", example_es: "¿Me trae agua fría, por favor?", example_en: "Could you bring me cold water, please?" },
      { id: "fd-3", spanish: "El pan", pronunciation: "ehl pahn", english: "Bread", example_es: "El pan está fresco y rico.", example_en: "The bread is fresh and tasty." },
      { id: "fd-4", spanish: "La manzana", pronunciation: "lah mahn-SAH-nah", english: "Apple", example_es: "Como una manzana cada mañana.", example_en: "I eat an apple every morning." },
      { id: "fd-5", spanish: "El queso", pronunciation: "ehl KEH-soh", english: "Cheese", example_es: "Este sándwich tiene queso.", example_en: "This sandwich has cheese." },
      { id: "fd-6", spanish: "El pollo", pronunciation: "ehl POH-yoh", english: "Chicken", example_es: "Voy a pedir pollo con arroz.", example_en: "I'm going to order chicken with rice." },
      { id: "fd-7", spanish: "La ensalada", pronunciation: "lah ehn-sah-LAH-dah", english: "Salad", example_es: "Una ensalada con tomate, por favor.", example_en: "A salad with tomato, please." },
      { id: "fd-8", spanish: "Tengo hambre", pronunciation: "TEHN-goh AHM-breh", english: "I am hungry", example_es: "Tengo mucha hambre. ¿Comemos?", example_en: "I'm very hungry. Shall we eat?" },
      { id: "fd-9", spanish: "¡Está delicioso!", pronunciation: "ehs-TAH deh-lee-SYOH-soh", english: "It's delicious!", example_es: "Este plato está delicioso.", example_en: "This dish is delicious." },
      { id: "fd-10", spanish: "La cuenta, por favor", pronunciation: "lah KWEHN-tah pohr fah-BOHR", english: "The check, please", example_es: "Disculpe, la cuenta, por favor.", example_en: "Excuse me, the check, please." },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    spanishTitle: "Viajes",
    cards: [
      { id: "tr-1", spanish: "El aeropuerto", pronunciation: "ehl ah-eh-roh-PWEHR-toh", english: "Airport", example_es: "El taxi va al aeropuerto.", example_en: "The taxi goes to the airport." },
      { id: "tr-2", spanish: "El pasaporte", pronunciation: "ehl pah-sah-POHR-teh", english: "Passport", example_es: "Aquí está mi pasaporte.", example_en: "Here is my passport." },
      { id: "tr-3", spanish: "El boleto", pronunciation: "ehl boh-LEH-toh", english: "Ticket", example_es: "Necesito comprar un boleto.", example_en: "I need to buy a ticket." },
      { id: "tr-4", spanish: "La maleta", pronunciation: "lah mah-LEH-tah", english: "Suitcase", example_es: "Mi maleta es azul y grande.", example_en: "My suitcase is blue and big." },
      { id: "tr-5", spanish: "El hotel", pronunciation: "ehl oh-TEHL", english: "Hotel", example_es: "El hotel está cerca del centro.", example_en: "The hotel is near downtown." },
      { id: "tr-6", spanish: "¿Dónde está el baño?", pronunciation: "DOHN-deh ehs-TAH ehl BAH-nyoh", english: "Where is the bathroom?", example_es: "Perdón, ¿dónde está el baño?", example_en: "Excuse me, where is the bathroom?" },
      { id: "tr-7", spanish: "A la derecha", pronunciation: "ah lah deh-REH-chah", english: "To the right", example_es: "Gira a la derecha en la esquina.", example_en: "Turn right at the corner." },
      { id: "tr-8", spanish: "A la izquierda", pronunciation: "ah lah ees-KYEHR-dah", english: "To the left", example_es: "La puerta está a la izquierda.", example_en: "The gate is on the left." },
      { id: "tr-9", spanish: "¿Cuánto cuesta?", pronunciation: "KWAHN-toh KWEHS-tah", english: "How much does it cost?", example_es: "¿Cuánto cuesta este viaje?", example_en: "How much does this trip cost?" },
      { id: "tr-10", spanish: "Necesito ayuda", pronunciation: "neh-seh-SEE-toh ah-YOO-dah", english: "I need help", example_es: "Disculpe, necesito ayuda.", example_en: "Excuse me, I need help." },
    ],
  },
  {
    id: "numbers",
    title: "Numbers",
    spanishTitle: "Números",
    cards: [
      { id: "nm-1", spanish: "Uno", pronunciation: "OO-noh", english: "One (1)", example_es: "Quiero uno, por favor.", example_en: "I want one, please." },
      { id: "nm-2", spanish: "Dos", pronunciation: "dohs", english: "Two (2)", example_es: "Una mesa para dos personas.", example_en: "A table for two people." },
      { id: "nm-3", spanish: "Tres", pronunciation: "trehs", english: "Three (3)", example_es: "Son las tres de la tarde.", example_en: "It is three in the afternoon." },
      { id: "nm-4", spanish: "Cuatro", pronunciation: "KWAH-troh", english: "Four (4)", example_es: "Tengo cuatro libros nuevos.", example_en: "I have four new books." },
      { id: "nm-5", spanish: "Cinco", pronunciation: "SEEN-koh", english: "Five (5)", example_es: "Llega en cinco minutos.", example_en: "It arrives in five minutes." },
      { id: "nm-6", spanish: "Seis", pronunciation: "says", english: "Six (6)", example_es: "Me levanto a las seis.", example_en: "I wake up at six." },
      { id: "nm-7", spanish: "Siete", pronunciation: "SYEH-teh", english: "Seven (7)", example_es: "La semana tiene siete días.", example_en: "The week has seven days." },
      { id: "nm-8", spanish: "Ocho", pronunciation: "OH-choh", english: "Eight (8)", example_es: "La puerta ocho está abierta.", example_en: "Gate eight is open." },
      { id: "nm-9", spanish: "Nueve", pronunciation: "NWEH-beh", english: "Nine (9)", example_es: "Cuesta nueve euros.", example_en: "It costs nine euros." },
      { id: "nm-10", spanish: "Diez", pronunciation: "dyehs", english: "Ten (10)", example_es: "Diez de diez, ¡excelente!", example_en: "Ten out of ten, excellent!" },
    ],
  },
];

// French Preset Decks
const FRENCH_DECKS = [
  {
    id: "greetings",
    title: "Greetings",
    spanishTitle: "Salutations",
    cards: [
      { id: "fr-gr-1", spanish: "Bonjour !", pronunciation: "bohn-ZHOOR", english: "Hello / Good day", example_es: "Bonjour ! Comment allez-vous ?", example_en: "Hello! How are you?" },
      { id: "fr-gr-2", spanish: "Bonsoir", pronunciation: "bohn-SWAHR", english: "Good evening", example_es: "Bonsoir madame Dubois.", example_en: "Good evening Mrs. Dubois." },
      { id: "fr-gr-3", spanish: "Bonne nuit", pronunciation: "buhn NWEE", english: "Good night", example_es: "Bonne nuit et à demain.", example_en: "Good night and see you tomorrow." },
      { id: "fr-gr-4", spanish: "Comment allez-vous ?", pronunciation: "koh-mahn tah-lay VOO", english: "How are you? (formal)", example_es: "Bonjour monsieur, comment allez-vous ?", example_en: "Hello sir, how are you?" },
      { id: "fr-gr-5", spanish: "Ça va ?", pronunciation: "sah VAH", english: "How's it going?", example_es: "Salut ! Ça va bien ?", example_en: "Hi! How's it going?" },
      { id: "fr-gr-6", spanish: "Très bien, merci", pronunciation: "tray byan, mehr-SEE", english: "Very well, thank you", example_es: "Je vais très bien, merci !", example_en: "I am doing very well, thank you!" },
      { id: "fr-gr-7", spanish: "Enchanté(e)", pronunciation: "ahn-shahn-TAY", english: "Nice to meet you", example_es: "Je m'appelle Claire. Enchantée !", example_en: "My name is Claire. Nice to meet you!" },
      { id: "fr-gr-8", spanish: "S'il vous plaît", pronunciation: "seel voo PLEH", english: "Please", example_es: "Un café, s'il vous plaît.", example_en: "A coffee, please." },
      { id: "fr-gr-9", spanish: "De rien", pronunciation: "duh RYAN", english: "You're welcome", example_es: "—Merci beaucoup ! —De rien.", example_en: "—Thank you so much! —You're welcome." },
      { id: "fr-gr-10", spanish: "Au revoir", pronunciation: "oh ruh-VWAHR", english: "Goodbye", example_es: "Au revoir et bonne journée !", example_en: "Goodbye and have a good day!" },
    ],
  },
  {
    id: "food",
    title: "Food",
    spanishTitle: "Nourriture",
    cards: [
      { id: "fr-fd-1", spanish: "Le café au lait", pronunciation: "luh kah-FAY oh LEH", english: "Coffee with milk", example_es: "Je prends un café au lait chaud.", example_en: "I'll have a hot coffee with milk." },
      { id: "fr-fd-2", spanish: "Le croissant", pronunciation: "luh krwah-SAHN", english: "Croissant", example_es: "Un croissant au beurre frais.", example_en: "A fresh butter croissant." },
      { id: "fr-fd-3", spanish: "Le pain", pronunciation: "luh PAN", english: "Bread", example_es: "Une baguette de pain s'il vous plaît.", example_en: "A baguette of bread please." },
      { id: "fr-fd-4", spanish: "L'eau", pronunciation: "LOH", english: "Water", example_es: "Une carafe d'eau, s'il vous plaît.", example_en: "A pitcher of water, please." },
      { id: "fr-fd-5", spanish: "Le fromage", pronunciation: "luh froh-MAHZH", english: "Cheese", example_es: "La France a beaucoup de bons fromages.", example_en: "France has many good cheeses." },
      { id: "fr-fd-6", spanish: "La pomme", pronunciation: "lah PUHM", english: "Apple", example_es: "Je mange une pomme rouge.", example_en: "I'm eating a red apple." },
      { id: "fr-fd-7", spanish: "Le poulet", pronunciation: "luh poo-LEH", english: "Chicken", example_es: "Du poulet avec du riz.", example_en: "Chicken with rice." },
      { id: "fr-fd-8", spanish: "J'ai faim", pronunciation: "zhay FAN", english: "I am hungry", example_es: "J'ai très faim, on mange ?", example_en: "I'm very hungry, shall we eat?" },
      { id: "fr-fd-9", spanish: "C'est délicieux !", pronunciation: "say day-lee-SYEU", english: "It's delicious!", example_es: "Ce repas est délicieux !", example_en: "This meal is delicious!" },
      { id: "fr-fd-10", spanish: "L'addition, s'il vous plaît", pronunciation: "lah-dee-SYOHN seel voo PLEH", english: "The check, please", example_es: "Excusez-moi, l'addition s'il vous plaît.", example_en: "Excuse me, the check please." },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    spanishTitle: "Voyages",
    cards: [
      { id: "fr-tr-1", spanish: "La gare", pronunciation: "lah GAHR", english: "Train station", example_es: "Le taxi va à la gare.", example_en: "The taxi goes to the train station." },
      { id: "fr-tr-2", spanish: "L'aéroport", pronunciation: "lah-ay-roh-POHR", english: "Airport", example_es: "Où est le terminal deux ?", example_en: "Where is terminal two?" },
      { id: "fr-tr-3", spanish: "Le passeport", pronunciation: "luh pahs-POHR", english: "Passport", example_es: "Voici mon passeport.", example_en: "Here is my passport." },
      { id: "fr-tr-4", spanish: "Le billet", pronunciation: "luh bee-YEH", english: "Ticket", example_es: "Un billet pour Paris, s'il vous plaît.", example_en: "A ticket to Paris, please." },
      { id: "fr-tr-5", spanish: "La valise", pronunciation: "lah vah-LEEZ", english: "Suitcase", example_es: "Ma valise est trop lourde.", example_en: "My suitcase is too heavy." },
      { id: "fr-tr-6", spanish: "L'hôtel", pronunciation: "loh-TEHL", english: "Hotel", example_es: "L'hôtel est près du musée.", example_en: "The hotel is near the museum." },
      { id: "fr-tr-7", spanish: "Où sont les toilettes ?", pronunciation: "oo sohn lay twah-LEHT", english: "Where is the restroom?", example_es: "Pardon, où sont les toilettes ?", example_en: "Excuse me, where is the restroom?" },
      { id: "fr-tr-8", spanish: "À droite", pronunciation: "ah DRWAHT", english: "To the right", example_es: "Tournez à droite après le pont.", example_en: "Turn right after the bridge." },
      { id: "fr-tr-9", spanish: "À gauche", pronunciation: "ah GOHSH", english: "To the left", example_es: "La station est à gauche.", example_en: "The station is on the left." },
      { id: "fr-tr-10", spanish: "Combien ça coûte ?", pronunciation: "kohm-byan sah KOOT", english: "How much does it cost?", example_es: "Pardon, combien ça coûte ?", example_en: "Excuse me, how much does it cost?" },
    ],
  },
  {
    id: "numbers",
    title: "Numbers",
    spanishTitle: "Nombres",
    cards: [
      { id: "fr-nm-1", spanish: "Un", pronunciation: "uhn", english: "One (1)", example_es: "Un café s'il vous plaît.", example_en: "One coffee please." },
      { id: "fr-nm-2", spanish: "Deux", pronunciation: "deu", english: "Two (2)", example_es: "Une table pour deux personnes.", example_en: "A table for two people." },
      { id: "fr-nm-3", spanish: "Trois", pronunciation: "trwah", english: "Three (3)", example_es: "Il est trois heures.", example_en: "It is three o'clock." },
      { id: "fr-nm-4", spanish: "Quatre", pronunciation: "kahtr", english: "Four (4)", example_es: "Quatre croissants s'il vous plaît.", example_en: "Four croissants please." },
      { id: "fr-nm-5", spanish: "Cinq", pronunciation: "sank", english: "Five (5)", example_es: "Dans cinq minutes.", example_en: "In five minutes." },
      { id: "fr-nm-6", spanish: "Six", pronunciation: "sees", english: "Six (6)", example_es: "Il a six ans.", example_en: "He is six years old." },
      { id: "fr-nm-7", spanish: "Sept", pronunciation: "seht", english: "Seven (7)", example_es: "Sept jours par semaine.", example_en: "Seven days a week." },
      { id: "fr-nm-8", spanish: "Huit", pronunciation: "weet", english: "Eight (8)", example_es: "La porte huit est ouverte.", example_en: "Gate eight is open." },
      { id: "fr-nm-9", spanish: "Neuf", pronunciation: "nuhf", english: "Nine (9)", example_es: "Ça coûte neuf euros.", example_en: "It costs nine euros." },
      { id: "fr-nm-10", spanish: "Dix", pronunciation: "dees", english: "Ten (10)", example_es: "Dix sur dix, parfait !", example_en: "Ten out of ten, perfect!" },
    ],
  },
];

export const PRESET_DECKS_DATA = {
  es: SPANISH_DECKS,
  fr: FRENCH_DECKS,
};

export const MINI_LEXICON_DATA = {
  es: {
    hola: { en: "hello", pos: "Interjection", pron: "OH-lah", note: "Silent 'h' in Spanish." },
    gracias: { en: "thank you", pos: "Noun", pron: "GRAH-syahs", note: "Always plural." },
    por: { en: "for / please", pos: "Preposition", pron: "pohr", note: "Part of 'por favor'." },
    favor: { en: "favor", pos: "Noun (m.)", pron: "fah-BOHR", note: "Part of 'por favor'." },
    yo: { en: "I", pos: "Pronoun", pron: "yoh", note: "Subject pronoun, often omitted." },
    tú: { en: "you", pos: "Pronoun", pron: "too", note: "Informal singular you (accented)." },
    quiero: { en: "I want", pos: "Verb", pron: "KYEH-roh", note: "Present form of 'querer'." },
    necesito: { en: "I need", pos: "Verb", pron: "neh-seh-SEE-toh", note: "Present form of 'necesitar'." },
    tengo: { en: "I have", pos: "Verb", pron: "TEHN-goh", note: "Irregular 1st-person of 'tener'." },
    estoy: { en: "I am", pos: "Verb", pron: "ehs-TOY", note: "From 'estar': states and locations." },
    soy: { en: "I am", pos: "Verb", pron: "soy", note: "From 'ser': identity and origins." },
    café: { en: "coffee", pos: "Noun (m.)", pron: "kah-FEH", note: "Stress on final syllable." },
    eau: { en: "water", pos: "Noun", pron: "oh", note: "" },
  },
  fr: {
    bonjour: { en: "hello / good day", pos: "Interjection", pron: "bohn-ZHOOR", note: "Standard greeting until evening." },
    merci: { en: "thank you", pos: "Interjection", pron: "mehr-SEE", note: "Polite expression of thanks." },
    salut: { en: "hi / bye", pos: "Interjection", pron: "sah-LOO", note: "Casual informal greeting." },
    oui: { en: "yes", pos: "Adverb", pron: "WEE", note: "Affirmative answer." },
    non: { en: "no", pos: "Adverb", pron: "NOHN", note: "Negative answer." },
    je: { en: "I", pos: "Pronoun", pron: "zhuh", note: "Subject pronoun." },
    tu: { en: "you", pos: "Pronoun", pron: "too", note: "Informal singular you." },
    vous: { en: "you (formal/plural)", pos: "Pronoun", pron: "VOO", note: "Polite or plural you." },
    veux: { en: "want", pos: "Verb", pron: "veu", note: "From 'vouloir'." },
    suis: { en: "am", pos: "Verb", pron: "swee", note: "From 'être'." },
    café: { en: "coffee", pos: "Noun (m.)", pron: "kah-FAY", note: "Coffee or café place." },
    croissant: { en: "croissant", pos: "Noun (m.)", pron: "krwah-SAHN", note: "Traditional French pastry." },
    pain: { en: "bread", pos: "Noun (m.)", pron: "pan", note: "Nasal vowel sound." },
    eau: { en: "water", pos: "Noun (f.)", pron: "oh", note: "Spelled 'eau', sounds like 'o'." },
  },
};
