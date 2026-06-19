const contributors = [
  {
    initials: "JD",
    name: "Jane Doe",
    role: "Lead Developer",
    color: "bg-blue-500",
  },
  {
    initials: "AS",
    name: "Alex Smith",
    role: "Sustainability Expert",
    color: "bg-emerald-500",
  },
  {
    initials: "MK",
    name: "Maria Kovač",
    role: "BIM Engineer",
    color: "bg-violet-500",
  },
  {
    initials: "TN",
    name: "Tom Nguyen",
    role: "Frontend Developer",
    color: "bg-amber-500",
  },
  {
    initials: "FO",
    name: "Fatima Omar",
    role: "Architect",
    color: "bg-rose-500",
  },
  {
    initials: "RB",
    name: "Ravi Bose",
    role: "API Developer",
    color: "bg-indigo-500",
  },
  {
    initials: "LM",
    name: "Lena Müller",
    role: "Material Researcher",
    color: "bg-teal-500",
  },
  {
    initials: "YOU",
    name: "Your Name",
    role: "Future Contributor",
    color: "bg-primary",
    placeholder: true,
  },
];

const audiences = [
  "Architects",
  "Construction Companies",
  "Sustainability Consultants",
  "BIM Engineers",
  "Material Manufacturers",
  "Building Owners",
  "Researchers",
  "Developers",
];

export default function Contributors() {
  return (
    <section className="py-24 lg:py-32 bg-card" id="contributors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-primary">
              Contributors
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-secondary tracking-tight mb-5">
            Built by the community
          </h2>
          <p className="text-lg text-muted leading-relaxed">
            Material Passport is shaped by contributors from architecture,
            engineering, sustainability, and software development.
          </p>
        </div>

        {/* Contributor grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {contributors.map((contributor, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border text-center transition-all hover:shadow-md ${
                contributor.placeholder
                  ? "border-dashed border-primary/40 bg-primary/5 hover:border-primary/60"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full ${contributor.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
              >
                {contributor.initials}
              </div>
              <div>
                <div className="text-xs font-semibold text-secondary leading-tight">
                  {contributor.name}
                </div>
                <div className="text-[10px] text-muted mt-0.5 leading-tight">
                  {contributor.role}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audience tags */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {audiences.map((audience) => (
            <span
              key={audience}
              className="px-3 py-1.5 text-xs font-medium text-muted bg-background border border-border rounded-full"
            >
              {audience}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-muted mb-4">
            Want to see your name here?
          </p>
          <a
            href="https://github.com/piyushkumar-prog/material-passport"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Become a Contributor
          </a>
        </div>
      </div>
    </section>
  );
}
