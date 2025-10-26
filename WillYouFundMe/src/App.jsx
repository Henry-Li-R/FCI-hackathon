import { useState } from "react";
import logo from "./assets/logo.png";
import heroIllustration from "./assets/react.svg";

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <Header />
        <Hero />
        <Instructions />
        <Body />
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-400/80">Nunavut Innovation Lab</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Will You Fund Me?</h1>
          <p className="text-sm text-slate-300">Craft compelling funding proposals with local insight.</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
        <a className="rounded-full border border-white/10 px-4 py-2 transition hover:border-blue-500 hover:text-white" href="#instructions">
          About
        </a>
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

function ProposalForm() {
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
    console.log("Form submitted:", formData);
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
          className="w-full rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
        >
          Generate proposal draft
        </button>
      </form>
    </div>
  );
}

function ProposalPreview() {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-slate-900/60 to-slate-950 p-8 text-left shadow-inner">
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
    </div>
  );
}

function Body() {
  return (
    <section id="proposal" className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <ProposalForm />
      <ProposalPreview />
    </section>
  );
}

export default App;
