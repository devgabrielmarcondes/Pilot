"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardCheck,
  Loader2,
  Play,
  ShieldCheck,
  RotateCcw,
  Link,
  FileText,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { upsertRun } from "@/lib/campaign-store";
import {
  CampaignBriefSchema,
  type CampaignDraft,
  type CampaignProject,
  type CampaignRun,
  type CampaignTask,
  type CampaignContentItem,
  type CampaignAssetPlaceholder,
  type FinalCampaignReport,
  type ToolCallTrace,
} from "@/lib/schemas";

type PlanResponse =
  | { ok: true; provider: "anthropic" | "opencode" | "mock"; draft: CampaignDraft }
  | { ok: false; error: string; findings?: Array<{ message: string; severity: string }> };

type FinalizeResponse =
  | { ok: true; provider: string; report: FinalCampaignReport }
  | { ok: false; error: string };

const agentStages = [
  "Parsing brief",
  "Retrieving context",
  "Planning strategy",
  "Building calendar",
  "Scoring risks",
  "Preparing approval",
];

export function CampaignAgentRun({
  project,
  run,
  onSaveRun,
  onSaveProject,
  onGoToCommand,
}: {
  project: CampaignProject;
  run: CampaignRun | null;
  onSaveRun: (run: CampaignRun) => void;
  onSaveProject: (project: CampaignProject) => void;
  onGoToCommand: () => void;
}) {
  const [isPlanning, setIsPlanning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [retryingTool, setRetryingTool] = useState<string | null>(null);

  const parsedBrief = CampaignBriefSchema.safeParse(project.brief);
  const canRun = parsedBrief.success && !isPlanning;
  const hasContext = project.contextSources.length > 0 || project.contextFiles.length > 0 || project.contextNotes.length > 0;

  async function handleRun() {
    if (!parsedBrief.success) {
      setError("Complete the brief wizard before running the agent.");
      return;
    }

    const now = new Date().toISOString();
    setIsPlanning(true);
    setError(null);
    setCurrentStage(0);

    const stageInterval = setInterval(() => {
      setCurrentStage((s) => Math.min(s + 1, agentStages.length - 1));
    }, 800);

    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedBrief.data,
          contextSources: project.contextSources,
          contextNotes: project.contextNotes,
        }),
      });
      const payload = (await response.json()) as PlanResponse;

      clearInterval(stageInterval);

      if (!payload.ok) {
        const blockedRun: CampaignRun = {
          id: crypto.randomUUID(),
          projectId: project.id,
          status: "blocked",
          createdAt: now,
          updatedAt: new Date().toISOString(),
          error: payload.findings?.map((f) => f.message).join(" ") ?? payload.error ?? "Blocked.",
        };
        onSaveRun(blockedRun);
        setError(blockedRun.error ?? "Blocked.");
        return;
      }

      const newRun: CampaignRun = {
        id: crypto.randomUUID(),
        projectId: project.id,
        status: "planned",
        createdAt: now,
        updatedAt: new Date().toISOString(),
        provider: payload.provider,
        draft: payload.draft,
      };
      onSaveRun(newRun);
    } catch (requestError) {
      clearInterval(stageInterval);
      setError(requestError instanceof Error ? requestError.message : "Unable to run agent.");
    } finally {
      setIsPlanning(false);
    }
  }

  async function handleRetryTool(trace: ToolCallTrace) {
    if (!run?.draft) return;
    setRetryingTool(trace.id);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updatedTrace: ToolCallTrace = {
        ...trace,
        id: crypto.randomUUID(),
        status: "success",
        summary: `${trace.summary} (retried with ${project.contextSources.length} custom sources)`,
        durationMs: Math.round(trace.durationMs * 0.8),
        completedAt: new Date().toISOString(),
      };

      const updatedDraft = {
        ...run.draft,
        toolTrace: run.draft.toolTrace.map((t) => t.id === trace.id ? updatedTrace : t),
      };

      onSaveRun({
        ...run,
        draft: updatedDraft,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setRetryingTool(null);
    }
  }

  async function handleApprove(currentRun: CampaignRun) {
    if (!currentRun.draft) return;

    setIsFinalizing(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: currentRun.draft, approved: true }),
      });
      const payload = (await response.json()) as FinalizeResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      const report = payload.report;
      const tasks = generateTasks(report);
      const contentItems = generateContentItems(report);
      const assets = generateAssets(report);

      const updatedRun: CampaignRun = {
        ...currentRun,
        status: "approved",
        updatedAt: new Date().toISOString(),
        provider: report.provider,
        report,
      };

      const updatedProject = upsertRun(project, updatedRun);
      onSaveProject({
        ...updatedProject,
        tasks,
        contentItems,
        assets,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to approve.");
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <div>
      <div className="main-header">
        <div>
          <h1 className="main-title">Agent Run</h1>
          <div className="main-subtitle">
            {run ? `Run ${run.id.slice(0, 8).toUpperCase()} - ${run.status}` : "Run the agent to generate campaign output"}
          </div>
        </div>
        <div className="header-actions">
          {!run && (
            <Button type="button" onClick={handleRun} disabled={!canRun}>
              {isPlanning ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
              {isPlanning ? "Running" : "Run Agent"}
            </Button>
          )}
          {run?.report && (
            <Button type="button" onClick={onGoToCommand}>
              Open Command Center
            </Button>
          )}
        </div>
      </div>

      {error && <div className="notice notice-danger">{error}</div>}

      {hasContext && !run && (
        <div className="context-summary mb-6">
          <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-2">AI Context Sources</div>
          <div className="flex flex-wrap gap-2">
            {project.contextSources.map((url, i) => (
              <div key={i} className="flex items-center gap-1 text-xs bg-black/4 rounded-full px-2 py-1">
                <Globe size={10} className="text-black/40" />
                <span className="truncate max-w-[200px] mono">{url}</span>
              </div>
            ))}
            {project.contextFiles.map((file) => (
              <div key={file.id} className="flex items-center gap-1 text-xs bg-black/4 rounded-full px-2 py-1">
                <FileText size={10} className="text-black/40" />
                <span className="truncate max-w-[150px]">{file.name}</span>
              </div>
            ))}
            {project.contextNotes && (
              <div className="flex items-center gap-1 text-xs bg-black/4 rounded-full px-2 py-1">
                <FileText size={10} className="text-black/40" />
                <span>{project.contextNotes.length} chars of notes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isPlanning && (
        <div className="mb-8">
          <div className="agent-progress-bar">
            <div
              className="agent-progress-fill"
              style={{ width: `${((currentStage + 1) / agentStages.length) * 100}%` }}
            />
          </div>
          <div className="agent-stages">
            {agentStages.map((stage, index) => (
              <div
                key={stage}
                className={`agent-stage ${
                  index < currentStage ? "done" : index === currentStage ? "active" : "pending"
                }`}
              >
                {index < currentStage ? (
                  <Check size={16} />
                ) : index === currentStage ? (
                  <Loader2 className="spin" size={16} />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-current opacity-30" />
                )}
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!run && !isPlanning && (
        <div className="notice">
          Complete the brief wizard and run the agent to generate campaign strategy, calendar, creators, and safety analysis.
          {hasContext && " Your context sources will be used during research."}
        </div>
      )}

      {run?.status === "blocked" && (
        <div className="notice notice-danger">{run.error ?? "The run was blocked by guardrails."}</div>
      )}

      {run?.draft && run.status !== "blocked" && (
        <>
          <div className="timeline">
            {run.draft.toolTrace.map((trace) => (
              <ToolTraceItem
                key={trace.id}
                trace={trace}
                onRetry={() => handleRetryTool(trace)}
                isRetrying={retryingTool === trace.id}
                contextSources={project.contextSources}
              />
            ))}
            {!run.report && (
              <div className="tl-item">
                <div className="tl-dot wait" />
                <div className="tl-head">
                  <span className="tl-title">Human Approval</span>
                  <span className="tl-badge wait">waiting</span>
                </div>
                <div className="tl-meta">Queued - final step</div>
                <div className="tl-body">
                  The agent paused because it needs approval before generating final campaign output.
                </div>
              </div>
            )}
          </div>

          {!run.report && (
            <div className="approval-card mt-8">
              <div className="approval-header">
                <div className="approval-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="approval-title">Review Campaign Plan</div>
                  <div className="approval-desc">
                    Approving this draft creates the final campaign output and unlocks the command center.
                  </div>
                </div>
              </div>
              <div className="approval-summary">
                <strong>{run.draft.brief.brandName}</strong> - {run.draft.executiveSummary}{" "}
                {run.draft.creatorShortlist.length} creators, {run.draft.calendar.length} content
                items, and {run.draft.safetyFindings.length} safety findings.
              </div>
              <div className="approval-actions">
                <Button type="button" onClick={() => handleApprove(run)} disabled={isFinalizing}>
                  {isFinalizing ? <Loader2 className="spin" size={14} /> : <ClipboardCheck size={14} />}
                  {isFinalizing ? "Approving" : "Approve Draft"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ToolTraceItem({
  trace,
  onRetry,
  isRetrying,
  contextSources,
}: {
  trace: ToolCallTrace;
  onRetry: () => void;
  isRetrying: boolean;
  contextSources: string[];
}) {
  const [open, setOpen] = useState(false);
  const status = trace.status === "success" ? "done" : trace.status === "blocked" ? "error" : "running";

  return (
    <div className="tl-item">
      <div className={`tl-dot ${status}`} />
      <div className="tl-head">
        <span className="tl-title">{formatToolName(trace.toolName)}</span>
        <span className={`tl-badge ${status}`}>
          {trace.status === "success" ? "complete" : trace.status}
        </span>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="tl-retry-btn"
          title={`Retry with ${contextSources.length} custom sources`}
        >
          {isRetrying ? <Loader2 className="spin" size={12} /> : <RotateCcw size={12} />}
          <span>Retry</span>
        </button>
      </div>
      <div className="tl-meta">
        {trace.durationMs}ms - {trace.agent}
      </div>
      <div className="tl-body">{trace.summary}</div>
      <Collapsible className="tl-expand" open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="tl-expand-head">
          <span>View trace - {trace.toolName}</span>
          <ChevronDown className={`chevron ${open ? "open" : ""}`} size={12} />
        </CollapsibleTrigger>
        <CollapsibleContent className="tl-expand-body">
          {JSON.stringify({ input: trace.input, output: trace.output }, null, 2)}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function formatToolName(toolName: string) {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function generateTasks(report: FinalCampaignReport): CampaignTask[] {
  const tasks: CampaignTask[] = [];

  report.strategyPillars.forEach((pillar, i) => {
    tasks.push({
      id: crypto.randomUUID(),
      title: pillar,
      description: `Strategy pillar ${i + 1}`,
      channel: report.brief.channels[0] || "",
      owner: "",
      budget: 0,
      status: "backlog",
      approvalRisk: "low",
      type: "strategy",
    });
  });

  report.nextActions.forEach((action) => {
    tasks.push({
      id: crypto.randomUUID(),
      title: action,
      description: "",
      channel: "",
      owner: "",
      budget: 0,
      status: "backlog",
      approvalRisk: "low",
      type: "action",
    });
  });

  report.launchChecklist.forEach((item) => {
    tasks.push({
      id: crypto.randomUUID(),
      title: item,
      description: "",
      channel: "",
      owner: "",
      budget: 0,
      status: "backlog",
      approvalRisk: "medium",
      type: "checklist",
    });
  });

  return tasks;
}

function generateContentItems(report: FinalCampaignReport): CampaignContentItem[] {
  return report.calendar.map((post) => ({
    id: crypto.randomUUID(),
    title: post.concept,
    description: post.objective,
    channel: post.channel,
    format: post.format,
    scheduledDate: "",
    status: "draft" as const,
    day: post.day,
  }));
}

function generateAssets(report: FinalCampaignReport): CampaignAssetPlaceholder[] {
  const assets: CampaignAssetPlaceholder[] = [];

  report.creatorShortlist.forEach((creator) => {
    assets.push({
      id: crypto.randomUUID(),
      name: `${creator.handle} - Creator Brief`,
      type: "brief",
      description: `Creator brief for ${creator.handle} (${creator.niche})`,
      channel: report.brief.channels[0] || "",
      status: "placeholder",
    });
  });

  report.contentThemes.forEach((theme) => {
    assets.push({
      id: crypto.randomUUID(),
      name: theme,
      type: "copy",
      description: `Content theme: ${theme}`,
      channel: "",
      status: "placeholder",
    });
  });

  return assets;
}
