"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white"
      >
        <div className="container max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm relative">
          <Sparkles className="h-4 w-4 shrink-0" />
          <p className="font-medium">
            <span className="hidden sm:inline">
              Carcashflow befindet sich in der Beta-Phase.{" "}
            </span>
            <span className="sm:hidden">Beta-Phase aktiv. </span>
            <span className="underline underline-offset-2 cursor-pointer hover:no-underline">
              Feedback geben
            </span>
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
