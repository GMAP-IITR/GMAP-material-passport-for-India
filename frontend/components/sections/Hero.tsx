import { ArrowRight, BookOpen, Star, GitFork, Package } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background pt-16">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(to right, #0F172A 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Gradient blobs */}
      <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-medium text-primary">
                Open Source · v0.1 Alpha
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-secondary leading-[1.05]">
                Material
                <br />
                <span className="text-primary">Passport</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted max-w-lg leading-relaxed">
                An open-source platform for creating, managing, and tracking
                digital material passports for circular economy and sustainable
                construction.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-semibold rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20"
              >
                <GithubIcon />
                View on GitHub
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary text-sm font-semibold rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Read Documentation
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-medium">Open Source</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <GitFork className="w-4 h-4 text-primary" />
                <span className="font-medium">MIT License</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Package className="w-4 h-4 text-accent" />
                <span className="font-medium">Free Forever</span>
              </div>
            </div>
          </div>

          {/* Right — passport card visual */}
          <div className="hidden lg:block">
            <PassportVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function PassportVisual() {
  return (
    <div className="relative">
      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-secondary/10 border border-border p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white text-xs font-bold">MP</span>
            </div>
            <div>
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Digital Material Passport
              </div>
              <div className="text-sm font-bold text-secondary">
                #MP-2024-00147
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-accent">Active</span>
          </div>
        </div>

        {/* Material details */}
        <div className="bg-background rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <div>
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Material
              </div>
              <div className="text-sm font-bold text-secondary mt-0.5">
                Structural Steel S355
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Quantity
              </div>
              <div className="text-sm font-bold text-secondary mt-0.5">
                2,450 kg
              </div>
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Origin
              </div>
              <div className="text-sm font-bold text-secondary mt-0.5">
                Germany, 2024
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Embodied Carbon
              </div>
              <div className="text-sm font-bold text-accent mt-0.5">
                1.8 kg CO₂/kg
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle bar */}
        <div>
          <div className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-2.5">
            Lifecycle Stage
          </div>
          <div className="flex items-center gap-1">
            {[
              { label: "Mfg", active: true },
              { label: "Install", active: true },
              { label: "Use", active: false, current: true },
              { label: "Reuse", active: false },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    stage.active
                      ? "bg-primary text-white"
                      : stage.current
                      ? "bg-primary/25 text-primary border border-primary/40"
                      : "bg-background text-muted border border-border"
                  }`}
                >
                  {stage.label}
                </div>
                {i < 3 && (
                  <div
                    className={`w-1.5 h-px flex-shrink-0 ${
                      stage.active ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Recyclability", value: "94%", color: "text-accent" },
            { label: "Reuse Score", value: "8.2", color: "text-primary" },
            { label: "Documents", value: "12", color: "text-secondary" },
          ].map((m) => (
            <div
              key={m.label}
              className="bg-background rounded-xl p-3 text-center"
            >
              <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
              <div className="text-[10px] text-muted font-medium mt-0.5">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* QR row */}
        <div className="flex items-center gap-4 pt-1 border-t border-border">
          <QrPlaceholder />
          <div>
            <div className="text-xs font-bold text-secondary">
              QR Code Linked
            </div>
            <div className="text-[10px] text-muted">Scan to verify on-site</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] text-accent font-semibold">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-5 -right-6 bg-white rounded-xl shadow-lg shadow-secondary/10 border border-border p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-accent/15 rounded-lg flex items-center justify-center text-lg">
          ♻
        </div>
        <div>
          <div className="text-xs font-bold text-secondary">94% Recyclable</div>
          <div className="text-[10px] text-muted">Circular Economy Ready</div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-6 bg-white rounded-xl shadow-lg shadow-secondary/10 border border-border p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center">
          <span className="text-primary font-bold text-[10px]">BIM</span>
        </div>
        <div>
          <div className="text-xs font-bold text-secondary">BIM Integrated</div>
          <div className="text-[10px] text-muted">IFC Compatible</div>
        </div>
      </div>
    </div>
  );
}

function QrPlaceholder() {
  const pattern = [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0];
  return (
    <div className="w-11 h-11 bg-secondary rounded-lg p-1.5 grid grid-cols-4 gap-px flex-shrink-0">
      {pattern.map((cell, i) => (
        <div
          key={i}
          className={`rounded-[1px] ${cell ? "bg-white" : "bg-secondary"}`}
        />
      ))}
    </div>
  );
}

function GithubIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
