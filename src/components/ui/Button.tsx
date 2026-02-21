import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
>;

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-accent)] text-[var(--color-accent-ink)] hover:brightness-105",
  secondary: "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)]",
  ghost: "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  fullWidth = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        fullWidth ? "w-full" : "",
        variantClass[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
