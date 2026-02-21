"use client";

import { useMemo, useRef, useState } from "react";

import { uploadFiles } from "@/lib/apiClient";
import type { UploadedFile } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { useToastStore } from "@/store/toastStore";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const ACCEPTED = ["pdf", "pptx", "docx", "txt"];

function ext(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function mapFiles(files: File[]): UploadedFile[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    size: file.size,
    mime_type: file.type || "application/octet-stream",
    status: "accepted",
  }));
}

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const setFiles = useAppStore((state) => state.setFiles);
  const setUploadStatus = useAppStore((state) => state.setUploadStatus);
  const setUploadId = useAppStore((state) => state.setUploadId);
  const pushToast = useToastStore((state) => state.push);

  const acceptAttr = useMemo(() => ACCEPTED.map((item) => `.${item}`).join(","), []);

  const handleSelect = async (incoming: File[]) => {
    const valid = incoming.filter((file) => ACCEPTED.includes(ext(file.name)));
    const invalid = incoming.length - valid.length;

    if (invalid > 0) {
      pushToast("Some files were skipped (allowed: pdf, pptx, docx, txt)", "warning");
    }

    if (valid.length === 0) {
      return;
    }

    const localFiles = mapFiles(valid);
    setFiles(localFiles);
    setUploadStatus("uploading");

    try {
      const response = await uploadFiles(valid);
      setUploadId(response.upload_id);
      setUploadStatus("success");
      pushToast("Upload completed", "success");
    } catch (error) {
      setUploadStatus("error");
      const message = error instanceof Error ? error.message : "Upload failed";
      pushToast(message, "error");
    }
  };

  return (
    <Card title="Upload Materials" subtitle="Drag and drop files or choose from disk.">
      <div
        data-testid="upload-dropzone"
        className={[
          "rounded-2xl border-2 border-dashed p-4 text-sm transition",
          dragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)]",
        ].join(" ")}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleSelect(Array.from(event.dataTransfer.files));
        }}
      >
        <p className="text-[var(--color-text-muted)]">Accepted types: pdf, pptx, docx, txt</p>
        <div className="mt-3">
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            multiple
            className="hidden"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              void handleSelect(selected);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </Card>
  );
}
