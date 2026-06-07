import { describe, expect, test } from "bun:test";
import {
  CampaignTaskSchema,
  CampaignContentItemSchema,
  BudgetAllocationSchema,
  MarketingMetricSchema,
  AssistantMessageSchema,
  CampaignViewModeSchema,
  CampaignAssetPlaceholderSchema,
  WizardStepSchema,
  CampaignProjectSchema,
} from "../schemas";

describe("new schemas", () => {
  test("CampaignTaskSchema validates with defaults", () => {
    const task = CampaignTaskSchema.parse({ id: "t1", title: "Test task" });
    expect(task.status).toBe("backlog");
    expect(task.approvalRisk).toBe("low");
    expect(task.budget).toBe(0);
  });

  test("CampaignContentItemSchema validates with defaults", () => {
    const item = CampaignContentItemSchema.parse({
      id: "c1",
      title: "Test content",
      channel: "TikTok",
    });
    expect(item.status).toBe("draft");
    expect(item.day).toBe(1);
  });

  test("BudgetAllocationSchema validates with string bucket", () => {
    const valid = BudgetAllocationSchema.parse({
      bucket: "Creator fees",
      amount: 5000,
      percentage: 40,
    });
    expect(valid.bucket).toBe("Creator fees");

    const custom = BudgetAllocationSchema.parse({
      bucket: "Custom bucket",
      amount: 100,
    });
    expect(custom.bucket).toBe("Custom bucket");
  });

  test("MarketingMetricSchema validates with string key", () => {
    const valid = MarketingMetricSchema.parse({
      key: "cpl",
      label: "CPL",
      value: 12.5,
      unit: "$",
    });
    expect(valid.key).toBe("cpl");

    const custom = MarketingMetricSchema.parse({
      key: "custom_metric",
      label: "Custom",
    });
    expect(custom.key).toBe("custom_metric");
  });

  test("AssistantMessageSchema validates roles", () => {
    const msg = AssistantMessageSchema.parse({
      id: "m1",
      role: "user",
      content: "Hello",
      createdAt: "2026-01-01T00:00:00Z",
    });
    expect(msg.role).toBe("user");
  });

  test("CampaignViewModeSchema accepts all view modes", () => {
    const modes = ["board", "calendar", "list", "budget", "metrics", "assistant"];
    for (const mode of modes) {
      expect(CampaignViewModeSchema.parse(mode)).toBe(mode);
    }
  });

  test("WizardStepSchema accepts all steps including context_sources", () => {
    const steps = [
      "context_sources",
      "brand_goal",
      "audience",
      "channels_creative",
      "budget_metrics",
      "guardrails_approvals",
      "review_run",
    ];
    for (const step of steps) {
      expect(WizardStepSchema.parse(step)).toBe(step);
    }
  });

  test("CampaignProjectSchema has all new fields with defaults", () => {
    const project = CampaignProjectSchema.parse({
      id: "p1",
      name: "Test",
      status: "draft",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      brief: {},
    });
    expect(project.tasks).toEqual([]);
    expect(project.contentItems).toEqual([]);
    expect(project.assets).toEqual([]);
    expect(project.budget).toEqual([]);
    expect(project.metrics).toEqual([]);
    expect(project.assistantMessages).toEqual([]);
    expect(project.viewMode).toBe("board");
    expect(project.sidebarCollapsed).toBe(false);
    expect(project.wizardStep).toBe("context_sources");
    expect(project.wizardCompleted).toBe(false);
    expect(project.templateId).toBe(null);
    expect(project.contextSources).toEqual([]);
    expect(project.contextFiles).toEqual([]);
    expect(project.contextNotes).toBe("");
    expect(project.customColumns).toEqual([]);
  });

  test("CampaignAssetPlaceholderSchema validates types", () => {
    const asset = CampaignAssetPlaceholderSchema.parse({
      id: "a1",
      name: "Test asset",
      type: "video",
    });
    expect(asset.type).toBe("video");
    expect(asset.status).toBe("placeholder");
  });
});
