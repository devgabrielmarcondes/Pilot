import {
  CampaignDraftSchema,
  FinalCampaignReportSchema,
  type CampaignBrief,
  type CampaignDraft,
  type FinalCampaignReport,
  type ToolCallTrace,
} from "../schemas";
import type { ToolExecutionRequest } from "../tools";
import { buildDeterministicDraft, buildDeterministicFinalReport } from "./mock";
import { extractTextContent, parseJsonFromText } from "./json";
import type { AiProvider, ProviderToolDefinition } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export function createAnthropicProvider(): AiProvider {
  return {
    name: "anthropic",
    async planToolCalls(brief, tools) {
      try {
        const client = await createClient();
        const message = await client.messages.create({
          model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
          max_tokens: 900,
          system:
            "You are a manager agent for a marketing campaign planner. Select useful tools only. Never execute tools yourself.",
          messages: [
            {
              role: "user",
              content: `Plan tool calls for this campaign brief:\n${JSON.stringify(brief, null, 2)}`,
            },
          ],
          tools: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
          })) as never,
          tool_choice: { type: "auto" },
        });

        const requested = extractAnthropicToolCalls(message.content);
        return requested.length > 0 ? requested : [];
      } catch {
        return [];
      }
    },
    async composeDraft(brief, toolTrace) {
      try {
        const client = await createClient();
        const fallbackDraft = buildDeterministicDraft(brief, toolTrace, "anthropic");
        const message = await client.messages.create({
          model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
          max_tokens: 2500,
          system:
            "You are a senior social-first campaign strategist. Return valid JSON only. Keep the schema identical to the supplied draft.",
          messages: [
            {
              role: "user",
              content: `Improve this campaign draft using the tool trace. Return the same JSON schema only.\n\nDraft:\n${JSON.stringify(
                fallbackDraft,
                null,
                2,
              )}`,
            },
          ],
        });
        const parsed = parseJsonFromText<CampaignDraft>(extractTextContent(message.content));
        return CampaignDraftSchema.parse(parsed ?? fallbackDraft);
      } catch {
        return buildDeterministicDraft(brief, toolTrace, "anthropic");
      }
    },
    async composeFinalReport(draft) {
      try {
        const client = await createClient();
        const fallbackReport = buildDeterministicFinalReport(draft);
        const message = await client.messages.create({
          model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
          max_tokens: 2200,
          system:
            "You finalize approved campaign reports. Return valid JSON only and preserve the supplied schema.",
          messages: [
            {
              role: "user",
              content: `Finalize this approved campaign report. Return JSON only.\n${JSON.stringify(
                fallbackReport,
                null,
                2,
              )}`,
            },
          ],
        });
        const parsed = parseJsonFromText<FinalCampaignReport>(extractTextContent(message.content));
        return FinalCampaignReportSchema.parse(parsed ?? fallbackReport);
      } catch {
        return buildDeterministicFinalReport(draft);
      }
    },
  };
}

async function createClient() {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

function extractAnthropicToolCalls(content: unknown): ToolExecutionRequest[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .filter(
      (block): block is { type: "tool_use"; name: string; input?: Record<string, unknown> } =>
        Boolean(block) &&
        typeof block === "object" &&
        (block as { type?: unknown }).type === "tool_use" &&
        typeof (block as { name?: unknown }).name === "string",
    )
    .map((block) => ({
      name: block.name,
      input: block.input ?? {},
    }));
}
