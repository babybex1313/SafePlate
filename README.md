# SafePlate — Allergy-Safe Restaurant Finder

Find restaurants with verified allergy protocols across 10 US cities. Dine with confidence for Celiac, gluten-free, dairy-free, nut-free, and more.

## Features

- 🗺️ **Restaurant Search** — 600+ verified restaurants with color-coded safety tier pins
- 🚗 **Route Planner** — Find safe restaurants along any road trip route
- 🏢 **B2B Portal** — Restaurant owners can claim listings, complete kitchen protocol audits, and download safety badges
- 💳 **Monetized Travel Cards** — 13-language allergen translation cards ($9)
- 📡 **MCP Data Server** — Programmatic access for AI agents to query verified restaurant data
- 🌙 **Dark Mode** — Full dark mode support across all pages
- ✍️ **Community Blog** — Submit and read allergy-safe dining stories

## Tech Stack

- **Frontend**: React 19, TanStack Start, Tailwind CSS
- **Backend**: Neon Postgres (serverless), TanStack Server Functions
- **Maps**: Google Maps JavaScript API
- **Payments**: Stripe
- **Email**: Resend
- **Analytics**: Google Analytics
- **Deploy**: Vercel

## Getting Started

```bash
bun install
source .env
bun run dev
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — Neon Postgres connection string
- `GOOGLE_MAPS_API_KEY` — Google Maps API key
- `RESEND_API_KEY` — Resend email API key
- `AUTH_SECRET` — JWT signing secret

## B2B Portal

Restaurant owners can visit `/business` to:
1. Register their restaurant
2. Complete a 10-question kitchen protocol audit
3. Receive a Tier 1/2/3 safety rating
4. Download an embeddable "SafePlate Verified" badge
