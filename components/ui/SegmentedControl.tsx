import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Option<T> = { value: T; label: string; count?: number };

/** Pill segmented control: a surface strip with the chosen option raised in white. Extra props go on the strip. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
  ...stripProps
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
} & Omit<ComponentProps<"div">, "onChange">) {
  return (
    <div role="group" aria-label={label} className={cn("flex max-w-full overflow-x-auto rounded-full bg-secondary p-1", className)} {...stripProps}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground press aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-(--shadow-card) sm:flex-none sm:px-3.5"
        >
          {option.label}
          {option.count !== undefined && <span className="font-mono text-xs tabular-nums text-muted-foreground">{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
