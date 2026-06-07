import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body.message as string;
    const brief = body.brief;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 },
      );
    }

    const reply = generateMockReply(message, brief);

    return NextResponse.json({
      ok: true,
      reply,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to process request.",
      },
      { status: 500 },
    );
  }
}

function generateMockReply(message: string, brief: Record<string, unknown> | undefined): string {
  const lower = message.toLowerCase();

  if (lower.includes("calendar") || lower.includes("improve")) {
    return `Based on the campaign brief${brief?.brandName ? ` for ${brief.brandName}` : ""}, here are suggestions to improve the calendar:\n\n1. Front-load creator content in week 1 to build social proof before brand-owned posts.\n2. Add comment-response content on days 3 and 7 to handle objections.\n3. Include a recap/compilation post at the end of each week.\n4. Test different formats across channels - short-form on TikTok, carousel on Instagram, long-form on YouTube.`;
  }

  if (lower.includes("cac") || lower.includes("cost") || lower.includes("reduce")) {
    return `To reduce Customer Acquisition Cost:\n\n1. Shift budget toward micro-creators with higher engagement rates (typically 40-60% lower CPM).\n2. Repurpose top-performing creator content as paid ads instead of producing new assets.\n3. Focus on 2-3 channels instead of spreading thin across all platforms.\n4. Use comment-led content to drive organic reach and reduce paid dependency.`;
  }

  if (lower.includes("budget") || lower.includes("risk")) {
    return `Budget risk analysis:\n\n1. Creator fees typically represent 35-45% of total budget - ensure contracts include usage rights.\n2. Keep 10-15% as contingency for creator replacement or content reshoots.\n3. Paid boost allocation should be flexible - shift budget to top performers after week 1.\n4. Production costs can overrun if briefs are not specific enough - provide detailed creative guidelines.`;
  }

  if (lower.includes("tiktok") || lower.includes("rewrite")) {
    return `TikTok-specific recommendations:\n\n1. Lead with a hook in the first 1.5 seconds - use pattern interrupts.\n2. Keep creator scripts loose - over-scripting kills authenticity on TikTok.\n3. Use trending sounds but pair with original messaging.\n4. Plan for 3-5 content variants per creator to test hooks and formats.\n5. Include comment-pinned CTAs instead of hard-sell end cards.`;
  }

  if (lower.includes("metric") || lower.includes("kpi") || lower.includes("measure")) {
    return `Key metrics to track for this campaign:\n\n1. Primary: qualified site visits, conversion rate, cost per acquisition.\n2. Secondary: reach, engagement rate, save rate, share rate.\n3. Creator-specific: comment quality score, completion rate, click-through rate.\n4. Compare creator-led vs brand-owned content performance after week 1.`;
  }

  return `I analyzed your question about "${message}" in the context of this campaign. Here are my thoughts:\n\nThe campaign strategy should focus on creator-led content with strong approval workflows. Key priorities include authentic creator partnerships, measurable social proof, and channel-specific content adaptation.\n\nWould you like me to dive deeper into any specific area - calendar optimization, budget allocation, creator selection, or measurement planning?`;
}
