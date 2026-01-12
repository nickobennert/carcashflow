"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Sun,
  Moon,
  Check,
  X,
  Plus,
  Trash2,
  Pencil,
  Car,
  Search,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Settings,
  Bell,
  ChevronRight,
  AlertTriangle,
  Info,
  Loader2,
  GripVertical,
  MapPin,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Header with Theme Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Design System</h1>
          <p className="text-muted-foreground mt-1">
            Alle UI-Komponenten und Farben auf einen Blick
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Theme wechseln</span>
          </Button>
        </div>
      </div>

      {/* Colors Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Farben</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Base Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Basis</h3>
            <div className="space-y-1">
              <ColorSwatch name="Background" className="bg-background border" />
              <ColorSwatch name="Foreground" className="bg-foreground" />
              <ColorSwatch name="Card" className="bg-card border" />
              <ColorSwatch name="Popover" className="bg-popover border" />
            </div>
          </div>

          {/* Primary/Secondary */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Primär/Sekundär</h3>
            <div className="space-y-1">
              <ColorSwatch name="Primary" className="bg-primary" />
              <ColorSwatch name="Secondary" className="bg-secondary" />
              <ColorSwatch name="Muted" className="bg-muted" />
              <ColorSwatch name="Accent" className="bg-accent" />
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Semantisch</h3>
            <div className="space-y-1">
              <ColorSwatch name="Offer (Grün)" className="bg-offer" />
              <ColorSwatch name="Request (Blau)" className="bg-request" />
              <ColorSwatch name="Destructive (Rot)" className="bg-destructive" />
              <ColorSwatch name="Warning" className="bg-warning" />
            </div>
          </div>

          {/* UI Colors */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">UI</h3>
            <div className="space-y-1">
              <ColorSwatch name="Border" className="bg-border" />
              <ColorSwatch name="Input" className="bg-input" />
              <ColorSwatch name="Ring" className="bg-ring" />
              <ColorSwatch name="Hover" className="bg-hover" />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Typography Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Typographie</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-4xl font-bold</p>
            <p className="text-4xl font-bold">Überschrift 1</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-3xl font-bold</p>
            <p className="text-3xl font-bold">Überschrift 2</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-2xl font-semibold</p>
            <p className="text-2xl font-semibold">Überschrift 3</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-xl font-semibold</p>
            <p className="text-xl font-semibold">Überschrift 4</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-base</p>
            <p className="text-base">Standard Text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-sm text-muted-foreground</p>
            <p className="text-sm text-muted-foreground">Kleinerer Text für Beschreibungen und Hinweise.</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">text-xs text-muted-foreground</p>
            <p className="text-xs text-muted-foreground">Kleinster Text für Labels und Meta-Informationen.</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>

        <div className="space-y-6">
          {/* Variants */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Varianten</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Semantic */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Semantische Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-offer hover:bg-offer/90">
                <Car className="mr-2 h-4 w-4" />
                Plätze anbieten
              </Button>
              <Button className="bg-request hover:bg-request/90">
                <Search className="mr-2 h-4 w-4" />
                Mitfahrt suchen
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" />
                Route erstellen
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Größen</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Large</Button>
              <Button size="default">Default</Button>
              <Button size="sm">Small</Button>
              <Button size="icon"><Plus className="h-4 w-4" /></Button>
              <Button size="icon-sm"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* States */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Zustände</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button onClick={handleLoadingDemo}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Lädt..." : "Loading Demo"}
              </Button>
            </div>
          </div>

          {/* With Icons */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Mit Icons</h3>
            <div className="flex flex-wrap gap-3">
              <Button><Plus className="mr-2 h-4 w-4" /> Hinzufügen</Button>
              <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Bearbeiten</Button>
              <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Löschen</Button>
              <Button variant="ghost"><Settings className="mr-2 h-4 w-4" /> Einstellungen</Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Badges Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Badges</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Varianten</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Semantisch</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-offer/10 text-offer hover:bg-offer/20">Bietet Plätze</Badge>
              <Badge className="bg-request/10 text-request hover:bg-request/20">Sucht Mitfahrt</Badge>
              <Badge className="bg-success/10 text-success hover:bg-success/20">Aktiv</Badge>
              <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Ausstehend</Badge>
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Abgelaufen</Badge>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Form Elements Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Formular-Elemente</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-demo">Input</Label>
              <Input id="input-demo" placeholder="Text eingeben..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="input-icon">Input mit Icon</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="input-icon" className="pl-9" placeholder="Adresse suchen..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textarea-demo">Textarea</Label>
              <Textarea id="textarea-demo" placeholder="Nachricht eingeben..." />
            </div>

            <div className="space-y-2">
              <Label>Select</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Option wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Option 1</SelectItem>
                  <SelectItem value="2">Option 2</SelectItem>
                  <SelectItem value="3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="switch-demo" />
                <Label htmlFor="switch-demo">Dark Mode aktivieren</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="checkbox-demo" />
                <Label htmlFor="checkbox-demo">AGB akzeptieren</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input Zustände</Label>
              <div className="space-y-2">
                <Input placeholder="Normal" />
                <Input placeholder="Disabled" disabled />
                <Input placeholder="Mit Fehler" className="border-destructive" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basis Card</CardTitle>
              <CardDescription>Eine einfache Card-Komponente</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cards werden für gruppierte Inhalte verwendet.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Aktion</Button>
            </CardFooter>
          </Card>

          {/* Stat Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Routen</CardTitle>
              <Car className="h-4 w-4 text-offer" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Fahrer bieten Plätze an</p>
            </CardContent>
          </Card>

          {/* User Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>ST</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Sascha T.</CardTitle>
                  <CardDescription>aus Monheim am Rhein</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Badge className="bg-offer/10 text-offer">Bietet Plätze</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Alerts Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Alerts</h2>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Dies ist eine informative Nachricht für den Benutzer.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Diese Plattform dient der Kontaktanbahnung. Es findet keine Vermittlung oder Haftung statt.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
              Etwas ist schief gelaufen. Bitte versuche es erneut.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <Separator />

      {/* Dialogs Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialoge</h2>

        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog öffnen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Titel</DialogTitle>
                <DialogDescription>
                  Dies ist eine Beschreibung des Dialogs.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Hier kann beliebiger Inhalt stehen.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Abbrechen</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Löschen Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <Separator />

      {/* Tabs Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tabs</h2>

        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Card>
              <CardContent className="pt-6">
                Inhalt von Tab 1
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab2">
            <Card>
              <CardContent className="pt-6">
                Inhalt von Tab 2
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tab3">
            <Card>
              <CardContent className="pt-6">
                Inhalt von Tab 3
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      {/* Avatar Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Avatare</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="text-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback>XS</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground mt-1">8x8</p>
          </div>
          <div className="text-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground mt-1">10x10</p>
          </div>
          <div className="text-center">
            <Avatar className="h-12 w-12">
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground mt-1">12x12</p>
          </div>
          <div className="text-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground mt-1">16x16</p>
          </div>
          <div className="text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback>XL</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground mt-1">20x20</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Skeleton Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Skeleton Loading</h2>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Icons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Icons (Lucide)</h2>

        <div className="flex flex-wrap gap-4">
          {[
            { icon: Car, name: "Car" },
            { icon: Search, name: "Search" },
            { icon: Plus, name: "Plus" },
            { icon: Pencil, name: "Pencil" },
            { icon: Trash2, name: "Trash2" },
            { icon: Calendar, name: "Calendar" },
            { icon: Clock, name: "Clock" },
            { icon: Users, name: "Users" },
            { icon: MessageSquare, name: "MessageSquare" },
            { icon: Settings, name: "Settings" },
            { icon: Bell, name: "Bell" },
            { icon: MapPin, name: "MapPin" },
            { icon: GripVertical, name: "GripVertical" },
            { icon: Check, name: "Check" },
            { icon: X, name: "X" },
            { icon: ChevronRight, name: "ChevronRight" },
            { icon: AlertTriangle, name: "AlertTriangle" },
            { icon: Info, name: "Info" },
            { icon: Loader2, name: "Loader2" },
            { icon: Sun, name: "Sun" },
            { icon: Moon, name: "Moon" },
          ].map(({ icon: Icon, name }) => (
            <div key={name} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted">
              <Icon className="h-5 w-5" />
              <span className="text-xs text-muted-foreground">{name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Helper component for color swatches
function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-md", className)} />
      <span className="text-sm">{name}</span>
    </div>
  )
}
