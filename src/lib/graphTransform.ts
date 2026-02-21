import type { GraphPayload } from "@/lib/types";

type GraphFilters = {
  entityTypes: string[];
  relationshipTypes: string[];
};

type Adjacency = {
  neighborsByNode: Map<string, Set<string>>;
  edgeIdsByNode: Map<string, Set<string>>;
};

type Neighborhood = {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
};

export function filterGraph(payload: GraphPayload, filters: GraphFilters): GraphPayload {
  const allowedEntityTypes = new Set(filters.entityTypes);
  const allowedRelationshipTypes = new Set(filters.relationshipTypes);

  const filteredNodes =
    filters.entityTypes.length === 0
      ? payload.nodes
      : payload.nodes.filter((node) => allowedEntityTypes.has(node.entity_type));

  const nodeIds = new Set(filteredNodes.map((node) => node.id));

  const filteredEdges = payload.edges.filter((edge) => {
    const relationAllowed =
      filters.relationshipTypes.length === 0 || allowedRelationshipTypes.has(edge.relationship_type);
    return relationAllowed && nodeIds.has(edge.source) && nodeIds.has(edge.target);
  });

  return {
    ...payload,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

export function buildAdjacency(payload: GraphPayload): Adjacency {
  const neighborsByNode = new Map<string, Set<string>>();
  const edgeIdsByNode = new Map<string, Set<string>>();

  payload.nodes.forEach((node) => {
    neighborsByNode.set(node.id, new Set());
    edgeIdsByNode.set(node.id, new Set());
  });

  payload.edges.forEach((edge) => {
    if (!neighborsByNode.has(edge.source)) {
      neighborsByNode.set(edge.source, new Set());
    }
    if (!neighborsByNode.has(edge.target)) {
      neighborsByNode.set(edge.target, new Set());
    }
    if (!edgeIdsByNode.has(edge.source)) {
      edgeIdsByNode.set(edge.source, new Set());
    }
    if (!edgeIdsByNode.has(edge.target)) {
      edgeIdsByNode.set(edge.target, new Set());
    }

    neighborsByNode.get(edge.source)?.add(edge.target);
    neighborsByNode.get(edge.target)?.add(edge.source);
    edgeIdsByNode.get(edge.source)?.add(edge.id);
    edgeIdsByNode.get(edge.target)?.add(edge.id);
  });

  return { neighborsByNode, edgeIdsByNode };
}

export function computeNeighborhood(selectedNodeId: string | null, payload: GraphPayload): Neighborhood {
  if (!selectedNodeId) {
    return { nodeIds: new Set(), edgeIds: new Set() };
  }

  const adjacency = buildAdjacency(payload);
  const nodeIds = new Set<string>([selectedNodeId]);
  const edgeIds = new Set<string>();

  const neighbors = adjacency.neighborsByNode.get(selectedNodeId) ?? new Set<string>();
  neighbors.forEach((neighborId) => nodeIds.add(neighborId));

  const edgeCandidates = adjacency.edgeIdsByNode.get(selectedNodeId) ?? new Set<string>();
  edgeCandidates.forEach((edgeId) => edgeIds.add(edgeId));

  return { nodeIds, edgeIds };
}
