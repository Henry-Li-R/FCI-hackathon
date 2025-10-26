export default function GrantForm({ form, onChange, inputClasses, textareaClasses }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Grant Details</h2>
        <p className="text-sm text-slate-400">Tell the assistant which funding stream you are targeting.</p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Grant Title
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g., Northern Infrastructure Resilience Fund"
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Grant Sponsor
          <input
            type="text"
            name="sponsor"
            value={form.sponsor}
            onChange={onChange}
            placeholder="e.g., Infrastructure Canada"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Key Criteria (one per line)
          <textarea
            name="criteria"
            value={form.criteria}
            onChange={onChange}
            placeholder={"Climate mitigation\nCommunity economic benefits\nIndigenous partnership"}
            rows={3}
            className={textareaClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Due Date
          <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} className={inputClasses} />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Maximum Amount (CAD)
          <input
            type="number"
            step="any"
            name="maxAmount"
            value={form.maxAmount}
            onChange={onChange}
            placeholder="e.g., 1250000"
            min="0"
            className={inputClasses}
          />
        </label>
      </div>
    </section>
  );
}
