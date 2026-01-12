"use client"

import { motion } from "motion/react"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  color?: "green" | "blue" | "purple" | "amber"
}

const colorClasses = {
  green: "bg-green-500/10 text-green-600",
  blue: "bg-blue-500/10 text-blue-600",
  purple: "bg-purple-500/10 text-purple-600",
  amber: "bg-amber-500/10 text-amber-600",
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "blue",
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="pt-6">
          <div
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4",
              colorClasses[color]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
