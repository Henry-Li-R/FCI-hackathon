import { useMemo, useState } from "react";
import "./App.css";

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
      prev.map((section) =>
        section.id === id ? { ...section, [field]: value } : section,
      ),
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
    <main className="app">
      <Header />
      <Hero />
      <section className="content">
        <div className="left-column">
          <section className="card" id="profile">
            <div className="card-header">
              <h2>Community Profile</h2>
              {profileStatus.state === "saved" && (
                <span className="status saved">Saved</span>
              )}
              {profileStatus.state === "saving" && (
                <span className="status saving">Saving…</span>
              )}
              {profileStatus.state === "error" && (
                <span className="status error">Save failed</span>
              )}
            </div>
            <p className="card-subtitle">
              Capture your community context to ground every generated section.
            </p>
            <form className="form-grid" onSubmit={submitProfile}>
              <label>
                Community or Project Name
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="e.g., Nunavut Coastal Resilience Initiative"
                  required
                />
              </label>
              <label>
                Population
                <input
                  type="number"
                  name="population"
                  value={profileForm.population}
                  onChange={handleProfileChange}
                  placeholder="e.g., 7800"
                  min="0"
                />
              </label>
              <label>
                Region
                <input
                  type="text"
                  name="region"
                  value={profileForm.region}
                  onChange={handleProfileChange}
                  placeholder="e.g., Qikiqtaaluk"
                />
              </label>
              <label className="full-width">
                Priorities (one per line)
                <textarea
                  name="priorities"
                  value={profileForm.priorities}
                  onChange={handleProfileChange}
                  placeholder={"Housing; food security; clean energy"}
                  rows={3}
                />
              </label>
              <label className="full-width">
                Constraints (one per line)
                <textarea
                  name="constraints"
                  value={profileForm.constraints}
                  onChange={handleProfileChange}
                  placeholder={"Limited construction season\nHigh transportation costs"}
                  rows={3}
                />
              </label>
              <label className="full-width">
                Community Assets (one per line)
                <textarea
                  name="assets"
                  value={profileForm.assets}
                  onChange={handleProfileChange}
                  placeholder={"Skilled local tradespeople\nPartnership with Arctic College"}
                  rows={3}
                />
              </label>
              <label className="full-width">
                Baseline Metrics (key: value per line)
                <textarea
                  name="baselineMetrics"
                  value={profileForm.baselineMetrics}
                  onChange={handleProfileChange}
                  placeholder={"Greenhouse gas emissions: 15kt\nHomes requiring retrofits: 240"}
                  rows={3}
                />
              </label>
              <label className="full-width">
                Additional Notes
                <textarea
                  name="notes"
                  value={profileForm.notes}
                  onChange={handleProfileChange}
                  placeholder="Important context, partners, or commitments"
                  rows={3}
                />
              </label>
              <div className="actions full-width">
                <button type="submit" className="primary-button">
                  Save Profile
                </button>
              </div>
              {profileError && (
                <p className="error-message" role="alert">
                  {profileError}
                </p>
              )}
            </form>
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Grant Details</h2>
            </div>
            <p className="card-subtitle">
              Tell the assistant which funding stream you are targeting.
            </p>
            <div className="form-grid">
              <label className="full-width">
                Grant Title
                <input
                  type="text"
                  name="title"
                  value={grantForm.title}
                  onChange={handleGrantChange}
                  placeholder="e.g., Northern Infrastructure Resilience Fund"
                  required
                />
              </label>
              <label className="full-width">
                Grant Sponsor
                <input
                  type="text"
                  name="sponsor"
                  value={grantForm.sponsor}
                  onChange={handleGrantChange}
                  placeholder="e.g., Infrastructure Canada"
                />
              </label>
              <label className="full-width">
                Key Criteria (one per line)
                <textarea
                  name="criteria"
                  value={grantForm.criteria}
                  onChange={handleGrantChange}
                  placeholder={"Climate mitigation\nCommunity economic benefits\nIndigenous partnership"}
                  rows={3}
                />
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  name="dueDate"
                  value={grantForm.dueDate}
                  onChange={handleGrantChange}
                />
              </label>
              <label>
                Maximum Amount (CAD)
                <input
                  type="number"
                  step="any"
                  name="maxAmount"
                  value={grantForm.maxAmount}
                  onChange={handleGrantChange}
                  placeholder="e.g., 1250000"
                  min="0"
                />
              </label>
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Proposal Outline</h2>
            </div>
            <p className="card-subtitle">
              Choose which sections to build and provide a short brief or prompt.
            </p>
            <label className="full-width">
              Project Brief for the AI
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Summarize the project goals, partners, and the support you need."
                rows={4}
              />
            </label>
            <div className="section-list">
              {sections.map((section) => (
                <article className="section-item" key={section.id}>
                  <div className="section-item-header">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(event) =>
                          handleSectionChange(section.id, "enabled", event.target.checked)
                        }
                      />
                      <span className="slider" />
                    </label>
                    <div>
                      <h3>{section.title}</h3>
                      <p className="section-meta">
                        {section.type === "narrative" && "Narrative"}
                        {section.type === "bullets" && "Bullet list"}
                        {section.type === "table" && "Budget table"}
                      </p>
                    </div>
                  </div>
                  <div className="section-fields">
                    <label>
                      Word Limit
                      <input
                        type="number"
                        min="0"
                        value={section.wordMax}
                        onChange={(event) =>
                          handleSectionChange(section.id, "wordMax", event.target.value)
                        }
                        placeholder="Optional"
                      />
                    </label>
                    <label>
                      Required Terms
                      <textarea
                        value={section.requiredTerms}
                        onChange={(event) =>
                          handleSectionChange(section.id, "requiredTerms", event.target.value)
                        }
                        placeholder="Comma or line separated terms"
                        rows={2}
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
            <div className="actions">
              <button
                type="button"
                className="primary-button"
                onClick={generateProposal}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate Proposal"}
              </button>
            </div>
            {outlineError && (
              <p className="error-message" role="alert">
                {outlineError}
              </p>
            )}
          </section>
        </div>

        <div className="right-column">
          <ProposalPanel proposal={proposal} isGenerating={isGenerating} />
        </div>
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="app-header">
      <div>
        <h1>Will You Fund Me?</h1>
        <p className="tagline">
          A proposal co-pilot designed for Northern and remote communities.
        </p>
      </div>
      <nav>
        <ul>
          <li>
            <a href="#profile">Profile</a>
          </li>
          <li>
            <a href="#proposal">Proposal</a>
          </li>
          <li>
            <a href="https://github.com/fci-innovation" target="_blank" rel="noreferrer">
              Learn more
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <h2>Build funder-ready narratives that reflect your community.</h2>
        <p>
          Capture your local priorities, align with grant criteria, and let the Municipal Proposal
          Copilot draft tailored sections complete with evidence citations and validation checks.
        </p>
      </div>
      <div className="hero-highlight">
        <p>
          “The Copilot helped us turn community knowledge into a polished submission in one afternoon.”
        </p>
        <span>— Pilot municipality partner</span>
      </div>
    </section>
  );
}

function ProposalPanel({ proposal, isGenerating }) {
  if (isGenerating && !proposal) {
    return (
      <section className="card proposal" id="proposal">
        <h2>Generating proposal…</h2>
        <p>This can take a minute while we assemble evidence-backed content.</p>
      </section>
    );
  }

  if (!proposal) {
    return (
      <section className="card proposal" id="proposal">
        <h2>Proposal Preview</h2>
        <p>
          Save your community profile and generate at least one section to see the AI-assisted draft
          here.
        </p>
      </section>
    );
  }

  return (
    <section className="card proposal" id="proposal">
      <h2>{proposal.title || "Proposal Draft"}</h2>
      <div className="proposal-sections">
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
    <article className="proposal-section">
      <div className="proposal-section-header">
        <h3>{volume.title}</h3>
        <span className={`badge ${validation.passed ? "success" : "warning"}`}>
          {validation.passed ? "Validation passed" : "Needs review"}
        </span>
      </div>
      {volume.type === "narrative" && volume.body && (
        <p className="proposal-body">{volume.body}</p>
      )}
      {volume.type === "bullets" && volume.items && (
        <ul>
          {volume.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
      {volume.type === "table" && volume.rows && (
        <table>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Cost (CAD)</th>
            </tr>
          </thead>
          <tbody>
            {volume.rows.map((row, index) => (
              <tr key={index}>
                <td>{row.item}</td>
                <td>{row.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <details className="citations">
        <summary>Citations ({citations.length})</summary>
        <ul>
          {citations.map((citation, index) => (
            <li key={index}>
              <strong>{citation.source}:</strong> {citation.snippet}
            </li>
          ))}
        </ul>
      </details>

      {!validation.passed && validation.issues.length > 0 && (
        <div className="validation-issues">
          <h4>Validation feedback</h4>
          <ul>
            {validation.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default App;
