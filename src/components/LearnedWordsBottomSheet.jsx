import React from "react";
import Icon from "./Icon";

/* ============================================================================
 * BOTTOM SHEET: Learned Words Sheet
 * ========================================================================== */
export default function LearnedWordsBottomSheet({ learnedWords, speakSpanish, onRemove, onClose }) {
  const list = Object.values(learnedWords).sort((a, b) => (b.learnedAt || 0) - (a.learnedAt || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#0D0D10] dark:border dark:border-white/[0.10] rounded-t-[28px] sm:rounded-3xl p-5 space-y-3 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-1 sm:hidden" />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
            Learned Words ({list.length})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
          >
            Done
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] py-6 text-center">
            No words marked learned yet. Head to <strong>Vocab</strong> and tap{" "}
            <strong>Mark Learned</strong>!
          </p>
        ) : (
          <div className="space-y-1.5">
            {list.map((w) => (
              <div
                key={w.key}
                className="p-2.5 rounded-2xl bg-[#F5F5F7] dark:bg-[#16161A] border border-transparent dark:border-white/[0.06] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{w.spanish}</div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#A1A1A6]">{w.english}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => speakSpanish(w.spanish)}
                    className="p-1 text-[#007AFF] dark:text-[#0A84FF] cursor-pointer"
                  >
                    <Icon name="volume" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(w.key)}
                    className="p-1 text-[#FF3B30] dark:text-[#FF453A] cursor-pointer"
                  >
                    <Icon name="trash" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
