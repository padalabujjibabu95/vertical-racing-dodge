import {
  type GameState,
  createInitialState,
  movePlayer,
  startGame,
  step,
} from "@/lib/game/engine";
import { render } from "@/lib/game/render";
import { useCallback, useEffect, useRef, useState } from "react";

export interface GameLoopApi {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: GameState["status"];
  score: number;
  move: (direction: -1 | 1) => void;
  restart: () => void;
  /** Called once per frame with the live state, for audio + HUD sync. */
  onFrame?: (state: GameState) => void;
}

/**
 * Owns the requestAnimationFrame loop, the mutable simulation state and the
 * canvas sizing. React state is only used for the values the DOM HUD needs
 * (status + score), so the 60fps loop never re-renders the tree.
 */
export function useGameLoop(onFrame?: (state: GameState) => void): GameLoopApi {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const [status, setStatus] = useState<GameState["status"]>("ready");
  const [score, setScore] = useState(0);

  const move = useCallback((direction: -1 | 1) => {
    movePlayer(stateRef.current, direction);
  }, []);

  const restart = useCallback(() => {
    startGame(stateRef.current);
    setStatus("playing");
    setScore(0);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const loop = (time: number) => {
      const dt = lastTimeRef.current
        ? Math.min((time - lastTimeRef.current) / 1000, 0.05)
        : 0;
      lastTimeRef.current = time;

      const state = stateRef.current;
      const prevStatus = state.status;
      const prevScore = state.score;

      step(state, dt);
      render(ctx, state, width, height);
      onFrameRef.current?.(state);

      if (state.status !== prevStatus) setStatus(state.status);
      if (state.score !== prevScore) setScore(state.score);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
    };
  }, []);

  return { canvasRef, status, score, move, restart };
}
