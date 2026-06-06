import { isBlocked, runInputGuardrails } from "./guardrails";
import { z } from "zod";
import { CampaignBriefSchema, CampaignDraftSchema, FinalCampaignReportSchema } from "./schemas";
import { getAiProvider } from "./providers";
import { createMockProvider } from "./providers/mock";
import { executeTools, getToolDefinitions, normalizeToolRequests } from "./tools";

export async function planCampaign(input: unknown) {
  const brief = CampaignBriefSchema.parse(input);
  const inputFindings = runInputGuardrails(brief);

  if (isBlocked(inputFindings)) {
    return {
      ok: false as const,
      status: 422,
      error: "Campaign brief was blocked by guardrails.",
      findings: inputFindings,
    };
  }

  const provider = getAiProvider();
  const mockProvider = createMockProvider(provider.name);
  let requestedToolCalls = await provider.planToolCalls(brief, getToolDefinitions());

  if (requestedToolCalls.length === 0) {
    requestedToolCalls = await mockProvider.planToolCalls(brief, getToolDefinitions());
  }

  const normalizedToolCalls = normalizeToolRequests(requestedToolCalls, brief);
  const toolTrace = await executeTools(normalizedToolCalls, brief);
  const draft = await provider.composeDraft(brief, toolTrace);

  return {
    ok: true as const,
    provider: provider.name,
    draft: CampaignDraftSchema.parse({
      ...draft,
      provider: provider.name,
      safetyFindings: [...inputFindings, ...draft.safetyFindings],
      toolTrace,
      approvalRequired: true,
      approved: false,
    }),
  };
}

export async function finalizeCampaign(input: unknown) {
  const payload = FinalizePayloadSchema.parse(input);

  if (!payload.approved) {
    return {
      ok: false as const,
      status: 422,
      error: "Human approval is required before finalizing the campaign report.",
    };
  }

  const provider = getAiProvider();
  const finalReport = await provider.composeFinalReport({
    ...payload.draft,
    provider: provider.name,
  });

  return {
    ok: true as const,
    provider: provider.name,
    report: FinalCampaignReportSchema.parse({
      ...finalReport,
      provider: provider.name,
      approved: true,
    }),
  };
}

const FinalizePayloadSchema = z.object({
  draft: CampaignDraftSchema,
  approved: z.boolean(),
});
