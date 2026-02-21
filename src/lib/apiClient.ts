import type {
  ExtractResponse,
  GraphPollResponse,
  NodeDetailsPayload,
  SearchResponse,
  UploadResponse,
} from "@/lib/types";

export type ApiClientError = {
  kind: "network" | "timeout" | "http" | "parse";
  message: string;
  status?: number;
  details?: unknown;
};

const DEFAULT_TIMEOUT_MS = 8000;

function buildError(message: string, kind: ApiClientError["kind"], status?: number, details?: unknown): ApiClientError {
  return { message, kind, status, details };
}

export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const text = await response.text();
    const body = text.length > 0 ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw buildError(
        `Request failed with status ${response.status}`,
        "http",
        response.status,
        body,
      );
    }

    return body as T;
  } catch (error) {
    if (isApiClientError(error)) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw buildError("Request timed out", "timeout");
    }

    throw buildError("Network request failed", "network", undefined, stringifyError(error));
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    throw buildError("Failed to parse JSON response", "parse");
  }
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isApiClientError(value: unknown): value is ApiClientError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    "message" in value
  );
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  return fetchJson<UploadResponse>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export async function extract(uploadId: string): Promise<ExtractResponse> {
  return fetchJson<ExtractResponse>("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ upload_id: uploadId }),
  });
}

export async function getGraph(graphId: string): Promise<GraphPollResponse> {
  return fetchJson<GraphPollResponse>(`/api/graph/${graphId}`, { method: "GET" });
}

export async function getNodeDetails(graphId: string, nodeId: string): Promise<NodeDetailsPayload> {
  return fetchJson<NodeDetailsPayload>(`/api/node/${graphId}/${nodeId}`, { method: "GET" });
}

export async function search(graphId: string, q: string): Promise<SearchResponse> {
  const query = new URLSearchParams({ q });
  return fetchJson<SearchResponse>(`/api/search/${graphId}?${query.toString()}`, { method: "GET" });
}

export async function getHealth() {
  return fetchJson<{ status: string; apiReachable: boolean }>("/api/health", { method: "GET" });
}
