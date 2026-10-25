// Web Audio synthesized DualSense sound set — no assets, pure client-side
// synthesis, same recipes as the reference site. Everything is gated on the
// user enabling sound via the navbar toggle (which also provides the user
// gesture browsers require before audio can start).

let ctx: AudioContext | null = null;
// On by default; browsers still keep the context suspended until the first
// real user gesture, so unlockAudio() is called from a one-time listener.
// Until then play calls are silently dropped (never queued — a queue would
// burst out all at once on unlock).
let enabled = true;

function ready(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  return ctx.state === "running" ? ctx : null;
}

/** Resume the context from a user gesture (pointerdown/keydown). */
export function unlockAudio() {
  if (!enabled) return;
  ctx ??= new AudioContext();
  void ctx.resume();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on) {
    unlockAudio();
    playClick(1000, 0.03); // unmute confirmation
  } else {
    void ctx?.suspend();
  }
}

/** Phone haptics: real vibration where the device supports it (Android
    browsers; iOS Safari has no vibration API). Shares the sound toggle. */
function buzz(ms: number) {
  if (!enabled || typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(ms);
}

/** Crisp mechanical tactile click — like a DualSense d-pad or face button.
    Triangle wave snapping from `freq` down to 120 Hz. */
export function playClick(freq = 900, duration = 0.03) {
  buzz(8);
  const ctx = ready();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + duration);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(t + duration);
}

/** Soft futuristic rising glide — camera transitions and view resets.
    Sine 220 → 550 Hz over 0.18 s, quiet (0.04) with a 0.22 s tail. */
export function playWhoosh() {
  const ctx = ready();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(550, t + 0.18);
  gain.gain.setValueAtTime(0.04, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(t + 0.22);
}

/** Stepped gear-tension click (400–1200 Hz) — adaptive-trigger / exploded-view ratchet. */
export function playTriggerRatchet(step = 1) {
  playClick(400 + step * 80, 0.02);
}

/** Low sub-bass voice-coil thud — the haptic pulse. Sine `freq` → 35 Hz. */
export function playHapticThud(freq = 65, duration = 0.15, strength = 0.2) {
  buzz(Math.min(80, Math.round(duration * 200)));
  const ctx = ready();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.linearRampToValueAtTime(35, t + duration);
  gain.gain.setValueAtTime(strength, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(t + duration);
}
