"use client";

import { useAppStore } from "@/store/appStore";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList() {
  const files = useAppStore((state) => state.files);
  const removeFile = useAppStore((state) => state.removeFile);

  return (
    <Card title="Files" subtitle="Review and remove before extraction.">
      <div data-testid="file-list" className="space-y-2">
        {files.length === 0 ? (
          <p className="text-sm text-[var(--color-text-subtle)]">No files selected yet.</p>
        ) : (
          files.map((file) => (
            <div key={file.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface-2)] px-3 py-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{file.name}</p>
                <p className="text-xs text-[var(--color-text-subtle)]">{file.mime_type} · {formatSize(file.size)}</p>
              </div>
              <Button variant="ghost" onClick={() => removeFile(file.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
