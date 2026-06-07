import {
  buildCalendar,
  retrieveKnowledge,
  selectCompetitors,
  selectCreators,
  selectRelevantTrends,
} from "./fixtures";
import { runInputGuardrails, runOutputSafetyReview } from "./guardrails";
import type { CampaignBrief, ToolCallTrace } from "./schemas";

export type AgentName =
  | "Manager Agent"
  | "Research Agent"
  | "Strategist Agent"
  | "Content Agent"
  | "Reviewer Agent";

export type ToolExecutionRequest = {
  name: string;
  input: Record<string, unknown>;
};

export type AgentTool = {
  name: string;
  description: string;
  agent: AgentName;
  inputSchema: Record<string, unknown>;
  run: (input: Record<string, unknown>, brief: CampaignBrief) => Promise<Record<string, unknown>>;
};

export const agentTools: AgentTool[] = [
  {
    name: "trend_research",
    description: "Find relevant social and content trends for the campaign brief.",
    agent: "Research Agent",
    inputSchema: {
      type: "object",
      properties: {
        audience: { type: "string" },
        market: { type: "string" },
      },
      required: ["audience", "market"],
    },
    async run(_input, brief) {
      const trends = selectRelevantTrends(brief);
      return {
        trends,
        recommendation: trends.map((trend) => trend.recommendedUse).join(" "),
      };
    },
  },
  {
    name: "competitor_scan",
    description: "Analyze competitor campaign patterns from local curated examples.",
    agent: "Research Agent",
    inputSchema: {
      type: "object",
      properties: {
        productOrService: { type: "string" },
        market: { type: "string" },
      },
      required: ["productOrService"],
    },
    async run(_input, brief) {
      const competitors = selectCompetitors(brief);
      return {
        competitors,
        learnings: competitors.flatMap((competitor) => competitor.campaigns).slice(0, 5),
      };
    },
  },
  {
    name: "influencer_match",
    description: "Recommend creator profiles based on niche fit, risk, and estimated cost.",
    agent: "Strategist Agent",
    inputSchema: {
      type: "object",
      properties: {
        niche: { type: "string" },
        budgetRange: { type: "string" },
      },
      required: ["niche", "budgetRange"],
    },
    async run(_input, brief) {
      return {
        creators: selectCreators(brief),
        selectionCriteria: [
          "audience trust",
          "category adjacency",
          "brand tone fit",
          "approval risk",
        ],
      };
    },
  },
  {
    name: "knowledge_retrieve",
    description: "Retrieve internal social-first campaign notes with lightweight local RAG.",
    agent: "Research Agent",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    async run(_input, brief) {
      const documents = retrieveKnowledge(brief);
      return {
        documents,
        insights: documents.map((document) => document.body),
      };
    },
  },
  {
    name: "content_calendar",
    description: "Generate a two-week content calendar from campaign strategy inputs.",
    agent: "Content Agent",
    inputSchema: {
      type: "object",
      properties: {
        campaignTheme: { type: "string" },
        channels: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["campaignTheme", "channels"],
    },
    async run(_input, brief) {
      return {
        posts: buildCalendar(brief),
        cadence: "10 posts across two weeks with creator-led proof and approval checkpoints.",
      };
    },
  },
  {
    name: "safety_review",
    description: "Check prompt-injection, unsupported claims, brand safety, and approval needs.",
    agent: "Reviewer Agent",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
      },
      required: ["summary"],
    },
    async run(input, brief) {
      const summary = String(input.summary ?? brief.campaignGoal);
      const findings = [...runInputGuardrails(brief), ...runOutputSafetyReview(summary)];
      return {
        findings,
        approvalRequired: findings.some((finding) => finding.severity !== "info"),
      };
    },
  },
];

export function getToolDefinitions() {
  return agentTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

export function buildDefaultToolRequests(brief: CampaignBrief): ToolExecutionRequest[] {
  return [
    {
      name: "knowledge_retrieve",
      input: {
        query: [
          brief.campaignGoal,
          brief.targetAudience,
          brief.audienceSegments.join(" "),
          brief.mandatoryMessages.join(" "),
          brief.forbiddenClaims.join(" "),
          brief.approvalRequirements,
          brief.knowledgeNotes,
        ].join(" "),
      },
    },
    {
      name: "trend_research",
      input: {
        audience: `${brief.targetAudience}; segments: ${brief.audienceSegments.join(", ")}`,
        market: brief.market,
      },
    },
    {
      name: "competitor_scan",
      input: {
        productOrService: brief.productOrService,
        market: brief.market,
        competitors: brief.competitors,
      },
    },
    {
      name: "influencer_match",
      input: {
        niche: `${brief.targetAudience}; criteria: ${brief.creatorCriteria}`,
        budgetRange: brief.budgetRange,
      },
    },
    {
      name: "content_calendar",
      input: {
        campaignTheme: brief.campaignGoal,
        channels: brief.channels,
      },
    },
    {
      name: "safety_review",
      input: {
        summary: `${brief.brandName} ${brief.productOrService} ${brief.campaignGoal}`,
        forbiddenClaims: brief.forbiddenClaims,
        approvalRequirements: brief.approvalRequirements,
      },
    },
  ];
}

export function normalizeToolRequests(
  requestedToolCalls: ToolExecutionRequest[],
  brief: CampaignBrief,
): ToolExecutionRequest[] {
  const defaults = buildDefaultToolRequests(brief);
  const byName = new Map(defaults.map((request) => [request.name, request]));

  for (const request of requestedToolCalls) {
    if (agentTools.some((tool) => tool.name === request.name)) {
      byName.set(request.name, {
        name: request.name,
        input: Object.keys(request.input ?? {}).length > 0 ? request.input : byName.get(request.name)?.input ?? {},
      });
    }
  }

  return defaults.map((request) => byName.get(request.name) ?? request);
}

export async function executeTools(
  requests: ToolExecutionRequest[],
  brief: CampaignBrief,
): Promise<ToolCallTrace[]> {
  const traces: ToolCallTrace[] = [];

  for (const request of requests) {
    const tool = agentTools.find((candidate) => candidate.name === request.name);
    const startedAt = new Date();

    if (!tool) {
      traces.push({
        id: crypto.randomUUID(),
        toolName: request.name,
        agent: "Manager Agent",
        status: "fallback",
        input: request.input,
        output: { error: "Unknown tool" },
        summary: `Skipped unknown tool ${request.name}.`,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
      });
      continue;
    }

    try {
      const output = await tool.run(request.input, brief);
      const completedAt = new Date();

      traces.push({
        id: crypto.randomUUID(),
        toolName: tool.name,
        agent: tool.agent,
        status: "success",
        input: request.input,
        output,
        summary: summarizeToolOutput(tool.name, output),
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    } catch (error) {
      const completedAt = new Date();

      traces.push({
        id: crypto.randomUUID(),
        toolName: tool.name,
        agent: tool.agent,
        status: "fallback",
        input: request.input,
        output: { error: error instanceof Error ? error.message : "Tool execution failed" },
        summary: `${tool.name} failed and was marked for fallback review.`,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: completedAt.getTime() - startedAt.getTime(),
      });
    }
  }

  return traces;
}

function summarizeToolOutput(toolName: string, output: Record<string, unknown>) {
  switch (toolName) {
    case "trend_research":
      return `Found ${(output.trends as unknown[] | undefined)?.length ?? 0} relevant trend signals.`;
    case "competitor_scan":
      return `Extracted ${(output.learnings as unknown[] | undefined)?.length ?? 0} competitor learnings.`;
    case "influencer_match":
      return `Shortlisted ${(output.creators as unknown[] | undefined)?.length ?? 0} creator profiles.`;
    case "knowledge_retrieve":
      return `Retrieved ${(output.documents as unknown[] | undefined)?.length ?? 0} local knowledge documents.`;
    case "content_calendar":
      return `Generated ${(output.posts as unknown[] | undefined)?.length ?? 0} content calendar items.`;
    case "safety_review":
      return `Completed safety review with ${(output.findings as unknown[] | undefined)?.length ?? 0} findings.`;
    default:
      return "Tool completed successfully.";
  }
}
