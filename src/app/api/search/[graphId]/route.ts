import { proxyJson } from "@/lib/server/proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ graphId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { graphId } = await context.params;
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const searchParams = new URLSearchParams({ q });
  return proxyJson({ method: "GET", path: `/search/${graphId}`, searchParams });
}
