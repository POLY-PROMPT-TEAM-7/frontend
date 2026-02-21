import demoGraph from "@/lib/demo/biology.graph.json";
import type { GraphEdge, GraphNode, GraphPayload, NodeDetailsPayload } from "@/lib/types";

export function getDemoGraph(): GraphPayload {
  return demoGraph as GraphPayload;
}

export function getDemoNodeDetails(nodeId: string): NodeDetailsPayload | null {
  const payload = getDemoGraph();
  const node = payload.nodes.find((item) => item.id === nodeId);
  if (!node) {
    return null;
  }

  const inbound = payload.edges.filter((edge) => edge.target === nodeId);
  const outbound = payload.edges.filter((edge) => edge.source === nodeId);

  return { node, inbound, outbound };
}

export function getUniqueEntityTypes(payload: GraphPayload): GraphNode["entity_type"][] {
  return Array.from(new Set(payload.nodes.map((node) => node.entity_type)));
}

export function getUniqueRelationshipTypes(payload: GraphPayload): GraphEdge["relationship_type"][] {
  return Array.from(new Set(payload.edges.map((edge) => edge.relationship_type)));
}
