export default function Loading() {
  return (
    <div className="flex flex-col h-[64vh] min-h-[340px] animate-pulse">
      <div className="flex-1 flex flex-col gap-3 pb-2">
        <div className="self-start h-12 w-48 rounded-[18px] bg-[var(--tk-parchment-border)]" />
        <div className="self-end h-12 w-40 rounded-[18px] bg-[var(--tk-parchment-border)]" />
        <div className="self-start h-16 w-56 rounded-[18px] bg-[var(--tk-parchment-border)]" />
        <div className="self-end h-10 w-32 rounded-[18px] bg-[var(--tk-parchment-border)]" />
      </div>
      <div className="pt-3 border-t border-[var(--tk-parchment-border)]">
        <div className="h-12 rounded-[15px] bg-[var(--tk-parchment-border)]" />
      </div>
    </div>
  );
}
