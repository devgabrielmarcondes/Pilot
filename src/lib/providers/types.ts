import type { CampaignBrief, CampaignDraft, FinalCampaignReport, ToolCallTrace } from "../schemas";
import type { ToolExecutionRequest } from "../tools";

export type ProviderName = "anthropic" | "opencode" | "mock";

export type ProviderToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

export type AiProvider = {
  name: ProviderName;
  planToolCalls: (
    brief: CampaignBrief,
    tools: ProviderToolDefinition[],
  ) => Promise<ToolExecutionRequest[]>;
  composeDraft: (brief: CampaignBrief, toolTrace: ToolCallTrace[]) => Promise<CampaignDraft>;
  composeFinalReport: (draft: CampaignDraft) => Promise<FinalCampaignReport>;
};
