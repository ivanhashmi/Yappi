import React from "react";
import { LANGUAGES } from "../data/languages";

export default function LanguageSelector({ currentLanguage, onChangeLanguage, compact = false }) {
  return (
    <div className={`flex items-center p-0.5 rounded-full bg-black/5 border border-black/[0.06] ${compact ? "gap-0.5" : "gap-1"}`}>
      {LANGUAGES.map((lang) => {
        const active = currentLanguage === lang.id;
        return (
          <button
            key={lang.id}
            type="button"
            onClick={() => onChangeLanguage(lang.id)}
            className={`press-scale flex items-center gap-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              compact ? "px-2 py-1" : "px-3 py-1.5"
            } ${
              active
                ? "bg-white text-[#1D1D1F] shadow-xs"
                : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
            title={`Learn ${lang.name}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}
