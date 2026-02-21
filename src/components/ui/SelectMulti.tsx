type SelectOption = {
  value: string;
  label: string;
};

type SelectMultiProps = {
  label?: string;
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

export function SelectMulti({ label, options, selectedValues, onChange }: SelectMultiProps) {
  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  return (
    <fieldset className="block">
      {label ? <legend className="mb-2 text-sm font-medium text-[var(--color-text)]">{label}</legend> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                selected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
              ].join(" ")}
              onClick={() => toggleValue(option.value)}
              aria-pressed={selected}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
