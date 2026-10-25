import { GameControls } from "@/components/game/GameControls";
import { GameHud } from "@/components/game/GameHud";
import { GameOverlay } from "@/components/game/GameOverlay";
import { useGameAudio } from "@/hooks/use-game-audio";
import { useGameLoop } from "@/hooks/use-game-loop";
import type { GameState } from "@/lib/game/engine";
import { useCallback, useEffect, useRef } from "react";

export default function App() {
  const audio = useGameAudio();
  const crashHandledRef = useRef(false);

  const handleFrame = useCallback(
    (state: GameState) => {
      audio.setEngineActive(state.status === "playing");
      if (state.crashed && !crashHandledRef.current) {
        crashHandledRef.current = true;
        audio.playCrash();
      }
      if (state.status !== "over") crashHandledRef.current = false;
    },
    [audio],
  );

  const { canvasRef, status, score, move, restart } = useGameLoop(handleFrame);

  const handleStart = useCallback(() => {
    audio.unlock();
    crashHandledRef.current = false;
    restart();
  }, [audio, restart]);

  const handleMove = useCallback(
    (direction: -1 | 1) => {
      audio.unlock();
      move(direction);
    },
    [audio, move],
  );

  // Keyboard controls: one lane per arrow press.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleMove(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleMove(1);
      } else if (event.key === "Enter" && status !== "playing") {
        event.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleMove, handleStart, status]);

  return (
    <main
      data-ocid="game.page"
      className="relative h-[100dvh] w-full overflow-hidden bg-background"
    >
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Racing game playfield"
      />

      <GameHud
        score={score}
        musicOn={audio.musicOn}
        onToggleMusic={audio.toggleMusic}
      />

      <GameControls onMove={handleMove} disabled={status !== "playing"} />

      {status !== "playing" && (
        <GameOverlay status={status} score={score} onStart={handleStart} />
      )}
    </main>
  );
}
