import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { evaluateCampaignRun } from "@/lib/evaluations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const evaluation = evaluateCampaignRun(body);

    return NextResponse.json({
      ok: true,
      evaluation,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid evaluation payload.",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to evaluate run.",
      },
      { status: 500 },
    );
  }
}
