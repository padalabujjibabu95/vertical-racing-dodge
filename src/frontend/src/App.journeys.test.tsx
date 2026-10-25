import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

/**
 * jsdom has no canvas backend, so `getContext("2d")` returns null and the game
 * loop would bail before starting. Provide a minimal 2D context stub so the
 * loop runs and the React HUD/overlay state can be exercised.
 */
function stubCanvasContext() {
  const ctx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arcTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    set fillStyle(_v: string) {},
    set shadowColor(_v: string) {},
    set shadowBlur(_v: number) {},
    set shadowOffsetY(_v: number) {},
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    ctx as unknown as CanvasRenderingContext2D,
  );
}

/** Drive the requestAnimationFrame loop manually with a controllable clock. */
function installRafDriver() {
  let now = 0;
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();

  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    const id = nextId++;
    callbacks.set(id, cb);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    callbacks.delete(id);
  });

  return {
    /**
     * Advance the clock by `ms` and run one frame. Wrapped in `act` so the
     * React state the loop writes (status/score) is flushed to the DOM before
     * the caller reads it.
     */
    frame(ms: number) {
      act(() => {
        now += ms;
        const pending = [...callbacks.values()];
        callbacks.clear();
        for (const cb of pending) cb(now);
      });
    },
  };
}

describe("App: score and collision journeys", () => {
  beforeEach(() => {
    stubCanvasContext();
    // Force every spawn into lane 0 so the journey is deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("increases the score when a traffic car passes the player", () => {
    const raf = installRafDriver();
    render(<App />);

    fireEvent.click(screen.getByTestId("game.restart_button"));

    // The player starts in the middle lane; traffic spawns in lane 0 and
    // passes without colliding, so the score must climb above zero.
    for (let i = 0; i < 400; i += 1) {
      raf.frame(16);
      if (screen.getByTestId("game.score_value").textContent !== "0000") break;
    }

    expect(screen.getByTestId("game.score_value")).not.toHaveTextContent(
      "0000",
    );
  });

  it("stops the game and shows GAME OVER when the player drives into traffic", () => {
    const raf = installRafDriver();
    render(<App />);

    fireEvent.click(screen.getByTestId("game.restart_button"));

    // Traffic always spawns in lane 0; steer the player left into that lane
    // and let the car reach the player's row.
    fireEvent.click(screen.getByTestId("game.left_button"));

    for (let i = 0; i < 4000; i += 1) {
      raf.frame(16);
      if (screen.queryByTestId("game.game_over_overlay")) break;
    }

    expect(screen.getByTestId("game.game_over_overlay")).toBeInTheDocument();
    expect(screen.getByTestId("game.overlay_title")).toHaveTextContent(
      /game over/i,
    );
    expect(screen.getByTestId("game.final_score")).toBeInTheDocument();
    // The lane controls are disabled once the race is over.
    expect(screen.getByTestId("game.left_button")).toBeDisabled();
  });

  it("restart resets the score and starts a fresh race", () => {
    const raf = installRafDriver();
    render(<App />);

    fireEvent.click(screen.getByTestId("game.restart_button"));
    fireEvent.click(screen.getByTestId("game.left_button"));

    for (let i = 0; i < 4000; i += 1) {
      raf.frame(16);
      if (screen.queryByTestId("game.game_over_overlay")) break;
    }
    expect(screen.getByTestId("game.game_over_overlay")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("game.restart_button"));

    expect(
      screen.queryByTestId("game.game_over_overlay"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("game.score_value")).toHaveTextContent("0000");
    expect(screen.getByTestId("game.left_button")).toBeEnabled();
  });
});
