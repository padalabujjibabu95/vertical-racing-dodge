import { useCallback, useEffect, useRef, useState } from "react";

export interface GameAudioApi {
  /** True once the user has interacted and audio is allowed to play. */
  unlocked: boolean;
  musicOn: boolean;
  toggleMusic: () => void;
  /** Call from any user gesture to satisfy browser autoplay rules. */
  unlock: () => void;
  setEngineActive: (active: boolean) => void;
  playCrash: () => void;
}

/**
 * Web Audio engine for the racer. All sounds are synthesized — no audio
 * files ship with the app. The AudioContext is created lazily on the first
 * user gesture so autoplay policies are respected.
 */
export function useGameAudio(): GameAudioApi {
  const ctxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<{
    osc: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  const musicRef = useRef<{
    oscs: OscillatorNode[];
    gain: GainNode;
    timer: number;
  } | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [musicOn, setMusicOn] = useState(true);

  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const unlock = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    setUnlocked(true);
  }, [ensureContext]);

  const setEngineActive = useCallback(
    (active: boolean) => {
      const ctx = ctxRef.current;
      if (!ctx || !unlocked) return;

      if (active && !engineRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = 68;
        gain.gain.value = 0.0;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.4);
        engineRef.current = { osc, gain };
      } else if (!active && engineRef.current) {
        const { osc, gain } = engineRef.current;
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.stop(ctx.currentTime + 0.3);
        engineRef.current = null;
      }
    },
    [unlocked],
  );

  const playCrash = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !unlocked) return;
    const now = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(now);

    // Low thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }, [unlocked]);

  const stopMusic = useCallback(() => {
    const ctx = ctxRef.current;
    const music = musicRef.current;
    if (!ctx || !music) return;
    window.clearInterval(music.timer);
    music.gain.gain.cancelScheduledValues(ctx.currentTime);
    music.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    for (const osc of music.oscs) osc.stop(ctx.currentTime + 0.35);
    musicRef.current = null;
  }, []);

  const startMusic = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !unlocked || musicRef.current) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.0;
    gain.connect(ctx.destination);
    gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.6);

    const oscs: OscillatorNode[] = [];
    const makeOsc = (freq: number, type: OscillatorType) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start();
      oscs.push(osc);
      return osc;
    };
    const bass = makeOsc(55, "triangle");
    const lead = makeOsc(220, "square");

    // Simple arpeggio loop for a driving arcade feel.
    const notes = [220, 277.18, 329.63, 277.18, 246.94, 329.63, 392, 329.63];
    let i = 0;
    const timer = window.setInterval(() => {
      const now = ctx.currentTime;
      lead.frequency.setValueAtTime(notes[i % notes.length], now);
      bass.frequency.setValueAtTime(i % 2 === 0 ? 55 : 73.42, now);
      i += 1;
    }, 260);

    musicRef.current = { oscs, gain, timer };
  }, [unlocked]);

  const toggleMusic = useCallback(() => {
    unlock();
    setMusicOn((prev) => {
      const next = !prev;
      if (next) startMusic();
      else stopMusic();
      return next;
    });
  }, [startMusic, stopMusic, unlock]);

  // Keep music in sync with the toggle once audio is unlocked.
  useEffect(() => {
    if (!unlocked) return;
    if (musicOn) startMusic();
    else stopMusic();
  }, [unlocked, musicOn, startMusic, stopMusic]);

  useEffect(() => {
    return () => {
      stopMusic();
      const engine = engineRef.current;
      const ctx = ctxRef.current;
      if (engine && ctx) {
        engine.osc.stop();
        engineRef.current = null;
      }
      void ctx?.close();
    };
  }, [stopMusic]);

  return { unlocked, musicOn, toggleMusic, unlock, setEngineActive, playCrash };
}
