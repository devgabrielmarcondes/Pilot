import { z } from "zod";

export const ChannelSchema = z.enum([
  "TikTok",
  "Instagram",
  "YouTube Shorts",
  "Twitch",
  "LinkedIn",
  "Retail Media",
]);

export const CampaignBriefSchema = z.object({
  brandName: z.string().trim().min(2).max(80),
  productOrService: z.string().trim().min(2).max(120),
  campaignGoal: z.string().trim().min(10).max(500),
  targetAudience: z.string().trim().min(10).max(500),
  market: z.string().trim().min(2).max(80),
  budgetRange: z.string().trim().min(2).max(80),
  channels: z.array(ChannelSchema).min(1).default(["TikTok", "Instagram"]),
  timelineWeeks: z.coerce.number().int().min(2).max(8).default(2),
  constraints: z.string().trim().max(500).optional().default(""),
});

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;

export const GuardrailFindingSchema = z.object({
  id: z.string(),
  severity: z.enum(["info", "warning", "block"]),
  category: z.enum([
    "prompt_injection",
    "unsupported_claim",
    "brand_safety",
    "privacy",
    "quality",
  ]),
  message: z.string(),
});

export type GuardrailFinding = z.infer<typeof GuardrailFindingSchema>;

export const ToolCallTraceSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  agent: z.enum([
    "Manager Agent",
    "Research Agent",
    "Strategist Agent",
    "Content Agent",
    "Reviewer Agent",
  ]),
  status: z.enum(["success", "blocked", "fallback"]),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
  summary: z.string(),
  startedAt: z.string(),
  completedAt: z.string(),
  durationMs: z.number(),
});

export type ToolCallTrace = z.infer<typeof ToolCallTraceSchema>;

export const CalendarPostSchema = z.object({
  day: z.number(),
  channel: ChannelSchema,
  format: z.string(),
  concept: z.string(),
  objective: z.string(),
  approvalRisk: z.enum(["low", "medium", "high"]),
});

export type CalendarPost = z.infer<typeof CalendarPostSchema>;

export const CreatorRecommendationSchema = z.object({
  handle: z.string(),
  niche: z.string(),
  fitReason: z.string(),
  estimatedCost: z.string(),
  risk: z.enum(["low", "medium", "high"]),
});

export type CreatorRecommendation = z.infer<typeof CreatorRecommendationSchema>;

export const CampaignDraftSchema = z.object({
  id: z.string(),
  provider: z.enum(["anthropic", "opencode", "mock"]),
  generatedAt: z.string(),
  brief: CampaignBriefSchema,
  executiveSummary: z.string(),
  positioning: z.string(),
  audienceInsight: z.string(),
  strategyPillars: z.array(z.string()).min(3),
  competitorLearnings: z.array(z.string()),
  ragInsights: z.array(z.string()),
  contentThemes: z.array(z.string()),
  creatorShortlist: z.array(CreatorRecommendationSchema),
  calendar: z.array(CalendarPostSchema),
  safetyFindings: z.array(GuardrailFindingSchema),
  toolTrace: z.array(ToolCallTraceSchema),
  approvalRequired: z.boolean(),
  approved: z.boolean(),
});

export type CampaignDraft = z.infer<typeof CampaignDraftSchema>;

export const FinalCampaignReportSchema = CampaignDraftSchema.extend({
  approved: z.literal(true),
  approvedAt: z.string(),
  finalNarrative: z.string(),
  launchChecklist: z.array(z.string()),
  measurementPlan: z.array(z.string()),
  residualRisks: z.array(z.string()),
});

export type FinalCampaignReport = z.infer<typeof FinalCampaignReportSchema>;

export const EvaluationResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  inputSummary: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  metrics: z.object({
    toolSuccessRate: z.number(),
    guardrailPassRate: z.number(),
    responseQuality: z.number(),
    averageLatencyMs: z.number(),
    estimatedCostUsd: z.number(),
  }),
  checks: z.array(
    z.object({
      label: z.string(),
      status: z.enum(["pass", "warn", "fail"]),
      detail: z.string(),
    }),
  ),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
