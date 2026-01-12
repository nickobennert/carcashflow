"use client"

import { motion } from "motion/react"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface Stat {
  value: string
  label: string
}

interface StatsSectionProps {
  stats: Stat[]
  className?: string
}

export function StatsSection({ stats, className }: StatsSectionProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            variants={staggerItem}
            className="text-center"
          >
            <motion.p
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
            >
              {stat.value}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
