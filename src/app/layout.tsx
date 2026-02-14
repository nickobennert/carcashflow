import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Fahr mit! - Mitfahrbörse für Schulungsteilnehmer",
    template: "%s | Fahr mit!",
  },
  description:
    "Organisiere Rückfahrten effizient mit anderen Schulungsteilnehmern. Biete Fahrten an oder finde Mitfahrgelegenheiten.",
  keywords: [
    "Mitfahrbörse",
    "Schulung",
    "Fahrgemeinschaft",
    "Mitfahrgelegenheit",
    "Rückfahrt",
  ],
  authors: [{ name: "Fahr mit!" }],
  creator: "Fahr mit!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fahr mit!",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Fahr mit!",
    title: "Fahr mit! - Mitfahrbörse für Schulungsteilnehmer",
    description:
      "Organisiere Rückfahrten effizient mit anderen Schulungsteilnehmern.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fahr mit! - Mitfahrbörse für Schulungsteilnehmer",
    description:
      "Organisiere Rückfahrten effizient mit anderen Schulungsteilnehmern.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevent zoom on iOS input focus
  viewportFit: "cover", // Support for iPhone notch/Dynamic Island
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
