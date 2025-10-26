export default function ProfileForm({
  form,
  onChange,
  onSubmit,
  status,
  statusStyles,
  error,
  inputClasses,
  textareaClasses,
}) {
  const statusClass =
    status?.state && status.state !== "idle"
      ? statusStyles[status.state] ?? "border-slate-600 bg-slate-800 text-slate-300"
      : null;

  return (
    <section
      className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur"
      id="profile"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Community Profile</h2>
          <p className="mt-1 text-sm text-slate-400">
            Capture your community context to ground every generated section.
          </p>
        </div>
        {statusClass && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}>
            {status.state === "saved" && "Saved"}
            {status.state === "saving" && "Saving…"}
            {status.state === "error" && "Save failed"}
          </span>
        )}
      </div>
      <form className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Community or Project Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="e.g., Nunavut Coastal Resilience Initiative"
            required
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Population
          <input
            type="number"
            name="population"
            value={form.population}
            onChange={onChange}
            placeholder="e.g., 7800"
            min="0"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200">
          Region
          <input
            type="text"
            name="region"
            value={form.region}
            onChange={onChange}
            placeholder="e.g., Qikiqtaaluk"
            className={inputClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Priorities (one per line)
          <textarea
            name="priorities"
            value={form.priorities}
            onChange={onChange}
            placeholder={"Housing; food security; clean energy"}
            rows={3}
            className={textareaClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Constraints (one per line)
          <textarea
            name="constraints"
            value={form.constraints}
            onChange={onChange}
            placeholder={"Limited construction season\nHigh transportation costs"}
            rows={3}
            className={textareaClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Community Assets (one per line)
          <textarea
            name="assets"
            value={form.assets}
            onChange={onChange}
            placeholder={"Skilled local tradespeople\nPartnership with Arctic College"}
            rows={3}
            className={textareaClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Baseline Metrics (key: value per line)
          <textarea
            name="baselineMetrics"
            value={form.baselineMetrics}
            onChange={onChange}
            placeholder={"Greenhouse gas emissions: 15kt\nHomes requiring retrofits: 240"}
            rows={3}
            className={textareaClasses}
          />
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
          Additional Notes
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder="Important context, partners, or commitments"
            rows={3}
            className={textareaClasses}
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          >
            Save Profile
          </button>
        </div>
        {error && (
          <p className="text-sm text-rose-300 md:col-span-2" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
