"use client";

interface SystemMockupProps {
  title?: string;
  variant?: "light" | "dark";
  className?: string;
}

export function SystemMockup({
  title = "Dashboard",
  variant = "dark",
  className,
}: SystemMockupProps) {
  const isLight = variant === "light";

  return (
    <div
      className={`overflow-hidden rounded-xl shadow-2xl ${className ?? ""}`}
    >
      {/* Browser chrome bar */}
      <div
        className={`flex items-center gap-2 px-4 py-2.5 ${
          isLight ? "bg-white/10 backdrop-blur" : "bg-slate-800"
        }`}
      >
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
        </div>
        <div
          className={`ml-2 flex-1 rounded-md px-3 py-1 text-xs ${
            isLight
              ? "bg-white/10 text-white/60"
              : "bg-slate-700 text-slate-400"
          }`}
        >
          app.vitalis.com/{title.toLowerCase().replace(/\s/g, "-")}
        </div>
      </div>

      {/* Content area */}
      <div
        className={`relative aspect-[16/10] ${
          isLight
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
        }`}
      >
        {/* Fake sidebar */}
        <div
          className={`absolute inset-y-0 left-0 w-1/5 border-r ${
            isLight
              ? "border-white/5 bg-white/5"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="space-y-2 p-3">
            {[70, 85, 60, 90, 75].map((w, i) => (
              <div
                key={i}
                className={`h-2 rounded ${
                  isLight ? "bg-white/10" : "bg-slate-200"
                }`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>

        {/* Fake content area */}
        <div className="absolute inset-y-0 left-[20%] right-0 p-4">
          {/* Top stat cards */}
          <div className="flex gap-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-12 flex-1 rounded-lg ${
                  isLight ? "bg-white/5" : "bg-white shadow-sm"
                }`}
              />
            ))}
          </div>

          {/* Chart placeholder */}
          <div
            className={`mt-3 h-[45%] rounded-lg ${
              isLight ? "bg-white/5" : "bg-white shadow-sm"
            }`}
          >
            <div className="flex h-full items-end gap-1 p-3">
              {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 68].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-teal-500/60"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>
          </div>

          {/* Table placeholder */}
          <div
            className={`mt-3 space-y-1.5 rounded-lg p-3 ${
              isLight ? "bg-white/5" : "bg-white shadow-sm"
            }`}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-2 rounded ${
                  isLight ? "bg-white/10" : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Teal accent glow */}
        <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 bg-gradient-to-tl from-teal-500/10 to-transparent" />
      </div>
    </div>
  );
}
