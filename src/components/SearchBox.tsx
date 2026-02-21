"use client";

import { useEffect, useMemo, useState } from "react";

import { search } from "@/lib/apiClient";
import { getDemoGraph } from "@/lib/demo/demoGraph";
import type { SearchResult } from "@/lib/types";

import { Input } from "@/components/ui/Input";

type SearchBoxProps = {
  graphId: string | null;
  graphMode: "api" | "demo";
  onSelect: (nodeId: string) => void;
};

export function SearchBox({ graphId, graphMode, onSelect }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (graphMode === "demo") {
        const payload = getDemoGraph();
        const q = query.trim().toLowerCase();
        const local = payload.nodes
          .filter((node) => node.name.toLowerCase().includes(q))
          .slice(0, 8)
          .map((node) => ({
            id: node.id,
            name: node.name,
            entity_type: node.entity_type,
            description: node.description,
          }));
        if (!cancelled) setResults(local);
        return;
      }

      if (!graphId) {
        return;
      }

      try {
        const response = await search(graphId, query.trim());
        if (!cancelled) {
          setResults(response.results.slice(0, 8));
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [graphId, graphMode, query]);

  const visibleResults = useMemo(
    () => (query.trim().length < 2 ? [] : results),
    [query, results],
  );

  const hasResults = useMemo(() => visibleResults.length > 0, [visibleResults.length]);

  return (
    <div className="relative">
      <Input
        id="search-input"
        name="search"
        label="Search Nodes"
        placeholder="Try: Photosynthesis, Chloroplast"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        data-testid="search-input"
      />

      {hasResults ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          {visibleResults.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
              onClick={() => {
                onSelect(item.id);
                setQuery(item.name);
                setResults([]);
              }}
            >
              <span className="font-medium text-[var(--color-text)]">{item.name}</span>
              <span className="ml-2 text-xs text-[var(--color-text-subtle)]">{item.entity_type}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
