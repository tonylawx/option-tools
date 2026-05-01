import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  unstyled?: boolean
}

function Input({ className, type, unstyled = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        unstyled
          ? "w-full min-w-0 bg-transparent text-base text-app-ink outline-none placeholder:text-app-muted/70"
          : "h-11 w-full min-w-0 rounded-[14px] border border-app-line bg-[#fcfbf8] px-3 py-2 text-base text-app-ink shadow-sm transition-[color,box-shadow,border-color] outline-none placeholder:text-app-muted/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        !unstyled && "focus-visible:border-app-navy/28 focus-visible:ring-[3px] focus-visible:ring-app-navy/8",
        !unstyled && "aria-invalid:border-app-rose aria-invalid:ring-app-rose/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
