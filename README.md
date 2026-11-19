# Yappi — AI Language Studio

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://yappi-tau.vercel.app)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)

**Yappi** is an AI-powered conversational language learning studio. Designed with an Apple-inspired interface, it combines natural conversational practice, instant grammar feedback, interactive roleplay personas, and smart flashcard decks across Spanish, French, and Italian.

Live app: **[yappi-tau.vercel.app](https://yappi-tau.vercel.app)**

---

## ✨ Features

- **Personal AI Tutors**: Practice speaking and texting with dedicated tutors (Sofía for Spanish, Amélie for French, Chiara for Italian). Receive immediate grammar corrections, suggestions, and explanations.
- **Interactive Roleplay Characters**: Text in an iOS Messages-style interface with characters tailored to different scenarios (barista, roommate, travel guide, friend). Features local progress tracking, dynamic conversation starters, and character voice presets.
- **Natural Speech & Listening**: High-fidelity AI speech synthesis with 0.7x slow-mode playback and voice recognition for hands-free speaking practice. Audio playback is guarded against overlapping streams.
- **Smart Vocabulary & Flashcards**: Curated decks sorted by level and theme with interactive 3D flip cards, pronunciation keys, example sentences, and custom deck creation.
- **Contextual Translator**: Bidirectional translation with grammar breakdowns, word-by-word tokenized pronunciation, and one-tap saving to your learned words.
- **Cloud Sync & Streaks**: Optional Supabase authentication with persistent streak tracking, learned word counters, and multi-device synchronization.
- **iOS Human Interface Design**: 44px minimum touch targets, haptic feedback, glass-blur surfaces, safe-area inset compliance, and dark/light mode.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4
- **Backend / API**: Vercel Serverless Functions (`/api/gemini`)
- **AI Models**: Google Gemini API (conversations, translation, speech generation)
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Speech**: Gemini Neural Audio with native Web Speech API fallback

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Google Gemini API key
- (Optional) A Supabase project for user authentication & cloud sync

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ivanhashmi/Yappi.git
   cd Yappi
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Fill in your configuration:
   ```env
   # Server-only Gemini API key (proxied through /api/gemini in Vite & Vercel)
   GEMINI_API_KEY=your_gemini_api_key_here

   # Public Supabase config (optional for cloud sync)
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite development server with local Gemini proxy |
| `npm run build` | Builds the production bundle to `dist/` |
| `npm run preview` | Previews the production build locally |

---

## 🚢 Deployment

The project is configured for deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import the project into your Vercel Dashboard.
3. Add your environment variables in Vercel Project Settings:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy! Production builds and serverless endpoints in `/api` are handled automatically via `vercel.json`.

---

## 📄 License

MIT License. Built for language learners worldwide.
