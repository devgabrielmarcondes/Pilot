import { z } from "zod";

export const ChannelSchema = z.enum([
  "TikTok",
  "Instagram",
  "YouTube Shorts",
  "Twitch",
  "LinkedIn",
  "Retail Media",
]);

const RequiredTextSchema = z.string().trim().min(2).max(500);
const LongTextSchema = z.string().trim().min(10).max(1000);
const StringListSchema = z.array(z.string().trim().min(2).max(240));

export const CampaignBriefDraftSchema = z.object({
  brandName: z.string().default(""),
  productOrService: z.string().default(""),
  campaignGoal: z.string().default(""),
  targetAudience: z.string().default(""),
  audienceSegments: z.array(z.string()).default([]),
  market: z.string().default(""),
  budgetRange: z.string().default(""),
  channels: z.array(ChannelSchema).default([]),
  timelineWeeks: z.coerce.number().int().min(2).max(8).default(2),
  constraints: z.string().default(""),
  brandVoice: z.string().default(""),
  competitors: z.array(z.string()).default([]),
  creatorCriteria: z.string().default(""),
  successMetrics: z.array(z.string()).default([]),
  mandatoryMessages: z.array(z.string()).default([]),
  forbiddenClaims: z.array(z.string()).default([]),
  approvalRequirements: z.string().default(""),
  knowledgeNotes: z.string().default(""),
});

export type CampaignBriefDraft = z.infer<typeof CampaignBriefDraftSchema>;

export const CampaignBriefSchema = z.object({
  brandName: z.string().trim().min(2).max(80),
  productOrService: z.string().trim().min(2).max(120),
  campaignGoal: z.string().trim().min(20).max(700),
  targetAudience: z.string().trim().min(10).max(500),
  audienceSegments: StringListSchema.min(1),
  market: z.string().trim().min(2).max(80),
  budgetRange: z.string().trim().min(2).max(80),
  channels: z.array(ChannelSchema).min(1).default(["TikTok", "Instagram"]),
  timelineWeeks: z.coerce.number().int().min(2).max(8).default(2),
  constraints: z.string().trim().max(700).optional().default(""),
  brandVoice: RequiredTextSchema,
  competitors: StringListSchema.default([]),
  creatorCriteria: LongTextSchema,
  successMetrics: StringListSchema.min(1),
  mandatoryMessages: StringListSchema.min(1),
  forbiddenClaims: StringListSchema.default([]),
  approvalRequirements: LongTextSchema,
  knowledgeNotes: z.string().trim().max(1500).optional().default(""),
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
  budgetAllocation: z.array(z.string()).default([]),
  nextActions: z.array(z.string()).default([]),
});

export type FinalCampaignReport = z.infer<typeof FinalCampaignReportSchema>;

export const RunEvaluationSchema = z.object({
  id: z.string(),
  runId: z.string(),
  generatedAt: z.string(),
  name: z.string(),
  summary: z.string(),
  status: z.enum(["pass", "warn", "fail"]),
  metrics: z.object({
    completeness: z.number(),
    briefAlignment: z.number(),
    toolSuccessRate: z.number(),
    guardrailPassRate: z.number(),
    actionability: z.number(),
    approvalReadiness: z.number(),
    latencyMs: z.number(),
    estimatedCostUsd: z.number(),
  }),
  checks: z.array(
    z.object({
      label: z.string(),
      status: z.enum(["pass", "warn", "fail"]),
      detail: z.string(),
    }),
  ),
  nextImprovements: z.array(z.string()),
});

export type RunEvaluation = z.infer<typeof RunEvaluationSchema>;

export const CampaignRunSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.enum(["draft", "planned", "approved", "evaluated", "blocked"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  provider: z.enum(["anthropic", "opencode", "mock"]).optional(),
  draft: CampaignDraftSchema.optional(),
  report: FinalCampaignReportSchema.optional(),
  evaluation: RunEvaluationSchema.optional(),
  error: z.string().optional(),
});

export type CampaignRun = z.infer<typeof CampaignRunSchema>;

export const CampaignTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  channel: z.string().default(""),
  owner: z.string().default(""),
  budget: z.number().default(0),
  status: z.string().default("backlog"),
  approvalRisk: z.enum(["low", "medium", "high"]).default("low"),
  type: z.string().default("task"),
});

export type CampaignTask = z.infer<typeof CampaignTaskSchema>;

export const CampaignContentItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  channel: ChannelSchema,
  format: z.string().default(""),
  scheduledDate: z.string().default(""),
  status: z.enum(["draft", "review", "approved", "published"]).default("draft"),
  day: z.number().default(1),
});

export type CampaignContentItem = z.infer<typeof CampaignContentItemSchema>;

export const CampaignAssetPlaceholderSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["image", "video", "copy", "brief"]).default("image"),
  description: z.string().default(""),
  channel: z.string().default(""),
  status: z.enum(["placeholder", "in_progress", "ready"]).default("placeholder"),
});

export type CampaignAssetPlaceholder = z.infer<typeof CampaignAssetPlaceholderSchema>;

export const BudgetAllocationSchema = z.object({
  id: z.string().default(""),
  bucket: z.string(),
  amount: z.number().default(0),
  percentage: z.number().default(0),
});

export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;

export const MarketingMetricSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number().default(0),
  unit: z.string().default(""),
  editable: z.boolean().default(true),
});

export type MarketingMetric = z.infer<typeof MarketingMetricSchema>;

export const AssistantMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.string(),
});

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

export const ContextFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  data: z.string(),
});

export type ContextFile = z.infer<typeof ContextFileSchema>;

export const CampaignViewModeSchema = z.enum([
  "board",
  "calendar",
  "list",
  "budget",
  "metrics",
  "assistant",
]);

export type CampaignViewMode = z.infer<typeof CampaignViewModeSchema>;

export const WizardStepSchema = z.enum([
  "context_sources",
  "brand_goal",
  "audience",
  "channels_creative",
  "budget_metrics",
  "guardrails_approvals",
  "review_run",
]);

export type WizardStep = z.infer<typeof WizardStepSchema>;

export const CampaignTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  brief: CampaignBriefDraftSchema,
});

export type CampaignTemplate = z.infer<typeof CampaignTemplateSchema>;

export const CampaignProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["draft", "planned", "approved", "evaluated", "blocked"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  brief: CampaignBriefDraftSchema,
  runs: z.array(CampaignRunSchema).default([]),
  tasks: z.array(CampaignTaskSchema).default([]),
  contentItems: z.array(CampaignContentItemSchema).default([]),
  assets: z.array(CampaignAssetPlaceholderSchema).default([]),
  budget: z.array(BudgetAllocationSchema).default([]),
  metrics: z.array(MarketingMetricSchema).default([]),
  assistantMessages: z.array(AssistantMessageSchema).default([]),
  viewMode: CampaignViewModeSchema.default("board"),
  sidebarCollapsed: z.boolean().default(false),
  wizardStep: WizardStepSchema.default("context_sources"),
  wizardCompleted: z.boolean().default(false),
  templateId: z.string().nullable().default(null),
  contextSources: z.array(z.string()).default([]),
  contextFiles: z.array(ContextFileSchema).default([]),
  contextNotes: z.string().default(""),
  customColumns: z.array(z.string()).default([]),
});

export type CampaignProject = z.infer<typeof CampaignProjectSchema>;

export const CampaignStoreStateSchema = z.object({
  activeProjectId: z.string().nullable(),
  projects: z.array(CampaignProjectSchema),
});

export type CampaignStoreState = z.infer<typeof CampaignStoreStateSchema>;
