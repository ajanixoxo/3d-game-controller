# Feel Everything — a DualSense 3D showcase

An interactive, cinematic 3D study of the PS5 DualSense controller: scroll-choreographed
camera work, an exploded view, feature demos (triggers, haptics, mic, motion, touch pad),
live Gamepad API mirroring of a connected controller, and a synthesized Web Audio sound
design with phone haptics.

Built with Next.js 15, React Three Fiber 9, drei, GSAP ScrollTrigger, and Tailwind 4.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build      # stop the dev server first — both write .next/
```

## 3D model attribution & license

The controller model (`public/controller.glb`) is adapted from
["DualSense PS5" by lucasbds on CGTrader](https://www.cgtrader.com/free-3d-models/interior/house-interior/dualsense-ps5-d29a3bcb-22a6-4e51-b3c6-4bece07950b2)
(model #2940281), distributed under **CGTrader's Editorial License (no AI)**.

That license means, in short:

- **Editorial / non-commercial use only** — this project must not be used to advertise,
  sell, or promote anything, and may not be rehosted as a commercial product.
- **No AI training** — the model and its derivatives may not be used to train
  machine-learning models.
- The model remains the property of its creator; this repository includes an adapted
  runtime copy solely to make the demonstration run. It is not offered for reuse —
  obtain the asset from the CGTrader page above under its own license.

This is an independent, non-commercial web experiment. Not affiliated with or endorsed
by Sony Interactive Entertainment. "PlayStation", "PS5" and "DualSense" are trademarks
of Sony Interactive Entertainment Inc.
