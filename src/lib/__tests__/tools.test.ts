import { describe, expect, test } from "bun:test";
import { buildDefaultToolRequests, executeTools } from "../tools";
import { completeBrief } from "./test-fixtures";

describe("tools", () => {
  test("executes the default agent tool chain", async () => {
    const requests = buildDefaultToolRequests(completeBrief);
    const traces = await executeTools(requests, completeBrief);

    expect(traces).toHaveLength(6);
    expect(traces.every((trace) => trace.status === "success")).toBe(true);
    expect(traces.map((trace) => trace.toolName)).toContain("knowledge_retrieve");
    expect(traces.map((trace) => trace.toolName)).toContain("safety_review");
  });
});
