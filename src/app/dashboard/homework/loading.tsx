export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-1/2 rounded-full" style={{ background: "var(--tk-parchment-border)" }} />
      <div className="h-28 rounded-[16px]" style={{ background: "var(--tk-parchment-border)" }} />
      <div className="h-28 rounded-[16px]" style={{ background: "var(--tk-parchment-border)" }} />
      <div className="h-28 rounded-[16px]" style={{ background: "var(--tk-parchment-border)" }} />
    </div>
  );
}
