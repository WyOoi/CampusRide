# CampusRide (frontend)

Production-style **Next.js 15** frontend for **CampusRide** — a UTeM-exclusive peer-to-peer carpooling prototype. This package is **UI-only**: mock JSON, local Zustand state, and simulated map movement. No backend APIs are implemented.

## Tech stack

- **Next.js 15** (App Router, React 19)
- **TypeScript**
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline` tokens)
- **shadcn/ui-style** primitives (Radix UI + `class-variance-authority`)
- **Framer Motion**
- **Lucide React**
- **next-themes** (light/dark toggle)
- **Zustand** (session + UI shell state)
- **React Leaflet + Leaflet** (OpenStreetMap tiles; dynamically imported with `ssr: false`)
- **Recharts** (admin charts)
- **Sonner** (toast notifications)

## Folder layout

```text
frontend/
├── app/                 # Routes (marketing, auth, app shell)
├── components/          # UI primitives, layouts, feature blocks
├── data/                # Mock JSON/TS datasets
├── hooks/
├── lib/
├── store/               # Zustand stores
├── types/
├── utils/
├── public/
└── styles/              # Optional global style extensions
```

## Prerequisites

- Node.js **20+** recommended
- npm **10+** (or compatible package manager)

> If `npm install` fails with **ENOSPC (no space left on device)**, free disk space and retry.

## Setup

### 1) Install dependencies

```bash
cd frontend
npm install
```

### 2) Environment template

Copy `.env.example` to `.env.local` if you want to override public labels later:

```bash
copy .env.example .env.local
```

### 3) shadcn/ui alignment

This repo already includes the common shadcn-style building blocks under `components/ui/`.

If you want to use the official CLI to add more components later:

```bash
npx shadcn@latest init
```

Point it at:

- **Tailwind CSS file**: `app/globals.css`
- **Components alias**: `@/components`
- **Utils alias**: `@/lib/utils`

### 4) Tailwind CSS

Tailwind v4 is configured via:

- `app/globals.css` (`@import "tailwindcss";` + design tokens)
- `postcss.config.mjs` (`@tailwindcss/postcss`)

No separate `tailwind.config.ts` is required for this template.

### 5) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

### 6) Production build

```bash
npm run build
npm start
```

## Primary routes

| Route | Purpose |
| --- | --- |
| `/` | Landing (hero, stats, problem, features, testimonials, CTA) |
| `/login`, `/register`, `/forgot-password`, `/verify-email` | Auth flows (mock) |
| `/dashboard` | Mobile-first dashboard + role toggle |
| `/history` | Completed trips (ride history) |
| `/offer` | Offer ride form + fare estimator + OSM preview |
| `/find` | Search/filter + ride cards |
| `/tracking/[rideId]` | Live map simulation + ETA + emergency UI |
| `/rides/[rideId]` | Trip sheet + chat mock + fare breakdown |
| `/profile` | Tabs for settings, vehicle, prefs, payments, stats |
| `/admin` | Moderator analytics + tables + charts |
| `/notifications` | Notification center tabs |

## Map notes

- Tiles: **OpenStreetMap** (`https://tile.openstreetmap.org/...`)
- Map components are loaded with `next/dynamic({ ssr: false })` to avoid SSR issues with Leaflet.

## License / academic use

Built as a **final-year / hackathon / investor demo** style MVP. Replace mock data with real APIs when you are ready to go beyond the prototype.
