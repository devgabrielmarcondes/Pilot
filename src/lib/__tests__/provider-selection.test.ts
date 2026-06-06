import { describe, expect, test } from "bun:test";
import { selectProviderName } from "../providers";

describe("provider selection", () => {
  test("uses mock when no provider is configured", () => {
    expect(selectProviderName({})).toBe("mock");
  });

  test("prefers anthropic during auto-detect", () => {
    expect(
      selectProviderName({
        ANTHROPIC_API_KEY: "test",
        OPENCODE_BASE_URL: "http://localhost:4096/v1",
        OPENCODE_MODEL: "local-model",
      }),
    ).toBe("anthropic");
  });

  test("supports explicit opencode when configured", () => {
    expect(
      selectProviderName({
        AI_PROVIDER: "opencode",
        OPENCODE_BASE_URL: "http://localhost:4096/v1",
        OPENCODE_MODEL: "local-model",
      }),
    ).toBe("opencode");
  });
});
