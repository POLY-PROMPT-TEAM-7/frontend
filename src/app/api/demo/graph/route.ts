import { NextResponse } from "next/server";

import graphPayload from "@/lib/demo/biology.graph.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(graphPayload, { status: 200 });
}
