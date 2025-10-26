function ProposalSection({ section }) {
  const { volume, citations, validation } = section;

  return (
    <article className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-inner shadow-black/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{volume.title}</h3>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            validation.passed
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
              : "border-amber-400/40 bg-amber-400/10 text-amber-200"
          }`}
        >
          {validation.passed ? "Validation passed" : "Needs review"}
        </span>
      </div>
      {volume.type === "narrative" && volume.body && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{volume.body}</p>
      )}
      {volume.type === "bullets" && volume.items && (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-200">
          {volume.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      {volume.type === "table" && volume.rows && (
        <div className="overflow-hidden rounded-2xl border border-slate-800/80">
          <table className="min-w-full divide-y divide-slate-800/80 text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 text-left">
                  Item
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Cost (CAD)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {volume.rows.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-left">{row.item}</td>
                  <td className="px-4 py-3 text-right">
                    {row.cost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 transition group-open:bg-slate-900">
          Citations ({citations.length})
          <span className="text-xs text-slate-500 group-open:rotate-180">⌃</span>
        </summary>
        <ul className="mt-3 space-y-2 rounded-xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm text-slate-300">
          {citations.map((citation, index) => (
            <li key={index}>
              <strong className="text-slate-200">{citation.source}:</strong> {citation.snippet}
            </li>
          ))}
        </ul>
      </details>

      {!validation.passed && validation.issues.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
          <h4 className="text-sm font-semibold text-amber-100">Validation feedback</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-50">
            {validation.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function ProposalPanel({ proposal, isGenerating }) {
  if (isGenerating && !proposal) {
    return (
      <section
        className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-lg shadow-indigo-500/10 backdrop-blur"
        id="proposal"
      >
        <h2 className="text-xl font-semibold text-white">Generating proposal…</h2>
        <p className="mt-2 text-sm text-slate-300">
          This can take a minute while we assemble evidence-backed content.
        </p>
      </section>
    );
  }

  if (!proposal) {
    return (
      <section
        className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-left shadow-lg shadow-indigo-500/10 backdrop-blur"
        id="proposal"
      >
        <h2 className="text-xl font-semibold text-white">Proposal Preview</h2>
        <p className="mt-2 text-sm text-slate-300">
          Save your community profile and generate at least one section to see the AI-assisted draft here.
        </p>
      </section>
    );
  }

  return (
    <section
      className="flex h-full flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur"
      id="proposal"
    >
      <h2 className="text-xl font-semibold text-white">{proposal.title || "Proposal Draft"}</h2>
      <div className="space-y-6 overflow-y-auto pr-2">
        {proposal.volumes.map((section) => (
          <ProposalSection key={section.volume.id} section={section} />
        ))}
      </div>
    </section>
  );
}
