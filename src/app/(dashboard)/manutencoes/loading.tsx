export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-white p-4">
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-3/4 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
