import { describe, expect, test } from "bun:test";
import { runEvaluationSuite } from "../evaluations";

describe("evaluations", () => {
  test("returns deterministic evaluation results", async () => {
    const results = await runEvaluationSuite();

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.metrics.guardrailPassRate >= 0)).toBe(true);
    expect(results.find((result) => result.id === "guardrail-injection")?.status).toBe("pass");
  });
});
