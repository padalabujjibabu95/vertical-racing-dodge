import {
  HITBOX_PADDING,
  LANE_CHANGE_DURATION,
  LANE_COUNT,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_Y,
  TRAFFIC_COLORS,
  TRAFFIC_HEIGHT,
  TRAFFIC_WIDTH,
  laneCenterX,
  spawnIntervalForScore,
  trafficSpeedForScore,
} from "./constants";

export interface TrafficCar {
  id: number;
  lane: number;
  /** Top edge, normalized 0..1. */
  y: number;
  color: string;
  scored: boolean;
}

export interface GameState {
  status: "ready" | "playing" | "over";
  score: number;
  /** Continuous lane position of the player (0..LANE_COUNT-1). */
  playerLane: number;
  /** Target lane the player is easing toward. */
  targetLane: number;
  traffic: TrafficCar[];
  /** Seconds accumulated since the last spawn. */
  spawnTimer: number;
  /** Scroll offset for lane markings, normalized 0..1. */
  roadOffset: number;
  /** Set for one frame when a collision happens. */
  crashed: boolean;
}

export function createInitialState(): GameState {
  return {
    status: "ready",
    score: 0,
    playerLane: 1,
    targetLane: 1,
    traffic: [],
    spawnTimer: 0,
    roadOffset: 0,
    crashed: false,
  };
}

let nextId = 1;

function pickLane(occupied: Set<number>): number {
  const free: number[] = [];
  for (let lane = 0; lane < LANE_COUNT; lane += 1) {
    if (!occupied.has(lane)) free.push(lane);
  }
  const pool = free.length > 0 ? free : [0, 1, 2];
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnTraffic(state: GameState): void {
  // Never spawn a car in the player's current lane while another car is
  // still near the top, so the road always has an escape route.
  const occupied = new Set<number>();
  for (const car of state.traffic) {
    if (car.y < TRAFFIC_HEIGHT * 2.4) occupied.add(car.lane);
  }
  const playerLane = Math.round(state.playerLane);
  if (occupied.size >= LANE_COUNT - 1) {
    occupied.delete(playerLane);
  }
  const lane = pickLane(occupied);
  state.traffic.push({
    id: nextId,
    lane,
    y: -TRAFFIC_HEIGHT,
    color: TRAFFIC_COLORS[nextId % TRAFFIC_COLORS.length],
    scored: false,
  });
  nextId += 1;
}

function overlaps(a: TrafficCar, playerLane: number): boolean {
  const playerLeft =
    laneCenterX(playerLane) - PLAYER_WIDTH / 2 + HITBOX_PADDING;
  const playerRight =
    laneCenterX(playerLane) + PLAYER_WIDTH / 2 - HITBOX_PADDING;
  const playerTop = PLAYER_Y + HITBOX_PADDING;
  const playerBottom = PLAYER_Y + PLAYER_HEIGHT - HITBOX_PADDING;

  const carLeft = laneCenterX(a.lane) - TRAFFIC_WIDTH / 2 + HITBOX_PADDING;
  const carRight = laneCenterX(a.lane) + TRAFFIC_WIDTH / 2 - HITBOX_PADDING;
  const carTop = a.y + HITBOX_PADDING;
  const carBottom = a.y + TRAFFIC_HEIGHT - HITBOX_PADDING;

  return (
    playerLeft < carRight &&
    playerRight > carLeft &&
    playerTop < carBottom &&
    playerBottom > carTop
  );
}

/**
 * Advance the simulation by `dt` seconds. Pure with respect to React: it
 * mutates the passed state object and returns it, so the render loop can
 * keep a single mutable reference without triggering re-renders.
 */
export function step(state: GameState, dt: number): GameState {
  state.crashed = false;
  if (state.status !== "playing") return state;

  const speed = trafficSpeedForScore(state.score);

  // Ease the player toward the target lane.
  const diff = state.targetLane - state.playerLane;
  if (Math.abs(diff) < 0.001) {
    state.playerLane = state.targetLane;
  } else {
    const stepAmount = dt / LANE_CHANGE_DURATION;
    state.playerLane += Math.sign(diff) * Math.min(Math.abs(diff), stepAmount);
  }

  // Scroll the road markings.
  state.roadOffset = (state.roadOffset + speed * dt) % 1;

  // Move traffic and score avoided cars.
  for (const car of state.traffic) {
    car.y += speed * dt;
    if (!car.scored && car.y > PLAYER_Y + PLAYER_HEIGHT) {
      car.scored = true;
      state.score += 1;
    }
  }
  state.traffic = state.traffic.filter((car) => car.y < 1.05);

  // Collision check.
  for (const car of state.traffic) {
    if (overlaps(car, state.playerLane)) {
      state.status = "over";
      state.crashed = true;
      return state;
    }
  }

  // Spawn cadence.
  state.spawnTimer += dt;
  const interval = spawnIntervalForScore(state.score);
  if (state.spawnTimer >= interval) {
    state.spawnTimer = 0;
    spawnTraffic(state);
  }

  return state;
}

export function movePlayer(state: GameState, direction: -1 | 1): void {
  if (state.status !== "playing") return;
  const next = Math.min(
    LANE_COUNT - 1,
    Math.max(0, Math.round(state.targetLane) + direction),
  );
  state.targetLane = next;
}

export function startGame(state: GameState): void {
  state.status = "playing";
  state.score = 0;
  state.playerLane = 1;
  state.targetLane = 1;
  state.traffic = [];
  state.spawnTimer = 0;
  state.roadOffset = 0;
  state.crashed = false;
}
