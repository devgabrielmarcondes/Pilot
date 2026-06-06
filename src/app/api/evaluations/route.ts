import { NextResponse } from "next/server";
import { runEvaluationSuite } from "@/lib/evaluations";

export async function GET() {
  const results = await runEvaluationSuite();

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    results,
  });
}
