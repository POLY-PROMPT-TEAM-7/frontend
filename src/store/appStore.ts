import { create } from "zustand";

import type { GraphPayload, UploadedFile } from "@/lib/types";

export type AppPhase = "empty" | "uploaded" | "extracting" | "ready" | "error";
export type UploadStatus = "idle" | "uploading" | "success" | "error";
export type ExtractStatus = "idle" | "queued" | "processing" | "complete" | "error";
export type GraphMode = "api" | "demo";

type FilterState = {
  entityTypes: string[];
  relationshipTypes: string[];
};

type AppState = {
  appPhase: AppPhase;
  files: UploadedFile[];
  uploadId: string | null;
  uploadStatus: UploadStatus;
  graphId: string | null;
  extractStatus: ExtractStatus;
  extractMessage: string | null;
  pollingEnabled: boolean;
  graph: GraphPayload | null;
  graphMode: GraphMode;
  graphError: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  filters: FilterState;
  setAppPhase: (phase: AppPhase) => void;
  setFiles: (files: UploadedFile[]) => void;
  addFiles: (files: UploadedFile[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  setUploadStatus: (status: UploadStatus) => void;
  setUploadId: (uploadId: string | null) => void;
  setGraphId: (graphId: string | null) => void;
  setExtractStatus: (status: ExtractStatus, message?: string | null) => void;
  startPolling: () => void;
  stopPolling: () => void;
  setGraphPayload: (graph: GraphPayload, mode: GraphMode) => void;
  clearGraph: () => void;
  setGraphError: (message: string | null) => void;
  setSelection: (nodeId: string | null, edgeId?: string | null) => void;
  clearSelection: () => void;
  setEntityTypeFilters: (types: string[]) => void;
  setRelationshipTypeFilters: (types: string[]) => void;
  reset: () => void;
};

type AppSnapshot = Omit<
  AppState,
  | "setAppPhase"
  | "setFiles"
  | "addFiles"
  | "removeFile"
  | "clearFiles"
  | "setUploadStatus"
  | "setUploadId"
  | "setGraphId"
  | "setExtractStatus"
  | "startPolling"
  | "stopPolling"
  | "setGraphPayload"
  | "clearGraph"
  | "setGraphError"
  | "setSelection"
  | "clearSelection"
  | "setEntityTypeFilters"
  | "setRelationshipTypeFilters"
  | "reset"
>;

const initialState: AppSnapshot = {
  appPhase: "empty",
  files: [],
  uploadId: null,
  uploadStatus: "idle",
  graphId: null,
  extractStatus: "idle",
  extractMessage: null,
  pollingEnabled: false,
  graph: null,
  graphMode: "api",
  graphError: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  filters: {
    entityTypes: [],
    relationshipTypes: [],
  },
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setAppPhase: (phase) => set({ appPhase: phase }),
  setFiles: (files) =>
    set({
      files,
      appPhase: files.length > 0 ? "uploaded" : "empty",
    }),
  addFiles: (files) =>
    set((state) => {
      const existingIds = new Set(state.files.map((file) => file.id));
      const nextFiles = files.filter((file) => !existingIds.has(file.id));
      const merged = [...state.files, ...nextFiles];

      return {
        files: merged,
        appPhase: merged.length > 0 ? "uploaded" : "empty",
      };
    }),
  removeFile: (fileId) =>
    set((state) => {
      const nextFiles = state.files.filter((file) => file.id !== fileId);
      return {
        files: nextFiles,
        appPhase: nextFiles.length > 0 ? "uploaded" : "empty",
      };
    }),
  clearFiles: () => set({ files: [], uploadId: null, uploadStatus: "idle", appPhase: "empty" }),
  setUploadStatus: (status) => set({ uploadStatus: status }),
  setUploadId: (uploadId) => set({ uploadId }),
  setGraphId: (graphId) => set({ graphId }),
  setExtractStatus: (status, message = null) =>
    set((state) => ({
      extractStatus: status,
      extractMessage: message,
      appPhase:
        status === "error"
          ? "error"
          : status === "complete"
            ? "ready"
            : status === "queued" || status === "processing"
              ? "extracting"
              : state.files.length > 0
                ? "uploaded"
                : "empty",
    })),
  startPolling: () => set({ pollingEnabled: true }),
  stopPolling: () => set({ pollingEnabled: false }),
  setGraphPayload: (graph, mode) =>
    set({
      graph,
      graphMode: mode,
      graphError: null,
      appPhase: "ready",
      extractStatus: "complete",
    }),
  clearGraph: () =>
    set((state) => ({
      graph: null,
      graphId: null,
      selectedNodeId: null,
      selectedEdgeId: null,
      extractStatus: "idle",
      extractMessage: null,
      appPhase: state.files.length > 0 ? "uploaded" : "empty",
    })),
  setGraphError: (message) =>
    set((state) => ({
      graphError: message,
      appPhase: message ? "error" : state.files.length > 0 ? "uploaded" : "empty",
    })),
  setSelection: (nodeId, edgeId = null) => set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),
  clearSelection: () => set({ selectedNodeId: null, selectedEdgeId: null }),
  setEntityTypeFilters: (types) => set((state) => ({ filters: { ...state.filters, entityTypes: types } })),
  setRelationshipTypeFilters: (types) =>
    set((state) => ({ filters: { ...state.filters, relationshipTypes: types } })),
  reset: () => set({ ...initialState }),
}));
