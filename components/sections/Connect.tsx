"use client";

import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { pollGamepad, type GamepadStatus } from "@/lib/gamepad";
import { CONTROL_IDS, type ControlId } from "@/lib/parts";

const LABELS: Record<ControlId, string> = {
  north: "△", east: "○", south: "✕", west: "□",
  up: "↑", down: "↓", left: "←", right: "→",
  lb: "L1", rb: "R1", lt: "L2", rt: "R2",
  create: "Create", options: "Options", home: "PS", pad: "Pad",
  l3: "L3", r3: "R3",
};

const STATUS_COPY: Record<Exclude<GamepadStatus, "connected">, [string, string]> = {
  none: ["No controller detected", "Connect one by USB or Bluetooth, then press any button on it — browsers keep controllers invisible until you do."],
  unsupported: ["Controller input isn't available", "This browser doesn't support the Gamepad API. Everything on the page still works with mouse, touch and keyboard."],
  blocked: ["This view can't read controllers", "Some embedded views block controller access. Open this page in a full browser tab."],
};

interface LiveState {
  status: GamepadStatus;
  id: string;
  buttons: Partial<Record<ControlId, number>>;
  sticks: { lx: number; ly: number; rx: number; ry: number };
}

const fmt = (v: number) => {
  const s = v.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
};

export function Connect() {
  const [live, setLive] = useState<LiveState>({
    status: "none", id: "", buttons: {}, sticks: { lx: 0, ly: 0, rx: 0, ry: 0 },
  });

  useEffect(() => {
    const tick = () => {
      const s = pollGamepad();
      setLive({ status: s.status, id: s.id, buttons: { ...s.buttons }, sticks: { ...s.sticks } });
    };
    tick();
    const iv = setInterval(tick, 100);
    return () => clearInterval(iv);
  }, []);

  const connected = live.status === "connected";

  return (
    <section data-s-connect className="relative min-h-[130vh]">
      <div className="sticky top-0 flex min-h-screen items-end py-6 sm:items-center">
        <div className="stage-fade" aria-hidden />
        <div className="copy-block pointer-events-auto w-full max-w-md px-6 pb-8 sm:ml-[7vw] sm:px-0 sm:pb-0">
          <div>
            <p className="eyebrow">Connect &amp; interact</p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bring your own controller
            </h2>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Gamepad2 className={`mt-0.5 h-5 w-5 shrink-0 ${connected ? "text-accent" : "text-muted"}`} aria-hidden />
              <div aria-live="polite">
                <p className="text-sm font-bold">
                  {connected ? "Controller connected" : STATUS_COPY[live.status as Exclude<GamepadStatus, "connected">][0]}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {connected
                    ? live.id.length > 70 ? `${live.id.slice(0, 70)}…` : live.id
                    : STATUS_COPY[live.status as Exclude<GamepadStatus, "connected">][1]}
                </p>
              </div>
            </div>

            {connected && (
              <>
                <p className="mt-4 text-xs text-muted">
                  Every press is mirrored live on the 3D model.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CONTROL_IDS.map((id) => (
                    <span
                      key={id}
                      className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                        (live.buttons[id] ?? 0) > 0.5
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-white/10 text-muted"
                      }`}
                    >
                      {LABELS[id]}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[11px] text-muted">
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="mb-1 font-sans text-xs font-bold text-ink">Left stick</p>
                    <p>x {fmt(live.sticks.lx)}</p>
                    <p>y {fmt(live.sticks.ly)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 p-3">
                    <p className="mb-1 font-sans text-xs font-bold text-ink">Right stick</p>
                    <p>x {fmt(live.sticks.rx)}</p>
                    <p>y {fmt(live.sticks.ry)}</p>
                  </div>
                  <div className="col-span-2 space-y-2 rounded-xl border border-white/10 p-3">
                    {(["lt", "rt"] as const).map((id) => (
                      <div key={id} className="flex items-center gap-2">
                        <span className="w-6">{LABELS[id]}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${Math.round((live.buttons[id] ?? 0) * 100)}%` }}
                          />
                        </div>
                        <span className="w-9 text-right">{Math.round((live.buttons[id] ?? 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
