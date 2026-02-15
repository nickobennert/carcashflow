import { Skeleton } from "@/components/ui/skeleton"

export default function ConversationLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-4">
        {/* Date separator */}
        <div className="flex justify-center">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Received messages */}
        <div className="flex justify-start">
          <Skeleton className="h-12 w-48 rounded-2xl rounded-bl-lg" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-16 w-56 rounded-2xl rounded-bl-lg" />
        </div>

        {/* Sent messages */}
        <div className="flex justify-end">
          <Skeleton className="h-12 w-44 rounded-2xl rounded-br-lg" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36 rounded-2xl rounded-br-lg" />
        </div>

        <div className="flex justify-start">
          <Skeleton className="h-14 w-52 rounded-2xl rounded-bl-lg" />
        </div>
      </div>

      {/* Input Area */}
      <footer className="shrink-0 border-t bg-card px-4 py-3">
        <Skeleton className="h-10 w-full rounded-md" />
      </footer>
    </div>
  )
}
