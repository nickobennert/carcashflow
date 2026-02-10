# Fahr mit! - Mitfahrbörse

Eine Webanwendung für aktive Schulungsteilnehmer, um Rückfahrten effizient zu organisieren.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Hosting:** Vercel
- **Maps:** OpenRouteService API (Route-Berechnung)

## Features

- Fahrtangebote und -gesuche erstellen
- Intelligentes Route-Matching ("Unterwegs"-Filter)
- Echtzeit-Nachrichten zwischen Nutzern
- Route-Benachrichtigungen für Stammstrecken
- DSGVO-konforme Datenverwaltung
- Dark/Light Mode

## Entwicklung starten

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Environment Variables

Erstelle eine `.env.local` Datei mit:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ORS_API_KEY=
```

## Deployment

Die App ist für Vercel optimiert. Bei jedem Push auf `main` wird automatisch deployed.

## Dokumentation

- `CLAUDE.md` - Technische Entwicklerdokumentation
- `docs/ROUTING_HOSTING_OPTIONEN.md` - Routing-Infrastruktur Optionen
