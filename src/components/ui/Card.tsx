import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    title?: string;
    subtitle?: string;
  }
>;

export function Card({ title, subtitle, children, className = "", ...props }: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.08)]",
        className,
      ].join(" ")}
      {...props}
    >
      {title ? <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3> : null}
      {subtitle ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
