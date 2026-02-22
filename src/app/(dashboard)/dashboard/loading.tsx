export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-white p-5">
            <div className="h-3 w-1/2 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-1/3 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-lg border bg-white" />
        <div className="h-32 rounded-lg border bg-white" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[300px] rounded-lg border bg-white" />
        ))}
      </div>
    </div>
  );
}
