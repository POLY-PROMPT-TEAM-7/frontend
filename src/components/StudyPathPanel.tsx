"use client";

import { Card } from "@/components/ui/Card";

type StudyPathPanelProps = {
  steps: { id: string; name: string }[];
  warning: string | null;
  highlightPath: boolean;
  onToggleHighlight: (value: boolean) => void;
};

export function StudyPathPanel({ steps, warning, highlightPath, onToggleHighlight }: StudyPathPanelProps) {
  return (
    <Card title="Study Path" subtitle="Prerequisite chain">
      <div data-testid="study-path-panel" className="space-y-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={highlightPath}
            onChange={(event) => onToggleHighlight(event.target.checked)}
          />
          <span>Highlight path</span>
        </label>

        {warning ? <p className="text-xs text-[var(--color-warn-strong)]">{warning}</p> : null}

        {steps.length === 0 ? (
          <p className="text-[var(--color-text-subtle)]">Select a node to compute a path.</p>
        ) : (
          <ol className="space-y-1">
            {steps.map((step, index) => (
              <li key={step.id} className="rounded-lg bg-[var(--color-surface-2)] px-2 py-1">
                <span className="mr-2 text-xs text-[var(--color-text-subtle)]">{index + 1}.</span>
                {step.name}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
