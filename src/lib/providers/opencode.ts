import {
  CampaignDraftSchema,
  FinalCampaignReportSchema,
  type CampaignBrief,
  type CampaignDraft,
  type FinalCampaignReport,
  type ToolCallTrace,
} from "../schemas";
import type { ToolExecutionRequest } from "../tools";
import { extractTextContent, parseJsonFromText } from "./json";
import { buildDeterministicDraft, buildDeterministicFinalReport } from "./mock";
import type { AiProvider, ProviderToolDefinition } from "./types";

export function createOpenCodeProvider(): AiProvider {
  return {
    name: "opencode",
    async planToolCalls(brief, tools) {
      try {
        const response = await chatCompletion({
          messages: [
            {
              role: "system",
              content:
                "You are a manager agent for a marketing campaign planner. Select useful tools only.",
            },
            {
              role: "user",
              content: `Plan tool calls for this brief:\n${JSON.stringify(brief, null, 2)}`,
            },
          ],
          tools: tools.map(toOpenAiTool),
          tool_choice: "auto",
        });

        const toolCalls = response?.choices?.[0]?.message?.tool_calls;
        if (!Array.isArray(toolCalls)) {
          return [];
        }

        return toolCalls.flatMap((toolCall) => {
          const functionCall = toolCall.function;

          if (!functionCall?.name) {
            return [];
          }

          return [
            {
              name: String(functionCall.name),
              input:
                parseJsonFromText<Record<string, unknown>>(functionCall.arguments ?? "{}") ?? {},
            },
          ];
        });
      } catch {
        return [];
      }
    },
    async composeDraft(brief, toolTrace) {
      try {
        const fallbackDraft = buildDeterministicDraft(brief, toolTrace, "opencode");
        const response = await chatCompletion({
          messages: [
            {
              role: "system",
              content:
                "You are a senior social-first campaign strategist. Return valid JSON only and preserve the supplied schema.",
            },
            {
              role: "user",
              content: `Improve this campaign draft. Return JSON only.\n${JSON.stringify(
                fallbackDraft,
                null,
                2,
              )}`,
            },
          ],
        });

        const content = response?.choices?.[0]?.message?.content;
        const parsed = parseJsonFromText<CampaignDraft>(extractTextContent(content));
        return CampaignDraftSchema.parse(parsed ?? fallbackDraft);
      } catch {
        return buildDeterministicDraft(brief, toolTrace, "opencode");
      }
    },
    async composeFinalReport(draft) {
      try {
        const fallbackReport = buildDeterministicFinalReport(draft);
        const response = await chatCompletion({
          messages: [
            {
              role: "system",
              content:
                "You finalize approved campaign reports. Return valid JSON only and preserve the supplied schema.",
            },
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

        const content = response?.choices?.[0]?.message?.content;
        const parsed = parseJsonFromText<FinalCampaignReport>(extractTextContent(content));
        return FinalCampaignReportSchema.parse(parsed ?? fallbackReport);
      } catch {
        return buildDeterministicFinalReport(draft);
      }
    },
  };
}

async function chatCompletion(body: Record<string, unknown>) {
  const baseUrl = process.env.OPENCODE_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.OPENCODE_API_KEY;
  const model = process.env.OPENCODE_MODEL;

  if (!baseUrl || !model) {
    throw new Error("OpenCode provider requires OPENCODE_BASE_URL and OPENCODE_MODEL.");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      ...body,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenCode request failed with ${response.status}.`);
  }

  return (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
        tool_calls?: Array<{
          function?: {
            name?: string;
            arguments?: string;
          };
        }>;
      };
    }>;
  };
}

function toOpenAiTool(tool: ProviderToolDefinition) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  };
}
