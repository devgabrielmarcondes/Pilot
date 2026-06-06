"use client";

import { Check, ChevronDown, Download, Loader2, Play, Send, Share2, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CampaignBrief, CampaignDraft, FinalCampaignReport, ToolCallTrace } from "@/lib/schemas";

type PlanResponse =
  | {
      ok: true;
      provider: string;
      draft: CampaignDraft;
    }
  | {
      ok: false;
      error: string;
      findings?: Array<{ message: string; severity: string }>;
    };

type FinalizeResponse =
  | {
      ok: true;
      provider: string;
      report: FinalCampaignReport;
    }
  | {
      ok: false;
      error: string;
    };

const channelOptions = [
  "TikTok",
  "Instagram",
  "YouTube Shorts",
  "Twitch",
  "LinkedIn",
  "Retail Media",
] as const;

const initialBrief: CampaignBrief = {
  brandName: "Volt Pop",
  productOrService: "zero sugar energy drink",
  campaignGoal: "Launch a two-week creator campaign that earns Gen Z trial and social participation.",
  targetAudience: "Gen Z students and young professionals interested in fitness and gaming",
  market: "United States",
  budgetRange: "$40k-$60k",
  channels: ["TikTok", "Instagram", "YouTube Shorts"],
  timelineWeeks: 2,
  constraints: "Avoid medical claims and keep creator language flexible.",
};

export function CampaignWorkspace() {
  const [brief, setBrief] = useState<CampaignBrief>(initialBrief);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [report, setReport] = useState<FinalCampaignReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const visibleReport = report ?? draft;
  const completedTools = draft?.toolTrace.filter((trace) => trace.status === "success").length ?? 0;
  const title = `${brief.brandName} — ${brief.productOrService}`;
  const status = useMemo(() => {
    if (isPlanning) {
      return {
        dot: "running",
        label: "Agent running — planning tool calls and campaign strategy",
        meta: "Live run",
      };
    }

    if (report) {
      return {
        dot: "done",
        label: "Final report approved and ready",
        meta: `${completedTools} tools completed`,
      };
    }

    if (draft) {
      return {
        dot: "wait",
        label: "Agent paused — human approval required",
        meta: `${completedTools}/${draft.toolTrace.length} tools completed`,
      };
    }

    if (error) {
      return {
        dot: "error",
        label: "Guardrail or request error",
        meta: "Review brief",
      };
    }

    return {
      dot: "wait",
      label: "Ready — submit a campaign brief to start the agent",
      meta: "0 tool calls",
    };
  }, [completedTools, draft, error, isPlanning, report]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPlanning(true);
    setError(null);
    setReport(null);

    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const payload = (await response.json()) as PlanResponse;

      if (!payload.ok) {
        setError(
          payload.findings?.map((finding) => finding.message).join(" ") ??
            payload.error ??
            "Unable to plan campaign.",
        );
        return;
      }

      setDraft(payload.draft);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to plan campaign.");
    } finally {
      setIsPlanning(false);
    }
  }

  async function handleApprove() {
    if (!draft) {
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, approved: true }),
      });
      const payload = (await response.json()) as FinalizeResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      setReport(payload.report);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to finalize campaign.",
      );
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Campaign Brief</div>

        <form onSubmit={handleSubmit}>
          <Field label="Brand">
            <input
              className="form-input"
              value={brief.brandName}
              onChange={(event) => setBrief({ ...brief, brandName: event.target.value })}
            />
          </Field>

          <Field label="Product or service">
            <input
              className="form-input"
              value={brief.productOrService}
              onChange={(event) => setBrief({ ...brief, productOrService: event.target.value })}
            />
          </Field>

          <Field label="Campaign objective">
            <textarea
              className="form-textarea"
              value={brief.campaignGoal}
              onChange={(event) => setBrief({ ...brief, campaignGoal: event.target.value })}
              rows={3}
            />
          </Field>

          <Field label="Target audience">
            <textarea
              className="form-textarea"
              value={brief.targetAudience}
              onChange={(event) => setBrief({ ...brief, targetAudience: event.target.value })}
              rows={3}
            />
          </Field>

          <Field label="Platforms">
            <div className="form-tags">
              {channelOptions.map((channel) => (
                <label key={channel} className="form-tag">
                  <input
                    type="checkbox"
                    checked={brief.channels.includes(channel)}
                    onChange={(event) => {
                      const channels = event.target.checked
                        ? [...brief.channels, channel]
                        : brief.channels.filter((item) => item !== channel);
                      setBrief({ ...brief, channels });
                    }}
                  />
                  <span>{channel}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Market">
            <input
              className="form-input"
              value={brief.market}
              onChange={(event) => setBrief({ ...brief, market: event.target.value })}
            />
          </Field>

          <Field label="Budget range">
            <input
              className="form-input"
              value={brief.budgetRange}
              onChange={(event) => setBrief({ ...brief, budgetRange: event.target.value })}
            />
          </Field>

          <Field label="Timeline">
            <input
              className="form-input"
              type="number"
              min={2}
              max={8}
              value={brief.timelineWeeks}
              onChange={(event) =>
                setBrief({ ...brief, timelineWeeks: Number(event.target.value) })
              }
            />
            <div className="form-hint">Weeks. Demo output uses a two-week calendar.</div>
          </Field>

          <Field label="Key constraints">
            <textarea
              className="form-textarea"
              value={brief.constraints}
              onChange={(event) => setBrief({ ...brief, constraints: event.target.value })}
              rows={3}
            />
          </Field>

          <Button className="w-full" type="submit" disabled={isPlanning}>
            {isPlanning ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
            {isPlanning ? "Running agent" : "Run Agent"}
          </Button>
        </form>
      </aside>

      <main className="main-content">
        <div className="main-header">
          <div>
            <h1 className="main-title">{title}</h1>
            <div className="main-subtitle">
              Campaign #{draft?.id.slice(0, 8).toUpperCase() ?? "SAMY-2026"} ·{" "}
              {draft ? `Generated with ${draft.provider}` : "Ready for planning"}
            </div>
          </div>
          <div className="header-actions">
            <Button size="sm" variant="secondary" type="button">
              <Download size={12} />
              Export
            </Button>
            <Button size="sm" variant="secondary" type="button">
              <Share2 size={12} />
              Share
            </Button>
          </div>
        </div>

        {error ? <div className="notice notice-danger">{error}</div> : null}

        <div className="status-bar">
          <div className={`status-dot ${status.dot}`} />
          <span className="status-label">{status.label}</span>
          <span className="status-meta">{status.meta}</span>
        </div>

        <section className="section">
          <SectionHeader title="Agent Timeline" />
          {draft ? (
            <div className="timeline">
              {draft.toolTrace.map((trace) => (
                <ToolTraceItem key={trace.id} trace={trace} />
              ))}
              {!report ? (
                <TimelineGate title="Human Approval" meta="Queued — final step">
                  The agent paused because it needs your approval before producing the final report.
                </TimelineGate>
              ) : null}
            </div>
          ) : (
            <div className="notice">
              The trace will show each agent step, tool call, result summary, and approval gate.
            </div>
          )}
        </section>

        {draft ? (
          <section className="section">
            <SectionHeader title="Human Approval" />
            <div className="approval-card">
              <div className="approval-header">
                <div className="approval-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="approval-title">
                    {report ? "Campaign plan approved" : "Review Campaign Plan"}
                  </div>
                  <div className="approval-desc">
                    {report
                      ? "The final report was generated after explicit human approval."
                      : "The agent generated a complete draft. Approve to continue."}
                  </div>
                </div>
              </div>
              <div className="approval-summary">
                <strong>{draft.brief.brandName}</strong> — {draft.executiveSummary}{" "}
                {draft.creatorShortlist.length} creators shortlisted, {draft.calendar.length} posts
                planned, and {draft.safetyFindings.length} safety findings recorded.
              </div>
              <div className="approval-actions">
                <Button onClick={handleApprove} disabled={Boolean(report) || isFinalizing} type="button">
                  {isFinalizing ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
                  {report ? "Approved" : isFinalizing ? "Finalizing" : "Approve"}
                </Button>
                <Button variant="secondary" type="button">
                  Request Changes
                </Button>
                <Button variant="danger" size="sm" type="button" disabled={Boolean(report)}>
                  Reject
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {visibleReport ? (
          <section className="section">
            <SectionHeader title="Campaign Report" />
            <div className="report-tabs">
              <Tabs defaultValue="strategy">
                <div className="report-tab-shell">
                  <TabsList>
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="creators">Creators</TabsTrigger>
                    <TabsTrigger value="safety">Safety</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="strategy" className="report-tab-panel">
                  <StrategyTab report={visibleReport} />
                </TabsContent>
                <TabsContent value="calendar" className="report-tab-panel">
                  <CalendarTab report={visibleReport} />
                </TabsContent>
                <TabsContent value="creators" className="report-tab-panel">
                  <CreatorsTab report={visibleReport} />
                </TabsContent>
                <TabsContent value="safety" className="report-tab-panel">
                  <SafetyTab report={visibleReport} />
                </TabsContent>
              </Tabs>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-group">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="section-header">
      <span className="section-title">{title}</span>
      <div className="section-line" />
    </div>
  );
}

function ToolTraceItem({ trace }: { trace: ToolCallTrace }) {
  const [open, setOpen] = useState(trace.toolName === "knowledge_retrieve");
  const status = trace.status === "success" ? "done" : trace.status === "blocked" ? "error" : "running";

  return (
    <div className="tl-item">
      <div className={`tl-dot ${status}`} />
      <div className="tl-head">
        <span className="tl-title">{formatToolName(trace.toolName)}</span>
        <span className={`tl-badge ${status}`}>{trace.status === "success" ? "complete" : trace.status}</span>
      </div>
      <div className="tl-meta">
        {trace.durationMs}ms · {trace.agent}
      </div>
      <div className="tl-body">{trace.summary}</div>
      <Collapsible className="tl-expand" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="tl-expand-head">
          <span>
            Tool: {trace.toolName} · {trace.status} · {trace.durationMs}ms
          </span>
          <ChevronDown className={`chevron ${open ? "open" : ""}`} size={12} />
        </CollapsibleTrigger>
        <CollapsibleContent className="tl-expand-body">
          {JSON.stringify(
            {
              input: trace.input,
              output: trace.output,
            },
            null,
            2,
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function TimelineGate({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tl-item">
      <div className="tl-dot wait" />
      <div className="tl-head">
        <span className="tl-title">{title}</span>
        <span className="tl-badge wait">waiting</span>
      </div>
      <div className="tl-meta">{meta}</div>
      <div className="tl-body">{children}</div>
    </div>
  );
}

function StrategyTab({ report }: { report: CampaignDraft | FinalCampaignReport }) {
  const finalNarrative = "finalNarrative" in report ? report.finalNarrative : report.executiveSummary;

  return (
    <div className="report-grid">
      <ReportItem label="Objective" value={report.brief.campaignGoal} desc={report.brief.productOrService} />
      <ReportItem
        label="Estimated reach"
        value={`${report.creatorShortlist.length * 420}K – ${report.creatorShortlist.length * 620}K`}
        desc="Modeled from creator fit and campaign cadence"
      />
      <ReportItem
        label="Campaign phases"
        value={`${report.brief.timelineWeeks} weeks / ${report.strategyPillars.length} pillars`}
        desc={report.strategyPillars.join(" · ")}
      />
      <ReportItem
        label="Content volume"
        value={`${report.calendar.length} posts`}
        desc={`Across ${report.brief.channels.join(", ")}`}
      />
      <ReportItem label="Budget allocation" value={report.brief.budgetRange} desc="Creators, boosted content, and production" />
      <ReportItem label="Primary KPIs" value="Engagement + trial intent" desc={finalNarrative} />
    </div>
  );
}

function ReportItem({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div>
      <div className="report-item-label">{label}</div>
      <div className="report-item-value">{value}</div>
      <div className="report-item-desc">{desc}</div>
    </div>
  );
}

function CalendarTab({ report }: { report: CampaignDraft | FinalCampaignReport }) {
  const firstWeek = report.calendar.filter((post) => post.day <= 5);
  const secondWeek = report.calendar.filter((post) => post.day > 5);

  return (
    <div className="report-calendar-grid">
      <div className="report-calendar-week">
        Week 1
        <br />
        <span className="text-[10px] text-black/40">TEASE</span>
      </div>
      <div className="report-calendar-items">
        {firstWeek.map((post) => (
          <CalendarItem key={`${post.day}-${post.channel}`} post={post} />
        ))}
      </div>
      <div className="report-calendar-week">
        Week 2
        <br />
        <span className="text-[10px] text-black/40">CONVERT</span>
      </div>
      <div className="report-calendar-items">
        {secondWeek.map((post) => (
          <CalendarItem key={`${post.day}-${post.channel}`} post={post} />
        ))}
      </div>
    </div>
  );
}

function CalendarItem({ post }: { post: CampaignDraft["calendar"][number] }) {
  return (
    <div className="report-calendar-item">
      <div className="report-calendar-platform">
        Day {post.day} · {post.channel} · {post.format}
      </div>
      {post.concept}
    </div>
  );
}

function CreatorsTab({ report }: { report: CampaignDraft | FinalCampaignReport }) {
  return (
    <div className="s-table-wrap">
      <table className="s-table">
        <thead>
          <tr>
            <th>Creator</th>
            <th>Niche</th>
            <th>Cost</th>
            <th>Risk</th>
            <th>Fit reason</th>
          </tr>
        </thead>
        <tbody>
          {report.creatorShortlist.map((creator) => (
            <tr key={creator.handle}>
              <td className="mono">{creator.handle}</td>
              <td>{creator.niche}</td>
              <td className="mono">{creator.estimatedCost}</td>
              <td>
                <Badge variant={creator.risk === "low" ? "success" : "warning"}>{creator.risk}</Badge>
              </td>
              <td>{creator.fitReason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SafetyTab({ report }: { report: CampaignDraft | FinalCampaignReport }) {
  const checks =
    report.safetyFindings.length > 0
      ? report.safetyFindings
      : [
          {
            id: "no-findings",
            severity: "info" as const,
            category: "quality" as const,
            message: "No material safety findings.",
          },
        ];

  return (
    <div>
      {checks.map((finding) => {
        const isDanger = finding.severity === "block";
        const isWarning = finding.severity === "warning";

        return (
          <div className="safety-check" key={finding.id}>
            <div className={`safety-icon ${isDanger ? "safety-danger" : isWarning ? "safety-warn" : "safety-pass"}`}>
              {isDanger ? "!" : isWarning ? "!" : "✓"}
            </div>
            <span className="safety-label">{finding.message}</span>
            <span
              className="safety-status"
              style={{ color: isDanger ? "var(--danger)" : isWarning ? "var(--warn)" : "var(--success)" }}
            >
              {isDanger ? "BLOCK" : isWarning ? "REVIEW" : "PASS"}
            </span>
          </div>
        );
      })}
      {"launchChecklist" in report
        ? report.launchChecklist.map((item) => (
            <div className="safety-check" key={item}>
              <div className="safety-icon safety-pass">✓</div>
              <span className="safety-label">{item}</span>
              <span className="safety-status" style={{ color: "var(--success)" }}>
                READY
              </span>
            </div>
          ))
        : null}
    </div>
  );
}

function formatToolName(toolName: string) {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
