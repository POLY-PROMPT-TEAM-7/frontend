export type ExtractStatus = "queued" | "processing" | "complete" | "error";

export type SourceReference = {
  id: string;
  title: string;
  locator?: string;
  excerpt?: string;
};

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  status?: "accepted" | "rejected";
  reason?: string;
};

export type UploadResponse = {
  upload_id: string;
  files: UploadedFile[];
};

export type ExtractRequest = {
  upload_id: string;
};

export type ExtractResponse = {
  graph_id: string;
  status: ExtractStatus;
  message?: string;
};

export type GraphNode = {
  id: string;
  name: string;
  entity_type: "Concept" | "Process" | "Structure" | "Molecule" | "Outcome";
  description?: string;
  confidence?: number;
  sources?: SourceReference[];
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relationship_type:
    | "prerequisite_of"
    | "part_of"
    | "enables"
    | "causes"
    | "related_to";
  description?: string;
  confidence?: number;
  sources?: SourceReference[];
};

export type GraphStats = {
  node_count: number;
  edge_count: number;
  entity_type_count: Record<string, number>;
  relationship_type_count: Record<string, number>;
};

export type GraphPayload = {
  graph_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: GraphStats;
};

export type GraphPollStatus = {
  status: "queued" | "processing" | "error";
  message?: string;
  graph_id?: string;
};

export type GraphPollResponse = GraphPayload | GraphPollStatus;

export type NodeDetailsPayload = {
  node: GraphNode;
  inbound: GraphEdge[];
  outbound: GraphEdge[];
};

export type SearchResult = {
  id: string;
  name: string;
  entity_type: GraphNode["entity_type"];
  description?: string;
  score?: number;
};

export type SearchResponse = {
  graph_id: string;
  query: string;
  results: SearchResult[];
};
