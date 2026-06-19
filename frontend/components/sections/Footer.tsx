import { Layers, BookOpen, Map, Scale } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Material Passport
              </span>
            </div>
            <p className="text-sm text-white/45 leading-relaxed max-w-sm">
              An open-source platform for digital material passports, lifecycle
              tracking, and circular economy analytics in the construction
              industry.
            </p>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-xs font-medium text-accent">
                Open Source · MIT License
              </span>
            </div>
          </div>

          {/* Project links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/35 uppercase tracking-wider">
              Project
            </h4>
            <ul className="space-y-3">
              {[
                {
                  label: "GitHub Repository",
                  href: "#",
                  icon: GithubIcon,
                  external: true,
                },
                {
                  label: "Documentation",
                  href: "#",
                  icon: BookOpen,
                  external: false,
                },
                {
                  label: "Roadmap",
                  href: "#roadmap",
                  icon: Map,
                  external: false,
                },
                {
                  label: "License",
                  href: "#",
                  icon: Scale,
                  external: true,
                },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors"
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Community links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/35 uppercase tracking-wider">
              Community
            </h4>
            <ul className="space-y-3">
              {[
                {
                  label: "Contributing Guide",
                  href: "#",
                },
                { label: "Code of Conduct", href: "#" },
                {
                  label: "Issue Tracker",
                  href: "#",
                },
                {
                  label: "Discussions",
                  href: "#",
                },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/45 hover:text-white transition-colors"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © 2024 Material Passport Contributors. Released under the MIT
            License.
          </p>
          <p className="text-xs text-white/25">
            Built with Next.js · Tailwind CSS · Open Source
          </p>
        </div>
      </div>
    </footer>
  );
}
