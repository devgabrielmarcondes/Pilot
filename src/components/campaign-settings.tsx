"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCampaignStore } from "@/lib/campaign-store";
import type { CampaignProject } from "@/lib/schemas";

export function CampaignSettings({
  project,
  onSaveProject,
  onDelete,
}: {
  project: CampaignProject;
  onSaveProject: (project: CampaignProject) => void;
  onDelete: () => void;
}) {
  const { deleteProject } = useCampaignStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    deleteProject(project.id);
    onDelete();
  }

  function handleResetWizard() {
    onSaveProject({
      ...project,
      wizardCompleted: false,
      wizardStep: "brand_goal",
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div>
      <div className="main-header">
        <div>
          <h1 className="main-title">Settings</h1>
          <div className="main-subtitle">{project.name}</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Campaign Info</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">ID</div>
            <div className="mono text-xs">{project.id}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">Status</div>
            <div>{project.status}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">Created</div>
            <div>{new Date(project.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">Updated</div>
            <div>{new Date(project.updatedAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">Runs</div>
            <div>{project.runs.length}</div>
          </div>
          <div>
            <div className="text-xs font-mono text-black/40 uppercase tracking-wider mb-1">Template</div>
            <div>{project.templateId || "None"}</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Wizard</div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-black/55">
            {project.wizardCompleted ? "Wizard completed. Reset to edit the brief again." : "Wizard in progress."}
          </div>
          {project.wizardCompleted && (
            <Button variant="secondary" size="sm" type="button" onClick={handleResetWizard}>
              Reset Wizard
            </Button>
          )}
        </div>
      </div>

      <div className="settings-section" style={{ borderColor: "rgb(220 38 38 / 24%)" }}>
        <div className="settings-section-title" style={{ color: "var(--danger)" }}>Danger Zone</div>
        {!confirmDelete ? (
          <div className="flex items-center justify-between">
            <div className="text-sm text-black/55">
              Permanently delete this campaign and all its data.
            </div>
            <Button variant="danger" size="sm" type="button" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={12} />
              Delete Campaign
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            <span className="text-sm text-[var(--danger)]">This cannot be undone.</span>
            <Button variant="danger" size="sm" type="button" onClick={handleDelete}>
              Confirm Delete
            </Button>
            <Button variant="secondary" size="sm" type="button" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
