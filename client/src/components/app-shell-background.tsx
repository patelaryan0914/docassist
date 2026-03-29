export function AppShellBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.42_0.2_277/0.22),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_35%_at_100%_0%,oklch(0.55_0.2_277/0.08),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.28] dark:opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(1 0 0 / 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(1 0 0 / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 75% 65% at 50% 45%, black 15%, transparent 72%)",
        }}
      />
    </div>
  )
}
