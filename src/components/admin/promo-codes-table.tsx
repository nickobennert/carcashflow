"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Plus,
  Loader2,
  Copy,
  MoreHorizontal,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
} from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { staggerContainer, staggerItem } from "@/lib/animations"

interface PromoCode {
  id: string
  code: string
  type: string
  value: number | null
  duration_months: number | null
  max_uses: number | null
  current_uses: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
  creator?: {
    id: string
    username: string
    first_name: string | null
    last_name: string | null
  }
}

const typeLabels: Record<string, string> = {
  percent_discount: "Prozent-Rabatt",
  fixed_discount: "Festbetrag-Rabatt",
  free_months: "Kostenlose Monate",
  lifetime_free: "Lebenslang kostenlos",
}

const typeBadgeColors: Record<string, string> = {
  percent_discount: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  fixed_discount: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  free_months: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  lifetime_free: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
}

export function PromoCodesTable() {
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCode, setNewCode] = useState({
    code: "",
    type: "percent_discount",
    value: "",
    duration_months: "",
    max_uses: "",
    valid_until: "",
  })

  useEffect(() => {
    loadCodes()
  }, [])

  async function loadCodes() {
    try {
      const response = await fetch("/api/promo-codes")
      if (!response.ok) throw new Error("Failed to load")
      const data = await response.json()
      setCodes(data.data || [])
    } catch (error) {
      console.error("Error loading promo codes:", error)
      toast.error("Fehler beim Laden der Promo Codes")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateCode(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)

    try {
      const response = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.code,
          type: newCode.type,
          value: newCode.value ? parseInt(newCode.value) : null,
          duration_months: newCode.duration_months ? parseInt(newCode.duration_months) : null,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          valid_until: newCode.valid_until || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Fehler beim Erstellen")
        return
      }

      toast.success("Code erstellt")
      setIsCreateOpen(false)
      setNewCode({
        code: "",
        type: "percent_discount",
        value: "",
        duration_months: "",
        max_uses: "",
        valid_until: "",
      })
      loadCodes()
    } catch (error) {
      console.error("Error creating code:", error)
      toast.error("Fehler beim Erstellen")
    } finally {
      setIsCreating(false)
    }
  }

  async function toggleActive(code: PromoCode) {
    try {
      const response = await fetch(`/api/promo-codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !code.is_active }),
      })

      if (!response.ok) throw new Error("Failed to update")

      setCodes((prev) =>
        prev.map((c) =>
          c.id === code.id ? { ...c, is_active: !c.is_active } : c
        )
      )
      toast.success(code.is_active ? "Code deaktiviert" : "Code aktiviert")
    } catch (error) {
      console.error("Error toggling code:", error)
      toast.error("Fehler beim Aktualisieren")
    }
  }

  async function deleteCode(code: PromoCode) {
    if (!confirm(`Code "${code.code}" wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/promo-codes/${code.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete")

      setCodes((prev) => prev.filter((c) => c.id !== code.id))
      toast.success("Code gelöscht")
    } catch (error) {
      console.error("Error deleting code:", error)
      toast.error("Fehler beim Löschen")
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    toast.success("Code kopiert")
  }

  function formatValue(code: PromoCode): string {
    if (!code.value) return "-"
    switch (code.type) {
      case "percent_discount":
        return `${code.value}%`
      case "fixed_discount":
        return `${(code.value / 100).toFixed(2)}€`
      case "free_months":
        return `${code.value} Monate`
      case "lifetime_free":
        return "Unbegrenzt"
      default:
        return String(code.value)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promo Codes ({codes.length})</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Promo Code erstellen</DialogTitle>
              <DialogDescription>
                Erstelle einen neuen Gutscheincode für deine Nutzer.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="z.B. WILLKOMMEN2024"
                  value={newCode.code}
                  onChange={(e) =>
                    setNewCode({ ...newCode, code: e.target.value.toUpperCase() })
                  }
                  className="font-mono uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Typ</Label>
                <Select
                  value={newCode.type}
                  onValueChange={(value) => setNewCode({ ...newCode, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent_discount">Prozent-Rabatt</SelectItem>
                    <SelectItem value="fixed_discount">Festbetrag-Rabatt</SelectItem>
                    <SelectItem value="free_months">Kostenlose Monate</SelectItem>
                    <SelectItem value="lifetime_free">Lebenslang kostenlos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCode.type !== "lifetime_free" && (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Wert{" "}
                    {newCode.type === "percent_discount"
                      ? "(%)"
                      : newCode.type === "fixed_discount"
                      ? "(Cent)"
                      : "(Monate)"}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder={
                      newCode.type === "percent_discount"
                        ? "z.B. 20"
                        : newCode.type === "fixed_discount"
                        ? "z.B. 500 (= 5€)"
                        : "z.B. 3"
                    }
                    value={newCode.value}
                    onChange={(e) => setNewCode({ ...newCode, value: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max. Einlösungen</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    placeholder="Leer = unbegrenzt"
                    value={newCode.max_uses}
                    onChange={(e) =>
                      setNewCode({ ...newCode, max_uses: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Gültig bis</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={newCode.valid_until}
                    onChange={(e) =>
                      setNewCode({ ...newCode, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Noch keine Promo Codes erstellt.
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Wert</TableHead>
                <TableHead>Nutzung</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gültig bis</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <motion.tr key={code.id} variants={staggerItem} className="group">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-medium">{code.code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyCode(code.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={typeBadgeColors[code.type]}>
                      {typeLabels[code.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatValue(code)}</TableCell>
                  <TableCell>
                    {code.current_uses}
                    {code.max_uses && ` / ${code.max_uses}`}
                  </TableCell>
                  <TableCell>
                    {code.is_active ? (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aktiv
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inaktiv
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {code.valid_until
                      ? format(new Date(code.valid_until), "dd.MM.yyyy", { locale: de })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleActive(code)}>
                          {code.is_active ? (
                            <>
                              <ToggleLeft className="h-4 w-4 mr-2" />
                              Deaktivieren
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4 mr-2" />
                              Aktivieren
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteCode(code)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  )
}
