import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { finalizeCampaign } from "@/lib/agent";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await finalizeCampaign(body);

    if (!result.ok) {
      return NextResponse.json(result, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid approval payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to finalize campaign.",
      },
      { status: 500 },
    );
  }
}
