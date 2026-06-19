import { ClipboardList, FileCheck, BarChart3, Recycle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Material Registration",
    description:
      "Register materials with comprehensive specifications — type, manufacturer, weight, dimensions, certifications, and embedded carbon data.",
    details: [
      "Standardized data schema",
      "BIM model integration",
      "Manufacturer data import",
    ],
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Passport Generation",
    description:
      "Automatically generate structured digital passports following open standards, ready for sharing with stakeholders and regulators.",
    details: ["Open standard formats", "QR code generation", "PDF export"],
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Lifecycle Tracking",
    description:
      "Track materials through every phase — from manufacturing to installation, maintenance, and eventual end-of-life decisions.",
    details: [
      "Stage-by-stage updates",
      "Photo documentation",
      "Condition reporting",
    ],
  },
  {
    number: "04",
    icon: Recycle,
    title: "Reuse & Recycling",
    description:
      "When materials reach end-of-use, their passport data enables informed reuse, repurposing, or recycling decisions.",
    details: [
      "Circularity scoring",
      "Marketplace listings",
      "Waste reduction reports",
    ],
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-card" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-primary">
              How It Works
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight mb-5">
            A passport for every material
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            Four steps to transform how your organization tracks, manages, and
            reports on building materials across their full lifecycle.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Arrow connector on large screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-8 left-full w-8 items-center justify-center z-10 -translate-x-4">
                    <svg
                      className="w-4 h-4 text-border"
                      fill="none"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Icon + number */}
                  <div className="flex items-end gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-5xl font-black text-border leading-none select-none pb-1">
                      {step.number}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-secondary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-center gap-2 text-xs text-muted"
                        >
                          <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
