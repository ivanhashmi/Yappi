import React, { useState, useEffect } from "react";
import Icon from "./Icon";
import { ALPHABET_DATA, SPECIAL_SOUNDS_DATA } from "../data/languages";

/* ============================================================================
 * TAB 2: ALPHABET — Phone-First Full Alphabet & Digraphs
 * ========================================================================== */
export default function AlphabetTab({ language = "es", speakSpanish, recordPractice }) {
  const alphabet = ALPHABET_DATA[language] || ALPHABET_DATA.es;
  const specialSounds = SPECIAL_SOUNDS_DATA[language] || SPECIAL_SOUNDS_DATA.es;

  const [selected, setSelected] = useState(alphabet[0]);

  useEffect(() => {
    setSelected(alphabet[0]);
  }, [language, alphabet]);

  const handleSelect = (item) => {
    setSelected(item);
    recordPractice();
    speakSpanish(`${item.tts}. ${item.word}`);
  };

  const langName = language === "fr" ? "French (Français)" : "Spanish (Español)";
  const letterCount = alphabet.length;

  return (
    <div className="space-y-4">
      {/* Mobile Spotlight Card */}
      <div className="material-card rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-bold text-3xl shadow-sm">
              {selected.letter}
              <span className="text-xl ml-0.5 opacity-80">{selected.lower}</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-[#86868B] font-bold">
                Letter Name: <span className="text-[#007AFF]">{selected.name}</span>
              </div>
              <div className="text-base font-bold text-[#1D1D1F]">
                {selected.word}
                <span className="text-xs font-normal text-[#86868B] ml-2">({selected.meaning})</span>
              </div>
              <div className="text-xs font-mono text-[#007AFF] font-medium">
                🗣️ {selected.wordPhonetic}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                recordPractice();
                speakSpanish(`${selected.tts}. ${selected.word}`);
              }}
              className="press-scale p-2 rounded-full bg-[#007AFF] text-white shadow-xs cursor-pointer flex items-center justify-center"
              title="Listen letter + word"
            >
              <Icon name="volume" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                recordPractice();
                speakSpanish(`${selected.tts}. ${selected.word}`, { slow: true });
              }}
              className="press-scale px-2 py-1 rounded-full bg-black/5 text-[10px] font-bold text-[#1D1D1F] cursor-pointer"
              title="Slow audio"
            >
              0.7x
            </button>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-[#007AFF]/[0.06] border border-[#007AFF]/15 text-xs text-[#1D1D1F]">
          <span className="font-bold text-[#007AFF]">Pronunciation tip: </span>
          {selected.tip}
        </div>
      </div>

      {/* Letters Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
            All {letterCount} Letters ({langName})
          </h2>
          <span className="text-[11px] text-[#86868B]">Tap to hear</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {alphabet.map((item) => {
            const active = selected.letter === item.letter;
            return (
              <button
                key={item.letter}
                type="button"
                onClick={() => handleSelect(item)}
                className={`press-scale p-2.5 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  active
                    ? "bg-[#007AFF] text-white shadow-sm"
                    : "material-card hover:bg-black/[0.03]"
                }`}
              >
                <div className="text-lg font-bold">
                  {item.letter}
                  <span className="text-sm font-normal opacity-75 ml-0.5">{item.lower}</span>
                </div>
                <div
                  className={`text-[10px] tracking-tight ${
                    active ? "text-white/80" : "text-[#86868B]"
                  }`}
                >
                  {item.name}
                </div>
                <div
                  className={`text-[10px] font-medium truncate max-w-full ${
                    active ? "text-white" : "text-[#007AFF]"
                  }`}
                >
                  {item.word}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Sounds, Accents & Digraphs */}
      {specialSounds.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#86868B] uppercase tracking-wider px-1">
            Special Sounds, Accents & Digraphs
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {specialSounds.map((item) => {
              return (
                <button
                  key={item.letter}
                  type="button"
                  onClick={() => {
                    recordPractice();
                    speakSpanish(item.word);
                  }}
                  className="press-scale p-3 rounded-2xl material-card text-left hover:bg-black/[0.03] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#007AFF]">{item.letter}</span>
                    <span className="text-[10px] font-mono text-[#86868B]">{item.name}</span>
                  </div>
                  <div className="text-xs font-bold text-[#1D1D1F]">{item.word}</div>
                  <div className="text-[11px] text-[#86868B] mt-0.5">{item.tip}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
