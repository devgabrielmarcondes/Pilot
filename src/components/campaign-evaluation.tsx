"use client";

import { useState } from "react";
import { ArrowRight, Loader2, PlayCircle, BarChart3, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { upsertRun } from "@/lib/campaign-store";
import { CampaignBriefSchema, type CampaignProject, type CampaignRun, type RunEvaluation } from "@/lib/schemas";

type EvaluationResponse =
  | { ok: true; evaluation: RunEvaluation }
  | { ok: false; error: string };

const metricExplanations: Record<string, string> = {
  "Completeness": "Measures whether the campaign output includes all required sections: strategy pillars (min 3), content calendar (min 6 items), creator recommendations (min 2), and a final report narrative.",
  "Brief Alignment": "Scores how well the output matches the original brief. Checks if mandatory messages are covered, success metrics are addressed, and brand/product are referenced throughout.",
  "Tool Success": "Percentage of agent tool calls that completed successfully. A low score means some research or content generation steps failed or fell back to defaults.",
  "Guardrails": "Measures safety compliance. A score of 100% means no blocking findings (prompt injection, unsupported claims, brand safety violations) were detected in the output.",
  "Actionability": "Evaluates whether the output is actionable: does it include a content calendar, launch checklist, measurement plan, and concrete next actions you can execute?",
};

export function CampaignEvaluation({
  project,
  run,
  onSaveRun,
}: {
  project: CampaignProject;
  run: CampaignRun | null;
  onSaveRun: (run: CampaignRun) => void;
}) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runEvaluation(currentRun: CampaignRun) {
    if (!currentRun.draft || !currentRun.report) return;

    const briefResult = CampaignBriefSchema.safeParse(project.brief);
    if (!briefResult.success) {
      setError("The campaign brief is incomplete.");
      return;
    }

    setIsEvaluating(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: currentRun.id,
          brief: briefResult.data,
          draft: currentRun.draft,
          report: currentRun.report,
          toolTrace: currentRun.draft.toolTrace,
        }),
      });
      const payload = (await response.json()) as EvaluationResponse;

      if (!payload.ok) {
        setError(payload.error);
        return;
      }

      onSaveRun({
        ...currentRun,
        status: "evaluated",
        updatedAt: new Date().toISOString(),
        evaluation: payload.evaluation,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to run evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  }

  if (!run) {
    return (
      <div>
        <div className="main-header">
          <div>
            <h1 className="main-title">Evaluation</h1>
            <div className="main-subtitle">Score campaign output against the original brief</div>
          </div>
        </div>
        <div className="empty-structure">
          <div className="empty-structure-header">
            <span className="text-xs font-mono text-black/40 uppercase tracking-wider">Evaluation</span>
            <BarChart3 size={14} className="text-black/30" />
          </div>
          <div className="empty-structure-body">
            Run the agent and approve output before evaluating.
          </div>
        </div>
      </div>
    );
  }

  if (!run.report) {
    return (
      <div>
        <div className="main-header">
          <div>
            <h1 className="main-title">Evaluation</h1>
            <div className="main-subtitle">Approval required before evaluation</div>
          </div>
        </div>
        <div className="notice">
          The current run has a draft but no approved output yet. Approve the draft to unlock evaluation.
        </div>
      </div>
    );
  }

  const evaluation = run.evaluation;

  return (
    <div>
      <div className="main-header">
        <div>
          <h1 className="main-title">Evaluation</h1>
          <div className="main-subtitle">
            {project.name} - scores the approved output against the original brief
          </div>
        </div>
        <div className="header-actions">
          <Button
            type="button"
            onClick={() => runEvaluation(run)}
            disabled={isEvaluating}
          >
            {isEvaluating ? <Loader2 className="spin" size={12} /> : <PlayCircle size={12} />}
            {evaluation ? "Re-run Evaluation" : "Run Evaluation"}
          </Button>
        </div>
      </div>

      {error && <div className="notice notice-danger">{error}</div>}

      {!evaluation ? (
        <div className="notice">
          The approved campaign output is ready. Run evaluation to score completeness, brief
          alignment, tools, guardrails, actionability, and approval readiness.
        </div>
      ) : (
        <>
          <div className="eval-metrics">
            <EvalMetricCard label="Completeness" value={evaluation.metrics.completeness} explanation={metricExplanations["Completeness"]} />
            <EvalMetricCard label="Brief Alignment" value={evaluation.metrics.briefAlignment} explanation={metricExplanations["Brief Alignment"]} />
            <EvalMetricCard label="Tool Success" value={evaluation.metrics.toolSuccessRate} explanation={metricExplanations["Tool Success"]} />
            <EvalMetricCard label="Guardrails" value={evaluation.metrics.guardrailPassRate} explanation={metricExplanations["Guardrails"]} />
            <EvalMetricCard label="Actionability" value={evaluation.metrics.actionability} explanation={metricExplanations["Actionability"]} />
          </div>

          <section className="section">
            <div className="section-heading-row">
              <div className="flex items-center gap-3">
                <h2 className="section-heading">Evaluation Checks</h2>
                <Badge variant={evaluation.status === "pass" ? "success" : evaluation.status === "warn" ? "warning" : "danger"}>
                  {evaluation.status}
                </Badge>
              </div>
              <span className="mono text-xs text-black/40">
                Cost ${evaluation.metrics.estimatedCostUsd.toFixed(3)}
              </span>
            </div>

            <div className="scenarios">
              {evaluation.checks.map((check) => (
                <article className="scenario-card" key={check.label}>
                  <div className="scenario-head">
                    <span className="scenario-name">{check.label}</span>
                    <Badge variant={check.status === "pass" ? "success" : check.status === "warn" ? "warning" : "danger"}>
                      {check.status}
                    </Badge>
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
    </div>
  );
}

function EvalMetricCard({ label, value, explanation }: { label: string; value: number; explanation?: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="metric-card eval-metric-card">
      <div className="flex items-center gap-1">
        <div className="metric-label">{label}</div>
        {explanation && (
          <div className="relative">
            <button
              type="button"
              className="eval-tooltip-trigger"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <Info size={12} />
            </button>
            {showTooltip && (
              <div className="eval-tooltip">
                {explanation}
              </div>
            )}
          </div>
        )}
      </div>
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
