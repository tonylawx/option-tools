import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "ghost";
  size?: "default" | "sm" | "icon";
};

const buttonVariants = {
  default: "bg-app-navy text-white hover:bg-[#252848]",
  ghost: "bg-transparent text-app-muted hover:bg-app-navy/8 hover:text-app-navy"
} satisfies Record<NonNullable<ButtonProps["variant"]>, string>;

const buttonSizes = {
  default: "min-h-9 px-3 py-2",
  sm: "min-h-8 px-3 py-1.5 text-sm",
  icon: "size-8 p-0"
} satisfies Record<NonNullable<ButtonProps["size"]>, string>;

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-transparent font-medium transition-colors duration-150 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-app-navy/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}
