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

- **A hand-drawn product.** There's no photography. Each of the eight occasions (wedding, engagement, birthday, Garba, baby shower, housewarming, anniversary, grand opening) has an ink-and-watercolour illustration in `app/ui/art.tsx`. The home page hero is a sketchbook that draws itself.
- **A different opening for each occasion** (`app/ui/openers.tsx`). Untie a kankotri scroll, open a ring box, pull a gift's bow, light a diya so the rangoli blooms, shake a rattle to rock the cradle, lift the latch on a front door, break the seal on a letter, or cut a ribbon.
- **The studio** (`/create`): edit the details with a live preview, then publish.
- **Publishing:** a short public link (`/e/<slug>`), with sharing by link, WhatsApp, the native share sheet or a printable QR code. Each link gets its own share preview image for WhatsApp and social apps.
- **Guests** open the link, play the opening, see a countdown, add the event to their calendar (Google or `.ics`), and RSVP without an account. With a schedule, they tick which celebrations they're coming to, and can give a different number of people for each.
- **Blessings and wishes.** Guests can leave a wish with their reply. The host sees them all on the manage page and can show them on the invitation as taped, hand-written notes, hiding any one. Only the name a guest typed goes with their wish, and the form tells guests whether the hosts alone will read it.
- **Gujarati and English.** In the studio the host picks the language guests see first; each guest can switch with the toggle in the header, and their choice is remembered on their phone. Dates and times are written the Gujarati way ("8 નવેમ્બર 2026", "સાંજે 6:00 વાગ્યે"), WhatsApp messages follow the invitation's language, and handwritten touches use Farsan for Gujarati. Hosts can use the studio, the manage page and My invitations in Gujarati too, with their own switch (remembered on their device, and separate from the language guests read).
- **Your own colours.** In the studio the host can keep the occasion's colours, pick one of seven palettes (sindoor, marigold, rani pink, peacock, mehndi, indigo, kesar) or choose any colour of their own. The colours tint the handwriting, underlines, the countdown circle, the timeline and the little doodles; the illustrations keep their watercolours. Each colour is checked for contrast (`app/lib/palette.ts`), and one that's too pale or too dark is deepened or lightened until it can be read on paper and on the dark section. The link preview image uses it too.
- **On the day, and after.** When a celebration is today, the invitation leads with it: what's still to come or happening now, with directions. Once everything is over, it becomes a thank-you: the host's note (written in the studio) in place of the reply form, with the blessings wall. Each link only counts its own celebrations.
- **My invitations** (`/mine`): every invitation this device can manage, with replies at a glance, plus drafts. Since there are no accounts yet, it can save all your manage links to a small private file, and add invitations from a pasted link or that file on another device.
- **Personal invitations** (`/e/<slug>/<id>`): a link for one household ("the Patel family"). It opens addressed to them and shows only the celebrations the host picked. The household has one reply, which they can change later. The general link can also be limited, for example to the reception only. Celebrations a link doesn't show never reach that browser: not in the page, the calendar file or the share image.
- **The manage page** (`/manage/<slug>#k=…`): a private link for reply totals, the headcount for each celebration, who hasn't replied, personal invitations, editing, and unpublishing. You can add invitations one at a time or paste a whole list (one household per line, optionally with a WhatsApp number), then preview, send, remind, replace a link or remove each one. With a number, WhatsApp opens that family's chat directly. Each household shows whether they've opened their link yet ("Opened 22 Oct · no reply yet"), counted from real visits only, not link previews. Numbers are only ever shown to the host. Everything can be downloaded as a spreadsheet: every reply, the headcount per celebration for the caterer, and the invitation list with links.
- **Deleting.** On the manage page a host can delete a single reply (when a guest asks to be taken off), or the whole invitation with every reply, wish, household and number in it. Both ask first; deleting the invitation offers to download the replies, then takes it off My invitations on that device. Only a deleted invitation's slug is kept, so its old link can never open someone else's invitation.
- **How it's doing.** The manage page shows how many people opened the invitation, how many played the opening and replied, visits from the printed QR code, visits over the last two weeks, and how the host shared it (WhatsApp, copied link, QR code, personal links). These are plain daily counts (`app/lib/insights.ts`), reported by the page once it runs, so link previews don't count, and a browser where the host has opened their manage page isn't counted. A browser remembers it has been counted, so each browser counts once. No cookies, no outside analytics, and nobody is identified.
- **Reports and taking down.** Every invitation has a "Report" link in its footer (`/report/<slug>`, in the guest's language). A report keeps the reason and what was written, never who sent it, and one address can send five an hour. WowLink's admin (`/admin`, opened with `WOWLINK_ADMIN_KEY`) lists reported invitations, most reported first. From there you can take one down, restore it, dismiss its reports, or find any invitation by its link. A taken-down invitation can't be opened, replied to or republished; its host sees why on their manage page and keeps their replies. The admin also shows the app's numbers over 7, 30 or 90 days: occasion pages, samples, studio visits, invitations published by occasion, visits, people, openings, replies, "Create yours free" clicks, sharing, reports and take-downs.
- **Privacy** (`/privacy`, `/privacy?lang=gu`): what WowLink keeps, who sees it, that a link isn't a lock, and how things are deleted, in plain English and Gujarati. Guests reach it from the reply form and the invitation's footer, in their language; hosts from the manage page.
- **Occasion pages for search** (`/templates/<occasion>`): each occasion has its own page with a sample that opens right there, what it's good for, what guests get, and a few questions answered, written for searches like "Garba invitation maker online" or "Gujarati wedding invitation website" (`app/lib/occasion-pages.ts`). Each has its own share card. `sitemap.xml` lists the home page, the occasions, their pages and the privacy page; `robots.txt` keeps crawlers out of the API and the hosts' pages. Invitations, the studio, the manage pages and My invitations all carry `noindex`.

## Tests

```bash
npm test
```

Playwright runs the unit and end-to-end tests against a production build on port 3100, with its own build folder and data file, so a running `npm run dev` isn't affected. GitHub Actions runs the same suite on every push to `main` (`.github/workflows/test.yml`). If a run fails, its report is attached to the run.

## Configuration

Copy `.env.example` to `.env.local` and fill it in.

| Variable | Used for |
|---|---|
| `WOWLINK_ADMIN_KEY` | Opens the admin page (`/admin`). On a live site it needs at least 24 characters (`openssl rand -hex 24`), or the admin stays off and the server logs a warning; with `npm run dev` any key works. Without it the admin doesn't exist. Ten wrong keys from one address lock that address out for an hour (the page then says so). |
| `NEXT_PUBLIC_SITE_URL` | The public address, for absolute links in share previews, canonical links, `sitemap.xml` and `robots.txt` (for example `https://wowlink.example`). Defaults to the Vercel production URL when deployed there, and `http://localhost:3000` otherwise. |

## Current limits

- Published invitations and RSVPs are stored in a local JSON file, `.data/wowlink.json` (git-ignored), behind `app/lib/store.ts`. It works for local use but won't persist on serverless hosting. The PRD's target is Supabase, which means replacing that one module.
- There are no accounts yet. Ownership is the private manage link, so a lost manage link can't be recovered. My invitations (`/mine`) keeps a list on each device and can back the links up to a file.
- Rate limiting is in memory, for one server process.
- Times are read as India Standard Time for the countdown and calendar files.
- The free plan's 100 replies count every general-link reply plus one place kept for each personal invitation, so an invited household can always reply.
- Subscriptions, analytics and the free plan's 60-day expiry aren't built yet.
- The PRD puts custom colours in the paid plan. Until plans exist, every host has them.
- Each counted visit rewrites the JSON file, like every other change. That's fine for trying it out; with Supabase, counts become single increments.
- The admin is one shared key, not accounts. When accounts arrive it should become a role.
- The privacy page describes the app as it is today. Before launch it needs a proper review: where the data is hosted, how long it's kept, what the hosting provider logs, and consent.

## Performance on phones

The drawings get their hand-made look from SVG paint filters (the watercolour wash and the ink wobble), which are costly to repaint. Three rules keep phones smooth:

- **Drawings that don't animate are images.** The reel, the catalogue, the studio tiles and the manage page use `/art/<name>.svg` (prerendered, `ArtImage`). A browser paints an image once; inline SVG with filters is repainted whenever it moves or scales.
- **Ink draws itself "on twos"**, about 12 frames a second, like hand animation.
- **The boiling ink on the home page sketch is only for devices with a mouse.** Phones get the same sketch with still ink.

Measured headless at phone size with a 6× slower CPU, these cut paint work while an invitation opens by about 60%, on the home page at rest by about 70%, and while scrolling the occasion reel by about 90%.

## Fonts

The fonts are self-hosted in `app/fonts/` (OFL-licensed) so builds never need to reach Google Fonts. `app/fonts/og/` holds static TTF copies for the share-preview image renderer, which can't read woff2.
