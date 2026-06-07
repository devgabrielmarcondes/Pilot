"use client";

import {
  Check,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import {
  createEmptyCampaignProject,
  updateProjectBrief,
  upsertRun,
  useCampaignStore,
} from "@/lib/campaign-store";
import {
  CampaignBriefSchema,
  type CampaignBrief,
  type CampaignBriefDraft,
  type CampaignDraft,
  type CampaignProject,
  type CampaignRun,
  type FinalCampaignReport,
  type ToolCallTrace,
} from "@/lib/schemas";

const workspaceRoute = "/workspace" as never;
const campaignsRoute = "/" as never;
const evaluationsRoute = "/evaluations" as never;

type PlanResponse =
  | {
      ok: true;
      provider: "anthropic" | "opencode" | "mock";
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

export function CampaignWorkspace() {
  const router = useRouter();
  const { hasLoaded, activeProject, latestRun, saveProject, saveBrief, saveRun } =
    useCampaignStore();
  const [error, setError] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const readiness = useMemo(
    () => (activeProject ? buildReadiness(activeProject.brief) : []),
    [activeProject],
  );
  const parsedBrief = activeProject
    ? CampaignBriefSchema.safeParse(activeProject.brief)
    : { success: false as const };
  const canRun = parsedBrief.success && !isPlanning;

  function createAndOpen() {
    const project = createEmptyCampaignProject();
    saveProject(project);
    router.push(workspaceRoute);
  }

  function updateBrief(nextBrief: CampaignBriefDraft) {
    if (!activeProject) {
      return;
    }

    saveBrief(activeProject, nextBrief);
  }

  async function handleRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeProject) {
      return;
    }

    const briefResult = CampaignBriefSchema.safeParse(activeProject.brief);

    if (!briefResult.success) {
      setError("Complete the required brief fields before running the agent.");
      return;
    }

    const now = new Date().toISOString();
    setIsPlanning(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefResult.data),
      });
      const payload = (await response.json()) as PlanResponse;

      if (!payload.ok) {
        const blockedRun: CampaignRun = {
          id: crypto.randomUUID(),
          projectId: activeProject.id,
          status: "blocked",
          createdAt: now,
          updatedAt: new Date().toISOString(),
          error:
            payload.findings?.map((finding) => finding.message).join(" ") ??
            payload.error ??
            "The campaign run was blocked.",
        };
        saveRun(activeProject, blockedRun);
        setError(blockedRun.error ?? "The campaign run was blocked.");
        return;
      }

      const run: CampaignRun = {
        id: crypto.randomUUID(),
        projectId: activeProject.id,
        status: "planned",
        createdAt: now,
        updatedAt: new Date().toISOString(),
        provider: payload.provider,
        draft: payload.draft,
      };
      saveRun(activeProject, run);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run agent.");
    } finally {
      setIsPlanning(false);
    }
  }

  async function handleApprove(run: CampaignRun) {
    if (!activeProject || !run.draft) {
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: run.draft, approved: true }),
      });
      const payload = (await response.json()) as FinalizeResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      saveRun(activeProject, {
        ...run,
        status: "approved",
        updatedAt: new Date().toISOString(),
        provider: payload.report.provider,
        report: payload.report,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to approve run.");
    } finally {
      setIsFinalizing(false);
    }
  }

  if (!hasLoaded) {
    return <main className="page" />;
  }

  if (!activeProject) {
    return (
      <main className="page">
        <EmptyState
          icon={FileText}
          title="No campaign selected"
          description="Create a campaign first. The workspace stays empty until there is a real project to plan."
          actionLabel="Create Campaign"
          onAction={createAndOpen}
        />
      </main>
    );
  }

  return (
    <div className="app-layout">
      <CampaignBriefBuilder
        canRun={canRun}
        isPlanning={isPlanning}
        project={activeProject}
        readiness={readiness}
        onRun={handleRun}
        onUpdateBrief={updateBrief}
      />

      <main className="main-content">
        <div className="main-header">
          <div>
            <h1 className="main-title">{activeProject.name}</h1>
            <div className="main-subtitle">
              {latestRun ? `Run ${latestRun.id.slice(0, 8).toUpperCase()} - ${latestRun.status}` : "Brief not run yet"}
            </div>
          </div>
          <div className="header-actions">
            <Button variant="secondary" size="sm" type="button" onClick={() => router.push(campaignsRoute)}>
              Campaigns
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={() => router.push(evaluationsRoute)}>
              Evaluations
            </Button>
          </div>
        </div>

        {error ? <div className="notice notice-danger">{error}</div> : null}

        <AgentRunWorkspace
          isFinalizing={isFinalizing}
          isPlanning={isPlanning}
          readiness={readiness}
          run={latestRun}
          onApprove={handleApprove}
        />

        <CampaignOutputPanel run={latestRun} />
      </main>
    </div>
  );
}

function CampaignBriefBuilder({
  project,
  readiness,
  canRun,
  isPlanning,
  onRun,
  onUpdateBrief,
}: {
  project: CampaignProject;
  readiness: ReadinessItem[];
  canRun: boolean;
  isPlanning: boolean;
  onRun: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateBrief: (brief: CampaignBriefDraft) => void;
}) {
  const brief = project.brief;

  function patchBrief(patch: Partial<CampaignBriefDraft>) {
    onUpdateBrief({
      ...brief,
      ...patch,
    });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Campaign Brief</div>
      <form onSubmit={onRun}>
        <Field label="Brand">
          <input
            className="form-input"
            value={brief.brandName}
            onChange={(event) => patchBrief({ brandName: event.target.value })}
            placeholder="Brand name"
          />
        </Field>

        <Field label="Product or service">
          <input
            className="form-input"
            value={brief.productOrService}
            onChange={(event) => patchBrief({ productOrService: event.target.value })}
            placeholder="Product, offer, or service"
          />
        </Field>

        <Field label="Campaign goal">
          <textarea
            className="form-textarea"
            value={brief.campaignGoal}
            onChange={(event) => patchBrief({ campaignGoal: event.target.value })}
            placeholder="What should this campaign accomplish?"
            rows={3}
          />
        </Field>

        <Field label="Audience">
          <textarea
            className="form-textarea"
            value={brief.targetAudience}
            onChange={(event) => patchBrief({ targetAudience: event.target.value })}
            placeholder="Who is this for?"
            rows={2}
          />
        </Field>

        <Field label="Audience segments">
          <textarea
            className="form-textarea"
            value={brief.audienceSegments.join("\n")}
            onChange={(event) => patchBrief({ audienceSegments: parseList(event.target.value) })}
            placeholder={"One segment per line\nExample: Gen Z students"}
            rows={3}
          />
        </Field>

        <Field label="Brand voice">
          <input
            className="form-input"
            value={brief.brandVoice}
            onChange={(event) => patchBrief({ brandVoice: event.target.value })}
            placeholder="Confident, direct, playful"
          />
        </Field>

        <Field label="Platforms">
          <div className="form-tags">
            {channelOptions.map((channel) => (
              <label className="form-tag" key={channel}>
                <input
                  type="checkbox"
                  checked={brief.channels.includes(channel)}
                  onChange={(event) => {
                    patchBrief({
                      channels: event.target.checked
                        ? [...brief.channels, channel]
                        : brief.channels.filter((item) => item !== channel),
                    });
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
            onChange={(event) => patchBrief({ market: event.target.value })}
            placeholder="United States, Brazil, Global"
          />
        </Field>

        <Field label="Budget range">
          <input
            className="form-input"
            value={brief.budgetRange}
            onChange={(event) => patchBrief({ budgetRange: event.target.value })}
            placeholder="$40k-$60k"
          />
        </Field>

        <Field label="Success metrics">
          <textarea
            className="form-textarea"
            value={brief.successMetrics.join("\n")}
            onChange={(event) => patchBrief({ successMetrics: parseList(event.target.value) })}
            placeholder={"One metric per line\nExample: Qualified site visits"}
            rows={3}
          />
        </Field>

        <Field label="Mandatory messages">
          <textarea
            className="form-textarea"
            value={brief.mandatoryMessages.join("\n")}
            onChange={(event) => patchBrief({ mandatoryMessages: parseList(event.target.value) })}
            placeholder={"One required message per line\nExample: Zero sugar, no crash"}
            rows={3}
          />
        </Field>

        <Field label="Creator criteria">
          <textarea
            className="form-textarea"
            value={brief.creatorCriteria}
            onChange={(event) => patchBrief({ creatorCriteria: event.target.value })}
            placeholder="Creator niches, trust signals, follower range, risk constraints"
            rows={3}
          />
        </Field>

        <Field label="Competitors">
          <textarea
            className="form-textarea"
            value={brief.competitors.join("\n")}
            onChange={(event) => patchBrief({ competitors: parseList(event.target.value) })}
            placeholder="One competitor per line"
            rows={2}
          />
        </Field>

        <Field label="Forbidden claims">
          <textarea
            className="form-textarea"
            value={brief.forbiddenClaims.join("\n")}
            onChange={(event) => patchBrief({ forbiddenClaims: parseList(event.target.value) })}
            placeholder="Claims the agent must avoid"
            rows={2}
          />
        </Field>

        <Field label="Approval requirements">
          <textarea
            className="form-textarea"
            value={brief.approvalRequirements}
            onChange={(event) => patchBrief({ approvalRequirements: event.target.value })}
            placeholder="Legal, brand, creator, or claims approval rules"
            rows={3}
          />
        </Field>

        <Field label="Knowledge notes">
          <textarea
            className="form-textarea"
            value={brief.knowledgeNotes}
            onChange={(event) => patchBrief({ knowledgeNotes: event.target.value })}
            placeholder="Optional brand context, past campaign notes, audience insights"
            rows={3}
          />
        </Field>

        <Field label="Other constraints">
          <textarea
            className="form-textarea"
            value={brief.constraints}
            onChange={(event) => patchBrief({ constraints: event.target.value })}
            placeholder="Timing, legal, creative, or channel constraints"
            rows={2}
          />
        </Field>

        <div className="mb-4 border border-black/12 rounded-[8px] p-3">
          <div className="sidebar-title mb-2">Readiness</div>
          <div className="grid gap-2">
            {readiness.map((item) => (
              <div className="flex items-start gap-2 text-xs" key={item.label}>
                <span
                  className={`mt-0.5 grid size-4 place-items-center rounded-full ${
                    item.ready ? "bg-[#16a34a]/10 text-[#16a34a]" : "bg-black/6 text-black/40"
                  }`}
                >
                  {item.ready ? <Check size={11} /> : null}
                </span>
                <span className={item.ready ? "text-black" : "text-black/45"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" type="submit" disabled={!canRun}>
          {isPlanning ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
          {isPlanning ? "Running Agent" : "Run Agent"}
        </Button>
      </form>
    </aside>
  );
}

function AgentRunWorkspace({
  run,
  readiness,
  isPlanning,
  isFinalizing,
  onApprove,
}: {
  run: CampaignRun | null;
  readiness: ReadinessItem[];
  isPlanning: boolean;
  isFinalizing: boolean;
  onApprove: (run: CampaignRun) => void;
}) {
  const readyCount = readiness.filter((item) => item.ready).length;
  const status = getRunStatus(run, isPlanning, readyCount, readiness.length);

  return (
    <section className="section">
      <SectionHeader title="Agent Run" />
      <div className="status-bar">
        <div className={`status-dot ${status.dot}`} />
        <span className="status-label">{status.label}</span>
        <span className="status-meta">{status.meta}</span>
      </div>

      {!run ? (
        <div className="notice">
          Complete the brief first. The agent timeline appears only after a real run starts.
        </div>
      ) : run.status === "blocked" ? (
        <div className="notice notice-danger">{run.error ?? "The run was blocked by guardrails."}</div>
      ) : run.draft ? (
        <>
          <div className="timeline">
            {run.draft.toolTrace.map((trace) => (
              <ToolTraceItem key={trace.id} trace={trace} />
            ))}
            {!run.report ? (
              <TimelineGate title="Human Approval" meta="Queued - final step">
                The agent paused because it needs approval before generating final campaign output.
              </TimelineGate>
            ) : null}
          </div>

          {!run.report ? (
            <div className="approval-card mt-8">
              <div className="approval-header">
                <div className="approval-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="approval-title">Review Campaign Plan</div>
                  <div className="approval-desc">
                    Approving this draft creates the final campaign output and unlocks evaluation.
                  </div>
                </div>
              </div>
              <div className="approval-summary">
                <strong>{run.draft.brief.brandName}</strong> - {run.draft.executiveSummary}{" "}
                {run.draft.creatorShortlist.length} creators, {run.draft.calendar.length} content
                items, and {run.draft.safetyFindings.length} safety findings.
              </div>
              <div className="approval-actions">
                <Button type="button" onClick={() => onApprove(run)} disabled={isFinalizing}>
                  {isFinalizing ? <Loader2 className="spin" size={14} /> : <ClipboardCheck size={14} />}
                  {isFinalizing ? "Approving" : "Approve Draft"}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function CampaignOutputPanel({ run }: { run: CampaignRun | null }) {
  if (!run?.report) {
    return (
      <section className="section">
        <SectionHeader title="Campaign Output" />
        <div className="notice">
          No approved campaign output yet. Approve a draft to generate strategy, calendar, creators,
          measurement, risks, and next actions.
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <SectionHeader title="Campaign Output" />
      <div className="report-tabs">
        <Tabs defaultValue="strategy">
          <div className="report-tab-shell">
            <TabsList>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="creators">Creators</TabsTrigger>
              <TabsTrigger value="measurement">Measurement</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="strategy" className="report-tab-panel">
            <StrategyTab report={run.report} />
          </TabsContent>
          <TabsContent value="calendar" className="report-tab-panel">
            <CalendarTab report={run.report} />
          </TabsContent>
          <TabsContent value="creators" className="report-tab-panel">
            <CreatorsTab report={run.report} />
          </TabsContent>
          <TabsContent value="measurement" className="report-tab-panel">
            <ListTab items={[...run.report.measurementPlan, ...run.report.budgetAllocation, ...run.report.nextActions]} />
          </TabsContent>
          <TabsContent value="safety" className="report-tab-panel">
            <SafetyTab report={run.report} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
        {trace.durationMs}ms - {trace.agent}
      </div>
      <div className="tl-body">{trace.summary}</div>
      <Collapsible className="tl-expand" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="tl-expand-head">
          <span>
            Tool: {trace.toolName} - {trace.status} - {trace.durationMs}ms
          </span>
          <ChevronDown className={`chevron ${open ? "open" : ""}`} size={12} />
        </CollapsibleTrigger>
        <CollapsibleContent className="tl-expand-body">
          {JSON.stringify({ input: trace.input, output: trace.output }, null, 2)}
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

function StrategyTab({ report }: { report: FinalCampaignReport }) {
  return (
    <div className="report-grid">
      <ReportItem label="Campaign goal" value={report.brief.campaignGoal} desc={report.finalNarrative} />
      <ReportItem label="Audience rationale" value={report.audienceInsight} desc={report.brief.audienceSegments.join(", ")} />
      <ReportItem
        label="Campaign phases"
        value={`${report.brief.timelineWeeks} weeks / ${report.strategyPillars.length} pillars`}
        desc={report.strategyPillars.join(" | ")}
      />
      <ReportItem
        label="Creator criteria"
        value={report.brief.creatorCriteria}
        desc={`${report.creatorShortlist.length} recommendations generated`}
      />
      <ReportItem label="Budget allocation" value={report.brief.budgetRange} desc={report.budgetAllocation.join(" | ")} />
      <ReportItem label="Next actions" value={`${report.nextActions.length} actions`} desc={report.nextActions.join(" | ")} />
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

function CalendarTab({ report }: { report: FinalCampaignReport }) {
  const firstWeek = report.calendar.filter((post) => post.day <= 5);
  const secondWeek = report.calendar.filter((post) => post.day > 5);

  return (
    <div className="report-calendar-grid">
      <CalendarGroup label="Week 1" phase="Build proof" posts={firstWeek} />
      <CalendarGroup label="Week 2" phase="Convert intent" posts={secondWeek} />
    </div>
  );
}

function CalendarGroup({
  label,
  phase,
  posts,
}: {
  label: string;
  phase: string;
  posts: FinalCampaignReport["calendar"];
}) {
  return (
    <>
      <div className="report-calendar-week">
        {label}
        <br />
        <span className="text-[10px] text-black/40">{phase}</span>
      </div>
      <div className="report-calendar-items">
        {posts.map((post) => (
          <div className="report-calendar-item" key={`${post.day}-${post.channel}`}>
            <div className="report-calendar-platform">
              Day {post.day} - {post.channel} - {post.format}
            </div>
            {post.concept}
          </div>
        ))}
      </div>
    </>
  );
}

function CreatorsTab({ report }: { report: FinalCampaignReport }) {
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

function ListTab({ items }: { items: string[] }) {
  return (
    <ul className="report-list">
      {items.map((item) => (
        <li key={item}>
          <span>{item}</span>
          <Badge variant="info">planned</Badge>
        </li>
      ))}
    </ul>
  );
}

function SafetyTab({ report }: { report: FinalCampaignReport }) {
  const items = [
    ...report.safetyFindings.map((finding) => ({
      id: finding.id,
      label: finding.message,
      status: finding.severity === "block" ? "BLOCK" : finding.severity === "warning" ? "REVIEW" : "PASS",
      tone: finding.severity === "block" ? "danger" : finding.severity === "warning" ? "warn" : "pass",
    })),
    ...report.residualRisks.map((risk) => ({
      id: risk,
      label: risk,
      status: "REVIEW",
      tone: "warn",
    })),
  ];

  return (
    <div>
      {items.map((item) => (
        <div className="safety-check" key={item.id}>
          <div className={`safety-icon ${item.tone === "danger" ? "safety-danger" : item.tone === "warn" ? "safety-warn" : "safety-pass"}`}>
            {item.tone === "pass" ? "ok" : "!"}
          </div>
          <span className="safety-label">{item.label}</span>
          <span
            className="safety-status"
            style={{ color: item.tone === "danger" ? "var(--danger)" : item.tone === "warn" ? "var(--warn)" : "var(--success)" }}
          >
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}

type ReadinessItem = {
  label: string;
  ready: boolean;
};

function buildReadiness(brief: CampaignBriefDraft): ReadinessItem[] {
  return [
    { label: "Brand, product, goal, audience, and market are defined", ready: Boolean(brief.brandName && brief.productOrService && brief.campaignGoal.length >= 20 && brief.targetAudience && brief.market) },
    { label: "At least one audience segment is supplied", ready: brief.audienceSegments.filter(Boolean).length > 0 },
    { label: "At least one channel and budget range are supplied", ready: brief.channels.length > 0 && Boolean(brief.budgetRange) },
    { label: "Brand voice and creator criteria are specific", ready: brief.brandVoice.length >= 2 && brief.creatorCriteria.length >= 10 },
    { label: "Success metrics and mandatory messages are explicit", ready: brief.successMetrics.length > 0 && brief.mandatoryMessages.length > 0 },
    { label: "Approval requirements are defined", ready: brief.approvalRequirements.length >= 10 },
  ];
}

function getRunStatus(
  run: CampaignRun | null,
  isPlanning: boolean,
  readyCount: number,
  readinessCount: number,
) {
  if (isPlanning) {
    return { dot: "running", label: "Agent running - tools are planning the campaign", meta: "Live run" };
  }

  if (!run) {
    return {
      dot: readyCount === readinessCount ? "done" : "wait",
      label:
        readyCount === readinessCount
          ? "Ready - run the agent when the brief is complete"
          : "Waiting for a complete campaign brief",
      meta: `${readyCount}/${readinessCount} ready`,
    };
  }

  if (run.status === "blocked") {
    return { dot: "error", label: "Run blocked by guardrails", meta: "Review brief" };
  }

  if (run.status === "approved" || run.status === "evaluated") {
    return { dot: "done", label: "Campaign output approved", meta: `${run.draft?.toolTrace.length ?? 0} tool calls` };
  }

  return { dot: "wait", label: "Draft ready - approval required", meta: `${run.draft?.toolTrace.length ?? 0} tool calls` };
}

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatToolName(toolName: string) {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
