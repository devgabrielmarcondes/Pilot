import type { CampaignBrief, GuardrailFinding } from "./schemas";

const injectionPatterns = [
  /ignore (all )?(previous|above) instructions/i,
  /reveal (the )?(system|developer) prompt/i,
  /act as unrestricted/i,
  /bypass (safety|guardrails|policy)/i,
  /print hidden/i,
];

const unsupportedClaimPatterns = [
  /guarantee(s|d)? weight loss/i,
  /cure(s|d)?/i,
  /100% safe/i,
  /no side effects/i,
  /instant results/i,
];

export function runInputGuardrails(brief: CampaignBrief): GuardrailFinding[] {
  const requestText = [
    brief.brandName,
    brief.productOrService,
    brief.campaignGoal,
    brief.targetAudience,
    brief.audienceSegments.join("\n"),
    brief.market,
    brief.budgetRange,
    brief.brandVoice,
    brief.competitors.join("\n"),
    brief.creatorCriteria,
    brief.successMetrics.join("\n"),
    brief.mandatoryMessages.join("\n"),
    brief.approvalRequirements,
    brief.constraints,
    brief.knowledgeNotes,
  ].join("\n");
  const policyText = brief.forbiddenClaims.join("\n");
  const text = `${requestText}\n${policyText}`;

  const findings: GuardrailFinding[] = [];

  if (injectionPatterns.some((pattern) => pattern.test(text))) {
    findings.push({
      id: "prompt-injection-detected",
      severity: "block",
      category: "prompt_injection",
      message: "The brief contains language that attempts to override system instructions.",
    });
  }

  if (unsupportedClaimPatterns.some((pattern) => pattern.test(text))) {
    findings.push({
      id: "unsupported-claim-detected",
      severity: "warning",
      category: "unsupported_claim",
      message: "The brief includes a claim that should be softened or substantiated before launch.",
    });
  }

  for (const forbiddenClaim of brief.forbiddenClaims) {
    const claim = forbiddenClaim.trim();

    if (claim.length > 1 && requestText.toLowerCase().includes(claim.toLowerCase())) {
      findings.push({
        id: `forbidden-claim-${slugify(claim)}`,
        severity: "warning",
        category: "unsupported_claim",
        message: `The brief asks for a forbidden claim: "${claim}". Remove or reframe it before launch.`,
      });
    }
  }

  if (/under\s?13|children|kids/i.test(text)) {
    findings.push({
      id: "youth-audience-review",
      severity: "warning",
      category: "privacy",
      message: "Youth-oriented campaigns should include stricter targeting and approval review.",
    });
  }

  return findings;
}

export function isBlocked(findings: GuardrailFinding[]) {
  return findings.some((finding) => finding.severity === "block");
}

export function runOutputSafetyReview(summary: string): GuardrailFinding[] {
  const findings: GuardrailFinding[] = [];

  if (unsupportedClaimPatterns.some((pattern) => pattern.test(summary))) {
    findings.push({
      id: "output-claim-review",
      severity: "warning",
      category: "unsupported_claim",
      message: "Generated output contains a claim that requires evidence or legal review.",
    });
  }

  if (!summary.toLowerCase().includes("approval")) {
    findings.push({
      id: "approval-step-missing",
      severity: "info",
      category: "quality",
      message: "Add a human approval step before publishing campaign assets.",
    });
  }

  return findings;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
