import { createAnthropicProvider } from "./anthropic";
import { createMockProvider } from "./mock";
import { createOpenCodeProvider } from "./opencode";
import type { AiProvider, ProviderName } from "./types";

export function selectProviderName(env: Partial<NodeJS.ProcessEnv> = process.env): ProviderName {
  const requested = env.AI_PROVIDER?.toLowerCase();

  if (requested === "mock") {
    return "mock";
  }

  if (requested === "anthropic" && env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }

  if (requested === "opencode" && env.OPENCODE_BASE_URL && env.OPENCODE_MODEL) {
    return "opencode";
  }

  if (!requested && env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }

  if (!requested && env.OPENCODE_BASE_URL && env.OPENCODE_MODEL) {
    return "opencode";
  }

  return "mock";
}

export function getAiProvider(env: Partial<NodeJS.ProcessEnv> = process.env): AiProvider {
  const providerName = selectProviderName(env);

  switch (providerName) {
    case "anthropic":
      return createAnthropicProvider();
    case "opencode":
      return createOpenCodeProvider();
    case "mock":
      return createMockProvider();
  }
}
