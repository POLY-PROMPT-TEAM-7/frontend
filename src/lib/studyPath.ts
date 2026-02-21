import type { GraphEdge, GraphPayload, GraphNode } from "@/lib/types";

export type StudyPathResult = {
  orderedNodeIds: string[];
  orderedNodes: GraphNode[];
  edgeIds: Set<string>;
  hasCycle: boolean;
  warning: string | null;
};

function nodeMap(payload: GraphPayload): Map<string, GraphNode> {
  return new Map(payload.nodes.map((node) => [node.id, node]));
}

function prerequisiteEdges(payload: GraphPayload): GraphEdge[] {
  return payload.edges.filter((edge) => edge.relationship_type === "prerequisite_of");
}

export function computeStudyPath(payload: GraphPayload, selectedNodeId: string | null): StudyPathResult {
  if (!selectedNodeId) {
    return { orderedNodeIds: [], orderedNodes: [], edgeIds: new Set(), hasCycle: false, warning: null };
  }

  const nodesById = nodeMap(payload);
  const prereqEdges = prerequisiteEdges(payload);
  const incoming = new Map<string, GraphEdge[]>();

  prereqEdges.forEach((edge) => {
    if (!incoming.has(edge.target)) {
      incoming.set(edge.target, []);
    }
    incoming.get(edge.target)?.push(edge);
  });

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const orderedNodeIds: string[] = [];
  const edgeIds = new Set<string>();
  let hasCycle = false;

  const dfs = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      hasCycle = true;
      return;
    }
    if (visited.has(nodeId)) {
      return;
    }

    visiting.add(nodeId);
    const requiredEdges = incoming.get(nodeId) ?? [];
    requiredEdges.forEach((edge) => {
      edgeIds.add(edge.id);
      dfs(edge.source);
    });
    visiting.delete(nodeId);
    visited.add(nodeId);
    orderedNodeIds.push(nodeId);
  };

  dfs(selectedNodeId);

  const orderedNodes = orderedNodeIds
    .map((id) => nodesById.get(id))
    .filter((node): node is GraphNode => Boolean(node));

  return {
    orderedNodeIds,
    orderedNodes,
    edgeIds,
    hasCycle,
    warning: hasCycle ? "Cycle detected in prerequisite chain. Showing best-effort path." : null,
  };
}
