import { proxyJson } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ graphId: string; nodeId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { graphId, nodeId } = await context.params;
  return proxyJson({ method: "GET", path: `/node/${graphId}/${nodeId}` });
}
