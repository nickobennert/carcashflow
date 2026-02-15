import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function RideDetailLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Main Card */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* User */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full ml-auto" />
          </div>

          {/* Route */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="w-0.5 h-8" />
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="w-0.5 h-8" />
                <Skeleton className="h-3 w-3 rounded-full" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-52" />
                </div>
              </div>
            </div>
          </div>

          {/* Details row */}
          <div className="flex gap-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Comment */}
          <Skeleton className="h-16 w-full rounded-lg" />

          {/* Action button */}
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  )
}
