import { z } from "zod";
import {
  CampaignBriefSchema,
  CampaignDraftSchema,
  FinalCampaignReportSchema,
  RunEvaluationSchema,
  ToolCallTraceSchema,
  type RunEvaluation,
} from "./schemas";

export const RunEvaluationInputSchema = z.object({
  runId: z.string().optional(),
  brief: CampaignBriefSchema,
  draft: CampaignDraftSchema,
  report: FinalCampaignReportSchema.optional(),
  toolTrace: z.array(ToolCallTraceSchema).optional(),
});

export type RunEvaluationInput = z.infer<typeof RunEvaluationInputSchema>;

export function evaluateCampaignRun(input: unknown): RunEvaluation {
  const parsed = RunEvaluationInputSchema.parse(input);
  const runId = parsed.runId ?? parsed.draft.id;
  const toolTrace = parsed.toolTrace ?? parsed.draft.toolTrace;
  const report = parsed.report;
  const outputText = JSON.stringify(report ?? parsed.draft).toLowerCase();

  const successfulTools = toolTrace.filter((trace) => trace.status === "success").length;
  const toolSuccessRate = toolTrace.length > 0 ? successfulTools / toolTrace.length : 0;
  const blockedFindings = parsed.draft.safetyFindings.filter(
    (finding) => finding.severity === "block",
  );
  const guardrailPassRate = blockedFindings.length === 0 ? 1 : 0;
  const mandatoryMessageCoverage = coverage(parsed.brief.mandatoryMessages, outputText);
  const successMetricCoverage = coverage(parsed.brief.successMetrics, outputText);
  const completeness = average([
    parsed.draft.strategyPillars.length >= 3 ? 1 : 0.5,
    parsed.draft.calendar.length >= 6 ? 1 : parsed.draft.calendar.length / 6,
    parsed.draft.creatorShortlist.length >= 2 ? 1 : parsed.draft.creatorShortlist.length / 2,
    report ? 1 : 0.55,
  ]);
  const briefAlignment = average([
    mandatoryMessageCoverage,
    successMetricCoverage,
    outputText.includes(parsed.brief.brandName.toLowerCase()) ? 1 : 0,
    outputText.includes(parsed.brief.productOrService.toLowerCase()) ? 1 : 0,
  ]);
  const actionability = average([
    parsed.draft.calendar.length > 0 ? 1 : 0,
    report?.launchChecklist.length ? 1 : 0.5,
    report?.measurementPlan.length ? 1 : 0.5,
    report?.nextActions.length ? 1 : 0.5,
  ]);
  const approvalReadiness = report?.approved ? 1 : parsed.draft.approvalRequired ? 0.75 : 0.45;
  const latencyMs = toolTrace.reduce((total, trace) => total + trace.durationMs, 0);
  const estimatedCostUsd = Number((0.01 + toolTrace.length * 0.0015).toFixed(4));
  const score = average([
    completeness,
    briefAlignment,
    toolSuccessRate,
    guardrailPassRate,
    actionability,
    approvalReadiness,
  ]);
  const status = score >= 0.82 ? "pass" : score >= 0.65 ? "warn" : "fail";
  const checks = [
    {
      label: "Brief completeness",
      status: completeness >= 0.85 ? "pass" : "warn",
      detail: report
        ? "The run contains strategy, calendar, creator recommendations, and approved output."
        : "The run has a draft, but final output is not approved yet.",
    },
    {
      label: "Brief alignment",
      status: briefAlignment >= 0.75 ? "pass" : "warn",
      detail: `${Math.round(mandatoryMessageCoverage * 100)}% mandatory message coverage and ${Math.round(
        successMetricCoverage * 100,
      )}% success metric coverage.`,
    },
    {
      label: "Tool orchestration",
      status: toolSuccessRate >= 0.95 ? "pass" : "warn",
      detail: `${successfulTools}/${toolTrace.length} tools completed successfully.`,
    },
    {
      label: "Guardrail behavior",
      status: guardrailPassRate === 1 ? "pass" : "fail",
      detail:
        blockedFindings.length > 0
          ? blockedFindings.map((finding) => finding.message).join(" ")
          : "No blocking guardrail findings remain in the run.",
    },
    {
      label: "Actionability",
      status: actionability >= 0.8 ? "pass" : "warn",
      detail: "The output is scored on calendar, launch checklist, measurement plan, and next actions.",
    },
  ] as const;

  return RunEvaluationSchema.parse({
    id: crypto.randomUUID(),
    runId,
    generatedAt: new Date().toISOString(),
    name: `${parsed.brief.brandName} run evaluation`,
    summary:
      status === "pass"
        ? "This run is ready for portfolio review and campaign planning handoff."
        : "This run needs targeted review before it is treated as ready.",
    status,
    metrics: {
      completeness,
      briefAlignment,
      toolSuccessRate,
      guardrailPassRate,
      actionability,
      approvalReadiness,
      latencyMs,
      estimatedCostUsd,
    },
    checks,
    nextImprovements: buildNextImprovements({
      completeness,
      briefAlignment,
      actionability,
      toolSuccessRate,
      reportApproved: Boolean(report?.approved),
    }),
  });
}

function coverage(items: string[], outputText: string) {
  if (items.length === 0) {
    return 1;
  }

  const matches = items.filter((item) => {
    const normalized = item.toLowerCase();
    const keywords = normalized.split(/\s+/).filter((word) => word.length > 4);
    return outputText.includes(normalized) || keywords.some((word) => outputText.includes(word));
  }).length;

  return matches / items.length;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildNextImprovements(input: {
  completeness: number;
  briefAlignment: number;
  actionability: number;
  toolSuccessRate: number;
  reportApproved: boolean;
}) {
  const improvements: string[] = [];

  if (!input.reportApproved) {
    improvements.push("Approve the draft before treating the output as final.");
  }

  if (input.completeness < 0.85) {
    improvements.push("Add missing strategy, calendar, creator, or measurement sections.");
  }

  if (input.briefAlignment < 0.75) {
    improvements.push("Mirror the mandatory messages and success metrics more explicitly.");
  }

  if (input.actionability < 0.8) {
    improvements.push("Add concrete next actions, owners, and approval checkpoints.");
  }

  if (input.toolSuccessRate < 0.95) {
    improvements.push("Review failed or fallback tool calls before handoff.");
  }

  return improvements.length > 0 ? improvements : ["No priority improvements found."];
}
