import type { CampaignBrief } from "../schemas";

export const completeBrief: CampaignBrief = {
  brandName: "Volt Pop",
  productOrService: "zero sugar energy drink",
  campaignGoal:
    "Launch a two-week creator campaign that earns Gen Z trial and social participation.",
  targetAudience: "Gen Z students and young professionals interested in fitness and gaming",
  audienceSegments: ["Gen Z students", "young fitness creators"],
  market: "United States",
  budgetRange: "$40k-$60k",
  channels: ["TikTok", "Instagram", "YouTube Shorts"],
  timelineWeeks: 2,
  constraints: "Avoid medical claims and keep creator language flexible.",
  brandVoice: "direct, energetic, and culturally fluent",
  competitors: ["Red Bull", "Celsius"],
  creatorCriteria:
    "Creators must have audience trust, short-form skill, category adjacency, and low brand-safety risk.",
  successMetrics: ["qualified site visits", "creator comment quality"],
  mandatoryMessages: ["zero sugar energy without a crash", "built for busy student routines"],
  forbiddenClaims: ["instant results", "100% safe"],
  approvalRequirements:
    "Legal must approve product claims and brand must approve creator scripts before publication.",
  knowledgeNotes:
    "Past campaigns performed best when creators showed realistic routines and answered objections in comments.",
};
