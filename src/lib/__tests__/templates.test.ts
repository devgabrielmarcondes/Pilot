import { describe, expect, test } from "bun:test";
import { campaignTemplates } from "../templates";
import { CampaignBriefDraftSchema } from "../schemas";

describe("campaign templates", () => {
  test("all templates have valid brief drafts", () => {
    for (const template of campaignTemplates) {
      const parsed = CampaignBriefDraftSchema.safeParse(template.brief);
      expect(parsed.success).toBe(true);
    }
  });

  test("templates fill brief fields without creating a campaign", () => {
    for (const template of campaignTemplates) {
      expect(template.brief.productOrService.length).toBeGreaterThan(0);
      expect(template.brief.campaignGoal.length).toBeGreaterThan(0);
      expect(template.brief.targetAudience.length).toBeGreaterThan(0);
      expect(template.brief.channels.length).toBeGreaterThan(0);
      expect(template.brief.brandName).toBe("");
    }
  });

  test("there are exactly four templates", () => {
    expect(campaignTemplates).toHaveLength(4);
  });

  test("each template has a unique id", () => {
    const ids = campaignTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
