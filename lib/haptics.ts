// Honest haptics: try the connected controller's rumble, then the device
// vibration motor, and always run the visual fallback. Reports which channel
// actually fired so the UI never overclaims.

import { currentPad, pollGamepad } from "./gamepad";
import { store } from "./store";

export type HapticChannel = "controller" | "device" | "visual";

interface ActuatorLike {
  playEffect?: (
    type: string,
    params: { startDelay: number; duration: number; weakMagnitude: number; strongMagnitude: number },
  ) => Promise<string>;
}

function actuator(): ActuatorLike | null {
  const pad = currentPad() as (Gamepad & { vibrationActuator?: ActuatorLike }) | null;
  return pad?.vibrationActuator ?? null;
}

export function hapticSupport() {
  pollGamepad();
  return {
    controllerRumble: !!actuator()?.playEffect,
    deviceVibrate: typeof navigator !== "undefined" && "vibrate" in navigator,
  };
}

/** Must be called from a user gesture. Returns the strongest channel that fired. */
export function playRumble(duration = 420, strong = 0.9, weak = 0.6): HapticChannel {
  // Always shake the 3D model so every visitor sees the effect.
  store.shakeUntil = performance.now() + duration;

  const act = actuator();
  if (act?.playEffect) {
    act.playEffect("dual-rumble", { startDelay: 0, duration, weakMagnitude: weak, strongMagnitude: strong }).catch(() => {});
    return "controller";
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      if (navigator.vibrate([80, 40, 140, 40, 80])) return "device";
    } catch {
      /* fall through to visual */
    }
  }
  return "visual";
}
