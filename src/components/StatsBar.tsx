"use client";

import type { GraphPayload } from "@/lib/types";

import { Badge } from "@/components/ui/Badge";

type StatsBarProps = {
  payload: GraphPayload | null;
  mode: "api" | "demo";
};

export function StatsBar({ payload, mode }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge tone={mode === "demo" ? "warning" : "success"}>{mode === "demo" ? "Demo mode" : "API mode"}</Badge>
      <Badge tone="neutral">Nodes: {payload?.nodes.length ?? 0}</Badge>
      <Badge tone="neutral">Edges: {payload?.edges.length ?? 0}</Badge>
    </div>
  );
}
