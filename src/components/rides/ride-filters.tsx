"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { CalendarIcon, Filter, X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RideFiltersProps {
  className?: string
}

export function RideFilters({ className }: RideFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [type, setType] = useState(searchParams.get("type") || "all")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined
  )

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    router.push(`/dashboard?${params.toString()}`)
  }

  function clearFilters() {
    setType("all")
    setSearch("")
    setDate(undefined)
    router.push("/dashboard")
  }

  const hasActiveFilters = type !== "all" || search || date

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Type Filter */}
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value)
            updateFilters({ type: value })
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Alle Typen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Routen</SelectItem>
            <SelectItem value="offer">Nur Angebote</SelectItem>
            <SelectItem value="request">Nur Gesuche</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: de }) : "Datum filtern"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate)
                updateFilters({
                  date: newDate ? format(newDate, "yyyy-MM-dd") : null,
                })
              }}
              locale={de}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Stadt oder Adresse suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters({ search })
              }
            }}
            onBlur={() => updateFilters({ search })}
            className="pl-9"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Filter zurücksetzen
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {type !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {type === "offer" ? "Angebote" : "Gesuche"}
              <button
                onClick={() => {
                  setType("all")
                  updateFilters({ type: "all" })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {date && (
            <Badge variant="secondary" className="gap-1">
              {format(date, "d. MMM yyyy", { locale: de })}
              <button
                onClick={() => {
                  setDate(undefined)
                  updateFilters({ date: null })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="gap-1">
              "{search}"
              <button
                onClick={() => {
                  setSearch("")
                  updateFilters({ search: null })
                }}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
