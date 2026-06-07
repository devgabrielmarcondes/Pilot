import { describe, expect, test } from "bun:test";
import { CampaignBriefSchema } from "../schemas";
import { completeBrief } from "./test-fixtures";

describe("campaign brief schema", () => {
  test("accepts a structured complete brief", () => {
    const parsed = CampaignBriefSchema.parse(completeBrief);

    expect(parsed.brandName).toBe("Volt Pop");
    expect(parsed.audienceSegments).toHaveLength(2);
  });

  test("rejects generic incomplete briefs", () => {
    const result = CampaignBriefSchema.safeParse({
      brandName: "A",
      productOrService: "",
      campaignGoal: "Launch",
      targetAudience: "",
      market: "",
      budgetRange: "",
      channels: [],
    });

    expect(result.success).toBe(false);
  });
});
