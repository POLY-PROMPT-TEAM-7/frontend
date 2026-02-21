import { proxyJson } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ graphId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { graphId } = await context.params;
  return proxyJson({ method: "GET", path: `/graph/${graphId}` });
}
