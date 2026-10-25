"use client";

export function Outro() {
  const replay = () => {
    document.querySelector("[data-s-explore]")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section data-s-outro className="relative flex min-h-[120vh] flex-col justify-end">
      <div className="relative flex min-h-screen flex-col items-center justify-center text-center [text-shadow:0_2px_30px_rgba(5,7,12,0.9),0_0_60px_rgba(5,7,12,0.7)]">
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[34rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(5,7,12,0.55),transparent)]"
        />
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent">DualSense</p>
        <h2 className="mt-3 max-w-2xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Built to be felt.
        </h2>
        <p className="mt-4 max-w-md text-pretty text-sm text-muted sm:text-base">
          Some of it you&apos;ve just seen. The rest — the tension, the texture,
          the pulse — is waiting in your hands.
        </p>
        <button
          type="button"
          onClick={replay}
          className="pointer-events-auto mt-8 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/85"
        >
          Explore it again
        </button>
      </div>
      <footer className="pointer-events-auto mx-auto w-full max-w-4xl px-4 pb-8 text-center">
        <p className="text-[11px] leading-relaxed text-muted/80">
          An independent, non-commercial 3D web experiment. Not affiliated with
          or endorsed by Sony Interactive Entertainment. &ldquo;PlayStation&rdquo;,
          &ldquo;PS5&rdquo; and &ldquo;DualSense&rdquo; are trademarks of Sony
          Interactive Entertainment Inc. 3D model adapted from a community-made
          asset for this demonstration.
        </p>
      </footer>
    </section>
  );
}
