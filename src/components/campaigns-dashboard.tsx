"use client";

import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getLatestRun, useCampaignStore } from "@/lib/campaign-store";

export function CampaignsDashboard() {
  const router = useRouter();
  const { state, hasLoaded, createProject, selectProject } = useCampaignStore();

  function createAndOpen() {
    const project = createProject();
    router.push(`/campaigns/${project.id}` as never);
  }

  function openProject(projectId: string) {
    selectProject(projectId);
    router.push(`/campaigns/${projectId}` as never);
  }

  if (!hasLoaded) {
    return <main className="page" />;
  }

  if (state.projects.length === 0) {
    return (
      <main className="page">
        <div className="empty-structure">
          <div className="empty-structure-header">
            <span className="text-xs font-mono text-black/40 uppercase tracking-wider">Campaigns</span>
            <div className="flex items-center gap-2">
              <FolderKanban size={14} className="text-black/30" />
            </div>
          </div>
          <div className="empty-structure-body">
            <div className="text-center">
              <div className="mx-auto mb-5 grid size-11 place-items-center rounded-full bg-[#7C3AED]/10 text-[#7C3AED]">
                <FolderKanban size={22} />
              </div>
              <h1 className="font-display text-2xl font-semibold">No campaigns yet</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/55">
                Create a campaign to get started. Use a template or start from scratch with the guided wizard.
              </p>
              <Button className="mt-6" type="button" onClick={createAndOpen}>
                <Plus size={12} />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <div className="page-subtitle">
            Your campaign projects. Open any campaign to continue planning.
          </div>
        </div>
        <Button type="button" onClick={createAndOpen}>
          <Plus size={12} />
          Create Campaign
        </Button>
      </div>

      <div className="scenarios">
        {state.projects.map((project) => {
          const run = getLatestRun(project);

          return (
            <button
              className="scenario-card text-left"
              key={project.id}
              type="button"
              onClick={() => openProject(project.id)}
            >
              <div className="scenario-head">
                <span className="scenario-name">{project.name}</span>
                <Badge
                  variant={
                    project.status === "blocked"
                      ? "danger"
                      : project.status === "approved" || project.status === "evaluated"
                        ? "success"
                        : project.status === "draft"
                          ? "warning"
                          : "default"
                  }
                >
                  {project.status}
                </Badge>
              </div>
              <div className="scenario-body">
                <div className="scenario-desc">
                  {project.brief.campaignGoal || "Brief not completed yet."}
                </div>
                <div className="scenario-metrics">
                  <Metric label="Brand" value={project.brief.brandName || "Missing"} />
                  <Metric label="Channels" value={project.brief.channels.length.toString()} />
                  <Metric label="Runs" value={project.runs.length.toString()} />
                  <Metric label="Wizard" value={project.wizardCompleted ? "Done" : "In progress"} />
                </div>
              </div>
              <div className="scenario-foot">
                <span className="scenario-time">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
                <span className="scenario-link">
                  <Sparkles size={12} />
                  Open campaign
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="scenario-metric-label">{label}</div>
      <div className="scenario-metric-value">{value}</div>
    </div>
  );
}
