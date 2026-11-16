import React from "react";
import Icon from "./Icon";
import { Sheet, Button, Card } from "./ui";

/* ============================================================================
 * BOTTOM SHEET: Learned Words Vocabulary History
 * ========================================================================== */
export default function LearnedWordsBottomSheet({
  learnedWords = {},
  speakSpanish,
  onRemove,
  onClose,
}) {
  const list = Object.values(learnedWords).sort(
    (a, b) => (b.learnedAt || 0) - (a.learnedAt || 0)
  );

  return (
    <Sheet
      isOpen={true}
      onClose={onClose}
      title={`Learned Words (${list.length})`}
      actionButton={
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4 pt-2">
        {list.length === 0 ? (
          <Card className="py-12 text-center p-6 space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-subtle flex items-center justify-center text-muted">
              <Icon name="check" className="w-5 h-5" />
            </div>
            <h3 className="text-headline font-semibold text-primary">
              No words marked learned yet
            </h3>
            <p className="text-caption text-muted max-w-xs mx-auto">
              Flip flashcards in the Vocab tab and tap "Mark Learned" to save words here for active review.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-1">
            {list.map((w) => (
              <Card
                key={w.key}
                className="p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-body font-medium text-primary truncate">
                    {w.spanish}
                  </p>
                  <p className="text-caption text-muted truncate mt-0.5">
                    {w.english}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => speakSpanish(w.spanish)}
                    className="press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted hover:text-accent hover:bg-subtle cursor-pointer transition-colors"
                    aria-label={`Listen to ${w.spanish}`}
                  >
                    <Icon name="volume" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(w.key)}
                    className="press-scale min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-muted hover:text-status-error hover:bg-subtle cursor-pointer transition-colors"
                    aria-label={`Remove ${w.spanish} from learned`}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
