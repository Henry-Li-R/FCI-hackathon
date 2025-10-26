import { useEffect, useRef, useState } from "react";
import logo from "./assets/logo.png";
import heroIllustration from "./assets/logo.png";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

const PROPOSAL_SECTIONS = [
  { id: "overview", title: "Project Overview", type: "narrative", word_max: 200 },
  { id: "impact", title: "Community Impact", type: "narrative", word_max: 220 },
  { id: "budget", title: "Budget Overview", type: "table" },
  { id: "timeline", title: "Timeline & Milestones", type: "bullets" },
];

const parseListInput = (value = "") =>
  value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

function App() {
  const [proposal, setProposal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") {
      sessionIdRef.current = `session-${Date.now()}`;
      return;
    }

    let stored = window.localStorage.getItem("wyfm-session-id");
    if (!stored) {
      const generated = window.crypto?.randomUUID?.() || `session-${Date.now()}`;
      window.localStorage.setItem("wyfm-session-id", generated);
      stored = generated;
    }
    sessionIdRef.current = stored;
  }, []);

  const ensureSessionId = () => {
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }
    const fallback = `session-${Date.now()}`;
    sessionIdRef.current = fallback;
    return fallback;
  };

  const postJson = async (endpoint, payload) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.detail) {
          message =
            typeof errorBody.detail === "string"
              ? errorBody.detail
              : JSON.stringify(errorBody.detail);
        }
      } catch (parseError) {
        // Ignore JSON parsing errors and fall back to the default message
      }
      throw new Error(message);
    }

    return response.json();
  };

  const handleGenerateProposal = async (formData) => {
    const sessionId = ensureSessionId();
    const objectiveList = parseListInput(formData.objectives);
    const budgetValue = formData.budget ? Number(formData.budget) : undefined;
    const timelineValue = formData.timeline ? Number(formData.timeline) : undefined;

    const baselineMetrics = {};
    if (Number.isFinite(budgetValue)) {
      baselineMetrics.estimated_budget = budgetValue;
    }
    if (Number.isFinite(timelineValue)) {
      baselineMetrics.timeline_months = timelineValue;
    }

    const profilePayload = {
      name:
        formData.communityName?.trim() ||
        formData.projectName?.trim() ||
        "Community Partner",
      priorities: objectiveList,
      notes: formData.description?.trim() || undefined,
    };

    if (Object.keys(baselineMetrics).length > 0) {
      profilePayload.baseline_metrics = baselineMetrics;
    }

    const grantPayload = {
      title: formData.fundingCall?.trim() || formData.projectName?.trim() || "Funding Proposal",
      sponsor: formData.communityName?.trim() || "Local Sponsor",
      criteria: objectiveList,
    };

    if (Number.isFinite(budgetValue)) {
      grantPayload.max_amount = budgetValue;
    }

    const querySegments = [
      formData.projectName && `Project Name: ${formData.projectName}`,
      formData.communityName && `Community: ${formData.communityName}`,
      formData.fundingCall && `Funding Call: ${formData.fundingCall}`,
      formData.objectives && `Objectives: ${formData.objectives}`,
      formData.description && `Project Description: ${formData.description}`,
      formData.budget && `Estimated Budget: ${formData.budget} CAD`,
      formData.timeline && `Timeline: ${formData.timeline} months`,
    ].filter(Boolean);

    const query = querySegments.length
      ? querySegments.join("\n")
      : `Generate a project proposal outline for ${profilePayload.name}.`;

    setIsLoading(true);
    setError(null);
    setProposal(null);

    try {
      await postJson("/intake_profile", { session_id: sessionId, profile: profilePayload });
      const proposalResponse = await postJson("/proposal/complete", {
        session_id: sessionId,
        query,
        volume_list: PROPOSAL_SECTIONS,
        grant: grantPayload,
      });
      setProposal(proposalResponse);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError instanceof Error ? requestError.message : "Failed to generate proposal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <Header />
        <Hero />
        <Instructions />
        <Body
          onGenerate={handleGenerateProposal}
          isLoading={isLoading}
          proposal={proposal}
          error={error}
        />
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <img src={logo} alt="Will You Fund Me logo" className="h-16 w-16 rounded-full border border-white/20 object-cover" />
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Will You Fund Me?</h1>
          <p className="text-sm text-slate-300">Craft compelling funding proposals with local insight.</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
        <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-blue-500 hover:text-white" href="#instructions">
          Instructions
        </a>
        <a className="rounded-full border border-blue-500 bg-blue-600/20 px-4 py-2 text-blue-200 transition hover:bg-blue-600/30" href="#proposal">
          Build Your Proposal
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="mt-12 grid gap-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-950 p-10 shadow-glow md:grid-cols-[1.1fr_0.9fr]">
      <div className="flex flex-col justify-center space-y-6">
        <span className="inline-flex max-w-max items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/90">
          Built for Nunavut
        </span>
        <h2 className="text-4xl font-bold text-white sm:text-5xl">Build Your Funding Proposal Today</h2>
        <p className="text-base leading-relaxed text-slate-200 sm:text-lg">
          Combine local knowledge with AI to craft stronger, more compelling funding proposals — faster and with
          confidence. Provide your project details and our assistant will help you articulate impact, budget, and
          timeline tailored to Nunavut communities.
        </p>
        <div className="flex flex-wrap gap-3">
          <a className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400" href="#proposal">
            Start Building
          </a>
          <a className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-white" href="#instructions">
            How it works
          </a>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 -z-10 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />
        <img src={heroIllustration} alt="Illustration of proposal planning" className="h-64 w-64 drop-shadow-lg sm:h-72 sm:w-72" />
      </div>
    </section>
  );
}

function Instructions() {
  const steps = [
    {
      title: "Gather your project details",
      description: "Tell us about your community, funding call, goals, and the problem you aim to solve.",
    },
    {
      title: "Generate tailored guidance",
      description: "Receive AI-assisted recommendations to strengthen your narrative, budget, and timeline.",
    },
    {
      title: "Export your proposal",
      description: "Copy the generated text into your preferred template and keep iterating with your team.",
    },
  ];

  return (
    <section id="instructions" className="mt-16">
      <h2 className="text-3xl font-semibold text-white">How to use the assistant</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">
        Follow the guided steps below to make the most of our proposal builder. You can refine your answers and rerun the
        generator at any time.
      </p>

      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-200">
              {index + 1}
            </span>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="text-sm text-slate-300">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProposalForm({ onGenerate, isLoading }) {
  const [formData, setFormData] = useState({
    projectName: "",
    communityName: "",
    fundingCall: "",
    objectives: "",
    description: "",
    budget: "",
    timeline: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const sanitizedEntries = Object.entries(formData).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]);
    onGenerate(Object.fromEntries(sanitizedEntries));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur">
      <h2 className="text-2xl font-semibold text-white">Generate your proposal</h2>
      <p className="mt-2 text-sm text-slate-300">
        Fill in the details below to generate a customized proposal draft tailored for Nunavut communities.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="projectName">
            Project name
          </label>
          <input
            id="projectName"
            name="projectName"
            type="text"
            value={formData.projectName}
            onChange={handleChange}
            placeholder="Arctic Youth Wellness Initiative"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="communityName">
            Community name
          </label>
          <input
            id="communityName"
            name="communityName"
            type="text"
            value={formData.communityName}
            onChange={handleChange}
            placeholder="Iqaluit, Rankin Inlet, ..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="fundingCall">
            Funding call or program
          </label>
          <input
            id="fundingCall"
            name="fundingCall"
            type="text"
            value={formData.fundingCall}
            onChange={handleChange}
            placeholder="Community Infrastructure Fund 2025"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="objectives">
            Project objectives
          </label>
          <textarea
            id="objectives"
            name="objectives"
            value={formData.objectives}
            onChange={handleChange}
            placeholder="Summarize your main project goals..."
            rows={3}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-200" htmlFor="description">
            Project description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a short overview of your project..."
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-200" htmlFor="budget">
              Estimated budget (CAD)
            </label>
            <input
              id="budget"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleChange}
              placeholder="25000"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200" htmlFor="timeline">
              Timeline (months)
            </label>
            <input
              id="timeline"
              name="timeline"
              type="number"
              value={formData.timeline}
              onChange={handleChange}
              placeholder="6"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-blue-500/60"
        >
          {isLoading ? "Generating..." : "Generate proposal draft"}
        </button>
      </form>
    </div>
  );
}

function ProposalPreview({ proposal, isLoading, error }) {
  const currencyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });

  const renderVolumeContent = (volume) => {
    if (volume.type === "narrative") {
      return <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{volume.body}</p>;
    }

    if (volume.type === "bullets") {
      return (
        <ul className="ml-4 list-disc space-y-2 text-sm text-slate-200">
          {(volume.items || []).map((item, index) => (
            <li key={`${volume.id}-item-${index}`}>{item}</li>
          ))}
        </ul>
      );
    }

    if (volume.type === "table") {
      return (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
            <thead className="bg-white/5 text-left uppercase tracking-widest text-xs text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {(volume.rows || []).map((row, index) => (
                <tr key={`${volume.id}-row-${index}`} className="odd:bg-slate-900/60 even:bg-slate-900/30">
                  <td className="px-4 py-3 align-top">{row.item}</td>
                  <td className="px-4 py-3 align-top text-right font-medium text-blue-200">
                    {typeof row.cost === "number" ? currencyFormatter.format(row.cost) : row.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  const renderCitations = (citations, volumeId) => {
    if (!citations?.length) {
      return null;
    }

    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-100">Sources</p>
        <ul className="mt-2 space-y-1">
          {citations.map((citation, index) => (
            <li key={`${volumeId}-citation-${index}`} className="leading-snug">
              <span className="text-blue-200">[{index + 1}] {citation.source}</span>
              {citation.snippet ? <span className="text-slate-400"> — {citation.snippet}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderValidation = (validation, volumeId) => {
    if (!validation) {
      return null;
    }

    const baseClasses = "mt-4 rounded-xl border px-4 py-3 text-xs";
    const stateClasses = validation.passed
      ? "border-emerald-500/40 text-emerald-200"
      : "border-amber-500/40 text-amber-200";

    return (
      <div className={`${baseClasses} ${stateClasses}`}>
        <p className="font-semibold">
          {validation.passed ? "Validation passed" : "Needs attention"}
        </p>
        {!validation.passed && validation.issues?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100">
            {validation.issues.map((issue, index) => (
              <li key={`${volumeId}-issue-${index}`}>{issue}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  };

  let content = (
    <>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">Live Preview</p>
        <h3 className="text-2xl font-semibold text-white">Your proposal draft will appear here</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          After submitting the form, we will suggest a narrative structure, highlight community impact, and craft
          persuasive language tailored to your funding call.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 text-sm text-slate-200">
        <p className="font-semibold text-white">Preview sections:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-300">
          <li>Project overview</li>
          <li>Community impact</li>
          <li>Budget breakdown</li>
          <li>Timeline &amp; milestones</li>
        </ul>
      </div>
    </>
  );

  if (isLoading) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/40 border-t-blue-400" aria-hidden />
        <p className="mt-6 text-sm font-medium text-slate-200">Generating your tailored proposal draft…</p>
        <p className="mt-2 text-xs text-slate-400">This usually takes a few seconds.</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-sm font-semibold text-rose-200">We couldn’t complete the request.</p>
        <p className="mt-2 text-sm text-rose-100/80">{error}</p>
        <p className="mt-4 text-xs text-slate-400">Please adjust your inputs or try again shortly.</p>
      </div>
    );
  } else if (proposal) {
    const sections = Array.isArray(proposal.volumes) ? proposal.volumes : [];
    content = (
      <div className="flex h-full flex-col">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">Live Preview</p>
          <h3 className="text-2xl font-semibold text-white">{proposal.title || "Generated Proposal"}</h3>
          <p className="text-sm text-slate-300">These sections were generated using local guidance and retrieval-augmented context.</p>
        </div>

        <div className="mt-6 space-y-6 overflow-y-auto pr-1 text-left">
          {sections.length ? (
            sections.map((section) => (
              <div key={section.volume.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-inner">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-lg font-semibold text-white">{section.volume.title}</h4>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-slate-300">
                    {section.volume.type}
                  </span>
                </div>
                <div className="mt-4 space-y-4">
                  {renderVolumeContent(section.volume)}
                  {renderCitations(section.citations, section.volume.id)}
                  {renderValidation(section.validation, section.volume.id)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No sections were returned for this proposal. Try refining your inputs and generate again.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-slate-900/60 to-slate-950 p-8 text-left shadow-inner">
      {content}
    </div>
  );
}

function Body({ onGenerate, isLoading, proposal, error }) {
  return (
    <section id="proposal" className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <ProposalForm onGenerate={onGenerate} isLoading={isLoading} />
      <ProposalPreview proposal={proposal} isLoading={isLoading} error={error} />
    </section>
  );
}

export default App;
