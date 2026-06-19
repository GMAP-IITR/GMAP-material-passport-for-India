import {
  AlertTriangle,
  Database,
  FileX,
  BarChart3,
  RefreshCcw,
  FileWarning,
} from "lucide-react";

const challenges = [
  {
    icon: Database,
    title: "Fragmented Material Data",
    description:
      "Material information is scattered across spreadsheets, PDFs, BIM models, and proprietary systems with no unified source of truth.",
  },
  {
    icon: FileX,
    title: "Poor Traceability",
    description:
      "Tracking materials across their entire lifecycle — from manufacturing to demolition — is nearly impossible without dedicated tooling.",
  },
  {
    icon: BarChart3,
    title: "Difficult Sustainability Reporting",
    description:
      "Compiling accurate carbon footprint and embodied energy data requires manual effort across disconnected data sources.",
  },
  {
    icon: RefreshCcw,
    title: "Limited Reuse Visibility",
    description:
      "Without digital records, high-quality materials are unnecessarily demolished and sent to landfill instead of being reused or recycled.",
  },
  {
    icon: FileWarning,
    title: "No Standardized Records",
    description:
      "There are no widely adopted digital standards for material documentation, making interoperability between tools and projects impossible.",
  },
];

export default function Problem() {
  return (
    <section className="py-24 lg:py-32 bg-secondary" id="problem">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-medium text-white/80">
              The Problem
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-5">
            Current Industry Challenges
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            The construction industry generates over 40% of global waste.
            Solving this requires better material data — but the infrastructure
            to manage it doesn&apos;t yet exist.
          </p>
        </div>

        {/* Challenge cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((challenge, index) => {
            const Icon = challenge.icon;
            return (
              <div
                key={index}
                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <Icon className="w-5 h-5 text-white/55 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {challenge.title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">
                  {challenge.description}
                </p>
              </div>
            );
          })}

          {/* Stat card — spans 1 col to fill the 6-slot grid */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="text-5xl font-bold text-white mb-3">40%</div>
            <p className="text-sm text-white/45 leading-relaxed">
              of global CO₂ emissions come from the building sector. Transparent
              material data is the first step to meaningful reduction.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
