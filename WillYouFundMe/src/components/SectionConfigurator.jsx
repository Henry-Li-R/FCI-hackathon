import Toggle from "./Toggle";

export default function SectionConfigurator({
  sections,
  onSectionChange,
  query,
  onQueryChange,
  onGenerate,
  isGenerating,
  outlineError,
  inputClasses,
  textareaClasses,
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Proposal Outline</h2>
        <p className="text-sm text-slate-400">Choose which sections to build and provide a short brief or prompt.</p>
      </div>
      <div className="mt-6 space-y-5">
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Project Brief for the AI
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Summarize the project goals, partners, and the support you need."
            rows={4}
            className={textareaClasses}
          />
        </label>
        <div className="space-y-4">
          {sections.map((section) => (
            <article
              key={section.id}
              className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-inner shadow-black/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Toggle
                    checked={section.enabled}
                    onChange={(value) => onSectionChange(section.id, "enabled", value)}
                    label={`${section.title} toggle`}
                  />
                  <div>
                    <h3 className="text-base font-semibold text-white">{section.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {section.type === "narrative" && "Narrative"}
                      {section.type === "bullets" && "Bullet list"}
                      {section.type === "table" && "Budget table"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-400">
                  {section.wordMax && (
                    <span className="rounded-full border border-slate-700/70 px-3 py-1">{section.wordMax} words</span>
                  )}
                  {section.requiredTerms && section.requiredTerms.trim() && (
                    <span className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-indigo-200">
                      keywords
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-medium text-slate-200">
                  Word Limit
                  <input
                    type="number"
                    min="0"
                    value={section.wordMax}
                    onChange={(event) => onSectionChange(section.id, "wordMax", event.target.value)}
                    placeholder="Optional"
                    className={inputClasses}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-200 sm:col-span-2">
                  Required Terms
                  <textarea
                    value={section.requiredTerms}
                    onChange={(event) => onSectionChange(section.id, "requiredTerms", event.target.value)}
                    placeholder="Comma or line separated terms"
                    rows={2}
                    className={textareaClasses}
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate Proposal"}
          </button>
        </div>
        {outlineError && (
          <p className="text-sm text-rose-300" role="alert">
            {outlineError}
          </p>
        )}
      </div>
    </section>
  );
}
