import {
  ArrowRight,
  BarChart3,
  Calendar,
  FileText,
  Pen,
  Plus,
  Send,
  Shield,
} from "lucide-react";

const agents = [
  {
    icon: Send,
    name: "Research Agent",
    desc: "Scans the market, competitors, audiences and trends.",
    color: "bg-black",
    iconColor: "text-white",
  },
  {
    icon: Calendar,
    name: "Strategy Agent",
    desc: "Builds the campaign strategy, messaging and positioning.",
    color: "bg-[#8B5CF6]",
    iconColor: "text-white",
  },
  {
    icon: Pen,
    name: "Content Agent",
    desc: "Creates content ideas, briefs and calendars.",
    color: "bg-[#14B8A6]",
    iconColor: "text-white",
  },
  {
    icon: BarChart3,
    name: "Media Agent",
    desc: "Plans budget allocation and channel mix.",
    color: "bg-[#F97316]",
    iconColor: "text-white",
  },
  {
    icon: Shield,
    name: "Measurement Agent",
    desc: "Defines KPIs, tracking and performance forecast.",
    color: "bg-[#EC4899]",
    iconColor: "text-white",
  },
];

const activityFeed = [
  { time: "10:24", agent: "Research Agent", action: "Analyzing market trends" },
  { time: "10:24", agent: "Research Agent", action: "Scanning competitor campaigns" },
  { time: "10:25", agent: "Research Agent", action: "Identifying audience segments" },
  { time: "10:26", agent: "Strategy Agent", action: "Building campaign strategy" },
  { time: "10:28", agent: "Media Agent", action: "Calculating budget allocation" },
  { time: "10:29", agent: "Content Agent", action: "Generating content calendar" },
  { time: "10:31", agent: "Measurement Agent", action: "Defining success metrics" },
];

const assistantMessages = [
  {
    text: "Here's what I found about your top competitors' Q4 campaigns.",
    file: { name: "competitor-analysis.pdf", size: "12.4 KB" },
  },
  {
    text: "Audience insights are ready.",
    file: { name: "audience-segments.csv", size: "8.7 KB" },
  },
  {
    text: "I've built a first draft of the campaign strategy and channel mix.",
    file: { name: "strategy-draft.pdf", size: "15.2 KB" },
  },
];

export function LandingAgents() {
  return (
    <section className="landing-agents">
      <div className="landing-agents-inner">
        <div className="landing-agents-header">
          <div>
            <h2 className="landing-agents-title">Your AI marketing team.<br />Always on.</h2>
          </div>
          <p className="landing-agents-subtitle">
            Pilot's AI agents handle the heavy lifting&mdash;from research to strategy, content and optimization&mdash;so your team can focus on what matters.
          </p>
        </div>

        <div className="landing-agents-grid">
          {/* Left Panel - Agents List */}
          <div className="agents-panel">
            <div className="agents-panel-label">PILOT AGENTS</div>
            <div className="agents-list">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <div className="agent-row" key={agent.name}>
                    <div className={`agent-icon ${agent.color}`}>
                      <Icon size={18} className={agent.iconColor} />
                    </div>
                    <div className="agent-info">
                      <div className="agent-name">{agent.name}</div>
                      <div className="agent-desc">{agent.desc}</div>
                    </div>
                    <ArrowRight size={16} className="agent-arrow" />
                  </div>
                );
              })}
              <div className="agent-row agent-row-create">
                <div className="agent-icon-create">
                  <Plus size={18} />
                </div>
                <div className="agent-info">
                  <div className="agent-name">Create your own</div>
                  <div className="agent-desc">Build custom agents for your unique workflows.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Activity + Assistant */}
          <div className="workspace-panel">
            <div className="workspace-header">
              <div>
                <div className="workspace-title">Q4 Product Launch</div>
                <div className="workspace-meta">
                  Workspace
                  <span className="workspace-dot" />
                  Running
                </div>
              </div>
            </div>

            <div className="workspace-body">
              {/* Activity Feed */}
              <div className="activity-feed">
                <div className="activity-label">ACTIVITY</div>
                {activityFeed.map((item, i) => (
                  <div className="activity-row" key={i}>
                    <span className="activity-time">{item.time}</span>
                    <div>
                      <div className="activity-agent">{item.agent}</div>
                      <div className="activity-action">{item.action}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Assistant Chat */}
              <div className="assistant-feed">
                {assistantMessages.map((msg, i) => (
                  <div className="assistant-bubble" key={i}>
                    <div className="assistant-bubble-header">
                      <div className="assistant-bubble-avatar">P</div>
                      <span className="assistant-bubble-name">Pilot Assistant</span>
                    </div>
                    <div className="assistant-bubble-text">{msg.text}</div>
                    {msg.file && (
                      <div className="assistant-bubble-file">
                        <FileText size={16} className="text-black/40" />
                        <span>{msg.file.name}</span>
                        <span className="assistant-bubble-file-size">{msg.file.size}</span>
                      </div>
                    )}
                  </div>
                ))}

                <div className="assistant-input-mock">
                  <span className="text-black/30 text-sm">Ask anything about your campaign...</span>
                  <button type="button" className="assistant-send-btn">
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
