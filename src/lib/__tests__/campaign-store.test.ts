import { describe, expect, test } from "bun:test";
import {
  createEmptyCampaignProject,
  parseCampaignStore,
  serializeCampaignStore,
  updateProjectBrief,
  upsertProject,
} from "../campaign-store";
import { completeBrief } from "./test-fixtures";

describe("campaign store", () => {
  test("serializes and restores campaign projects", () => {
    const project = updateProjectBrief(createEmptyCampaignProject("2026-01-01T00:00:00.000Z"), {
      ...completeBrief,
    });
    const state = upsertProject({ activeProjectId: null, projects: [] }, project);
    const restored = parseCampaignStore(serializeCampaignStore(state));

    expect(restored.projects).toHaveLength(1);
    expect(restored.activeProjectId).toBe(project.id);
    expect(restored.projects[0]?.name).toBe("Volt Pop - zero sugar energy drink");
  });

  test("falls back to empty state when storage is invalid", () => {
    const restored = parseCampaignStore("{not-json");

    expect(restored.projects).toHaveLength(0);
    expect(restored.activeProjectId).toBe(null);
  });
});
