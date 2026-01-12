"use client"

import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface CTASectionProps {
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function CTASection({
  title,
  description,
  primaryAction,
  secondaryAction,
}: CTASectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 text-primary-foreground"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        <p className="text-primary-foreground/80 mb-8 text-lg">{description}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="gap-2 font-semibold"
          >
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {secondaryAction && (
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-primary-foreground hover:text-primary-foreground hover:bg-white/20"
            >
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </motion.section>
  )
}
