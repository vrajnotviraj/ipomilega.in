import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium outline-none transition-[background-color,color,transform] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"

/** Pill button: solid ink by default, or a quiet ghost. */
function Button({ variant, className, ...props }: ComponentProps<"button"> & { variant?: "ghost" }) {
  return (
    <button
      className={cn(BASE, "h-9 px-4", variant === "ghost" ? "hover:bg-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90", className)}
      {...props}
    />
  )
}

export { Button }
