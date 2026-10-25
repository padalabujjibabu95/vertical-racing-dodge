import { describe, expect, it } from "vitest";

import {
  LANE_COUNT,
  MAX_TRAFFIC_SPEED,
  PLAYER_HEIGHT,
  PLAYER_Y,
  trafficSpeedForScore,
} from "./constants";
import {
  type GameState,
  createInitialState,
  movePlayer,
  startGame,
  step,
} from "./engine";

/** A playing state with no traffic, so tests control the simulation exactly. */
function playingState(overrides: Partial<GameState> = {}): GameState {
  const state = createInitialState();
  startGame(state);
  return Object.assign(state, overrides);
}

describe("engine: lane movement", () => {
  it("starts the player in the middle lane", () => {
    const state = createInitialState();
    expect(state.playerLane).toBe(1);
    expect(state.targetLane).toBe(1);
  });

  it("moves exactly one lane per move and never leaves the three lanes", () => {
    const state = playingState();

    movePlayer(state, -1);
    expect(state.targetLane).toBe(0);
    movePlayer(state, -1);
    expect(state.targetLane).toBe(0);

    movePlayer(state, 1);
    expect(state.targetLane).toBe(1);
    movePlayer(state, 1);
    expect(state.targetLane).toBe(2);
    movePlayer(state, 1);
    expect(state.targetLane).toBe(2);
    expect(state.targetLane).toBeLessThan(LANE_COUNT);
  });

  it("ignores movement while the game is not playing", () => {
    const state = createInitialState();
    movePlayer(state, 1);
    expect(state.targetLane).toBe(1);
  });

  it("eases the player toward the target lane over time", () => {
    const state = playingState();
    movePlayer(state, 1);
    step(state, 0.05);
    expect(state.playerLane).toBeGreaterThan(1);
    expect(state.playerLane).toBeLessThanOrEqual(2);
  });
});

describe("engine: traffic and scoring", () => {
  it("moves traffic downward and scores a car that passes the player", () => {
    const state = playingState({
      traffic: [
        { id: 1, lane: 0, y: PLAYER_Y - 0.05, color: "#000", scored: false },
      ],
    });

    step(state, 0.7);

    expect(state.traffic[0].y).toBeGreaterThan(PLAYER_Y - 0.05);
    expect(state.score).toBe(1);
    expect(state.traffic[0].scored).toBe(true);
  });

  it("does not score the same car twice", () => {
    const state = playingState({
      traffic: [
        {
          id: 1,
          lane: 0,
          y: PLAYER_Y + PLAYER_HEIGHT + 0.01,
          color: "#000",
          scored: true,
        },
      ],
    });
    step(state, 0.1);
    expect(state.score).toBe(0);
  });

  it("spawns traffic at the top of the road over time", () => {
    const state = playingState();
    // Advance well past the base spawn interval in small steps.
    for (let i = 0; i < 40; i += 1) step(state, 0.05);
    expect(state.traffic.length).toBeGreaterThan(0);
    expect(state.traffic.every((car) => car.y >= -1)).toBe(true);
  });
});

describe("engine: collision", () => {
  it("stops the game and flags a crash when traffic overlaps the player", () => {
    const state = playingState({
      traffic: [{ id: 1, lane: 1, y: PLAYER_Y, color: "#000", scored: false }],
    });

    step(state, 0.016);

    expect(state.status).toBe("over");
    expect(state.crashed).toBe(true);
  });

  it("does not crash when traffic is in a different lane", () => {
    const state = playingState({
      traffic: [{ id: 1, lane: 0, y: PLAYER_Y, color: "#000", scored: false }],
    });
    step(state, 0.016);
    expect(state.status).toBe("playing");
    expect(state.crashed).toBe(false);
  });

  it("freezes the simulation once the game is over", () => {
    const state = playingState({
      traffic: [{ id: 1, lane: 1, y: PLAYER_Y, color: "#000", scored: false }],
    });
    step(state, 0.016);
    const frozenY = state.traffic[0].y;
    step(state, 0.5);
    expect(state.traffic[0].y).toBe(frozenY);
  });
});

describe("engine: restart", () => {
  it("resets score, lanes, traffic and status", () => {
    const state = playingState({
      score: 7,
      playerLane: 2,
      targetLane: 2,
      traffic: [{ id: 1, lane: 2, y: 0.5, color: "#000", scored: true }],
    });
    state.status = "over";

    startGame(state);

    expect(state.status).toBe("playing");
    expect(state.score).toBe(0);
    expect(state.playerLane).toBe(1);
    expect(state.targetLane).toBe(1);
    expect(state.traffic).toEqual([]);
    expect(state.crashed).toBe(false);
  });
});

describe("engine: difficulty scaling", () => {
  it("increases traffic speed with score, capped at the maximum", () => {
    expect(trafficSpeedForScore(0)).toBeLessThan(trafficSpeedForScore(10));
    expect(trafficSpeedForScore(10)).toBeLessThan(trafficSpeedForScore(50));
    expect(trafficSpeedForScore(10_000)).toBe(MAX_TRAFFIC_SPEED);
  });
});
