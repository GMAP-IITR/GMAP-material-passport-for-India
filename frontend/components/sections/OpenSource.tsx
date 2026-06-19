import { Users, Eye, Puzzle, FileCode2, Building2 } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const benefits = [
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Built by and for architects, engineers, sustainability consultants, and developers. No single vendor controls the roadmap.",
  },
  {
    icon: Eye,
    title: "Transparent",
    description:
      "All code, issues, and decisions are made in the open. Inspect, audit, and contribute to every aspect of the platform.",
  },
  {
    icon: Puzzle,
    title: "Extensible",
    description:
      "Plugin-friendly architecture allows organizations to extend the platform for their specific workflows and integrations.",
  },
  {
    icon: FileCode2,
    title: "Standards Friendly",
    description:
      "Built to support emerging material data standards like ISO 23387, IFC, and the EU Digital Product Passport regulation.",
  },
  {
    icon: Building2,
    title: "Industry Collaboration",
    description:
      "Developed in collaboration with industry partners to ensure it solves real problems at the project level.",
  },
];

export default function OpenSource() {
  return (
    <section className="py-24 lg:py-32 bg-secondary" id="open-source">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — copy & benefits */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-xs font-medium text-white/80">
                  Open Source
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-5">
                Why Open Source?
              </h2>
              <p className="text-lg text-white/55 leading-relaxed">
                Material data standards should be a public good. Open source is
                the only model that can build the trust and adoption required
                across an entire industry.
              </p>
            </div>

            <div className="space-y-5">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                      <Icon className="w-5 h-5 text-white/55 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-white/45 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — GitHub contribution card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                <GithubIcon className="w-7 h-7 text-white" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Contribute to Material Passport
                </h3>
                <p className="text-white/55 leading-relaxed text-sm">
                  Whether you&apos;re a developer, sustainability expert,
                  architect, BIM engineer, or just passionate about circular
                  economy — there&apos;s a place for you here.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  "Star the repository",
                  "Report bugs and request features",
                  "Submit pull requests",
                  "Improve documentation",
                  "Share with your network",
                ].map((action) => (
                  <li
                    key={action}
                    className="flex items-center gap-3 text-sm text-white/65"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>

              <div className="space-y-3 pt-1">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white text-secondary text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  <GithubIcon className="w-4 h-4" />
                  View on GitHub
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white/10 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors border border-white/20"
                >
                  Read Contributing Guide
                </a>
              </div>

              {/* License / status chips */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                {[
                  { label: "License", value: "MIT" },
                  { label: "Issues", value: "Open" },
                  { label: "PRs", value: "Welcome" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-sm font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/35 mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
