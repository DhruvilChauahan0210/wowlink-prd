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

- Public landing page with product story, template highlights, steps, and Free plan introduction
- Template gallery for weddings, birthdays, Garba/Navratri, and grand openings
- Form-based editor with live local preview
- Guest-facing sample invitation with event details and RSVP interaction preview
- Responsive styling and reduced-motion support

The editor and RSVP actions are front-end prototypes. Authentication, persistence, uploads, QR generation, server-side publishing, RSVP storage, subscriptions, and analytics are not connected yet. Do not use this scaffold to collect real guest data or take payments.

## Product direction

The recommended MVP stack is Next.js, React, Supabase, and a recurring-payment provider selected for the Indian market. The first implementation step after this scaffold is to configure the data model and authentication, then replace the local editor state and preview alerts with persisted drafts and guest responses.
