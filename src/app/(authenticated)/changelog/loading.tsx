import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function ChangelogLoading() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10">
        <Skeleton className="h-5 w-28 rounded-full mb-3" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-56 mt-2" />
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative pl-14">
              <Skeleton className="absolute left-0 top-0 h-10 w-10 rounded-full" />
              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-2.5">
                        <Skeleton className="h-1.5 w-1.5 rounded-full" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
