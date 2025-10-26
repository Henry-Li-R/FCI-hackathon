export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex h-7 w-12 cursor-pointer items-center" aria-label={label}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="absolute inset-0 rounded-full border border-slate-700 bg-slate-800 transition peer-checked:border-indigo-400 peer-checked:bg-indigo-500/80" />
      <span className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
    </label>
  );
}
