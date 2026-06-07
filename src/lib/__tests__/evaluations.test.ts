import { describe, expect, test } from "bun:test";
import { evaluateCampaignRun } from "../evaluations";
import { buildDeterministicDraft, buildDeterministicFinalReport } from "../providers/mock";
import { buildDefaultToolRequests, executeTools } from "../tools";
import { completeBrief } from "./test-fixtures";

describe("run evaluations", () => {
  test("scores an approved campaign run", async () => {
    const toolTrace = await executeTools(buildDefaultToolRequests(completeBrief), completeBrief);
    const draft = buildDeterministicDraft(completeBrief, toolTrace, "mock");
    const report = buildDeterministicFinalReport(draft);
    const evaluation = evaluateCampaignRun({
      runId: "run_1",
      brief: completeBrief,
      draft,
      report,
      toolTrace,
    });

    expect(evaluation.runId).toBe("run_1");
    expect(evaluation.status).toBe("pass");
    expect(evaluation.checks.length).toBe(5);
  });
});
