export default function Header() {
  return (
    <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Will You Fund Me?</h1>
          <p className="mt-1 text-sm text-slate-400">
            A proposal co-pilot designed for Northern and remote communities.
          </p>
        </div>
        <nav>
          <ul className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <li>
              <a className="rounded-full px-3 py-1 transition hover:bg-slate-800/80" href="#profile">
                Profile
              </a>
            </li>
            <li>
              <a className="rounded-full px-3 py-1 transition hover:bg-slate-800/80" href="#proposal">
                Proposal
              </a>
            </li>
            <li>
              <a
                className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-3 py-1 text-indigo-200 transition hover:bg-slate-800"
                href="https://github.com/fci-innovation"
                target="_blank"
                rel="noreferrer"
              >
                Learn more
                <span aria-hidden>↗</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
