import { Flag, RotateCcw } from "lucide-react";

interface GameOverlayProps {
  status: "ready" | "over";
  score: number;
  onStart: () => void;
}

export function GameOverlay({ status, score, onStart }: GameOverlayProps) {
  const isOver = status === "over";

  return (
    <div
      data-ocid={isOver ? "game.game_over_overlay" : "game.start_overlay"}
      className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm animate-overlay-in rounded-3xl border border-border/70 bg-card/95 p-7 text-center shadow-hud">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {isOver ? (
            <Flag className="h-7 w-7" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-7 w-7" aria-hidden="true" />
          )}
        </div>

        <h1
          data-ocid="game.overlay_title"
          className="font-display text-3xl font-bold uppercase tracking-[0.18em] text-foreground"
        >
          {isOver ? "Game Over" : "Lane Racer"}
        </h1>

        {isOver ? (
          <p className="mt-3 font-body text-sm text-muted-foreground">
            Final score
          </p>
        ) : (
          <p className="mt-3 font-body text-sm text-muted-foreground">
            Weave through traffic. Tap Left / Right or use the arrow keys.
          </p>
        )}

        {isOver && (
          <div
            data-ocid="game.final_score"
            className="mt-1 font-mono text-5xl font-bold text-accent tabular-nums"
          >
            {String(score).padStart(4, "0")}
          </div>
        )}

        <button
          type="button"
          data-ocid="game.restart_button"
          onClick={onStart}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-base font-bold uppercase tracking-widest text-primary-foreground shadow-control transition-smooth hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
          {isOver ? "Restart" : "Start Race"}
        </button>
      </div>
    </div>
  );
}
