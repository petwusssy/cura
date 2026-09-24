/**
 * DashboardSkeleton
 * Full-page shimmer placeholder that matches the Dashboard layout.
 * Shown while the initial batch API calls are in-flight.
 */
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-5 bg-transparent min-h-full animate-in fade-in duration-300">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-7 w-36 rounded-lg" />
        <div className="flex items-center gap-2">
          {[80, 60, 80, 72, 64].map((w, i) => (
            <div key={i} className="skeleton h-8 rounded-lg" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* ── Stat Cards (6 cols) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 flex flex-col gap-3"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
          >
            <div className="flex items-center justify-between">
              <div className="skeleton skeleton-circle w-10 h-10" />
              <div className="skeleton h-2 w-2 rounded-full" />
            </div>
            <div className="skeleton h-8 w-12 rounded-md" />
            <div className="space-y-1.5 mt-auto">
              <div className="skeleton h-2.5 w-3/4 rounded" />
              <div className="skeleton h-2 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Live Queue strip ── */}
      <div
        className="bg-white rounded-xl p-5"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[210px] flex-shrink-0 rounded-lg p-3 flex flex-col gap-2"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div className="flex justify-between items-center">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-4 w-14 rounded-full" />
              </div>
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="flex gap-2 mt-1">
                <div className="skeleton h-7 flex-1 rounded" />
                <div className="skeleton h-7 flex-1 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeline chart + Medication reminders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 bg-white rounded-xl p-5"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1.5">
              <div className="skeleton h-4 w-44 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
            <div className="skeleton h-6 w-14 rounded-full" />
          </div>
          <div className="flex items-end gap-2 h-[180px] pt-4">
            {[40, 70, 55, 90, 60, 80, 45, 65, 75, 50].map((h, i) => (
              <div key={i} className="skeleton flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div
          className="bg-white rounded-xl p-5"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton skeleton-circle w-8 h-8" />
            <div className="space-y-1.5">
              <div className="skeleton h-3.5 w-32 rounded" />
              <div className="skeleton h-2.5 w-20 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div className="flex justify-between mb-2">
                  <div className="skeleton h-3.5 w-28 rounded" />
                  <div className="skeleton h-4 w-8 rounded-full" />
                </div>
                <div className="skeleton h-2.5 w-24 rounded mb-2" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-xl p-5"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="skeleton h-4 w-28 rounded mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100">
                <div className="skeleton skeleton-circle w-10 h-10" />
                <div className="skeleton h-2.5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-2 bg-white rounded-xl p-5"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f3f5' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-7 w-20 rounded-lg" />
          </div>
          <div className="hidden md:flex gap-4 pb-3 border-b border-gray-50">
            {[100, 80, 140, 60, 70].map((w, i) => (
              <div key={i} className="skeleton h-2.5 rounded" style={{ width: w }} />
            ))}
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="skeleton skeleton-circle w-7 h-7 flex-shrink-0" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
                <div className="skeleton h-4 w-16 rounded-full hidden md:block" />
                <div className="skeleton h-3 w-32 rounded hidden md:block" />
                <div className="skeleton h-3 w-12 rounded hidden md:block" />
                <div className="skeleton h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
