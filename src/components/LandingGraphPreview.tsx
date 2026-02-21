"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { getDemoGraph } from "@/lib/demo/demoGraph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export function LandingGraphPreview() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const data = useMemo(() => {
    const payload = getDemoGraph();
    const subset = payload.nodes.slice(0, 12);
    const subsetIds = new Set(subset.map((node) => node.id));
    return {
      nodes: subset.map((node) => ({ id: node.id, name: node.name })),
      links: payload.edges
        .filter(
          (edge) =>
            subsetIds.has(String(edge.source)) && subsetIds.has(String(edge.target)),
        )
        .map((edge) => ({ source: edge.source, target: edge.target })),
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(0, Math.floor(rect.width));
      const height = Math.max(0, Math.floor(rect.height));
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
      data-testid="landing-graph-preview"
    >
      {size.width > 0 && size.height > 0 ? (
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={data}
          nodeRelSize={5}
          cooldownTicks={80}
          d3VelocityDecay={0.35}
          enableNodeDrag={false}
          enablePointerInteraction={false}
          nodeLabel={(node) => String((node as { name?: string }).name ?? "")}
        />
      ) : null}
    </div>
  );
}
