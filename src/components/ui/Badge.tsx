import type { HTMLAttributes, PropsWithChildren } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "warning";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
  }
>;

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success-strong)]",
  warning: "bg-[var(--color-warn-soft)] text-[var(--color-warn-strong)]",
};

export function Badge({ children, className = "", tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClass[tone],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
