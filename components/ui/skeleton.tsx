import { cn } from "@/lib/utils"

/** Pulsing surface block used as a loading placeholder. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-lg bg-secondary", className)} {...props} />
}

export { Skeleton }
