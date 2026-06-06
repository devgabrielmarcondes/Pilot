import { describe, expect, test } from "bun:test";
import { buildDefaultToolRequests, executeTools } from "../tools";
import type { CampaignBrief } from "../schemas";

const brief: CampaignBrief = {
  brandName: "Volt Pop",
  productOrService: "zero sugar energy drink",
  campaignGoal: "Launch a creator-led campaign that earns product trial.",
  targetAudience: "Gen Z students and fitness fans",
  market: "United States",
  budgetRange: "$40k-$60k",
  channels: ["TikTok", "Instagram"],
  timelineWeeks: 2,
  constraints: "Avoid medical claims.",
};

describe("tools", () => {
  test("executes the default agent tool chain", async () => {
    const requests = buildDefaultToolRequests(brief);
    const traces = await executeTools(requests, brief);

    expect(traces).toHaveLength(6);
    expect(traces.every((trace) => trace.status === "success")).toBe(true);
    expect(traces.map((trace) => trace.toolName)).toContain("knowledge_retrieve");
    expect(traces.map((trace) => trace.toolName)).toContain("safety_review");
  });
});
