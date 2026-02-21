"use client";

import { useMemo } from "react";

import type { GraphPayload } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

import { SelectMulti } from "@/components/ui/SelectMulti";

type FiltersBarProps = {
  payload: GraphPayload | null;
};

export function FiltersBar({ payload }: FiltersBarProps) {
  const entityTypes = useAppStore((state) => state.filters.entityTypes);
  const relationshipTypes = useAppStore((state) => state.filters.relationshipTypes);
  const setEntityTypeFilters = useAppStore((state) => state.setEntityTypeFilters);
  const setRelationshipTypeFilters = useAppStore((state) => state.setRelationshipTypeFilters);

  const entityOptions = useMemo(() => {
    if (!payload) return [];
    return Array.from(new Set(payload.nodes.map((node) => node.entity_type))).map((item) => ({
      value: item,
      label: item,
    }));
  }, [payload]);

  const relationOptions = useMemo(() => {
    if (!payload) return [];
    return Array.from(new Set(payload.edges.map((edge) => edge.relationship_type))).map((item) => ({
      value: item,
      label: item,
    }));
  }, [payload]);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SelectMulti
        label="Entity Types"
        options={entityOptions}
        selectedValues={entityTypes}
        onChange={setEntityTypeFilters}
      />
      <SelectMulti
        label="Relationships"
        options={relationOptions}
        selectedValues={relationshipTypes}
        onChange={setRelationshipTypeFilters}
      />
    </div>
  );
}
