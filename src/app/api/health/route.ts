import { NextResponse } from "next/server";

import { probeApiReachable } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiReachable = await probeApiReachable();
  return NextResponse.json({ status: "ok", apiReachable });
}
