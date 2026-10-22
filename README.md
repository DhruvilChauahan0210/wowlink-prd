# WowLink

WowLink is a responsive web app for creating interactive occasion invitations. The product direction and MVP requirements are documented in [PRD.md](./PRD.md).

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's here

- **A hand-drawn product.** There's no photography. Each occasion (wedding, birthday, Garba, grand opening) has an ink-and-watercolour illustration in `app/ui/art.tsx`. The home page hero is a sketchbook that draws itself.
- **A different opening for each occasion** (`app/ui/openers.tsx`). Untie a kankotri scroll, pull a gift's bow, light a diya so the rangoli blooms, or cut a ribbon.
- **The studio** (`/create`): edit the details with a live preview, then publish.
- **Publishing:** a short public link (`/e/<slug>`), with sharing by link, WhatsApp, the native share sheet or a printable QR code. Each link gets its own share preview image for WhatsApp and social apps.
- **Guests** open the link, play the opening, see a countdown, add the event to their calendar (Google or `.ics`), and RSVP without an account.
- **The manage page** (`/manage/<slug>#k=…`): a private link for reply totals and the list, editing, and unpublishing.

## Tests

```bash
npm test
```

Playwright runs the unit and end-to-end tests against a production build on port 3100, with its own build folder and data file, so a running `npm run dev` isn't affected. GitHub Actions runs the same suite on every push to `main` (`.github/workflows/test.yml`). If a run fails, its report is attached to the run.

## Configuration

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The public address, for absolute links in share previews (for example `https://wowlink.example`). Defaults to the Vercel production URL when deployed there, and `http://localhost:3000` otherwise. |

## Current limits

- Published invitations and RSVPs are stored in a local JSON file, `.data/wowlink.json` (git-ignored), behind `app/lib/store.ts`. It works for local use but won't persist on serverless hosting. The PRD's target is Supabase, which means replacing that one module.
- There are no accounts yet. Ownership is the private manage link, so a lost manage link can't be recovered.
- Rate limiting is in memory, for one server process.
- Times are read as India Standard Time for the countdown and calendar files.
- Subscriptions, analytics and the free plan's 60-day expiry aren't built yet.

## Fonts

The fonts are self-hosted in `app/fonts/` (OFL-licensed) so builds never need to reach Google Fonts. `app/fonts/og/` holds static TTF copies for the share-preview image renderer, which can't read woff2.
