"use client";

import dynamic from "next/dynamic";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";

import type { GraphPayload } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type GraphNodeDatum = {
  id: string;
  name: string;
  entityType: string;
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

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  {
    testId = "graph-canvas",
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
    },
    [highlightedNodeIds, selectedNodeId],
  );

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      className="h-[460px] w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
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
    </div>
  );
});
