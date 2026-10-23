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

- **A hand-drawn product.** There's no photography. Each of the twelve occasions (wedding, engagement, birthday, Garba, baby shower, housewarming, anniversary, grand opening, Diwali get-together, janoi, Satyanarayan katha / puja, naamkaran) has an ink-and-watercolour illustration in `app/ui/art.tsx`. The home page hero is a sketchbook that draws itself.
- **A different opening for each occasion** (`app/ui/openers.tsx`). Untie a kankotri scroll, open a ring box, pull a gift's bow, light a diya so the rangoli blooms, shake a rattle to rock the cradle, lift the latch on a front door, break the seal on a letter, cut a ribbon, light a sparkler so a row of diyas catches, tie the sacred thread, ring a temple bell, or lift a bandhani cloth from the naming thali.
- **Two plans** (`app/lib/plans.ts`, PRD section 7). **Personal** (free) is deliberately small: the four starter occasions (wedding, birthday, Garba, grand opening), one celebration (no schedule), the occasion's own colours, up to 50 replies, no personal invitations, and it comes down 30 days after the day. The **Creator studio** adds every occasion, schedules of up to 10 celebrations, personal invitations, your own colours and hiding "Made with WowLink", song requests and polls, spreadsheet downloads, detailed insights, "Make another like this", up to 1,000 replies (tunable with `NEXT_PUBLIC_WOWLINK_PRO_REPLIES`) and no end date. The server enforces all of it (publishing, editing, personal invitations, replies); the studio and manage page show what's locked and link to pricing. There are no payments yet, so the plan belongs to each invitation and the admin page moves an invitation between plans (or the admin publishes straight into the Creator studio). Invitations made before plans existed keep everything.
- **Creator studio tools.** A free host can **ask for the Creator studio** from the manage page (a note and, optionally, how to reach them); requests appear on the admin page with Approve and Decline, and approving moves that invitation over. **Custom links** (`app/lib/aliases.ts`): `/e/isha-kabir`, lowercase words and numbers, checked against WowLink's own words, rude words (including look-alike digits) and every link ever given out; earlier custom links keep working and a deleted invitation's links are retired. **A planner's brand** (`app/lib/brand.ts`): a studio name, sign-off and logo (PNG, JPEG or WebP up to 150 KB, checked by its first bytes; never SVG) at the bottom of the invitation, savable as a brand kit on the planner's device. **Client previews**: while editing, "Share a preview with your client" makes a link (`/p/<token>`, 14 days, noindex) showing the invitation as it will be; the client answers "Looks good" or asks for changes, and the studio shows the answer. Showing wishes on the invitation and "Remind everyone who hasn't replied" (one WhatsApp message after another) are Creator studio too.
- **Guest extras** (`app/lib/extras.ts`): with the reply, guests can be asked about food needs (Jain, Swaminarayan, no onion or garlic, vegan, something else, plus a note; free), a song request and the host's own poll (Creator studio). The manage page's "From your guests" card counts food needs by households and people for the caterer, lists the songs and shows the poll; the replies spreadsheet gets their columns.
- **The studio** (`/create`): edit the details with a live preview, then publish. Under "On the invitation" a host can turn replies off (an announcement), hide the countdown, and paste a Google Maps link to the exact gate (only Google Maps links are accepted). "Make another like this" on the manage page or My invitations starts a new invitation from an existing one: same drawing, colours, words and schedule, without its guests or replies.
- **Publishing:** a short public link (`/e/<slug>`), with sharing by link, WhatsApp, the native share sheet or a printable QR code. Each link gets its own share preview image for WhatsApp and social apps.
- **Guests** open the link, play the opening, see a countdown, add the event to their calendar (Google or `.ics`), and RSVP without an account. With a schedule, they tick which celebrations they're coming to, and can give a different number of people for each.
- **Blessings and wishes.** Guests can leave a wish with their reply. The host sees them all on the manage page and can show them on the invitation as taped, hand-written notes, hiding any one. Only the name a guest typed goes with their wish, and the form tells guests whether the hosts alone will read it.
- **English, Gujarati and Hindi.** Everything below that says Gujarati works the same way in Hindi: guest pages, the host's screens, dates ("8 नवंबर 2026", "शाम 6:00 बजे"), WhatsApp messages, the share image, help, pricing and privacy. Hindi uses Noto Serif Devanagari and Kalam (self-hosted). Each switch shows the other two languages, each in its own script.
- **Gujarati and English.** In the studio the host picks the language guests see first; each guest can switch with the toggle in the header, and their choice is remembered on their phone. Dates and times are written the Gujarati way ("8 નવેમ્બર 2026", "સાંજે 6:00 વાગ્યે"), WhatsApp messages follow the invitation's language, and handwritten touches use Farsan for Gujarati. Hosts can use the studio, the manage page and My invitations in Gujarati too, with their own switch (remembered on their device, and separate from the language guests read).
- **Your own colours.** In the studio the host can keep the occasion's colours, pick one of seven palettes (sindoor, marigold, rani pink, peacock, mehndi, indigo, kesar) or choose any colour of their own. The colours tint the handwriting, underlines, the countdown circle, the timeline and the little doodles; the illustrations keep their watercolours. Each colour is checked for contrast (`app/lib/palette.ts`), and one that's too pale or too dark is deepened or lightened until it can be read on paper and on the dark section. The link preview image uses it too.
- **On the day, and after.** When a celebration is today, the invitation leads with it: what's still to come or happening now, with directions. Once everything is over, it becomes a thank-you: the host's note (written in the studio) in place of the reply form, with the blessings wall. Each link only counts its own celebrations.
- **My invitations** (`/mine`): every invitation this device can manage, with replies at a glance, plus drafts. Signed in, the account's invitations come to this device too. It can also save all your manage links to a small private file, and add invitations from a pasted link or that file.
- **Accounts** (`/signin`): hosts sign in with Google (Supabase Auth) to publish. A host's free plan has one live invitation at a time. Signing in on another phone gives that phone its own manage key for each of the host's invitations, so manage pages work as before; invitations a device already had (from before accounts, or published by WowLink for a client) join the account.
- **Personal invitations** (`/e/<slug>/<id>`): a link for one household ("the Patel family"). It opens addressed to them and shows only the celebrations the host picked. The household has one reply, which they can change later. The general link can also be limited, for example to the reception only. Celebrations a link doesn't show never reach that browser: not in the page, the calendar file or the share image.
- **The manage page** (`/manage/<slug>#k=…`): a private link for reply totals, the headcount for each celebration, who hasn't replied, personal invitations, editing, and unpublishing. You can add invitations one at a time or paste a whole list (one household per line, optionally with a WhatsApp number), then preview, send, remind, replace a link or remove each one. With a number, WhatsApp opens that family's chat directly. Each household shows whether they've opened their link yet ("Opened 22 Oct · no reply yet"), counted from real visits only, not link previews. Numbers are only ever shown to the host. Everything can be downloaded as a spreadsheet: every reply, the headcount per celebration for the caterer, and the invitation list with links.
- **Deleting.** On the manage page a host can delete a single reply (when a guest asks to be taken off), or the whole invitation with every reply, wish, household and number in it. Both ask first; deleting the invitation offers to download the replies, then takes it off My invitations on that device. Only a deleted invitation's slug is kept, so its old link can never open someone else's invitation.
- **How it's doing.** The manage page shows how many people opened the invitation, how many played the opening and replied, visits from the printed QR code, visits over the last two weeks, and how the host shared it (WhatsApp, copied link, QR code, personal links). These are plain daily counts (`app/lib/insights.ts`), reported by the page once it runs, so link previews don't count, and a browser where the host has opened their manage page isn't counted. A browser remembers it has been counted, so each browser counts once. No cookies, no outside analytics, and nobody is identified.
- **Reports and taking down.** Every invitation has a "Report" link in its footer (`/report/<slug>`, in the guest's language). A report keeps the reason and what was written, never who sent it, and one address can send five an hour. WowLink's admin (`/admin`, opened with `WOWLINK_ADMIN_KEY`) lists reported invitations, most reported first. From there you can take one down, restore it, dismiss its reports, or find any invitation by its link. A taken-down invitation can't be opened, replied to or republished; its host sees why on their manage page and keeps their replies. The admin also shows the app's numbers over 7, 30 or 90 days: occasion pages, samples, studio visits, invitations published by occasion, visits, people, openings, replies, "Create yours free" clicks, sharing, reports and take-downs.
- **Help and pricing** (`/help`, `/pricing`, each also `?lang=gu` and `?lang=hi`): the questions hosts ask, answered from how the app works today; and the two plans from the PRD, with the Creator studio shown as coming (nothing can be bought yet).
- **Accessibility.** Each opening is a real button whose name includes the words shown under it ("untie the knot"); opening moves focus to the card and replaying moves it back to the opener; the scene is tagged with its own language; reduced motion skips the animations; faint text and placeholders meet 4.5:1 contrast.
- **Privacy** (`/privacy`, `/privacy?lang=gu`, `/privacy?lang=hi`): what WowLink keeps, who sees it, that a link isn't a lock, and how things are deleted, in plain English and Gujarati. Guests reach it from the reply form and the invitation's footer, in their language; hosts from the manage page.
- **Occasion pages for search** (`/templates/<occasion>`): each occasion has its own page with a sample that opens right there, what it's good for, what guests get, and a few questions answered, written for searches like "Garba invitation maker online" or "Gujarati wedding invitation website" (`app/lib/occasion-pages.ts`). Each has its own share card. `sitemap.xml` lists the home page, the occasions, their pages and the privacy page; `robots.txt` keeps crawlers out of the API and the hosts' pages. Invitations, the studio, the manage pages and My invitations all carry `noindex`.

## Tests

```bash
npm test
```

Playwright runs the unit and end-to-end tests against a production build on port 3100, with its own build folder and data file, so a running `npm run dev` isn't affected. `npm run test:pg` runs the same tests against Postgres instead: a throwaway in-memory one (PGlite, `scripts/test-db.mjs`), so no Supabase project is needed. GitHub Actions runs both on every push to `main` (`.github/workflows/test.yml`). If a run fails, its report is attached to the run.

## Configuration

Copy `.env.example` to `.env.local` and fill it in.

| Variable | Used for |
|---|---|
| `WOWLINK_ADMINS` | The Google accounts (emails, comma-separated) that open the admin page (`/admin`) when signed in. |
| `WOWLINK_ADMIN_KEY` | A key that also opens the admin page: for `npm run dev` (any key works there) and the tests. A live site needn't have one; if it does, it needs at least 24 characters (`openssl rand -hex 24`). Ten wrong keys from one address lock that address out for an hour. |
| `DATABASE_URL` | Postgres on Supabase (see Database below). Without it the data stays in `.data/wowlink.json`. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Accounts (Supabase Auth): the project's address and its publishable key (public by design). Without them there are no accounts. |
| `NEXT_PUBLIC_SITE_URL` | The public address, for absolute links in share previews, canonical links, `sitemap.xml` and `robots.txt` (for example `https://wowlink.example`). Defaults to the Vercel production URL when deployed there, and `http://localhost:3000` otherwise. |

## Database

Everything goes through `app/lib/store.ts`, which holds the rules (who may change what, limits, links). Where the data lives depends on `DATABASE_URL`:

- Not set: one JSON file, `.data/wowlink.json` (`app/lib/store-file.ts`). Good for your own computer; it won't persist on serverless hosting.
- Set: Postgres on Supabase (`app/lib/store-pg.ts`). Each call loads only what it needs, a change runs in one transaction that locks its invitation (so two guests replying at once can't undo each other), and only what changed is written. Links are unique across the app by a primary key, so two hosts can't take the same custom link even at the same moment.

The tables are in their own `wowlink` schema (`supabase/migrations/`), which Supabase's Data API doesn't serve, with row level security on and nothing granted to Supabase's public roles: the app's server is the only way in. Each row keeps its object as a JSON document, the same shape as the file.

To switch a copy of WowLink to Supabase:

```bash
npm run db:migrate
npm run db:import -- .data/wowlink.json
```

The first sets up the tables (safe to run again). The second, optional, copies a JSON data file into an empty database; the file itself isn't changed. Both read `DATABASE_URL` from `.env.local`.

## Going live (Vercel)

The site runs on Vercel (https://wowlink-one.vercel.app), its functions in Mumbai (`vercel.json`) beside the Supabase database. On Vercel the app refuses to start without `DATABASE_URL`, since Vercel doesn't keep files. Set these in the Vercel project (Production): `DATABASE_URL`, `WOWLINK_ADMINS` (the Google accounts that open `/admin`), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `NEXT_PUBLIC_SITE_URL` defaults to the production address. A live site needs no `WOWLINK_ADMIN_KEY`.

Only what passes goes live. Vercel doesn't deploy pushes to `main` itself (`vercel.json`); GitHub Actions runs both test runs, then builds and deploys to production and checks the live site (`.github/workflows/test.yml`). That needs a Vercel token as the repository secret `VERCEL_TOKEN`. A new migration is applied before pushing it (`npm run db:migrate`, or `supabase db push --linked`), so the new code finds its tables.

Every 30 minutes `.github/workflows/health.yml` checks the live site: its pages answer, `/api/health` says the database is up, and there were no server errors in the last hour. Server errors are recorded by `instrumentation.ts` and listed on the admin page. A failed check is emailed by GitHub.

In Supabase (Authentication), kept in `supabase/config.toml` and sent with `supabase config push` (except Google's client secret, which goes in the dashboard):
- URL configuration: the Site URL is the live address; Redirect URLs include `https://<live address>/**` and `http://localhost:3000/**`.
- Providers: Google only, with a client from Google Cloud (its redirect URI is `https://<project>.supabase.co/auth/v1/callback`). Email sign-in is off (`supabase/config.toml`), so no email provider is needed.

The tests never use `.env.local`'s database or Supabase project: `playwright.config.ts` blanks them, and signs hosts in with a test header (`WOWLINK_TEST_AUTH`), which is refused on Vercel's production.

## Current limits

- Without `DATABASE_URL`, data is in a local JSON file that won't persist on serverless hosting; set it (Supabase) before going live.
- The admin's lists and numbers load every invitation; fine for now, worth turning into SQL counts as the app grows.
- Without Supabase's address and publishable key there are no accounts, and anyone can publish (fine on your own computer).
- Without a database, rate limits are in memory, for one server process; with one, they're shared in Postgres.
- Times are read as India Standard Time for the countdown and calendar files.
- The reply limits count every general-link reply plus one place kept for each personal invitation, so an invited household can always reply.
- The free plan's one live invitation is counted per account. The Creator studio's 20 live invitations and 5,000 replies a month (PRD) aren't counted yet, and the Creator studio still belongs to each invitation until payments exist.
- Subscriptions, analytics and the free plan's 60-day expiry aren't built yet.
- The PRD puts custom colours in the paid plan. Until plans exist, every host has them.
- Each counted visit rewrites the JSON file (or, on Supabase, the invitation's row). Fine at this size; very busy invitations would want their counts in rows of their own.
- The privacy page describes the app as it is today (Supabase and Vercel in Mumbai, accounts). Before launch it still needs a proper review: how long things are kept, what the hosting providers log, and consent.

## Performance on phones

The drawings get their hand-made look from SVG paint filters (the watercolour wash and the ink wobble), which are costly to repaint. Three rules keep phones smooth:

- **Drawings that don't animate are images.** The reel, the catalogue, the studio tiles and the manage page use `/art/<name>.svg` (prerendered, `ArtImage`). A browser paints an image once; inline SVG with filters is repainted whenever it moves or scales.
- **Ink draws itself "on twos"**, about 12 frames a second, like hand animation.
- **The boiling ink on the home page sketch is only for devices with a mouse.** Phones get the same sketch with still ink.

Measured headless at phone size with a 6× slower CPU, these cut paint work while an invitation opens by about 60%, on the home page at rest by about 70%, and while scrolling the occasion reel by about 90%.

## Fonts

The fonts are self-hosted in `app/fonts/` (OFL-licensed) so builds never need to reach Google Fonts. `app/fonts/og/` holds static TTF copies for the share-preview image renderer, which can't read woff2.
