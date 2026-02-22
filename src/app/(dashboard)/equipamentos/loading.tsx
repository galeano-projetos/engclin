export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border bg-white p-4">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
            <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
