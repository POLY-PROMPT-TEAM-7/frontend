"use client";

import { useAppStore } from "@/store/appStore";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ExtractionStatusProps = {
  onCancel: () => void;
};

export function ExtractionStatus({ onCancel }: ExtractionStatusProps) {
  const status = useAppStore((state) => state.extractStatus);
  const message = useAppStore((state) => state.extractMessage);

  const tone =
    status === "error" ? "warning" : status === "complete" ? "success" : status === "idle" ? "neutral" : "accent";

  return (
    <Card title="Extraction" subtitle="Queue and processing status">
      <div data-testid="extract-status" className="space-y-3">
        <Badge tone={tone}>{status}</Badge>
        <p className="text-sm text-[var(--color-text-muted)]">{message ?? "Ready to start extraction."}</p>
        {(status === "queued" || status === "processing") && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
