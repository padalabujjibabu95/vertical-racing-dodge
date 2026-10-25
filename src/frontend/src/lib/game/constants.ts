/**
 * Shared tuning constants for the vertical lane-racer.
 * All geometry is expressed in normalized units (0..1) relative to the
 * playfield so the simulation is resolution independent; the renderer
 * multiplies by the live canvas size.
 */

export const LANE_COUNT = 3;

/** Player car footprint, normalized to playfield width/height. */
export const PLAYER_WIDTH = 0.2;
export const PLAYER_HEIGHT = 0.16;

/** Traffic car footprint, normalized to playfield width/height. */
export const TRAFFIC_WIDTH = 0.2;
export const TRAFFIC_HEIGHT = 0.16;

/** Vertical position of the player's top edge (bottom lane area). */
export const PLAYER_Y = 0.78;

/** Base downward speed of traffic, in playfield-heights per second. */
export const BASE_TRAFFIC_SPEED = 0.34;

/** Additional speed gained per avoided car, capped for playability. */
export const SPEED_PER_SCORE = 0.006;
export const MAX_TRAFFIC_SPEED = 0.92;

/** Seconds between spawns at score 0, tightening as the score rises. */
export const BASE_SPAWN_INTERVAL = 1.15;
export const MIN_SPAWN_INTERVAL = 0.52;
export const SPAWN_INTERVAL_PER_SCORE = 0.012;

/** Lane change animation duration in seconds. */
export const LANE_CHANGE_DURATION = 0.14;

/** Collision forgiveness: shrink hitboxes slightly so near-misses feel fair. */
export const HITBOX_PADDING = 0.018;

/** Traffic car body colors (distinct from the crimson player car). */
export const TRAFFIC_COLORS = [
  "#3f4a63",
  "#2f6f6b",
  "#5a4a6e",
  "#6b5a3f",
  "#4a5a4a",
  "#5c3f4a",
] as const;

export function laneCenterX(lane: number): number {
  return (lane + 0.5) / LANE_COUNT;
}

export function trafficSpeedForScore(score: number): number {
  return Math.min(
    MAX_TRAFFIC_SPEED,
    BASE_TRAFFIC_SPEED + score * SPEED_PER_SCORE,
  );
}

export function spawnIntervalForScore(score: number): number {
  return Math.max(
    MIN_SPAWN_INTERVAL,
    BASE_SPAWN_INTERVAL - score * SPAWN_INTERVAL_PER_SCORE,
  );
}
