import { proxyJson } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyJson({ method: "POST", path: "/extract", request });
}
