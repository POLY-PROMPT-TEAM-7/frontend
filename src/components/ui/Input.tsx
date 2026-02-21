import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function Input({ label, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? props.name ?? "input";

  return (
    <label className="block" htmlFor={inputId}>
      {label ? <span className="mb-1 block text-sm font-medium text-[var(--color-text)]">{label}</span> : null}
      <input
        id={inputId}
        className={[
          "h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]",
          "placeholder:text-[var(--color-text-subtle)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          className,
        ].join(" ")}
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-[var(--color-text-subtle)]">{hint}</span> : null}
    </label>
  );
}
