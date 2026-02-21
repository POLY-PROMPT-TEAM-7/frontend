"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";

import type { GraphPayload } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNodeDatum = {
  id: string;
  name: string;
  entityType: string;
  description?: string;
  confidence?: number;
  x?: number;
  y?: number;
};

type GraphLinkDatum = {
  id: string;
  relationshipType: string;
  source: string | GraphNodeDatum;
  target: string | GraphNodeDatum;
};

type GraphData = {
  nodes: GraphNodeDatum[];
  links: GraphLinkDatum[];
};

export type GraphCanvasHandle = {
  fitToScreen: () => void;
  resetView: () => void;
  focusNode: (nodeId: string) => void;
  exportPng: () => string | null;
};

type GraphCanvasProps = {
  testId?: string;
  popup?: ReactNode;
  payload: GraphPayload | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  highlightedNodeIds: Set<string>;
  highlightedEdgeIds: Set<string>;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onBackgroundClick: () => void;
  onGraphReady?: () => void;
};

const entityColor: Record<string, string> = {
  Concept: "#4f772d",
  Process: "#2f6f45",
  Structure: "#7f5539",
  Molecule: "#1d3557",
  Outcome: "#6a4c93",
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function clampText(input: string, maxChars: number): string {
  const trimmed = input.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  {
    testId = "graph-canvas",
    popup,
    payload,
    selectedNodeId,
    selectedEdgeId,
    highlightedNodeIds,
    highlightedEdgeIds,
    onNodeClick,
    onEdgeClick,
    onBackgroundClick,
    onGraphReady,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  const data = useMemo<GraphData>(() => {
    if (!payload) {
      return { nodes: [], links: [] };
    }
    return {
      nodes: payload.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        entityType: node.entity_type,
        description: node.description,
        confidence: node.confidence,
      })),
      links: payload.edges.map((edge) => ({
        id: edge.id,
        relationshipType: edge.relationship_type,
        source: edge.source,
        target: edge.target,
      })),
    };
  }, [payload]);

  useImperativeHandle(
    ref,
    () => ({
      fitToScreen: () => {
        fgRef.current?.zoomToFit(400, 70);
      },
      resetView: () => {
        fgRef.current?.centerAt(0, 0, 500);
        fgRef.current?.zoom(1, 500);
      },
      focusNode: (nodeId: string) => {
        const node = data.nodes.find((item) => item.id === nodeId);
        if (node && typeof node.x === "number" && typeof node.y === "number") {
          fgRef.current?.centerAt(node.x, node.y, 700);
          fgRef.current?.zoom(2.6, 700);
        }
      },
      exportPng: () => {
        const canvas = containerRef.current?.querySelector("canvas") ?? null;
        return canvas ? canvas.toDataURL("image/png") : null;
      },
    }),
    [data.nodes],
  );

  const nodeCanvasObject = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNodeDatum;
      const highlighted = highlightedNodeIds.has(n.id) || selectedNodeId === n.id;
      const radius = highlighted ? 8 : 5;
      const color = entityColor[n.entityType] ?? "#2f6f45";

      ctx.beginPath();
      ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, Math.PI * 2, false);
      ctx.fillStyle = color;
      ctx.fill();

      if (highlighted) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const fontSize = Math.max(8, 12 / globalScale);
      ctx.font = `${fontSize}px var(--font-sans)`;
      ctx.fillStyle = "#1f2a22";
      ctx.fillText(n.name, (n.x ?? 0) + radius + 2, (n.y ?? 0) + fontSize / 3);

      if (selectedNodeId === n.id) {
        const cardWidth = 240 / globalScale;
        const cardPadding = 10 / globalScale;
        const lineHeight = 14 / globalScale;
        const titleSize = 13 / globalScale;
        const metaSize = 11 / globalScale;
        const descSize = 11 / globalScale;
        const maxDesc = 120;

        const title = clampText(n.name, 40);
        const meta = `${n.entityType}${typeof n.confidence === "number" ? ` · ${n.confidence.toFixed(2)}` : ""}`;
        const desc = clampText(n.description ?? "", maxDesc);

        const lines = desc ? [desc] : [];
        const cardHeight =
          cardPadding * 2 +
          titleSize +
          4 / globalScale +
          metaSize +
          (lines.length > 0 ? 6 / globalScale + lineHeight : 0);

        const x = (n.x ?? 0) + (14 / globalScale);
        const y = (n.y ?? 0) - cardHeight - (14 / globalScale);

        ctx.save();
        drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 12 / globalScale);
        ctx.fillStyle = "rgba(255, 255, 251, 0.95)";
        ctx.fill();
        ctx.strokeStyle = "rgba(201, 211, 182, 0.95)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();

        ctx.fillStyle = "#1f2a22";
        ctx.font = `600 ${titleSize}px var(--font-sans)`;
        ctx.fillText(title, x + cardPadding, y + cardPadding + titleSize);

        ctx.fillStyle = "#3e5144";
        ctx.font = `500 ${metaSize}px var(--font-sans)`;
        ctx.fillText(meta, x + cardPadding, y + cardPadding + titleSize + 4 / globalScale + metaSize);

        if (lines.length > 0) {
          ctx.fillStyle = "#607468";
          ctx.font = `400 ${descSize}px var(--font-sans)`;
          ctx.fillText(
            lines[0],
            x + cardPadding,
            y + cardPadding + titleSize + 4 / globalScale + metaSize + 6 / globalScale + lineHeight,
          );
        }

        ctx.restore();
      }
    },
    [highlightedNodeIds, selectedNodeId],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !payload || payload.nodes.length === 0) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        fgRef.current?.zoomToFit(300, 56);
      }, 120);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [payload]);

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className="relative h-[50vh] min-h-[320px] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:h-[56vh] xl:h-[72vh] 2xl:h-[74vh]"
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        onEngineStop={onGraphReady}
        nodeRelSize={6}
        nodeCanvasObject={nodeCanvasObject}
        linkWidth={(link) => {
          const id = (link as GraphLinkDatum).id;
          if (selectedEdgeId === id) return 3;
          return highlightedEdgeIds.has(id) ? 2.5 : 1;
        }}
        linkColor={(link) => {
          const id = (link as GraphLinkDatum).id;
          if (selectedEdgeId === id) return "#f59e0b";
          return highlightedEdgeIds.has(id) ? "#2f6f45" : "#94a3b8";
        }}
        onNodeClick={(node) => onNodeClick((node as GraphNodeDatum).id)}
        onLinkClick={(link) => onEdgeClick((link as GraphLinkDatum).id)}
        onBackgroundClick={onBackgroundClick}
      />

      {popup ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10 w-[min(24rem,92%)]">
          {popup}
        </div>
      ) : null}
    </div>
  );
});
