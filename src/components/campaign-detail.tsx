"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Play,
  Settings,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCampaignStore, getProjectById, getLatestRun } from "@/lib/campaign-store";
import type { CampaignViewMode, ContextFile } from "@/lib/schemas";
import { CampaignWizard } from "@/components/campaign-wizard";
import { CampaignAgentRun } from "@/components/campaign-agent-run";
import { CampaignCommandCenter } from "@/components/campaign-command-center";
import { CampaignEvaluation } from "@/components/campaign-evaluation";
import { CampaignSettings } from "@/components/campaign-settings";
import { EmptyState } from "@/components/empty-state";

type SidebarSection = "wizard" | "agent" | "command" | "evaluation" | "settings";

const sidebarItems: { id: SidebarSection; label: string; icon: typeof FileText }[] = [
  { id: "wizard", label: "Brief Wizard", icon: FileText },
  { id: "agent", label: "Agent Run", icon: Play },
  { id: "command", label: "Command Center", icon: LayoutDashboard },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const {
    state,
    hasLoaded,
    toggleSidebar,
    updateViewMode,
    updateWizardStep,
    completeWizard,
    saveProject,
    saveBrief,
    saveRun,
    updateTasks,
    updateContentItems,
    updateAssets,
    updateBudget,
    updateMetrics,
    updateContextSources,
    updateContextFiles,
    updateContextNotes,
    updateCustomColumns,
  } = useCampaignStore();

  const project = getProjectById(state, campaignId);
  const latestRun = getLatestRun(project);

  const [activeSection, setActiveSection] = useState<SidebarSection>(
    project?.wizardCompleted
      ? latestRun?.report
        ? "command"
        : "agent"
      : "wizard"
  );

  if (!hasLoaded) {
    return <main className="page" />;
  }

  if (!project) {
    return (
      <main className="page">
        <EmptyState
          icon={FileText}
          title="Campaign not found"
          description="This campaign does not exist or was deleted."
          actionLabel="Back to Campaigns"
          onAction={() => router.push("/app" as never)}
        />
      </main>
    );
  }

  const collapsed = project.sidebarCollapsed;

  return (
    <div className={`campaign-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="campaign-sidebar">
        <button
          className="sidebar-collapse-btn"
          type="button"
          onClick={() => toggleSidebar(project.id)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  if (item.id === "wizard") {
                    updateWizardStep(project.id, project.wizardStep);
                  }
                  if (item.id === "command") {
                    updateViewMode(project.id, project.viewMode || "board");
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <span className="sidebar-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="campaign-main">
        {activeSection === "wizard" && (
          <CampaignWizard
            project={project}
            onSaveBrief={(brief) => saveBrief(project, brief)}
            onUpdateContextSources={(sources) => updateContextSources(project.id, sources)}
            onUpdateContextFiles={(files: ContextFile[]) => updateContextFiles(project.id, files)}
            onUpdateContextNotes={(notes) => updateContextNotes(project.id, notes)}
            onComplete={() => {
              completeWizard(project.id);
              setActiveSection("agent");
            }}
            onSkipToAgent={() => setActiveSection("agent")}
          />
        )}

        {activeSection === "agent" && (
          <CampaignAgentRun
            project={project}
            run={latestRun}
            onSaveRun={(run) => saveRun(project, run)}
            onSaveProject={saveProject}
            onGoToCommand={() => setActiveSection("command")}
          />
        )}

        {activeSection === "command" && (
          <CampaignCommandCenter
            project={project}
            run={latestRun}
            viewMode={project.viewMode}
            onViewModeChange={(mode: CampaignViewMode) => updateViewMode(project.id, mode)}
            tasks={project.tasks}
            onTasksChange={(tasks) => updateTasks(project.id, tasks)}
            contentItems={project.contentItems}
            onContentItemsChange={(items) => updateContentItems(project.id, items)}
            budget={project.budget}
            onBudgetChange={(budget) => updateBudget(project.id, budget)}
            metrics={project.metrics}
            onMetricsChange={(metrics) => updateMetrics(project.id, metrics)}
            assets={project.assets}
            onAssetsChange={(assets) => updateAssets(project.id, assets)}
            assistantMessages={project.assistantMessages}
            onAssistantMessagesChange={(msgs) =>
              saveProject({ ...project, assistantMessages: msgs, updatedAt: new Date().toISOString() })
            }
            customColumns={project.customColumns}
            onCustomColumnsChange={(cols) => updateCustomColumns(project.id, cols)}
          />
        )}

        {activeSection === "evaluation" && (
          <CampaignEvaluation
            project={project}
            run={latestRun}
            onSaveRun={(run) => saveRun(project, run)}
          />
        )}

        {activeSection === "settings" && (
          <CampaignSettings
            project={project}
            onSaveProject={saveProject}
            onDelete={() => router.push("/app" as never)}
          />
        )}
      </main>
    </div>
  );
}
