import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-5 w-72" />
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Tab Navigation */}
        <nav className="sm:w-56 shrink-0">
          <div className="grid grid-cols-5 sm:grid-cols-1 gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Form fields skeleton */}
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-14 mb-2" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>
    </div>
  )
}
