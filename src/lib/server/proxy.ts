import { NextResponse } from "next/server";

const DEFAULT_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;

type ProxyOptions = {
  method: "GET" | "POST";
  path: string;
  request?: Request;
  searchParams?: URLSearchParams;
};

function buildTarget(path: string, searchParams?: URLSearchParams): string {
  const target = new URL(path, API_BASE_URL);
  if (searchParams) {
    target.search = searchParams.toString();
  }
  return target.toString();
}

export async function proxyJson({ method, path, request, searchParams }: ProxyOptions) {
  const target = buildTarget(path, searchParams);
  const init: RequestInit = {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  };

  if (request && method !== "GET") {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "API service unreachable" },
      { status: 503 },
    );
  }
}

export async function proxyMultipart(path: string, request: Request) {
  const target = buildTarget(path);

  try {
    const formData = await request.formData();
    const upstream = await fetch(target, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Upload proxy failed" },
      { status: 503 },
    );
  }
}

export async function probeApiReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(new URL("/docs", API_BASE_URL), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}
