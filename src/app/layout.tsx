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
    default: "Carcashflow - Mitfahrbörse für Schulungsteilnehmer",
    template: "%s | Carcashflow",
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
  authors: [{ name: "Carcashflow" }],
  creator: "Carcashflow",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Carcashflow",
    title: "Carcashflow - Mitfahrbörse für Schulungsteilnehmer",
    description:
      "Organisiere Rückfahrten effizient mit anderen Schulungsteilnehmern.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carcashflow - Mitfahrbörse für Schulungsteilnehmer",
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
