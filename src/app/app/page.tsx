"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DetailsPanel } from "@/components/DetailsPanel";
import { ExtractionStatus } from "@/components/ExtractionStatus";
import { FileList } from "@/components/FileList";
import { FiltersBar } from "@/components/FiltersBar";
import { GraphCanvas, type GraphCanvasHandle } from "@/components/GraphCanvas";
import { SearchBox } from "@/components/SearchBox";
import { StatsBar } from "@/components/StatsBar";
import { StudyPathPanel } from "@/components/StudyPathPanel";
import { UploadDropzone } from "@/components/UploadDropzone";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { extract, getGraph, getHealth, getNodeDetails } from "@/lib/apiClient";
import { getDemoGraph, getDemoNodeDetails } from "@/lib/demo/demoGraph";
import { filterGraph, computeNeighborhood } from "@/lib/graphTransform";
import { computeStudyPath } from "@/lib/studyPath";
import { usePolling } from "@/lib/usePolling";
import type { GraphPayload, NodeDetailsPayload } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { useToastStore } from "@/store/toastStore";

function isGraphPayload(value: unknown): value is GraphPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as Partial<GraphPayload>;
  return Array.isArray(maybe.nodes) && Array.isArray(maybe.edges);
}

export default function AppPage() {
  const graphRef = useRef<GraphCanvasHandle | null>(null);

  const graph = useAppStore((state) => state.graph);
  const graphMode = useAppStore((state) => state.graphMode);
  const graphId = useAppStore((state) => state.graphId);
  const uploadId = useAppStore((state) => state.uploadId);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const selectedEdgeId = useAppStore((state) => state.selectedEdgeId);
  const filters = useAppStore((state) => state.filters);
  const extractStatus = useAppStore((state) => state.extractStatus);
  const setExtractStatus = useAppStore((state) => state.setExtractStatus);
  const setGraphId = useAppStore((state) => state.setGraphId);
  const setGraphPayload = useAppStore((state) => state.setGraphPayload);
  const setSelection = useAppStore((state) => state.setSelection);
  const clearSelection = useAppStore((state) => state.clearSelection);
  const startPollingFlag = useAppStore((state) => state.startPolling);
  const stopPollingFlag = useAppStore((state) => state.stopPolling);

  const pushToast = useToastStore((state) => state.push);

  const [apiReachable, setApiReachable] = useState(true);
  const [nodeDetails, setNodeDetails] = useState<NodeDetailsPayload | null>(null);
  const [highlightPath, setHighlightPath] = useState(true);
  const pollGraphIdRef = useRef<string | null>(null);
  const nodeDetailsRequestRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    void getHealth()
      .then((health) => {
        if (!mounted) return;
        setApiReachable(health.apiReachable);
      })
      .catch(() => {
        if (!mounted) return;
        setApiReachable(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredGraph = useMemo(() => {
    if (!graph) return null;
    return filterGraph(graph, filters);
  }, [filters, graph]);

  const graphReady = Boolean(filteredGraph && filteredGraph.nodes.length > 0);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!filteredGraph) return;
    const exists = filteredGraph.nodes.some((node) => node.id === selectedNodeId);
    if (!exists) {
      clearSelection();
    }
  }, [clearSelection, filteredGraph, selectedNodeId]);

  const neighborhood = useMemo(() => {
    if (!filteredGraph) {
      return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    }
    return computeNeighborhood(selectedNodeId, filteredGraph);
  }, [filteredGraph, selectedNodeId]);

  const studyPath = useMemo(() => {
    if (!filteredGraph) {
      return { orderedNodeIds: [], orderedNodes: [], edgeIds: new Set<string>(), hasCycle: false, warning: null };
    }
    return computeStudyPath(filteredGraph, selectedNodeId);
  }, [filteredGraph, selectedNodeId]);

  const highlightedNodeIds = useMemo(() => {
    const ids = new Set<string>(neighborhood.nodeIds);
    if (highlightPath) {
      studyPath.orderedNodeIds.forEach((id) => ids.add(id));
    }
    return ids;
  }, [highlightPath, neighborhood.nodeIds, studyPath.orderedNodeIds]);

  const highlightedEdgeIds = useMemo(() => {
    const ids = new Set<string>(neighborhood.edgeIds);
    if (highlightPath) {
      studyPath.edgeIds.forEach((id) => ids.add(id));
    }
    return ids;
  }, [highlightPath, neighborhood.edgeIds, studyPath.edgeIds]);

  const loadNodeDetails = useCallback(
    async (nodeId: string) => {
      const requestId = nodeDetailsRequestRef.current + 1;
      nodeDetailsRequestRef.current = requestId;

      if (!filteredGraph) {
        setNodeDetails(null);
        return;
      }

      if (graphMode === "demo") {
        setNodeDetails(getDemoNodeDetails(nodeId));
        return;
      }

      if (!graphId) {
        setNodeDetails(null);
        return;
      }

      try {
        const details = await getNodeDetails(graphId, nodeId);
        if (nodeDetailsRequestRef.current === requestId) {
          setNodeDetails(details);
        }
      } catch (error) {
        if (nodeDetailsRequestRef.current !== requestId) {
          return;
        }
        const message = error instanceof Error ? error.message : "Failed loading node details";
        pushToast(message, "warning");
      }
    },
    [filteredGraph, graphMode, graphId, pushToast],
  );

  const detailsForPanel = selectedNodeId ? nodeDetails : null;

  const popupNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = detailsForPanel?.node ?? filteredGraph?.nodes.find((item) => item.id === selectedNodeId) ?? null;
    return node;
  }, [detailsForPanel?.node, filteredGraph, selectedNodeId]);

  const nodePopup = useMemo(() => {
    if (!popupNode) return null;
    return (
      <div
        data-testid="node-popup"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
      >
        <p className="text-sm font-semibold text-[var(--color-text)]">{popupNode.name}</p>
        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">
          {popupNode.entity_type}{" "}
          {typeof popupNode.confidence === "number" ? `· ${popupNode.confidence.toFixed(2)}` : ""}
        </p>
        {popupNode.description ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">{popupNode.description}</p>
        ) : null}
      </div>
    );
  }, [popupNode]);

  const onPollData = useCallback(
    (response: unknown) => {
      if (isGraphPayload(response)) {
        setGraphPayload(response, "api");
        setExtractStatus("complete", "Knowledge graph ready.");
        stopPollingFlag();
        pollGraphIdRef.current = null;
      } else {
        const status = (response as { status?: string; message?: string }).status;
        const message = (response as { message?: string }).message ?? "Extraction in progress";
        if (status === "queued" || status === "processing") {
          setExtractStatus(status, message);
        } else {
          setExtractStatus("error", message);
          stopPollingFlag();
          pollGraphIdRef.current = null;
        }
      }
    },
    [setExtractStatus, setGraphPayload, stopPollingFlag],
  );

  const { start: startPoll, stop: stopPoll } = usePolling<unknown>({
    intervalMs: 1700,
    fetcher: async () => {
      if (!pollGraphIdRef.current) {
        return { status: "error", message: "No graph id" };
      }
      return getGraph(pollGraphIdRef.current);
    },
    onData: onPollData,
    shouldStop: (response) => {
      if (isGraphPayload(response)) return true;
      const status = (response as { status?: string }).status;
      return status === "error";
    },
    onError: (message) => {
      setExtractStatus("error", message);
      stopPollingFlag();
      pollGraphIdRef.current = null;
    },
  });

  useEffect(() => {
    return () => {
      stopPoll();
      stopPollingFlag();
      pollGraphIdRef.current = null;
    };
  }, [stopPoll, stopPollingFlag]);

  const handleBuildGraph = useCallback(async () => {
    if (!uploadId) {
      pushToast("Upload at least one file first.", "warning");
      return;
    }

    try {
      setExtractStatus("queued", "Starting extraction...");
      const result = await extract(uploadId);
      setGraphId(result.graph_id);
      pollGraphIdRef.current = result.graph_id;
      startPollingFlag();
      startPoll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Extraction request failed";
      setExtractStatus("error", message);
      pushToast(message, "error");
    }
  }, [pushToast, setExtractStatus, setGraphId, startPoll, startPollingFlag, uploadId]);

  const handleCancelPolling = useCallback(() => {
    stopPoll();
    stopPollingFlag();
    pollGraphIdRef.current = null;
    setExtractStatus("idle", "Extraction cancelled.");
  }, [setExtractStatus, stopPoll, stopPollingFlag]);

  const handleLoadDemo = useCallback(() => {
    const payload = getDemoGraph();
    setGraphPayload(payload, "demo");
    setGraphId(payload.graph_id);
    setExtractStatus("complete", "Loaded local demo graph.");
    pushToast("Demo graph loaded", "success");
    setApiReachable(false);
  }, [pushToast, setExtractStatus, setGraphId, setGraphPayload]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      setSelection(nodeId, null);
      void loadNodeDetails(nodeId);
      graphRef.current?.focusNode(nodeId);
    },
    [loadNodeDetails, setSelection],
  );

  const handleExport = useCallback(() => {
    if (!graphReady) {
      pushToast("Graph is not ready to export yet.", "warning");
      return;
    }
    const dataUrl = graphRef.current?.exportPng() ?? null;
    if (!dataUrl) {
      pushToast("Export failed. Try again.", "error");
      return;
    }

    const byteString = atob(dataUrl.split(",")[1] ?? "");
    const array = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i += 1) {
      array[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([array], { type: "image/png" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kg-study-graph.png";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    pushToast("PNG export ready", "success");
  }, [graphReady, pushToast]);

  return (
    <main className="space-y-4">
      <header className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">KG Study Tool</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Upload, extract, explore, and export your study graph.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="load-demo-btn" onClick={handleLoadDemo} variant="secondary">
              Load demo graph
            </Button>
            <Button data-testid="fit-btn" onClick={() => graphRef.current?.fitToScreen()} variant="secondary">
              Fit
            </Button>
            <Button data-testid="reset-btn" onClick={() => graphRef.current?.resetView()} variant="secondary">
              Reset
            </Button>
            <Button data-testid="export-png-btn" onClick={handleExport} disabled={!graphReady}>
              Export PNG
            </Button>
          </div>
        </div>

        {!apiReachable || graphMode === "demo" ? (
          <p data-testid="offline-banner" className="mt-3 rounded-lg bg-[var(--color-warn-soft)] px-3 py-2 text-sm text-[var(--color-warn-strong)]">
            Offline/demo mode active. You can still run the full interactive demo.
          </p>
        ) : null}

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr,2fr]">
          <SearchBox graphId={graphId} graphMode={graphMode} onSelect={handleSelectNode} />
          <FiltersBar payload={graph} />
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,240px)_minmax(0,4fr)_minmax(0,220px)] 2xl:grid-cols-[minmax(0,260px)_minmax(0,4.8fr)_minmax(0,240px)]">
        <div className="min-w-0 space-y-4">
          <UploadDropzone />
          <FileList />
          <Button data-testid="extract-btn" fullWidth onClick={() => void handleBuildGraph()} disabled={extractStatus === "processing" || extractStatus === "queued"}>
            Build Knowledge Graph
          </Button>
          <ExtractionStatus onCancel={handleCancelPolling} />
        </div>

        <div className="min-w-0 space-y-3">
          <StatsBar payload={filteredGraph} mode={graphMode} />
          <GraphCanvas
            ref={graphRef}
            testId="graph-canvas"
            popup={selectedNodeId ? nodePopup : null}
            payload={filteredGraph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            highlightedNodeIds={highlightedNodeIds}
            highlightedEdgeIds={highlightedEdgeIds}
            onNodeClick={handleSelectNode}
            onEdgeClick={(edgeId) => {
              setNodeDetails(null);
              setSelection(null, edgeId);
            }}
            onBackgroundClick={() => {
              setNodeDetails(null);
              clearSelection();
            }}
            onGraphReady={undefined}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <DetailsPanel
            payload={filteredGraph}
            nodeDetails={detailsForPanel}
            selectedEdgeId={selectedEdgeId}
            onFocusNode={handleSelectNode}
          />
          <StudyPathPanel
            steps={studyPath.orderedNodes.map((node) => ({ id: node.id, name: node.name }))}
            warning={studyPath.warning}
            highlightPath={highlightPath}
            onToggleHighlight={setHighlightPath}
          />
        </div>
      </section>

      {filteredGraph && filteredGraph.nodes.length === 0 ? (
        <Card title="No graph data" subtitle="Try loading demo graph or adjusting filters.">
          <p className="text-sm text-[var(--color-text-muted)]">Current filters removed all nodes from view.</p>
        </Card>
      ) : null}
    </main>
  );
}
