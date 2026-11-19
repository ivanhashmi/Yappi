import React from "react";

/**
 * Clean inline SVG role icons for personas.
 * Follows Apple SF Symbols / Google Material 3 geometric line styling.
 */
const ROLE_ICONS = {
  barista: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  ),
  waiter: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2v20" />
      <path d="M21 2v6a3 3 0 0 1-3 3" />
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
    </svg>
  ),
  shopkeeper: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2c1 2 0 4-1 5" />
      <path d="M8.5 7A5.5 5.5 0 0 0 3 12.5C3 17 6.5 21 10 21c1.5 0 2-.8 3.5-.8s2 .8 3.5.8c3.5 0 7-4 7-8.5A5.5 5.5 0 0 0 18.5 7c-2 0-3.5 1-4.5 1S10.5 7 8.5 7z" />
    </svg>
  ),
  taxi: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2h4" />
      <path d="m5 11 2-5h10l2 5" />
      <rect x="3" y="11" width="18" height="8" rx="2" />
      <circle cx="7.5" cy="15" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="15" r="1.5" fill="currentColor" />
    </svg>
  ),
  roommate: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 2 10 14H2L12 2Z" />
      <path d="M2 16c3 2 7 3 10 3s7-1 10-3" />
      <circle cx="12" cy="9" r="1" fill="currentColor" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  "football-star": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 7 8.5 9.5 9.8 13.5 14.2 13.5 15.5 9.5 12 7" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="2.5" y1="8.5" x2="8.5" y2="9.5" />
      <line x1="4.5" y1="17.5" x2="9.8" y2="13.5" />
      <line x1="19.5" y1="17.5" x2="14.2" y2="13.5" />
      <line x1="21.5" y1="8.5" x2="15.5" y2="9.5" />
    </svg>
  ),
  "sports-fan": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
      <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  "movie-buff": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m7 3 2.5 4" />
      <path d="m11 3 2.5 4" />
      <path d="m15 3 2.5 4" />
      <path d="M3 7h18" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  ),
  musician: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="15" r="4" fill="currentColor" fillOpacity="0.2" />
      <circle cx="9" cy="15" r="1.5" />
      <path d="m11.8 12.2 6.7-6.7" />
      <path d="m15.5 8.5 2-2 2 2-2 2" />
      <line x1="18.5" y1="5.5" x2="20.5" y2="3.5" />
    </svg>
  ),
  girlfriend: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  "best-friend": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  crush: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  ),
  "party-stranger": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 22 5-14 9 9-14 5Z" />
      <path d="M14 6h2" />
      <path d="M18 10h2" />
      <path d="m17 3 1 2" />
      <path d="m21 7-2 1" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </svg>
  ),
  interviewer: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v2" />
    </svg>
  ),
  colleague: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="12" x="3" y="4" rx="2" />
      <line x1="2" x2="22" y1="20" y2="20" />
    </svg>
  ),
  businessman: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  professor: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  guide: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  ),
  hotel: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
      <path d="M9 16h6" />
      <path d="M8 7h.01M16 7h.01M8 11h.01M16 11h.01" />
    </svg>
  ),
  traveller: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
      <line x1="8" x2="16" y1="10" y2="10" />
    </svg>
  ),
  tourist: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  tutor: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    </svg>
  ),
  user: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

/**
 * Distinct, subtle color-coding per role and category.
 * Provides soft translucent tints with matching hairline borders and high-contrast foreground icons.
 */
const ROLE_THEMES = {
  barista: {
    bg: "bg-amber-500/12 dark:bg-amber-500/18",
    border: "border-amber-500/25 dark:border-amber-400/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  waiter: {
    bg: "bg-orange-500/12 dark:bg-orange-500/18",
    border: "border-orange-500/25 dark:border-orange-400/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  shopkeeper: {
    bg: "bg-teal-500/12 dark:bg-teal-500/18",
    border: "border-teal-500/25 dark:border-teal-400/30",
    text: "text-teal-700 dark:text-teal-300",
  },
  taxi: {
    bg: "bg-yellow-500/14 dark:bg-yellow-500/20",
    border: "border-yellow-500/25 dark:border-yellow-400/30",
    text: "text-yellow-800 dark:text-yellow-300",
  },
  roommate: {
    bg: "bg-sky-500/12 dark:bg-sky-500/18",
    border: "border-sky-500/25 dark:border-sky-400/30",
    text: "text-sky-700 dark:text-sky-300",
  },
  "football-star": {
    bg: "bg-emerald-500/12 dark:bg-emerald-500/18",
    border: "border-emerald-500/25 dark:border-emerald-400/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  "sports-fan": {
    bg: "bg-indigo-500/12 dark:bg-indigo-500/18",
    border: "border-indigo-500/25 dark:border-indigo-400/30",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  "movie-buff": {
    bg: "bg-fuchsia-500/12 dark:bg-fuchsia-500/18",
    border: "border-fuchsia-500/25 dark:border-fuchsia-400/30",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  musician: {
    bg: "bg-rose-500/12 dark:bg-rose-500/18",
    border: "border-rose-500/25 dark:border-rose-400/30",
    text: "text-rose-700 dark:text-rose-300",
  },
  girlfriend: {
    bg: "bg-pink-500/12 dark:bg-pink-500/18",
    border: "border-pink-500/25 dark:border-pink-400/30",
    text: "text-pink-700 dark:text-pink-300",
  },
  "best-friend": {
    bg: "bg-blue-500/12 dark:bg-blue-500/18",
    border: "border-blue-500/25 dark:border-blue-400/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  crush: {
    bg: "bg-violet-500/12 dark:bg-violet-500/18",
    border: "border-violet-500/25 dark:border-violet-400/30",
    text: "text-violet-700 dark:text-violet-300",
  },
  "party-stranger": {
    bg: "bg-amber-500/15 dark:bg-amber-500/22",
    border: "border-amber-500/25 dark:border-amber-400/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  interviewer: {
    bg: "bg-slate-500/12 dark:bg-slate-500/20",
    border: "border-slate-500/25 dark:border-slate-400/30",
    text: "text-slate-800 dark:text-slate-200",
  },
  colleague: {
    bg: "bg-cyan-500/12 dark:bg-cyan-500/18",
    border: "border-cyan-500/25 dark:border-cyan-400/30",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  businessman: {
    bg: "bg-blue-600/12 dark:bg-blue-600/18",
    border: "border-blue-600/25 dark:border-blue-400/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  professor: {
    bg: "bg-stone-500/14 dark:bg-stone-500/20",
    border: "border-stone-500/25 dark:border-stone-400/30",
    text: "text-stone-800 dark:text-stone-200",
  },
  guide: {
    bg: "bg-emerald-500/12 dark:bg-emerald-500/18",
    border: "border-emerald-500/25 dark:border-emerald-400/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  hotel: {
    bg: "bg-sky-500/12 dark:bg-sky-500/18",
    border: "border-sky-500/25 dark:border-sky-400/30",
    text: "text-sky-700 dark:text-sky-300",
  },
  traveller: {
    bg: "bg-orange-500/12 dark:bg-orange-500/18",
    border: "border-orange-500/25 dark:border-orange-400/30",
    text: "text-orange-700 dark:text-orange-300",
  },
  tourist: {
    bg: "bg-rose-500/12 dark:bg-rose-500/18",
    border: "border-rose-500/25 dark:border-rose-400/30",
    text: "text-rose-700 dark:text-rose-300",
  },
  user: {
    bg: "bg-subtle",
    border: "border-hairline",
    text: "text-muted",
  },
  tutor: {
    bg: "bg-accent/12",
    border: "border-accent/25",
    text: "text-accent",
  },
};

const CATEGORY_THEMES = {
  everyday: {
    bg: "bg-amber-500/12 dark:bg-amber-500/18",
    border: "border-amber-500/25 dark:border-amber-400/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  sports: {
    bg: "bg-emerald-500/12 dark:bg-emerald-500/18",
    border: "border-emerald-500/25 dark:border-emerald-400/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  relationships: {
    bg: "bg-rose-500/12 dark:bg-rose-500/18",
    border: "border-rose-500/25 dark:border-rose-400/30",
    text: "text-rose-700 dark:text-rose-300",
  },
  career: {
    bg: "bg-slate-500/12 dark:bg-slate-500/18",
    border: "border-slate-500/25 dark:border-slate-400/30",
    text: "text-slate-800 dark:text-slate-200",
  },
  travel: {
    bg: "bg-sky-500/12 dark:bg-sky-500/18",
    border: "border-sky-500/25 dark:border-sky-400/30",
    text: "text-sky-700 dark:text-sky-300",
  },
};

const FALLBACK_PALETTES = [
  { bg: "bg-amber-500/12 dark:bg-amber-500/18", border: "border-amber-500/25 dark:border-amber-400/30", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-500/12 dark:bg-emerald-500/18", border: "border-emerald-500/25 dark:border-emerald-400/30", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-sky-500/12 dark:bg-sky-500/18", border: "border-sky-500/25 dark:border-sky-400/30", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-rose-500/12 dark:bg-rose-500/18", border: "border-rose-500/25 dark:border-rose-400/30", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-violet-500/12 dark:bg-violet-500/18", border: "border-violet-500/25 dark:border-violet-400/30", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-teal-500/12 dark:bg-teal-500/18", border: "border-teal-500/25 dark:border-teal-400/30", text: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-orange-500/12 dark:bg-orange-500/18", border: "border-orange-500/25 dark:border-orange-400/30", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-indigo-500/12 dark:bg-indigo-500/18", border: "border-indigo-500/25 dark:border-indigo-400/30", text: "text-indigo-700 dark:text-indigo-300" },
];

/**
 * Smart lookup from character names to role IDs (supports ES, FR, IT personas).
 */
const NAME_TO_ROLE = {
  // Barista
  mateo: "barista",
  julien: "barista",
  matteo: "barista",
  // Waiter
  carlos: "waiter",
  pierre: "waiter",
  marco: "waiter",
  // Shopkeeper
  "doña carmen": "shopkeeper",
  carmen: "shopkeeper",
  "mme dupont": "shopkeeper",
  dupont: "shopkeeper",
  "sig.ra rossi": "shopkeeper",
  rossi: "shopkeeper",
  // Taxi
  paco: "taxi",
  karim: "taxi",
  giovanni: "taxi",
  // Roommate
  diego: "roommate",
  maxime: "roommate",
  luca: "roommate",
  // Football
  santiago: "football-star",
  antoine: "football-star",
  alessandro: "football-star",
  // Sports fan
  javier: "sports-fan",
  davide: "sports-fan",
  // Movie buff
  valeria: "movie-buff",
  francesca: "movie-buff",
  // Musician
  leo: "musician",
  leonardo: "musician",
  // Girlfriend
  elena: "girlfriend",
  chloé: "girlfriend",
  // Best friend
  lucas: "best-friend",
  lorenzo: "best-friend",
  // Crush
  sofía: "crush",
  inès: "crush",
  beatrice: "crush",
  // Party
  alejandro: "party-stranger",
  andrea: "party-stranger",
  // Interviewer
  "sr. navarro": "interviewer",
  navarro: "interviewer",
  "m. beaumont": "interviewer",
  beaumont: "interviewer",
  "dott.ssa bianchi": "interviewer",
  bianchi: "interviewer",
  // Colleague
  lucía: "colleague",
  gabriele: "colleague",
  // Businessman
  rodrigo: "businessman",
  roberto: "businessman",
  // Professor
  "prof. mendoza": "professor",
  mendoza: "professor",
  "prof. moretti": "professor",
  moretti: "professor",
  // Guide
  mariana: "guide",
  léa: "guide",
  chiara: "guide",
  // Hotel
  gonzalo: "hotel",
  étienne: "hotel",
  valentina: "hotel",
  // Traveller
  hugo: "traveller",
  massimo: "traveller",
  // Tourist
  emma: "tourist",
  emily: "tourist",
  // App personas
  "guest learner": "user",
  learner: "user",
  you: "user",
  amélie: "tutor",
};

/**
 * Modern Subtle Color-Coded Avatar
 * - Distinct subtle pastel tint per persona role with matching border and icon
 * - Crisp vector role icons (Coffee, Taxi, Football, Guitar, etc.) replacing plain monochrome letter circles
 * - Full backward compatibility with name, character object, custom icon, or initials
 */
export default function Avatar({
  character = null,
  name = "",
  role = "",
  avatar = null,
  category = "",
  icon = null,
  size = "md", // "xs" (24px), "sm" (32px), "md" (44px), "lg" (56px), "xl" (64px)
  variant = "role-icon", // "role-icon" | "emoji" | "initials"
  className = "",
  ariaLabel,
}) {
  const resolvedName = character?.name || name || "";
  const resolvedAvatar = character?.avatar || avatar || null;
  const resolvedCategory = character?.category || category || "";

  // Derive role key
  const normalizedName = resolvedName.trim().toLowerCase();
  const rawRoleKey = (character?.id || role || NAME_TO_ROLE[normalizedName] || "").toLowerCase();

  // Find theme
  const theme =
    ROLE_THEMES[rawRoleKey] ||
    CATEGORY_THEMES[resolvedCategory] ||
    (resolvedName
      ? FALLBACK_PALETTES[
          Math.abs(
            resolvedName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
          ) % FALLBACK_PALETTES.length
        ]
      : { bg: "bg-subtle", border: "border-hairline", text: "text-primary" });

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
  }[size] || "w-11 h-11";

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5.5 h-5.5",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  }[size] || "w-5.5 h-5.5";

  const emojiSizes = {
    xs: "text-[11px]",
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size] || "text-xl";

  const fontSizes = {
    xs: "text-[10px] font-semibold",
    sm: "text-caption font-semibold",
    md: "text-body font-semibold",
    lg: "text-title font-semibold",
    xl: "text-headline font-semibold",
  }[size] || "text-body font-semibold";

  const initials = resolvedName
    ? resolvedName
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const RoleIconComponent = ROLE_ICONS[rawRoleKey];

  // Render content based on availability and variant
  let content = null;
  if (icon) {
    content = <span className="opacity-95">{icon}</span>;
  } else if (variant === "emoji" && resolvedAvatar) {
    content = <span className={`select-none leading-none ${emojiSizes}`}>{resolvedAvatar}</span>;
  } else if (RoleIconComponent && variant !== "initials") {
    content = <RoleIconComponent className={iconSizes} />;
  } else if (resolvedAvatar && variant !== "initials") {
    content = <span className={`select-none leading-none ${emojiSizes}`}>{resolvedAvatar}</span>;
  } else {
    content = <span className={fontSizes}>{initials}</span>;
  }

  return (
    <div
      aria-label={ariaLabel || resolvedName}
      className={`rounded-full border flex items-center justify-center shrink-0 select-none transition-colors duration-fast ${theme.bg} ${theme.border} ${theme.text} ${sizeClasses} ${className}`}
    >
      {content}
    </div>
  );
}
