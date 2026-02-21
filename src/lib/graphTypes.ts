import type { GraphEdge, GraphNode } from "@/lib/types";

export type GraphNodeVM = GraphNode & {
  color?: string;
  size?: number;
  highlighted?: boolean;
};

export type GraphEdgeVM = GraphEdge & {
  width?: number;
  highlighted?: boolean;
};

export type ForceGraphNodeVM = GraphNodeVM & {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
};

export type ForceGraphLinkVM = GraphEdgeVM & {
  source: string | ForceGraphNodeVM;
  target: string | ForceGraphNodeVM;
};

export type ForceGraphDataVM = {
  nodes: ForceGraphNodeVM[];
  links: ForceGraphLinkVM[];
};
