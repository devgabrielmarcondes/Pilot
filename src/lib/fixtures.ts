import type { CampaignBrief, CalendarPost, CreatorRecommendation } from "./schemas";

export const trendFixtures = [
  {
    id: "creator-led-proof",
    markets: ["United States", "Brazil", "Global"],
    audiences: ["Gen Z", "young professionals", "fitness"],
    title: "Creator-led proof beats polished brand claims",
    signal:
      "Short-form videos with creator demos and transparent constraints outperform scripted product spots.",
    recommendedUse: "Use creators as validators, not as ad readers.",
  },
  {
    id: "micro-series",
    markets: ["United States", "Spain", "Global"],
    audiences: ["Gen Z", "students", "young professionals"],
    title: "Episodic micro-series drive repeat attention",
    signal:
      "Audiences return when campaign content has recurring formats, simple hooks, and a visible progression.",
    recommendedUse: "Package the launch as a two-week story arc.",
  },
  {
    id: "community-challenge",
    markets: ["Brazil", "Mexico", "Global"],
    audiences: ["Gen Z", "gaming", "fitness"],
    title: "Community challenges convert passive reach into participation",
    signal:
      "Low-friction challenges work best when creators show multiple ways to participate.",
    recommendedUse: "Create one repeatable challenge with creator variants.",
  },
];

export const competitorFixtures = [
  {
    brand: "Red Bull",
    category: "Energy drink",
    campaigns: [
      "Extreme-sports storytelling connects product usage to identity.",
      "Creator partnerships work because the talent already owns the subculture.",
      "The brand uses events as content engines, not one-off sponsorships.",
    ],
  },
  {
    brand: "Liquid Death",
    category: "Beverage",
    campaigns: [
      "Humor and anti-category positioning make simple product benefits memorable.",
      "Limited drops and creator stunts create social currency.",
      "Brand safety requires sharper approval because the tone is intentionally provocative.",
    ],
  },
  {
    brand: "Duolingo",
    category: "Consumer app",
    campaigns: [
      "A distinctive character voice makes reactive social feel coherent.",
      "Fast trend response works because internal guardrails are clear.",
      "The brand accepts controlled weirdness while protecting user trust.",
    ],
  },
];

export const influencerFixtures: CreatorRecommendation[] = [
  {
    handle: "@mika.moves",
    niche: "fitness lifestyle",
    fitReason: "High-energy short-form routines with credible product integration moments.",
    estimatedCost: "$4k-$7k",
    risk: "low",
  },
  {
    handle: "@bytebreaks",
    niche: "student productivity",
    fitReason: "Study-session formats align well with launch-week trial prompts.",
    estimatedCost: "$2k-$4k",
    risk: "low",
  },
  {
    handle: "@neonfork",
    niche: "food and beverage culture",
    fitReason: "Strong taste-test storytelling and fast comment response loops.",
    estimatedCost: "$5k-$9k",
    risk: "medium",
  },
  {
    handle: "@streamshift",
    niche: "gaming and Twitch clips",
    fitReason: "Audience overlaps with late-night social viewing and challenge participation.",
    estimatedCost: "$7k-$12k",
    risk: "medium",
  },
];

export const knowledgeBase = [
  {
    id: "samy-social-first",
    title: "Social-first campaign principle",
    body:
      "Start with the social behavior the campaign wants to earn. Build formats creators can adapt rather than scripts they must repeat.",
    tags: ["strategy", "creator", "social-first"],
  },
  {
    id: "approval-ladder",
    title: "Human approval ladder",
    body:
      "Campaigns with health, finance, youth, or performance claims should route through human review before final publication.",
    tags: ["guardrails", "approval", "safety"],
  },
  {
    id: "measurement-baseline",
    title: "Measurement baseline",
    body:
      "Report reach, completion rate, creator engagement quality, cost per qualified visit, and saved/commented content as separate signals.",
    tags: ["evaluation", "measurement"],
  },
  {
    id: "creator-fit",
    title: "Creator fit criteria",
    body:
      "Prioritize creators with repeated audience trust signals, comment depth, category adjacency, and a low mismatch between personal tone and brand promise.",
    tags: ["influencer", "quality"],
  },
];

export function selectRelevantTrends(brief: CampaignBrief) {
  const haystack = [
    brief.targetAudience,
    brief.audienceSegments.join(" "),
    brief.market,
    brief.productOrService,
    brief.brandVoice,
    brief.creatorCriteria,
  ]
    .join(" ")
    .toLowerCase();

  return trendFixtures
    .map((trend) => {
      const score = [...trend.markets, ...trend.audiences].reduce(
        (total, term) => total + (haystack.includes(term.toLowerCase()) ? 2 : 0),
        0,
      );
      return { ...trend, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function selectCompetitors(brief: CampaignBrief) {
  const product = brief.productOrService.toLowerCase();
  const userCompetitors = brief.competitors.map((brand) => ({
    brand,
    category: "User-provided competitor",
    campaigns: [
      `Review ${brand}'s creator formats, claims, and audience comments before final activation.`,
      `Use ${brand} only as positioning context; do not copy claims, hooks, or creator language.`,
    ],
  }));

  if (product.includes("drink") || product.includes("beverage") || product.includes("energy")) {
    return [
      ...userCompetitors,
      ...competitorFixtures.filter((item) => item.category.toLowerCase().includes("drink")),
    ].slice(0, 4);
  }

  return [...userCompetitors, ...competitorFixtures.slice(0, 2)].slice(0, 4);
}

export function selectCreators(brief: CampaignBrief) {
  const target = `${brief.targetAudience} ${brief.audienceSegments.join(" ")} ${brief.productOrService} ${brief.creatorCriteria}`.toLowerCase();

  return influencerFixtures
    .map((creator) => ({
      ...creator,
      score:
        (target.includes("fitness") && creator.niche.includes("fitness") ? 2 : 0) +
        (target.includes("student") && creator.niche.includes("student") ? 2 : 0) +
        (target.includes("gaming") && creator.niche.includes("gaming") ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...creator }) => creator);
}

export function retrieveKnowledge(brief: CampaignBrief) {
  const query = [
    brief.campaignGoal,
    brief.targetAudience,
    brief.audienceSegments.join(" "),
    brief.constraints,
    brief.brandVoice,
    brief.creatorCriteria,
    brief.successMetrics.join(" "),
    brief.mandatoryMessages.join(" "),
    brief.forbiddenClaims.join(" "),
    brief.approvalRequirements,
    brief.knowledgeNotes,
  ]
    .join(" ")
    .toLowerCase();

  return knowledgeBase
    .map((item) => {
      const score = item.tags.reduce(
        (total, tag) => total + (query.includes(tag) ? 2 : 0),
        query.includes("approval") || query.includes("risk") ? 1 : 0,
      );
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .concat(
      brief.knowledgeNotes
        ? [
            {
              id: "user-knowledge-notes",
              title: "Campaign knowledge notes",
              body: brief.knowledgeNotes,
              tags: ["user-input", "brief"],
              score: 10,
            },
          ]
        : [],
    );
}

export function buildCalendar(brief: CampaignBrief): CalendarPost[] {
  const fallbackChannels: CampaignBrief["channels"] = ["TikTok", "Instagram"];
  const channels = brief.channels.length > 0 ? brief.channels : fallbackChannels;
  const formats = ["creator demo", "comment reply", "challenge prompt", "behind-the-scenes"];

  return Array.from({ length: 10 }, (_, index) => {
    const channel = channels[index % channels.length];
    const format = formats[index % formats.length];
    const day = index + 1;

    return {
      day,
      channel,
      format,
      concept:
        day <= 3
          ? `Tease ${brief.productOrService} through a ${format} built around: ${brief.mandatoryMessages[0]}.`
          : `Turn ${brief.brandName} proof points into a ${format} with ${brief.brandVoice} creator language.`,
      objective: day <= 5 ? "Earn attention and comments" : "Convert interest into trial intent",
      approvalRisk: format === "comment reply" ? "medium" : "low",
    };
  });
}
