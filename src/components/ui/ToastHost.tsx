"use client";

import { useToastStore } from "@/store/toastStore";

const toneClass = {
  info: "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
  success: "bg-[var(--color-success-soft)] border-[var(--color-success-strong)] text-[var(--color-success-strong)]",
  warning: "bg-[var(--color-warn-soft)] border-[var(--color-warn-strong)] text-[var(--color-warn-strong)]",
  error: "bg-[var(--color-danger-soft)] border-[var(--color-danger-strong)] text-[var(--color-danger-strong)]",
};

export function ToastHost() {
  const items = useToastStore((state) => state.items);

  if (items.length === 0) {
    return <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50" />;
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={[
            "pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-[0_8px_18px_rgba(17,24,39,0.12)]",
            toneClass[item.tone ?? "info"],
          ].join(" ")}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
