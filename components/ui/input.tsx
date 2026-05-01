import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  unstyled?: boolean;
};

export function Input({ className, type, unstyled = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        unstyled
          ? "w-full bg-transparent text-base text-app-ink outline-none placeholder:text-app-muted/70"
          : "w-full rounded-[14px] border border-app-line bg-[#fcfbf8] px-3 py-2.5 text-base text-app-ink outline-none transition-[border-color,box-shadow,background] duration-150 placeholder:text-app-muted/70 focus:border-app-navy/28 focus:ring-3 focus:ring-app-navy/8",
        className
      )}
      {...props}
    />
  );
}
