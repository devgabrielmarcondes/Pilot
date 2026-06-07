import { describe, expect, test } from "bun:test";
import {
  createEmptyCampaignProject,
  createProjectFromTemplate,
  defaultBudget,
  defaultMetrics,
  parseCampaignStore,
  recalculateMetrics,
  serializeCampaignStore,
  updateProjectBrief,
  upsertProject,
} from "../campaign-store";
import { campaignTemplates } from "../templates";
import {
  BudgetAllocationSchema,
  MarketingMetricSchema,
  type BudgetAllocation,
  type MarketingMetric,
} from "../schemas";
import { completeBrief } from "./test-fixtures";

describe("campaign store v2", () => {
  test("serializes and restores view mode, sidebar collapsed, tasks, budget, and metrics", () => {
    const project = updateProjectBrief(createEmptyCampaignProject("2026-01-01T00:00:00.000Z"), {
      ...completeBrief,
    });
    const withExtras = {
      ...project,
      viewMode: "calendar" as const,
      sidebarCollapsed: true,
      tasks: [
        {
          id: "t1",
          title: "Test task",
          description: "",
          channel: "TikTok",
          owner: "",
          budget: 500,
          status: "backlog" as const,
          approvalRisk: "low" as const,
          type: "task",
        },
      ],
      contentItems: [],
      assets: [],
      budget: defaultBudget(),
      metrics: defaultMetrics(),
      assistantMessages: [],
      wizardCompleted: true,
      wizardStep: "review_run" as const,
      templateId: null,
    };
    const state = upsertProject({ activeProjectId: null, projects: [] }, withExtras);
    const restored = parseCampaignStore(serializeCampaignStore(state));

    expect(restored.projects).toHaveLength(1);
    expect(restored.projects[0]?.viewMode).toBe("calendar");
    expect(restored.projects[0]?.sidebarCollapsed).toBe(true);
    expect(restored.projects[0]?.tasks).toHaveLength(1);
    expect(restored.projects[0]?.budget).toHaveLength(5);
    expect(restored.projects[0]?.metrics).toHaveLength(12);
  });

  test("falls back to empty state when storage is invalid", () => {
    const restored = parseCampaignStore("{not-json");
    expect(restored.projects).toHaveLength(0);
    expect(restored.activeProjectId).toBe(null);
  });

  test("creates project from template with template id", () => {
    const template = campaignTemplates[0]!;
    const project = createProjectFromTemplate(template.brief, template.id);

    expect(project.templateId).toBe(template.id);
    expect(project.brief.productOrService).toBe(template.brief.productOrService);
    expect(project.budget).toHaveLength(5);
    expect(project.metrics).toHaveLength(12);
    expect(project.viewMode).toBe("board");
    expect(project.sidebarCollapsed).toBe(false);
    expect(project.wizardStep).toBe("context_sources");
    expect(project.wizardCompleted).toBe(false);
  });

  test("default budget has five buckets", () => {
    const budget = defaultBudget();
    expect(budget).toHaveLength(5);
    expect(budget.map((b) => b.bucket)).toEqual([
      "Creator fees",
      "Paid boost",
      "Production",
      "Tools",
      "Contingency",
    ]);
  });

  test("default metrics has twelve entries", () => {
    const metrics = defaultMetrics();
    expect(metrics).toHaveLength(12);
    expect(metrics.map((m) => m.key)).toEqual([
      "spend",
      "projected_leads",
      "cpl",
      "projected_customers",
      "cac",
      "ctr",
      "cvr",
      "cpm",
      "cpc",
      "roas",
      "creator_cost_per_post",
      "budget_remaining",
    ]);
  });
});

describe("budget recalculation", () => {
  test("recalculates CPL when spend and leads change", () => {
    const budget = defaultBudget();
    let metrics = defaultMetrics().map((m) => {
      if (m.key === "spend") return { ...m, value: 1000 };
      if (m.key === "projected_leads") return { ...m, value: 100 };
      return m;
    });

    const recalculated = recalculateMetrics(budget, metrics, 50000);
    const cpl = recalculated.find((m) => m.key === "cpl");
    expect(cpl?.value).toBe(10);
  });

  test("recalculates CAC when spend and customers change", () => {
    const budget = defaultBudget();
    let metrics = defaultMetrics().map((m) => {
      if (m.key === "spend") return { ...m, value: 5000 };
      if (m.key === "projected_customers") return { ...m, value: 50 };
      return m;
    });

    const recalculated = recalculateMetrics(budget, metrics, 50000);
    const cac = recalculated.find((m) => m.key === "cac");
    expect(cac?.value).toBe(100);
  });

  test("recalculates budget remaining", () => {
    const budget: BudgetAllocation[] = [
      BudgetAllocationSchema.parse({ bucket: "Creator fees", amount: 10000, percentage: 50 }),
      BudgetAllocationSchema.parse({ bucket: "Paid boost", amount: 5000, percentage: 25 }),
      BudgetAllocationSchema.parse({ bucket: "Production", amount: 3000, percentage: 15 }),
      BudgetAllocationSchema.parse({ bucket: "Tools", amount: 1000, percentage: 5 }),
      BudgetAllocationSchema.parse({ bucket: "Contingency", amount: 1000, percentage: 5 }),
    ];
    const metrics = defaultMetrics();

    const recalculated = recalculateMetrics(budget, metrics, 50000);
    const remaining = recalculated.find((m) => m.key === "budget_remaining");
    expect(remaining?.value).toBe(30000);
  });

  test("returns zero for derived metrics when inputs are zero", () => {
    const budget = defaultBudget();
    const metrics = defaultMetrics();

    const recalculated = recalculateMetrics(budget, metrics, 50000);
    const cpl = recalculated.find((m) => m.key === "cpl");
    const cac = recalculated.find((m) => m.key === "cac");
    expect(cpl?.value).toBe(0);
    expect(cac?.value).toBe(0);
  });
});
