# Project Guidance

## User Preferences

- Red sports car as the player vehicle
- Dark gray road background with white lane markings
- Three lanes
- Vertical top-to-bottom traffic flow
- Touch-friendly controls sized for Android phones in portrait

## Accepted Requirements

- Vertical three-lane road with dark gray background and white lane markings.
- Red sports car player vehicle at the bottom of the road.
- Traffic cars spawning at the top and moving down automatically.
- LEFT and RIGHT buttons to move the player car between lanes.
- Score displayed at the top, increasing when an enemy car is avoided.
- Collision detection that stops the game and shows GAME OVER.
- Restart button that resets score, repositions cars, and starts a new game.
- Enemy car speed gradually increasing with score.
- Engine sounds, collision sounds, and a background music option.
- Mobile support with touch controls and a responsive layout for Android phones.

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- The app is a single-screen canvas game; keep the game loop in a requestAnimationFrame hook and render the road, cars and overlays on a canvas sized to the viewport.
- Audio must stay muted until the first user interaction to respect browser autoplay rules; generate engine, collision and music sounds with the Web Audio API rather than shipping audio files.
- The game is a single-screen canvas racer: the loop lives in src/frontend/src/hooks/use-game-loop.ts with mutable simulation state in a ref, rendering in src/frontend/src/lib/game/render.ts, tuning in src/frontend/src/lib/game/constants.ts, and HUD, controls and overlay in src/frontend/src/components/game/.
- Web Audio nodes must be created lazily after a user gesture; creating the AudioContext on mount leaves it suspended under the browser autoplay policy.
- The backend exposes recordRun and listRuns plus getApiDoc, schema and execute in src/backend/main.mo; the game screen itself is fully client-side.
- The tester owns src/frontend/src/App.test.tsx, src/frontend/src/App.journeys.test.tsx, src/frontend/src/lib/game/engine.test.ts and test/pocketic/backend.test.ts; leave them alone even when a change makes them fail to compile.
