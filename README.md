# FlapKap Partner Portal

Front-end for the broker partner portal. React 18 + TypeScript + Vite, no backend —
all sample data lives in `src/lib/data.ts` behind typed interfaces, so wiring it to a
real API means replacing that one file.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Railway

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. Nothing to configure. Railway detects Node, runs `npm run build`, then `npm start`.
3. Settings → Networking → **Generate Domain** for a public URL.

`server.mjs` reads `process.env.PORT` directly, which is what Railway requires. It
serves `dist/` with a fallback to `index.html` so client-side routing works, caches
fingerprinted assets immutably, and never caches the HTML entry point.

## Deploy anywhere static

`npm run build` produces `dist/`, which drops onto Netlify, Vercel, Cloudflare Pages
or S3 with no rewrite rules needed — routing is hash-based.

For a single self-contained file (everything inlined, zero external requests, opens
straight from disk):

```bash
npm run artifact
```

## Layout

```
src/
  styles/tokens.css       every colour, size and duration — the only place they are decided
  styles/base.css         reset, document rhythm, browser surfaces (selection, caret, scrollbar, focus)
  styles/components.css   the component vocabulary, used identically on every screen
  lib/types.ts            domain model — stages, owners, document statuses, offers
  lib/domain.ts           labels, stage groups, commission maths
  lib/format.ts           AED, percentages, dates, countdowns
  lib/data.ts             sample data — replace with API calls
  components/AppShell.tsx sidebar, topbar, mobile drawer
  components/ui.tsx       Button, Pill, Clock, Chip, Gauge, Progress, StatStrip, Field, EmptyState
  screens/                one file per route
server.mjs                static server for production
```

## Routes

Hash-based: `/login`, `/`, `/new-case`, `/cases`, `/cases/:id`, `/documents`,
`/offers`, `/commissions`, `/clients`, `/notifications`, `/settings`, `/reports`.

## Design rules the code holds to

- One icon family (Phosphor), one weight. No unicode glyphs, no emoji.
- Tokens decide everything; no component hard-codes a colour or size.
- Fills and text are different colours — `--primary` for fills, `--primary-text` for
  type. The brand blue is only 3.78:1 as text on a dark surface.
- Every control ships default, hover, focus-visible, active, disabled, loading.
- Hover gated behind `(hover: hover) and (pointer: fine)` so it never sticks on touch.
- Motion follows frequency: anything seen constantly gets none. One authored moment —
  the quarterly gauge filling. `prefers-reduced-motion` drops movement, keeps opacity.
- Responsive is structural: sidebar becomes a drawer, tables become cards under 900px.
  44px touch targets on coarse pointers, zero horizontal page scroll at 375px.
- Verified across all 13 routes: no contrast failures, one `<h1>` each, every input
  labelled, every icon button named.

## Known gaps

- `partA()` implements the commission schedule as written, including the
  discontinuity at the 1.5% fee floor — at exactly 1.5% it pays 1.0% of the
  disbursal, just above it 75% of the fee, which is more. Deliberate, and flagged
  for policy review rather than silently smoothed.
- No team accounts, no bulk upload, no document auto-extraction.
- Figures on screen are illustrative sample data.
