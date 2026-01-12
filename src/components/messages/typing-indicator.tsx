"use client"

import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 bg-muted rounded-2xl rounded-bl-lg px-4 py-2.5",
        className
      )}
    >
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "0ms", animationDuration: "600ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "150ms", animationDuration: "600ms" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
        style={{ animationDelay: "300ms", animationDuration: "600ms" }}
      />
    </div>
  )
}
