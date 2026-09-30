/** Full-height centred spinner for route-level loading and retry states. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4" role="status">
      <span className="relative size-9">
        <span className="absolute inset-0 rounded-full border-2 border-border" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary [animation-duration:0.7s]" />
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </div>
  );
}
