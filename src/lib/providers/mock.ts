import {
  CampaignDraftSchema,
  FinalCampaignReportSchema,
  type CampaignBrief,
  type CampaignDraft,
  type FinalCampaignReport,
  type ToolCallTrace,
} from "../schemas";
import { buildDefaultToolRequests } from "../tools";
import type { AiProvider, ProviderName, ProviderToolDefinition } from "./types";

export function createMockProvider(name: ProviderName = "mock"): AiProvider {
  return {
    name,
    async planToolCalls(brief) {
      return buildDefaultToolRequests(brief);
    },
    async composeDraft(brief, toolTrace) {
      return buildDeterministicDraft(brief, toolTrace, name);
    },
    async composeFinalReport(draft) {
      return buildDeterministicFinalReport(draft);
    },
  };
}

export function buildDeterministicToolCalls(
  brief: CampaignBrief,
  _tools: ProviderToolDefinition[],
) {
  return buildDefaultToolRequests(brief);
}

export function buildDeterministicDraft(
  brief: CampaignBrief,
  toolTrace: ToolCallTrace[],
  provider: ProviderName,
): CampaignDraft {
  const trendOutput = findToolOutput(toolTrace, "trend_research");
  const competitorOutput = findToolOutput(toolTrace, "competitor_scan");
  const creatorOutput = findToolOutput(toolTrace, "influencer_match");
  const knowledgeOutput = findToolOutput(toolTrace, "knowledge_retrieve");
  const calendarOutput = findToolOutput(toolTrace, "content_calendar");
  const safetyOutput = findToolOutput(toolTrace, "safety_review");

  const competitorLearnings = asStringArray(competitorOutput.learnings).slice(0, 5);
  const ragInsights = asStringArray(knowledgeOutput.insights).slice(0, 3);
  const safetyFindings = Array.isArray(safetyOutput.findings) ? safetyOutput.findings : [];

  const draft = {
    id: crypto.randomUUID(),
    provider,
    generatedAt: new Date().toISOString(),
    brief,
    executiveSummary: `${brief.brandName} should launch ${brief.productOrService} with a creator-led, social-first campaign that turns audience participation into measurable trial intent.`,
    positioning: `${brief.brandName} becomes the practical, culturally fluent choice for ${brief.targetAudience} in ${brief.market}.`,
    audienceInsight:
      "The audience is more likely to trust repeated creator proof, transparent trade-offs, and formats that invite participation over polished brand claims.",
    strategyPillars: [
      "Use creator proof as the main trust engine.",
      "Build the campaign as a two-week episodic story.",
      "Route claims and higher-risk creator posts through human approval.",
    ],
    competitorLearnings,
    ragInsights,
    contentThemes: [
      `${brief.productOrService} in real routines`,
      "Creator challenge variants",
      "Comment-led objection handling",
      "Launch-week proof recap",
    ],
    creatorShortlist: Array.isArray(creatorOutput.creators) ? creatorOutput.creators : [],
    calendar: Array.isArray(calendarOutput.posts) ? calendarOutput.posts : [],
    safetyFindings,
    toolTrace,
    approvalRequired: true,
    approved: false,
  };

  if (asStringArray(trendOutput.recommendation).length > 0) {
    draft.contentThemes.push("Trend-backed creator adaptations");
  }

  return CampaignDraftSchema.parse(draft);
}

export function buildDeterministicFinalReport(draft: CampaignDraft): FinalCampaignReport {
  const finalReport = {
    ...draft,
    approved: true,
    approvedAt: new Date().toISOString(),
    finalNarrative: `Approved campaign: ${draft.brief.brandName} will run a two-week social-first launch that combines creator validation, competitive contrast, and human-reviewed content checkpoints.`,
    launchChecklist: [
      "Confirm creator usage rights and approval windows.",
      "Review all performance and health claims before publishing.",
      "Prepare channel-specific briefs with one required message and flexible creator language.",
      "Tag every post with campaign, creator, channel, and funnel objective metadata.",
    ],
    measurementPlan: [
      "Track reach, completion rate, comments saved, and qualified site visits separately.",
      "Compare creator-led content against brand-owned content after week one.",
      "Use approval findings as a reliability signal for future agent runs.",
    ],
    residualRisks:
      draft.safetyFindings.length > 0
        ? draft.safetyFindings.map((finding) => finding.message)
        : ["No material residual risks found in the approved draft."],
  };

  return FinalCampaignReportSchema.parse(finalReport);
}

function findToolOutput(toolTrace: ToolCallTrace[], toolName: string) {
  return toolTrace.find((trace) => trace.toolName === toolName)?.output ?? {};
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}
