# Design Brief

## Direction

Midnight Asphalt — a dark arcade racing system where a crimson sports car threads three lanes of oncoming traffic under high-contrast night-road lighting.

## Tone

Industrial arcade — near-black asphalt, motorsport telemetry typography, and one hot crimson accent executed with conviction; gameplay clarity over decoration.

## Differentiation

The HUD reads like a car's instrument cluster: monospace score digits in amber, glass panels floating over a scrolling road, and chunky thumb controls that feel like physical switches.

## Color Palette

| Token      | OKLCH        | Role                                    |
| ---------- | ------------ | --------------------------------------- |
| background | 0.16 0.012 265 | Near-black asphalt page base          |
| foreground | 0.96 0.006 265 | Primary text and lane markings        |
| card       | 0.21 0.014 265 | HUD panels, overlays, control surfaces |
| primary    | 0.58 0.23 25   | Crimson player car and primary actions |
| accent     | 0.8 0.16 78    | Amber score digits and highlights      |
| muted      | 0.26 0.014 265 | Inactive controls, secondary text      |
| destructive| 0.6 0.24 22    | GAME OVER state and collision feedback |
| success    | 0.72 0.16 165  | Music/sound toggle active state        |
| border     | 0.32 0.016 265 | Panel and control edges                |

## Typography

- Display: Space Grotesk — game title, GAME OVER, button labels; tight tracking, uppercase.
- Body: DM Sans — supporting labels, help text, instructions.
- Mono: JetBrains Mono — score digits and telemetry readouts (tabular, high legibility).
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, score `text-3xl font-mono tabular-nums`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm`.

## Elevation & Depth

Layered dark surfaces — road at `road-surface`, HUD panels on translucent `card` with `shadow-hud`, controls on `muted` with `shadow-control` for a pressable, physical feel; no glow effects.

## Structural Zones

| Zone          | Background                     | Border                | Notes                                             |
| ------------- | ------------------------------ | --------------------- | ------------------------------------------------- |
| Top HUD       | translucent card + shadow-hud  | border-border         | Score left, music toggle right, safe-area inset   |
| Road (canvas) | road-surface with lane markings| road-edge side rails  | Full-bleed vertical three-lane play area          |
| Bottom controls | transparent over road        | —                     | LEFT/RIGHT thumb buttons, safe-area inset         |
| GAME OVER overlay | card/95 backdrop-blur      | border-border         | Centered final score + restart action             |

## Spacing & Rhythm

Mobile-first with safe-area insets; HUD padding `px-4 py-3`, controls pinned to bottom with `gap-4` and `p-4`, overlay content centered with `gap-6`; canvas fills all remaining space with no page scroll.

## Component Patterns

- Buttons: LEFT/RIGHT are large rounded-2xl `muted`/`secondary` surfaces with `shadow-control`, active state darkens and depresses 2px; primary restart uses `bg-gradient-primary` crimson.
- Cards: HUD panels are rounded-xl translucent `card` with `border-border` and `shadow-hud`.
- Badges: score chip is monospace amber on translucent card, uppercase label above digits.

## Motion

- Entrance: GAME OVER overlay fades and scales in via `animate-overlay-in` (280ms).
- Hover: controls use `transition-smooth` with a 2px translate press.
- Decorative: `animate-pulse-score` on score increment, `animate-shake` on collision impact.

## Constraints

- Canvas/Web Audio may use literal colors; all DOM UI must use semantic tokens only.
- No page scrolling during play; respect `100dvh` and safe-area insets.
- Muted by default until first user interaction (browser autoplay policy).
- High contrast for gameplay: cars and lane markings must stay readable on dark asphalt.

## Signature Detail

The score renders as an amber monospace odometer that pulses on every dodge, turning the HUD into a live instrument cluster — the interface's unforgettable signature.
