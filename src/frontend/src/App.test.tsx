import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("App: game shell", () => {
  beforeEach(() => {
    stubCanvasContext();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the playfield, score and lane controls without a blank screen", () => {
    render(<App />);

    expect(screen.getByLabelText("Racing game playfield")).toBeInTheDocument();
    expect(screen.getByTestId("game.score_value")).toHaveTextContent("0000");
    expect(screen.getByTestId("game.left_button")).toBeInTheDocument();
    expect(screen.getByTestId("game.right_button")).toBeInTheDocument();
  });

  it("shows the start overlay and disables lane controls before the race", () => {
    render(<App />);

    expect(screen.getByTestId("game.start_overlay")).toBeInTheDocument();
    expect(screen.getByTestId("game.left_button")).toBeDisabled();
    expect(screen.getByTestId("game.right_button")).toBeDisabled();
  });

  it("starts the race from the overlay and enables the lane controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByTestId("game.restart_button"));

    expect(screen.queryByTestId("game.start_overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("game.left_button")).toBeEnabled();
    expect(screen.getByTestId("game.right_button")).toBeEnabled();
  });

  it("toggles background music on and off from the HUD", async () => {
    const user = userEvent.setup();
    render(<App />);

    const toggle = screen.getByTestId("game.music_toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});

describe("App: gameplay journey", () => {
  beforeEach(() => {
    stubCanvasContext();
    // Force every spawn into lane 0 so the collision journey is deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves the player one lane per control press and clamps at the edges", async () => {
    const user = userEvent.setup();
    const raf = installRafDriver();
    render(<App />);

    await user.click(screen.getByTestId("game.restart_button"));

    // Two left presses from the middle lane clamp at lane 0 without error.
    await user.click(screen.getByTestId("game.left_button"));
    await user.click(screen.getByTestId("game.left_button"));
    raf.frame(16);
    expect(screen.getByTestId("game.left_button")).toBeEnabled();

    // Two right presses reach the rightmost lane and clamp there.
    await user.click(screen.getByTestId("game.right_button"));
    await user.click(screen.getByTestId("game.right_button"));
    await user.click(screen.getByTestId("game.right_button"));
    raf.frame(16);
    expect(screen.getByTestId("game.right_button")).toBeEnabled();
  });

  it("shows GAME OVER with the final score and restarts to a fresh race", async () => {
    const user = userEvent.setup();
    const raf = installRafDriver();
    render(<App />);

    await user.click(screen.getByTestId("game.restart_button"));

    // Traffic always spawns in lane 0; steer the player left into that lane
    // so a collision is guaranteed rather than left to chance.
    await user.click(screen.getByTestId("game.left_button"));

    // Run frames until traffic collides with the player.
    for (let i = 0; i < 4000; i += 1) {
      raf.frame(16);
      if (screen.queryByTestId("game.game_over_overlay")) break;
    }

    const over = screen.getByTestId("game.game_over_overlay");
    expect(over).toBeInTheDocument();
    expect(screen.getByTestId("game.overlay_title")).toHaveTextContent(
      /game over/i,
    );
    expect(screen.getByTestId("game.final_score")).toBeInTheDocument();

    // Restart resets the score and returns to a playing state.
    await user.click(screen.getByTestId("game.restart_button"));
    expect(
      screen.queryByTestId("game.game_over_overlay"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("game.score_value")).toHaveTextContent("0000");
  });
});
