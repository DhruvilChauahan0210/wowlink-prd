# WowLink

WowLink is a responsive web app for creating interactive occasion invitations. The product direction and MVP requirements are documented in [PRD.md](./PRD.md).

## Getting started

Requires Node.js 20 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current scaffold

- Cinematic landing page with a pinned invitation reveal, photographic occasion reel, and scroll-drawn sharing journey
- A single animation loop with Lenis smoothing; scroll transforms update element refs directly
- Original local celebration imagery and a reduced-motion alternative
- Template gallery for weddings, birthdays, Garba/Navratri, and grand openings
- Cinematic editor and guest view sharing the same invitation scene and four reveal interactions
- Live form preview with drafts saved on the current device
- Guest-facing invitation with event details and an inline RSVP interaction preview
- Responsive styling and reduced-motion support

The editor stores drafts in this browser’s local storage. Full preview opens those saved details on the same device. The RSVP form demonstrates the interaction without sending or storing responses. Authentication, cloud persistence, uploads, QR generation, server-side publishing, RSVP storage, subscriptions, and analytics are not connected yet.

## Product direction

The recommended MVP stack is Next.js, React, Supabase, and a recurring-payment provider selected for the Indian market. The first implementation step after this scaffold is to configure the data model and authentication, then replace the local editor state and preview alerts with persisted drafts and guest responses.
