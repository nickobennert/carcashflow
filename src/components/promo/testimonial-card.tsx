"use client"

import { motion } from "motion/react"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface TestimonialCardProps {
  quote: string
  author: string
  role?: string
  avatarUrl?: string
  rating?: number
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  rating = 5,
}: TestimonialCardProps) {
  const initials = author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className="h-full">
        <CardContent className="pt-6">
          {/* Rating */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-foreground mb-6 leading-relaxed">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{author}</p>
              {role && (
                <p className="text-xs text-muted-foreground">{role}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
