import { CheckCircle2, Clock, Circle } from "lucide-react";

type Status = "completed" | "in-progress" | "upcoming";

const phases: {
  phase: string;
  title: string;
  description: string;
  status: Status;
  items: string[];
}[] = [
  {
    phase: "Phase 1",
    title: "Landing Page",
    description:
      "Project website explaining the vision, features, and roadmap. Open for community feedback and early contributors.",
    status: "completed",
    items: [
      "Project website",
      "Vision documentation",
      "Contribution guidelines",
    ],
  },
  {
    phase: "Phase 2",
    title: "Material Registry",
    description:
      "Core database for registering and managing materials with structured schemas and full-text search.",
    status: "in-progress",
    items: ["Material schema design", "Registry API", "Search & filter UI"],
  },
  {
    phase: "Phase 3",
    title: "Passport Generation",
    description:
      "Automated creation of structured digital passports following open standards with export capabilities.",
    status: "upcoming",
    items: ["Passport templates", "PDF generation", "Data validation"],
  },
  {
    phase: "Phase 4",
    title: "Authentication",
    description:
      "User accounts, organization management, role-based access control, and secure API key management.",
    status: "upcoming",
    items: ["User accounts", "Organizations", "Role-based access"],
  },
  {
    phase: "Phase 5",
    title: "QR Code Integration",
    description:
      "Generate, print, and scan QR codes that link physical materials to their digital passports.",
    status: "upcoming",
    items: ["QR generation", "Mobile scanner", "On-site verification"],
  },
  {
    phase: "Phase 6",
    title: "Lifecycle Tracking",
    description:
      "End-to-end material lifecycle management from manufacturing through demolition and reuse.",
    status: "upcoming",
    items: ["Stage tracking", "Condition updates", "Event logging"],
  },
  {
    phase: "Phase 7",
    title: "Analytics Dashboard",
    description:
      "Project-level and portfolio sustainability analytics with carbon reporting and circularity metrics.",
    status: "upcoming",
    items: ["Carbon reporting", "Circularity metrics", "Data exports"],
  },
];

function StatusBadge({ status }: { status: Status }) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 rounded-full">
        <CheckCircle2 className="w-3 h-3 text-accent" />
        <span className="text-xs font-semibold text-accent">Completed</span>
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
        <Clock className="w-3 h-3 text-primary" />
        <span className="text-xs font-semibold text-primary">In Progress</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-border rounded-full">
      <Circle className="w-3 h-3 text-muted" />
      <span className="text-xs font-semibold text-muted">Upcoming</span>
    </div>
  );
}

export default function Roadmap() {
  return (
    <section className="py-24 lg:py-32 bg-background" id="roadmap">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-primary">Roadmap</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight mb-5">
            What we&apos;re building
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            A transparent, community-driven roadmap. Follow our progress and
            contribute to what comes next.
          </p>
        </div>

        {/* Phase cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {phases.map((phase, index) => (
            <div
              key={index}
              className={`bg-card border rounded-2xl p-5 space-y-4 transition-shadow hover:shadow-md ${
                phase.status === "completed"
                  ? "border-accent/30"
                  : phase.status === "in-progress"
                  ? "border-primary/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  {phase.phase}
                </span>
                <StatusBadge status={phase.status} />
              </div>

              <div>
                <h3 className="text-base font-bold text-secondary mb-1.5">
                  {phase.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {phase.description}
                </p>
              </div>

              <ul className="space-y-1.5">
                {phase.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted"
                  >
                    <div
                      className={`w-1 h-1 rounded-full flex-shrink-0 ${
                        phase.status === "completed"
                          ? "bg-accent"
                          : phase.status === "in-progress"
                          ? "bg-primary"
                          : "bg-border"
                      }`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
