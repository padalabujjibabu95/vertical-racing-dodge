import { Music, VolumeX } from "lucide-react";

interface GameHudProps {
  score: number;
  musicOn: boolean;
  onToggleMusic: () => void;
}

export function GameHud({ score, musicOn, onToggleMusic }: GameHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div
        data-ocid="game.score_panel"
        className="pointer-events-auto rounded-2xl border border-border/70 bg-card/80 px-4 py-2 shadow-hud backdrop-blur-md"
      >
        <span className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Score
        </span>
        <div
          data-ocid="game.score_value"
          className="font-mono text-3xl font-bold leading-none text-accent tabular-nums sm:text-4xl"
        >
          {String(score).padStart(4, "0")}
        </div>
      </div>

      <button
        type="button"
        data-ocid="game.music_toggle"
        onClick={onToggleMusic}
        aria-pressed={musicOn}
        aria-label={
          musicOn ? "Turn background music off" : "Turn background music on"
        }
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/60 bg-card/80 text-accent shadow-hud backdrop-blur-md transition-smooth hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
      >
        {musicOn ? (
          <Music className="h-6 w-6" aria-hidden="true" />
        ) : (
          <VolumeX className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
