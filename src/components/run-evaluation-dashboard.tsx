"use client";

import { ArrowRight, BarChart3, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { upsertRun, useCampaignStore } from "@/lib/campaign-store";
import { CampaignBriefSchema, type CampaignRun, type RunEvaluation } from "@/lib/schemas";

const campaignsRoute = "/" as never;
const workspaceRoute = "/workspace" as never;

type EvaluationResponse =
  | {
      ok: true;
      evaluation: RunEvaluation;
    }
  | {
      ok: false;
      error: string;
    };

export function RunEvaluationDashboard() {
  const router = useRouter();
  const { hasLoaded, activeProject, latestRun, saveProject } = useCampaignStore();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runEvaluation(run: CampaignRun) {
    if (!activeProject || !run.draft || !run.report) {
      return;
    }

    const briefResult = CampaignBriefSchema.safeParse(activeProject.brief);

    if (!briefResult.success) {
      setError("The selected campaign brief is incomplete, so this run cannot be evaluated.");
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.id,
          brief: briefResult.data,
          draft: run.draft,
          report: run.report,
          toolTrace: run.draft.toolTrace,
        }),
      });
      const payload = (await response.json()) as EvaluationResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      saveProject(
        upsertRun(activeProject, {
          ...run,
          status: "evaluated",
          updatedAt: new Date().toISOString(),
          evaluation: payload.evaluation,
        }),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  }

  if (!hasLoaded) {
    return <main className="page" />;
  }

  if (!activeProject) {
    return (
      <main className="page">
        <EmptyState
          icon={BarChart3}
          title="No campaign selected"
          description="Evaluations are attached to campaign runs. Create or select a campaign before evaluating output."
          actionLabel="Go to Campaigns"
          onAction={() => router.push(campaignsRoute)}
        />
      </main>
    );
  }

  if (!latestRun) {
    return (
      <main className="page">
        <EmptyState
          icon={PlayCircle}
          title="No evaluated runs yet"
          description="Run the agent in the workspace first. This page stays empty until there is a real run to evaluate."
          actionLabel="Open Workspace"
          onAction={() => router.push(workspaceRoute)}
        />
      </main>
    );
  }

  if (!latestRun.report) {
    return (
      <main className="page">
        <EmptyState
          icon={CheckCircle2}
          title="Approval required before evaluation"
          description="The current run has a draft, but no approved campaign output yet. Approve the run in the workspace to unlock evaluation."
          actionLabel="Review Draft"
          onAction={() => router.push(workspaceRoute)}
        />
      </main>
    );
  }

  const evaluation = latestRun.evaluation;

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Run Evaluation</h1>
          <div className="page-subtitle">
            {activeProject.name} - evaluates the approved output against the original brief.
          </div>
        </div>
        <div className="header-actions">
          <Button
            type="button"
            onClick={() => runEvaluation(latestRun)}
            disabled={isEvaluating}
          >
            {isEvaluating ? <Loader2 className="spin" size={12} /> : <PlayCircle size={12} />}
            {evaluation ? "Re-run Evaluation" : "Run Evaluation"}
          </Button>
        </div>
      </div>

      {error ? <div className="notice notice-danger">{error}</div> : null}

      {!evaluation ? (
        <div className="notice">
          The approved campaign output is ready. Run evaluation to score completeness, brief
          alignment, tools, guardrails, actionability, and approval readiness.
        </div>
      ) : (
        <>
          <div className="metrics">
            <MetricCard label="Completeness" value={evaluation.metrics.completeness} />
            <MetricCard label="Brief Alignment" value={evaluation.metrics.briefAlignment} />
            <MetricCard label="Tool Success" value={evaluation.metrics.toolSuccessRate} />
            <MetricCard label="Guardrails" value={evaluation.metrics.guardrailPassRate} />
            <MetricCard label="Actionability" value={evaluation.metrics.actionability} />
          </div>

          <section className="section">
            <div className="section-heading-row">
              <div className="flex items-center gap-3">
                <h2 className="section-heading">Evaluation Checks</h2>
                <span className={`scenario-badge ${evaluation.status === "pass" ? "pass" : evaluation.status === "warn" ? "partial" : "fail"}`}>
                  {evaluation.status}
                </span>
              </div>
              <span className="scenario-time">
                Cost ${evaluation.metrics.estimatedCostUsd.toFixed(3)}
              </span>
            </div>

            <div className="scenarios">
              {evaluation.checks.map((check) => (
                <article className="scenario-card" key={check.label}>
                  <div className="scenario-head">
                    <span className="scenario-name">{check.label}</span>
                    <span className={`scenario-badge ${check.status === "pass" ? "pass" : check.status === "warn" ? "partial" : "fail"}`}>
                      {check.status}
                    </span>
                  </div>
                  <div className="scenario-body">
                    <div className="scenario-desc">{check.detail}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-heading-row">
              <h2 className="section-heading">Next Improvements</h2>
            </div>
            <ul className="report-list">
              {evaluation.nextImprovements.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                  <ArrowRight size={14} className="text-[#7C3AED]" />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{Math.round(value * 100)}%</div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill"
          style={{
            width: `${Math.round(value * 100)}%`,
            background: value >= 0.8 ? "var(--success)" : value >= 0.65 ? "var(--warn)" : "var(--danger)",
          }}
        />
      </div>
    </div>
  );
}
