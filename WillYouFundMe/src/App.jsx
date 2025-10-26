import { useMemo, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import ProfileForm from "./components/ProfileForm";
import GrantForm from "./components/GrantForm";
import SectionConfigurator from "./components/SectionConfigurator";
import ProposalPanel from "./components/ProposalPanel";

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
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, [field]: value } : section)));
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
      population: profileForm.population ? Number.parseInt(profileForm.population, 10) : undefined,
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
      max_amount: grantForm.maxAmount ? Number.parseFloat(grantForm.maxAmount) : undefined,
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
      setOutlineError("We couldn't save the community profile. Please review the details above and try again.");
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
        throw new Error(detail?.detail ?? "Unable to generate proposal. Check that the backend is running.");
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
          <ProfileForm
            form={profileForm}
            onChange={handleProfileChange}
            onSubmit={submitProfile}
            status={profileStatus}
            statusStyles={statusStyles}
            error={profileError}
            inputClasses={inputClasses}
            textareaClasses={textareaClasses}
          />
          <GrantForm
            form={grantForm}
            onChange={handleGrantChange}
            inputClasses={inputClasses}
            textareaClasses={textareaClasses}
          />
          <SectionConfigurator
            sections={sections}
            onSectionChange={handleSectionChange}
            query={query}
            onQueryChange={setQuery}
            onGenerate={generateProposal}
            isGenerating={isGenerating}
            outlineError={outlineError}
            inputClasses={inputClasses}
            textareaClasses={textareaClasses}
          />
        </div>

        <div className="w-full max-w-xl flex-none lg:sticky lg:top-10">
          <ProposalPanel proposal={proposal} isGenerating={isGenerating} />
        </div>
      </section>
    </main>
  );
}

export default App;
