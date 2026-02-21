"use client";

import type { GraphPayload, NodeDetailsPayload } from "@/lib/types";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

type DetailsPanelProps = {
  payload: GraphPayload | null;
  nodeDetails: NodeDetailsPayload | null;
  selectedEdgeId: string | null;
  onFocusNode: (nodeId: string) => void;
};

function sourceRows(items: { title: string; locator?: string; excerpt?: string }[] | undefined) {
  if (!items || items.length === 0) {
    return [{ title: "Demo Biology Dataset", locator: "Local seed graph" }];
  }
  return items;
}

export function DetailsPanel({ payload, nodeDetails, selectedEdgeId, onFocusNode }: DetailsPanelProps) {
  const selectedEdge = payload?.edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  if (!nodeDetails && !selectedEdge) {
    return (
      <Card title="Details" subtitle="Inspect nodes and edges.">
        <div data-testid="details-panel" className="text-sm text-[var(--color-text-subtle)]">
          Select a node or edge to view details.
        </div>
      </Card>
    );
  }

  if (selectedEdge) {
    const sourceNode = payload?.nodes.find((node) => node.id === selectedEdge.source);
    const targetNode = payload?.nodes.find((node) => node.id === selectedEdge.target);
    const rows = sourceRows(selectedEdge.sources);

    return (
      <Card title="Edge Details" subtitle={selectedEdge.relationship_type}>
        <div data-testid="details-panel" className="space-y-3 text-sm">
          <p className="text-[var(--color-text-muted)]">
            {sourceNode?.name ?? selectedEdge.source} → {targetNode?.name ?? selectedEdge.target}
          </p>
          <p className="text-[var(--color-text-subtle)]">Confidence: {selectedEdge.confidence ?? "n/a"}</p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">Sources</p>
            {rows.map((row, idx) => (
              <div key={`${row.title}-${idx}`} className="rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
                <p>{row.title}</p>
                {row.locator ? <p className="text-xs text-[var(--color-text-subtle)]">{row.locator}</p> : null}
                {row.excerpt ? <p className="text-xs text-[var(--color-text-subtle)]">{row.excerpt}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const node = nodeDetails?.node;
  if (!nodeDetails || !node) {
    return null;
  }

  const rows = sourceRows(node.sources);

  return (
    <Card title="Node Details" subtitle={node.name}>
      <div data-testid="details-panel" className="space-y-3 text-sm">
        <p className="text-base font-semibold text-[var(--color-text)]">{node.name}</p>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">{node.entity_type}</Badge>
          <Badge tone="neutral">Confidence: {node.confidence ?? "n/a"}</Badge>
        </div>
        <p className="text-[var(--color-text-muted)]">{node.description ?? "No description available."}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">Sources</p>
          {rows.map((row, idx) => (
            <div key={`${row.title}-${idx}`} className="rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
              <p>{row.title}</p>
              {row.locator ? <p className="text-xs text-[var(--color-text-subtle)]">{row.locator}</p> : null}
              {row.excerpt ? <p className="text-xs text-[var(--color-text-subtle)]">{row.excerpt}</p> : null}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">Inbound</p>
          {nodeDetails.inbound.map((edge) => (
            <button
              key={edge.id}
              type="button"
              className="block w-full rounded-lg bg-[var(--color-surface-2)] px-2 py-1 text-left hover:bg-[var(--color-surface-3)]"
              onClick={() => onFocusNode(edge.source)}
            >
              {edge.relationship_type}: {edge.source}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">Outbound</p>
          {nodeDetails.outbound.map((edge) => (
            <button
              key={edge.id}
              type="button"
              className="block w-full rounded-lg bg-[var(--color-surface-2)] px-2 py-1 text-left hover:bg-[var(--color-surface-3)]"
              onClick={() => onFocusNode(edge.target)}
            >
              {edge.relationship_type}: {edge.target}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
