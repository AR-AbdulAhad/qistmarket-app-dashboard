"use client";

export function StatCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-dark-3 dark:bg-boxdark">
      <div className="h-1 w-full animate-pulse bg-slate-100 dark:bg-dark-3" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 animate-pulse rounded-xl bg-slate-100 dark:bg-dark-3" />
          <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100 dark:bg-dark-3" />
        </div>
        <div className="h-6 w-24 animate-pulse rounded bg-slate-100 dark:bg-dark-3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-dark-3 dark:bg-boxdark">
      <div className="border-b border-slate-100 bg-gray-50 px-4 py-3 dark:border-dark-3 dark:bg-dark-2">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-dark-3" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6 border-b border-slate-50 px-4 py-4 last:border-0 dark:border-dark-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3.5 w-20 animate-pulse rounded bg-slate-100 dark:bg-dark-3" style={{ animationDelay: `${(r + c) * 40}ms` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-end gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-boxdark">
      {[40, 65, 50, 80, 35, 60, 45].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-slate-100 dark:bg-dark-3" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
}
