import {
  Package,
  FileText,
  Activity,
  QrCode,
  Leaf,
  RefreshCw,
  FolderOpen,
  Code2,
} from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Material Registry",
    description:
      "Centralized database for all building materials with standardized properties, specifications, and metadata.",
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: FileText,
    title: "Digital Material Passports",
    description:
      "Generate structured, interoperable digital passports for every material used in a project.",
    accent: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: Activity,
    title: "Lifecycle Tracking",
    description:
      "Monitor materials from manufacturing through installation, use, and end-of-life stages.",
    accent: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: QrCode,
    title: "QR Code Integration",
    description:
      "Generate and link QR codes to physical materials for instant on-site verification and updates.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: Leaf,
    title: "Sustainability Metrics",
    description:
      "Track embodied carbon, carbon footprint, and environmental certifications per material.",
    accent: "bg-accent/10 text-accent",
  },
  {
    icon: RefreshCw,
    title: "Circularity Insights",
    description:
      "Measure recyclability, reuse potential, and circular economy scores across your projects.",
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Attach technical data sheets, certifications, warranties, and maintenance records.",
    accent: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Code2,
    title: "Open APIs",
    description:
      "REST and GraphQL APIs to integrate with BIM tools, ERP systems, and sustainability platforms.",
    accent: "bg-rose-500/10 text-rose-600",
  },
];

export default function Solution() {
  return (
    <section className="py-24 lg:py-32 bg-background" id="solution">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-primary">
              The Solution
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight mb-5">
            Everything you need for
            <br />
            material intelligence
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            Material Passport provides an open, extensible platform that brings
            all material data together — ready for the circular economy.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-secondary/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${feature.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-secondary mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
