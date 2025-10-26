export default function Hero() {
  return (
    <section className="border-b border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Build funder-ready narratives that reflect your community.
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            Capture your local priorities, align with grant criteria, and let the Municipal Proposal
            Copilot draft tailored sections complete with evidence citations and validation checks.
          </p>
        </div>
        <div className="flex-1 rounded-3xl border border-indigo-500/40 bg-indigo-500/10 p-6 shadow-glow">
          <p className="text-lg font-medium text-indigo-100">
            “The Copilot helped us turn community knowledge into a polished submission in one afternoon.”
          </p>
          <span className="mt-4 block text-sm font-medium text-indigo-200">— Pilot municipality partner</span>
        </div>
      </div>
    </section>
  );
}
