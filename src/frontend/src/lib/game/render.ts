import {
  LANE_COUNT,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  PLAYER_Y,
  TRAFFIC_HEIGHT,
  TRAFFIC_WIDTH,
  laneCenterX,
} from "./constants";
import type { GameState } from "./engine";

const ROAD_SURFACE = "#1c1f26";
const ROAD_EDGE = "#2b303b";
const LANE_MARKING = "#e8eaee";
const SHOULDER = "#14161b";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Draw a top-down car body with windshield, roof and lights. */
function drawCar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  w: number,
  h: number,
  body: string,
  isPlayer: boolean,
): void {
  const x = cx - w / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = w * 0.28;
  ctx.shadowOffsetY = h * 0.06;

  // Body
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, body);
  grad.addColorStop(0.5, isPlayer ? "#e23b3b" : body);
  grad.addColorStop(1, body);
  ctx.fillStyle = grad;
  roundRect(ctx, x, top, w, h, w * 0.22);
  ctx.fill();
  ctx.restore();

  // Roof / cabin
  ctx.fillStyle = "rgba(12,14,18,0.85)";
  roundRect(ctx, x + w * 0.16, top + h * 0.24, w * 0.68, h * 0.4, w * 0.12);
  ctx.fill();

  // Windshield (front, toward top of screen)
  ctx.fillStyle = "rgba(150,180,210,0.35)";
  roundRect(ctx, x + w * 0.2, top + h * 0.12, w * 0.6, h * 0.14, w * 0.08);
  ctx.fill();

  // Rear window
  ctx.fillStyle = "rgba(120,150,180,0.28)";
  roundRect(ctx, x + w * 0.22, top + h * 0.68, w * 0.56, h * 0.12, w * 0.07);
  ctx.fill();

  // Headlights (front)
  ctx.fillStyle = isPlayer ? "#fff6d8" : "#f2f4f8";
  roundRect(ctx, x + w * 0.12, top + h * 0.03, w * 0.2, h * 0.05, w * 0.03);
  ctx.fill();
  roundRect(ctx, x + w * 0.68, top + h * 0.03, w * 0.2, h * 0.05, w * 0.03);
  ctx.fill();

  // Tail lights (rear)
  ctx.fillStyle = isPlayer ? "#ff5a4d" : "#c94a3f";
  roundRect(ctx, x + w * 0.1, top + h * 0.92, w * 0.22, h * 0.05, w * 0.03);
  ctx.fill();
  roundRect(ctx, x + w * 0.68, top + h * 0.92, w * 0.22, h * 0.05, w * 0.03);
  ctx.fill();

  if (isPlayer) {
    // Racing stripe
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    roundRect(ctx, cx - w * 0.03, top + h * 0.06, w * 0.06, h * 0.88, w * 0.02);
    ctx.fill();
  }
}

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);

  // Shoulders
  ctx.fillStyle = SHOULDER;
  ctx.fillRect(0, 0, width, height);

  // Road surface
  const roadInset = width * 0.04;
  const roadX = roadInset;
  const roadW = width - roadInset * 2;
  ctx.fillStyle = ROAD_SURFACE;
  ctx.fillRect(roadX, 0, roadW, height);

  // Road edges
  ctx.fillStyle = ROAD_EDGE;
  ctx.fillRect(roadX, 0, Math.max(2, width * 0.006), height);
  ctx.fillRect(
    roadX + roadW - Math.max(2, width * 0.006),
    0,
    Math.max(2, width * 0.006),
    height,
  );

  // Dashed lane markings
  const dashH = height * 0.075;
  const gapH = height * 0.06;
  const period = dashH + gapH;
  const offset = state.roadOffset * period;
  ctx.fillStyle = LANE_MARKING;
  const markingW = Math.max(3, width * 0.012);
  for (let lane = 1; lane < LANE_COUNT; lane += 1) {
    const x = roadX + (roadW * lane) / LANE_COUNT - markingW / 2;
    for (let y = -period + offset; y < height; y += period) {
      ctx.fillRect(x, y, markingW, dashH);
    }
  }

  // Traffic cars
  for (const car of state.traffic) {
    drawCar(
      ctx,
      roadX + roadW * laneCenterX(car.lane),
      car.y * height,
      roadW * TRAFFIC_WIDTH,
      height * TRAFFIC_HEIGHT,
      car.color,
      false,
    );
  }

  // Player car
  drawCar(
    ctx,
    roadX + roadW * laneCenterX(state.playerLane),
    PLAYER_Y * height,
    roadW * PLAYER_WIDTH,
    height * PLAYER_HEIGHT,
    "#c81f2b",
    true,
  );
}
