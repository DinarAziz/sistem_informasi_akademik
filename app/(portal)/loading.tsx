export default function Loading() {
  return (
    <div role="status" aria-label="Memuat halaman" className="animate-pulse space-y-6">
      <div className="h-10 w-2/3 max-w-md rounded-lg bg-line/70" />
      <div className="h-4 w-1/2 max-w-sm rounded bg-line/60" />
      <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="h-72 rounded-lg bg-line/50" />
        <div className="h-72 rounded-lg bg-line/50" />
      </div>
    </div>
  );
}
