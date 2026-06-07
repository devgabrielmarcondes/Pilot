"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Pilot?",
    answer: "Pilot is an AI-powered marketing campaign platform that helps you plan, launch, and optimize campaigns using autonomous AI agents. It guides you through a structured brief, generates strategy, calendar, and creator recommendations, then lets you manage everything from a command center.",
  },
  {
    question: "How does the AI agent work?",
    answer: "The AI agent analyzes your campaign brief, researches trends and competitors, builds a content calendar, recommends creators, scores risks, and generates a complete campaign plan. You review and approve the output before it becomes actionable.",
  },
  {
    question: "Do I need to connect social media accounts?",
    answer: "No. Pilot is a planning and management platform. It generates strategies, calendars, budgets, and creative briefs that you can execute on your own channels. No external social media API connections are required.",
  },
  {
    question: "What AI models does Pilot use?",
    answer: "Pilot supports Anthropic Claude, OpenAI-compatible providers, and includes a deterministic mock mode for offline demos. You can configure your preferred provider through environment variables.",
  },
  {
    question: "Is my data stored securely?",
    answer: "All campaign data is stored locally in your browser using localStorage. No data is sent to external servers except when communicating with your configured AI provider. See our Privacy Policy for details.",
  },
  {
    question: "Can I use templates?",
    answer: "Yes. Pilot includes pre-built campaign templates for beverage launches, beauty products, app growth, and B2B creator campaigns. You can also start from scratch with the guided wizard.",
  },
  {
    question: "What is the Command Center?",
    answer: "The Command Center is your campaign management hub with Board (Kanban), Calendar, List, Budget, Metrics, and Assistant views. It lets you manage tasks, track content, allocate budget, and chat with an AI assistant about your campaign.",
  },
  {
    question: "Is Pilot free to use?",
    answer: "Pilot is an open portfolio demo project. The core platform is free to use with mock mode. To use real AI providers (Anthropic, OpenAI-compatible), you need your own API keys.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="landing-faq" id="faq">
      <div className="landing-faq-inner">
        <div className="landing-faq-header">
          <h2 className="landing-faq-title">Frequently Asked Questions</h2>
          <p className="landing-faq-subtitle">Everything you need to know about Pilot.</p>
        </div>
        <div className="landing-faq-list">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`landing-faq-item ${openIndex === index ? "open" : ""}`}
            >
              <button
                className="landing-faq-question"
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span>{faq.question}</span>
                <ChevronDown size={18} className={`landing-faq-chevron ${openIndex === index ? "open" : ""}`} />
              </button>
              <div className="landing-faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
