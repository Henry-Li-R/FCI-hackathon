import { useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const DEFAULT_PROFILE_FORM = {
  name: "",
  population: "",
  region: "",
  priorities: "",
  constraints: "",
  assets: "",
  baselineMetrics: "",
  notes: "",
};

const DEFAULT_GRANT_FORM = {
  title: "",
  sponsor: "",
  criteria: "",
  dueDate: "",
  maxAmount: "",
};

const DEFAULT_SECTIONS = [
  {
    id: "community-need",
    title: "Community Need & Opportunity",
    type: "narrative",
    wordMax: "250",
    requiredTerms: "community; opportunity; impact",
    enabled: true,
  },
  {
    id: "project-plan",
    title: "Project Plan & Activities",
    type: "narrative",
    wordMax: "275",
    requiredTerms: "timeline; partners",
    enabled: true,
  },
  {
    id: "objectives",
    title: "Project Objectives",
    type: "bullets",
    wordMax: "",
    requiredTerms: "",
    enabled: true,
  },
  {
    id: "budget",
    title: "Budget Breakdown",
    type: "table",
    wordMax: "",
    requiredTerms: "",
    enabled: true,
  },
];

const inputClasses =
  "mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-inner shadow-slate-950/40 transition focus:border-indigo-400/80 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
const textareaClasses = `${inputClasses} min-h-[120px] resize-y leading-relaxed`;

const statusStyles = {
  saved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  saving: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
};

function App() {
  const sessionId = useMemo(() => crypto.randomUUID(), []);
  const [profileForm, setProfileForm] = useState(DEFAULT_PROFILE_FORM);
  const [grantForm, setGrantForm] = useState(DEFAULT_GRANT_FORM);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [query, setQuery] = useState("");

  const [proposal, setProposal] = useState(null);
  const [profileStatus, setProfileStatus] = useState({ state: "idle" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [outlineError, setOutlineError] = useState(null);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGrantChange = (event) => {
    const { name, value } = event.target;
    setGrantForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (id, field, value) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, [field]: value } : section)),
    );
  };

  const parseList = (value) =>
    value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);

  const parseBaselineMetrics = (value) => {
    if (!value.trim()) {
      return {};
    }
    return value.split(/\n+/).reduce((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (!key) {
        return acc;
      }
      const metricKey = key.trim();
      const metricValue = rest.join(":").trim();
      if (!metricKey) {
        return acc;
      }
      acc[metricKey] = metricValue || null;
      return acc;
    }, {});
  };

  const buildProfilePayload = () => {
    const payload = {
      name: profileForm.name.trim(),
      population: profileForm.population
        ? Number.parseInt(profileForm.population, 10)
        : undefined,
      region: profileForm.region.trim() || undefined,
      priorities: parseList(profileForm.priorities),
      constraints: parseList(profileForm.constraints),
      assets: parseList(profileForm.assets),
      baseline_metrics: parseBaselineMetrics(profileForm.baselineMetrics),
      notes: profileForm.notes.trim() || undefined,
    };
    if (Number.isNaN(payload.population)) {
      payload.population = undefined;
    }
    return payload;
  };

  const buildGrantPayload = () => {
    const payload = {
      title: grantForm.title.trim(),
      sponsor: grantForm.sponsor.trim() || "Unknown sponsor",
      criteria: parseList(grantForm.criteria),
      due_date: grantForm.dueDate.trim() || undefined,
      max_amount: grantForm.maxAmount
        ? Number.parseFloat(grantForm.maxAmount)
        : undefined,
    };
    if (Number.isNaN(payload.max_amount)) {
      payload.max_amount = undefined;
    }
    return payload;
  };

  const buildSectionPayloads = () =>
    sections
      .filter((section) => section.enabled)
      .map((section) => ({
        id: section.id,
        title: section.title.trim() || section.id,
        type: section.type,
        word_max: section.wordMax ? Number.parseInt(section.wordMax, 10) : undefined,
        required_terms: parseList(section.requiredTerms),
      }));

  const persistProfile = async () => {
    setProfileStatus({ state: "saving" });
    setProfileError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/intake_profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          profile: buildProfilePayload(),
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? "Failed to save profile");
      }

      setProfileStatus({ state: "saved", timestamp: Date.now() });
      return true;
    } catch (submissionError) {
      console.error(submissionError);
      setProfileStatus({ state: "error" });
      setProfileError(submissionError.message);
      return false;
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    await persistProfile();
  };

  const generateProposal = async () => {
    const grantPayload = buildGrantPayload();
    const sectionPayloads = buildSectionPayloads();

    setOutlineError(null);

    if (!profileForm.name.trim()) {
      setOutlineError("Please provide a community or project name before generating a proposal.");
      return;
    }

    if (!grantPayload.title) {
      setOutlineError("Grant title is required to generate a proposal.");
      return;
    }

    if (sectionPayloads.length === 0) {
      setOutlineError("Select at least one section to generate.");
      return;
    }

    const saved = await persistProfile();
    if (!saved) {
      setOutlineError(
        "We couldn't save the community profile. Please review the details above and try again.",
      );
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/proposal/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: query.trim(),
          volume_list: sectionPayloads,
          grant: grantPayload,
        }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(
          detail?.detail ?? "Unable to generate proposal. Check that the backend is running.",
        );
      }

      const data = await response.json();
      setProposal(data);
    } catch (generationError) {
      console.error(generationError);
      setOutlineError(generationError.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="pb-16">
      <Header />
      <Hero />
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-12 lg:flex-row">
        <div className="flex flex-1 flex-col gap-8">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur" id="profile">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Community Profile</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture your community context to ground every generated section.
                </p>
              </div>
              {profileStatus.state !== "idle" && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                    statusStyles[profileStatus.state] ?? "border-slate-600 bg-slate-800 text-slate-300"
                  }`}
                >
                  {profileStatus.state === "saved" && "Saved"}
                  {profileStatus.state === "saving" && "Saving…"}
                  {profileStatus.state === "error" && "Save failed"}
                </span>
              )}
            </div>
            <form
              className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
              onSubmit={submitProfile}
            >
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Community or Project Name
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
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
                  value={profileForm.population}
                  onChange={handleProfileChange}
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
                  value={profileForm.region}
                  onChange={handleProfileChange}
                  placeholder="e.g., Qikiqtaaluk"
                  className={inputClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Priorities (one per line)
                <textarea
                  name="priorities"
                  value={profileForm.priorities}
                  onChange={handleProfileChange}
                  placeholder={"Housing; food security; clean energy"}
                  rows={3}
                  className={textareaClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Constraints (one per line)
                <textarea
                  name="constraints"
                  value={profileForm.constraints}
                  onChange={handleProfileChange}
                  placeholder={"Limited construction season\nHigh transportation costs"}
                  rows={3}
                  className={textareaClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Community Assets (one per line)
                <textarea
                  name="assets"
                  value={profileForm.assets}
                  onChange={handleProfileChange}
                  placeholder={"Skilled local tradespeople\nPartnership with Arctic College"}
                  rows={3}
                  className={textareaClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Baseline Metrics (key: value per line)
                <textarea
                  name="baselineMetrics"
                  value={profileForm.baselineMetrics}
                  onChange={handleProfileChange}
                  placeholder={"Greenhouse gas emissions: 15kt\nHomes requiring retrofits: 240"}
                  rows={3}
                  className={textareaClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Additional Notes
                <textarea
                  name="notes"
                  value={profileForm.notes}
                  onChange={handleProfileChange}
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
              {profileError && (
                <p className="md:col-span-2 text-sm text-rose-300" role="alert">
                  {profileError}
                </p>
              )}
            </form>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Grant Details</h2>
              <p className="text-sm text-slate-400">
                Tell the assistant which funding stream you are targeting.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Grant Title
                <input
                  type="text"
                  name="title"
                  value={grantForm.title}
                  onChange={handleGrantChange}
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
                  value={grantForm.sponsor}
                  onChange={handleGrantChange}
                  placeholder="e.g., Infrastructure Canada"
                  className={inputClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200 md:col-span-2">
                Key Criteria (one per line)
                <textarea
                  name="criteria"
                  value={grantForm.criteria}
                  onChange={handleGrantChange}
                  placeholder={"Climate mitigation\nCommunity economic benefits\nIndigenous partnership"}
                  rows={3}
                  className={textareaClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Due Date
                <input
                  type="date"
                  name="dueDate"
                  value={grantForm.dueDate}
                  onChange={handleGrantChange}
                  className={inputClasses}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Maximum Amount (CAD)
                <input
                  type="number"
                  step="any"
                  name="maxAmount"
                  value={grantForm.maxAmount}
                  onChange={handleGrantChange}
                  placeholder="e.g., 1250000"
                  min="0"
                  className={inputClasses}
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Proposal Outline</h2>
              <p className="text-sm text-slate-400">
                Choose which sections to build and provide a short brief or prompt.
              </p>
            </div>
            <div className="mt-6 space-y-5">
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Project Brief for the AI
                <textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
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
                          onChange={(value) => handleSectionChange(section.id, "enabled", value)}
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
                          <span className="rounded-full border border-slate-700/70 px-3 py-1">
                            {section.wordMax} words
                          </span>
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
                          onChange={(event) =>
                            handleSectionChange(section.id, "wordMax", event.target.value)
                          }
                          placeholder="Optional"
                          className={inputClasses}
                        />
                      </label>
                      <label className="flex flex-col text-sm font-medium text-slate-200 sm:col-span-2">
                        Required Terms
                        <textarea
                          value={section.requiredTerms}
                          onChange={(event) =>
                            handleSectionChange(section.id, "requiredTerms", event.target.value)
                          }
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
                  onClick={generateProposal}
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
        </div>

        <div className="w-full max-w-xl flex-none lg:sticky lg:top-10">
          <ProposalPanel proposal={proposal} isGenerating={isGenerating} />
        </div>
      </section>
    </main>
  );
}

function Header() {
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

function Hero() {
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
            “The Copilot helped us turn community knowledge into a polished submission in one
            afternoon.”
          </p>
          <span className="mt-4 block text-sm font-medium text-indigo-200">
            — Pilot municipality partner
          </span>
        </div>
      </div>
    </section>
  );
}

function ProposalPanel({ proposal, isGenerating }) {
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
          Save your community profile and generate at least one section to see the AI-assisted draft
          here.
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

function Toggle({ checked, onChange, label }) {
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

export default App;
