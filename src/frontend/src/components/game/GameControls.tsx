import { ChevronLeft, ChevronRight } from "lucide-react";

interface GameControlsProps {
  onMove: (direction: -1 | 1) => void;
  disabled: boolean;
}

export function GameControls({ onMove, disabled }: GameControlsProps) {
  const base =
    "flex h-24 w-28 select-none items-center justify-center gap-1 rounded-3xl border border-border/70 bg-secondary/85 text-secondary-foreground shadow-control backdrop-blur-md transition-smooth active:scale-95 active:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 sm:h-28 sm:w-32";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-6 sm:p-6">
      <button
        type="button"
        data-ocid="game.left_button"
        onClick={() => onMove(-1)}
        disabled={disabled}
        aria-label="Move left one lane"
        className={`pointer-events-auto ${base}`}
      >
        <ChevronLeft className="h-10 w-10" aria-hidden="true" />
        <span className="font-display text-sm font-bold uppercase tracking-widest">
          Left
        </span>
      </button>

      <button
        type="button"
        data-ocid="game.right_button"
        onClick={() => onMove(1)}
        disabled={disabled}
        aria-label="Move right one lane"
        className={`pointer-events-auto ${base}`}
      >
        <span className="font-display text-sm font-bold uppercase tracking-widest">
          Right
        </span>
        <ChevronRight className="h-10 w-10" aria-hidden="true" />
      </button>
    </div>
  );
}
