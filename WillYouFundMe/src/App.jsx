import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";


function App() {
  return (
    <main className="container">
      <Header />
      <Hero />
      <Instructions />
      <Body />
    </main>
  );
}

function Header() {
  return (
    <div class="header">
      <img src="src/assets/ChatGPT Image Oct 26, 2025, 12_25_50 PM.png" alt="logo" height="100px" width="100px"></img>
      <div>
        <ul class="header-links">
          <li><a href="#">About</a></li>
          <li><a href="#">Instructions</a></li>
          <li><a href="#">Build Your Proposal</a></li>
        </ul>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <div class="hero">
      <div class="hero-text">
        <h1 class="Main Text">Build Your Funding Proposal Today!</h1>
        <p> Built with Nunavut’s unique context in mind, this tool combines local knowledge with artificial
            intelligence to help you craft stronger, more compelling funding proposals — faster and with
            confidence. </p>
      </div>
      <img src="" alt="Hero Image" height="200px" width="300px"></img>
    </div>
  )
}

function Instructions() {
  return (
    <div class="instructions">
      <h1>How To Use</h1>
      <ol>
        <li>blah blah blah</li>
        <li>blah blah blah</li>
        <li>blah blah blah</li>
      </ol>
    </div>
  )
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // You can replace this with your API call or signal to trigger AI generation
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Generate Your Proposal
      </h2>
      <p className="text-gray-600 mb-6">
        Fill in the details below to generate a customized proposal draft.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Project Name
          </label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            placeholder="Enter your project name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Community Name
          </label>
          <input
            type="text"
            name="communityName"
            value={formData.communityName}
            onChange={handleChange}
            placeholder="e.g., Iqaluit, Rankin Inlet"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Funding Call or Program
          </label>
          <input
            type="text"
            name="fundingCall"
            value={formData.fundingCall}
            onChange={handleChange}
            placeholder="e.g., Community Infrastructure Fund 2025"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Project Objectives
          </label>
          <textarea
            name="objectives"
            value={formData.objectives}
            onChange={handleChange}
            placeholder="Summarize your main project goals..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Project Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a short overview of your project..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Estimated Budget (CAD)
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g., 25000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Timeline (months)
            </label>
            <input
              type="number"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              placeholder="e.g., 6"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Generate Proposal
        </button>
      </form>
    </div>
  )
}

function Body() {
  return (
    <div class="body">
      <div class="input">
        <ProposalForm />
        <form class="prompt">

        </form>
      </div>
      <div class="proposal">

      </div>
    </div>
  )
}

export default App;
