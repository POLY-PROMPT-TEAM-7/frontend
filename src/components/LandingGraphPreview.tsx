"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { getDemoGraph } from "@/lib/demo/demoGraph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export function LandingGraphPreview() {
  const data = useMemo(() => {
    const payload = getDemoGraph();
    return {
      nodes: payload.nodes.slice(0, 12).map((node) => ({ id: node.id, name: node.name })),
      links: payload.edges
        .filter(
          (edge) =>
            payload.nodes.slice(0, 12).some((node) => node.id === edge.source) &&
            payload.nodes.slice(0, 12).some((node) => node.id === edge.target),
        )
        .map((edge) => ({ source: edge.source, target: edge.target })),
    };
  }, []);

  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" data-testid="landing-graph-preview">
      <ForceGraph2D
        graphData={data}
        nodeRelSize={5}
        cooldownTicks={80}
        d3VelocityDecay={0.35}
        enableNodeDrag={false}
        enablePointerInteraction={false}
        nodeLabel={(node) => String((node as { name?: string }).name ?? "")}
      />
    </div>
  );
}
