"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  className?: string;
  itemClassName?: string;
};

const SHELL_CLASS = "rounded-full border border-app-line bg-white/82 p-1 shadow-app";
const ITEM_CLASS = "h-12 rounded-full border-0 px-4 text-sm text-app-muted outline-none transition-all hover:text-app-navy focus-visible:ring-2 focus-visible:ring-app-navy/15 focus-visible:ring-offset-0 data-[state=on]:bg-app-navy data-[state=on]:text-white data-[state=on]:shadow-[0_10px_24px_rgba(29,32,56,0.2)] sm:h-11";

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
  itemClassName
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup
      className={cn(SHELL_CLASS, className)}
      spacing={1}
      type="single"
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange(nextValue as T);
        }
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          className={cn("!rounded-full", ITEM_CLASS, itemClassName)}
          value={option.value}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
