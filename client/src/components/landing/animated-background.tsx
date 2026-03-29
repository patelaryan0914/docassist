"use client"

export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.42_0.2_277/0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_0%,oklch(0.55_0.2_277/0.12),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(1 0 0 / 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(1 0 0 / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
        }}
      />
      <div className="docassist-float absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="docassist-float-delayed absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-chart-2/20 blur-3xl" />
    </div>
  )
}
