"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BudgetAllocationSchema,
  CampaignBriefDraftSchema,
  CampaignProjectSchema,
  CampaignStoreStateSchema,
  MarketingMetricSchema,
  type BudgetAllocation,
  type CampaignBriefDraft,
  type CampaignProject,
  type CampaignRun,
  type CampaignStoreState,
  type CampaignTask,
  type CampaignContentItem,
  type CampaignAssetPlaceholder,
  type CampaignViewMode,
  type MarketingMetric,
  type WizardStep,
  type ContextFile,
} from "./schemas";

export const CAMPAIGN_STORE_KEY = "samy_campaign_projects_v3";

export const emptyCampaignStoreState: CampaignStoreState = {
  activeProjectId: null,
  projects: [],
};

export const DEFAULT_COLUMNS = ["backlog", "in_review", "approved", "scheduled", "published"];

export function createEmptyCampaignProject(now = new Date().toISOString()): CampaignProject {
  return CampaignProjectSchema.parse({
    id: crypto.randomUUID(),
    name: "Untitled campaign",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    brief: CampaignBriefDraftSchema.parse({}),
    runs: [],
    tasks: [],
    contentItems: [],
    assets: [],
    budget: defaultBudget(),
    metrics: defaultMetrics(),
    assistantMessages: [],
    viewMode: "board",
    sidebarCollapsed: false,
    wizardStep: "context_sources",
    wizardCompleted: false,
    templateId: null,
    contextSources: [],
    contextFiles: [],
    contextNotes: "",
    customColumns: [],
  });
}

export function createProjectFromTemplate(
  templateBrief: CampaignBriefDraft,
  templateId: string,
  now = new Date().toISOString(),
): CampaignProject {
  return CampaignProjectSchema.parse({
    id: crypto.randomUUID(),
    name: "Untitled campaign",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    brief: CampaignBriefDraftSchema.parse(templateBrief),
    runs: [],
    tasks: [],
    contentItems: [],
    assets: [],
    budget: defaultBudget(),
    metrics: defaultMetrics(),
    assistantMessages: [],
    viewMode: "board",
    sidebarCollapsed: false,
    wizardStep: "context_sources",
    wizardCompleted: false,
    templateId,
    contextSources: [],
    contextFiles: [],
    contextNotes: "",
    customColumns: [],
  });
}

export function defaultBudget(): BudgetAllocation[] {
  return [
    BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: "Creator fees", amount: 0, percentage: 40 }),
    BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: "Paid boost", amount: 0, percentage: 25 }),
    BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: "Production", amount: 0, percentage: 15 }),
    BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: "Tools", amount: 0, percentage: 10 }),
    BudgetAllocationSchema.parse({ id: crypto.randomUUID(), bucket: "Contingency", amount: 0, percentage: 10 }),
  ];
}

export function defaultMetrics(): MarketingMetric[] {
  return [
    MarketingMetricSchema.parse({ key: "spend", label: "Spend", value: 0, unit: "$", editable: true }),
    MarketingMetricSchema.parse({ key: "projected_leads", label: "Projected leads", value: 0, unit: "", editable: true }),
    MarketingMetricSchema.parse({ key: "cpl", label: "CPL", value: 0, unit: "$", editable: false }),
    MarketingMetricSchema.parse({ key: "projected_customers", label: "Projected customers", value: 0, unit: "", editable: true }),
    MarketingMetricSchema.parse({ key: "cac", label: "CAC", value: 0, unit: "$", editable: false }),
    MarketingMetricSchema.parse({ key: "ctr", label: "CTR", value: 0, unit: "%", editable: true }),
    MarketingMetricSchema.parse({ key: "cvr", label: "CVR", value: 0, unit: "%", editable: true }),
    MarketingMetricSchema.parse({ key: "cpm", label: "CPM", value: 0, unit: "$", editable: false }),
    MarketingMetricSchema.parse({ key: "cpc", label: "CPC", value: 0, unit: "$", editable: false }),
    MarketingMetricSchema.parse({ key: "roas", label: "ROAS", value: 0, unit: "x", editable: false }),
    MarketingMetricSchema.parse({ key: "creator_cost_per_post", label: "Creator cost per post", value: 0, unit: "$", editable: true }),
    MarketingMetricSchema.parse({ key: "budget_remaining", label: "Budget remaining", value: 0, unit: "$", editable: false }),
  ];
}

export function recalculateMetrics(
  budget: BudgetAllocation[],
  metrics: MarketingMetric[],
  totalBudget: number,
): MarketingMetric[] {
  const spend = metrics.find((m) => m.key === "spend")?.value ?? 0;
  const leads = metrics.find((m) => m.key === "projected_leads")?.value ?? 0;
  const customers = metrics.find((m) => m.key === "projected_customers")?.value ?? 0;
  const ctr = metrics.find((m) => m.key === "ctr")?.value ?? 0;
  const totalAllocated = budget.reduce((sum, b) => sum + b.amount, 0);

  return metrics.map((m) => {
    switch (m.key) {
      case "cpl":
        return { ...m, value: leads > 0 ? Math.round((spend / leads) * 100) / 100 : 0 };
      case "cac":
        return { ...m, value: customers > 0 ? Math.round((spend / customers) * 100) / 100 : 0 };
      case "cpm":
        return { ...m, value: ctr > 0 ? Math.round((spend / (ctr / 100 * 1000)) * 100) / 100 : 0 };
      case "cpc":
        return { ...m, value: ctr > 0 ? Math.round((spend / (ctr / 100 * 100)) * 100) / 100 : 0 };
      case "roas":
        return { ...m, value: spend > 0 && customers > 0 ? Math.round((customers * 50 / spend) * 100) / 100 : 0 };
      case "budget_remaining":
        return { ...m, value: Math.max(0, totalBudget - totalAllocated) };
      default:
        return m;
    }
  });
}

export function parseCampaignStore(raw: string | null): CampaignStoreState {
  if (!raw) {
    return emptyCampaignStoreState;
  }

  try {
    return CampaignStoreStateSchema.parse(JSON.parse(raw));
  } catch {
    return emptyCampaignStoreState;
  }
}

export function serializeCampaignStore(state: CampaignStoreState) {
  return JSON.stringify(CampaignStoreStateSchema.parse(state));
}

export function renameProjectFromBrief(project: CampaignProject): CampaignProject {
  const brand = project.brief.brandName.trim();
  const product = project.brief.productOrService.trim();
  const name = brand && product ? `${brand} - ${product}` : brand || product || "Untitled campaign";

  return {
    ...project,
    name,
  };
}

export function upsertProject(state: CampaignStoreState, project: CampaignProject): CampaignStoreState {
  const normalized = renameProjectFromBrief(project);
  const projects = state.projects.some((item) => item.id === normalized.id)
    ? state.projects.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...state.projects];

  return {
    activeProjectId: normalized.id,
    projects,
  };
}

export function getActiveProject(state: CampaignStoreState) {
  return state.projects.find((project) => project.id === state.activeProjectId) ?? null;
}

export function getProjectById(state: CampaignStoreState, id: string) {
  return state.projects.find((project) => project.id === id) ?? null;
}

export function getLatestRun(project: CampaignProject | null) {
  if (!project || project.runs.length === 0) {
    return null;
  }

  return [...project.runs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

export function updateProjectBrief(
  project: CampaignProject,
  brief: CampaignBriefDraft,
  now = new Date().toISOString(),
): CampaignProject {
  return renameProjectFromBrief({
    ...project,
    brief: CampaignBriefDraftSchema.parse(brief),
    updatedAt: now,
  });
}

export function upsertRun(
  project: CampaignProject,
  run: CampaignRun,
  now = new Date().toISOString(),
): CampaignProject {
  const runs = project.runs.some((item) => item.id === run.id)
    ? project.runs.map((item) => (item.id === run.id ? run : item))
    : [run, ...project.runs];

  return {
    ...project,
    status: run.status,
    updatedAt: now,
    runs,
  };
}

export function useCampaignStore() {
  const [state, setState] = useState<CampaignStoreState>(emptyCampaignStoreState);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setState(parseCampaignStore(window.localStorage.getItem(CAMPAIGN_STORE_KEY)));
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(CAMPAIGN_STORE_KEY, serializeCampaignStore(state));
    }
  }, [hasLoaded, state]);

  const activeProject = useMemo(() => getActiveProject(state), [state]);
  const latestRun = useMemo(() => getLatestRun(activeProject), [activeProject]);

  function createProject() {
    const project = createEmptyCampaignProject();
    setState((current) => upsertProject(current, project));
    return project;
  }

  function createFromTemplate(templateBrief: CampaignBriefDraft, templateId: string) {
    const project = createProjectFromTemplate(templateBrief, templateId);
    setState((current) => upsertProject(current, project));
    return project;
  }

  function selectProject(projectId: string) {
    setState((current) => ({
      ...current,
      activeProjectId: projectId,
    }));
  }

  function saveProject(project: CampaignProject) {
    setState((current) => upsertProject(current, project));
  }

  function saveBrief(project: CampaignProject, brief: CampaignBriefDraft) {
    saveProject(updateProjectBrief(project, brief));
  }

  function saveRun(project: CampaignProject, run: CampaignRun) {
    saveProject(upsertRun(project, run));
  }

  function updateViewMode(projectId: string, viewMode: CampaignViewMode) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, viewMode } : p,
      ),
    }));
  }

  function toggleSidebar(projectId: string) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, sidebarCollapsed: !p.sidebarCollapsed } : p,
      ),
    }));
  }

  function updateWizardStep(projectId: string, step: WizardStep) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, wizardStep: step } : p,
      ),
    }));
  }

  function completeWizard(projectId: string) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, wizardCompleted: true } : p,
      ),
    }));
  }

  function updateTasks(projectId: string, tasks: CampaignTask[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, tasks, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateContentItems(projectId: string, contentItems: CampaignContentItem[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, contentItems, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateAssets(projectId: string, assets: CampaignAssetPlaceholder[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, assets, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateBudget(projectId: string, budget: BudgetAllocation[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) => {
        if (p.id !== projectId) return p;
        const totalBudget = parseTotalBudget(p.brief.budgetRange);
        const metrics = recalculateMetrics(budget, p.metrics, totalBudget);
        return { ...p, budget, metrics, updatedAt: new Date().toISOString() };
      }),
    }));
  }

  function updateMetrics(projectId: string, metrics: MarketingMetric[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) => {
        if (p.id !== projectId) return p;
        const totalBudget = parseTotalBudget(p.brief.budgetRange);
        const recalculated = recalculateMetrics(p.budget, metrics, totalBudget);
        return { ...p, metrics: recalculated, updatedAt: new Date().toISOString() };
      }),
    }));
  }

  function updateContextSources(projectId: string, contextSources: string[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, contextSources, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateContextFiles(projectId: string, contextFiles: ContextFile[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, contextFiles, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateContextNotes(projectId: string, contextNotes: string) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, contextNotes, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function updateCustomColumns(projectId: string, customColumns: string[]) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((p) =>
        p.id === projectId ? { ...p, customColumns, updatedAt: new Date().toISOString() } : p,
      ),
    }));
  }

  function deleteProject(projectId: string) {
    setState((current) => ({
      activeProjectId: current.activeProjectId === projectId ? null : current.activeProjectId,
      projects: current.projects.filter((p) => p.id !== projectId),
    }));
  }

  return {
    state,
    hasLoaded,
    activeProject,
    latestRun,
    createProject,
    createFromTemplate,
    selectProject,
    saveProject,
    saveBrief,
    saveRun,
    updateViewMode,
    toggleSidebar,
    updateWizardStep,
    completeWizard,
    updateTasks,
    updateContentItems,
    updateAssets,
    updateBudget,
    updateMetrics,
    updateContextSources,
    updateContextFiles,
    updateContextNotes,
    updateCustomColumns,
    deleteProject,
  };
}

export function parseTotalBudget(budgetRange: string): number {
  const match = budgetRange.match(/\$?([\d,]+)k?/i);
  if (!match) return 50000;
  const num = parseInt(match[1].replace(/,/g, ""), 10);
  return budgetRange.toLowerCase().includes("k") ? num * 1000 : num;
}
