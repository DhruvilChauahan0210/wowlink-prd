# WowLink Product Requirements Document

**Product:** WowLink (working title)  
**Tagline:** Don’t Just Invite. Create an Experience.  
**Document version:** 1.0  
**Status:** MVP planning  
**Initial market:** South Gujarat, India  
**Expansion market:** Pan-India  
**Business model:** Freemium with a ₹1,999/month Professional plan  
**Platform:** Responsive web application  

---

## 1. Executive summary

WowLink lets people create and share interactive, browser-based experiences for occasions such as weddings, birthdays, Garba celebrations, and grand openings. A creator chooses a template, adds event information and personal touches, previews the result, and publishes a shareable link. Guests can interact with the experience and RSVP without creating an account.

The MVP focuses on four interactive templates, a no-code editor, publishing and sharing, guest RSVPs, a creator dashboard, and a self-service Professional subscription. Free experiences support product discovery through unobtrusive WowLink attribution. Professional features serve creators who produce experiences repeatedly for clients.

The product should be inexpensive to operate: templates and browser-side animation are preferred over generated video or bespoke experiences. The initial validation market is South Gujarat, with Gujarati and English support first and expansion to additional Indian languages in later phases.

## 2. Product vision and positioning

### Vision

Make it easy for anyone to turn a special occasion into a memorable interactive experience, without coding or design skills.

### Problem

Traditional image and video invitations are difficult to update after sharing, offer limited interaction, and leave RSVP coordination to separate conversations. A custom invitation website typically requires a designer. Professional creators also need repeatable workflows, client branding, and a way to manage multiple events.

### Solution

WowLink provides reusable interactive templates, a form-based editor, public event pages, sharing tools, and RSVP management. Professionals can pay for higher usage limits, branding controls, client review, and analytics.

### Value propositions

- **Consumers:** Create and share a beautiful interactive occasion website for free.
- **Professionals:** Build branded experiences for multiple clients and manage them in one self-service platform.

### Primary differentiator

WowLink is an interactive occasion experience builder, rather than a static invitation generator. Its value comes from the interactive moment, personalisation, guest engagement, and ease of sharing.

## 3. Goals, non-goals, and validation

### Business objectives

1. Provide self-service creation without manual onboarding.
2. Make the free tier useful and shareable enough to drive discovery.
3. Convert frequent creators to the Professional plan at ₹1,999/month.
4. Build organic acquisition through useful, indexable template and landing pages.
5. Keep infrastructure and processing costs low through reusable templates and browser-side animation.

### Initial validation targets

These are targets for product validation, not forecasts or guarantees.

- At least 30% of users who start creating an experience successfully publish one.
- At least 50% of published experiences are shared using the product’s sharing tools.
- Establish measurable traffic from shared experiences and search.
- Acquire the first 10 paying Professional subscribers without direct sales outreach.

### Out of scope for the MVP

- AI video generation or generative AI on ordinary guest visits
- Full 3D venue experiences
- Native Android or iOS applications
- Automated WhatsApp messaging
- Wedding vendor marketplace, ticketing, or ticket payments
- Guest photo uploads or public photo walls
- Complex agency permissions and multi-user collaboration
- Custom domains per event
- Advanced timeline or animation editors

These may be reconsidered when usage evidence supports the added product and operating costs.

## 4. Users and needs

### Free consumer creators

People organising birthdays, anniversaries, weddings, engagements, baby showers, college events, Navratri/Garba celebrations, or shop openings.

**Need:** Make something distinctive without paying or installing an app.

### Professional creators

Freelance invitation designers, wedding and event planners, social media agencies, photographers, event management companies, and small creative studios.

**Need:** Reuse templates, serve several clients, apply their own branding, and manage event experiences and engagement in one place.

### Guests

Recipients opening an event link on a phone or desktop browser.

**Need:** Understand the event, enjoy the interaction, find venue details, and RSVP with minimal friction and no account requirement.

## 5. User journeys

### Consumer creator

1. Find WowLink through search or a shared experience.
2. Browse and preview templates without signing in.
3. Select an occasion template and enter event details, imagery, colours, language, and a personal message.
4. Preview and refine the experience.
5. Create an account when saving or publishing.
6. Publish and receive a unique URL.
7. Share through WhatsApp, Instagram, QR code, or another channel.
8. Review guest RSVPs in the dashboard.

### Professional creator

1. Discover WowLink and try the free editor.
2. Subscribe through online checkout.
3. Create client experiences using reusable templates and brand presets.
4. Share a review link with the client and publish the approved experience.
5. Monitor engagement and export RSVP data.
6. Reuse templates and presets for future clients.

### Guest

1. Open a shared link in a browser.
2. Interact with the template and review event details.
3. Open the venue map link or countdown details as needed.
4. Submit an RSVP without creating an account.
5. Optionally follow the WowLink attribution link to create an experience.

## 6. MVP scope and requirements

Priority labels: **P0** means required for the MVP. The requirements below retain the supplied MVP scope; implementation sequencing is described in Section 12.

### 6.1 Template gallery — P0

Users can browse templates without authentication. Starter categories:

- Wedding
- Birthday
- Garba/Navratri
- Grand Opening

**Acceptance criteria**

- Gallery works on mobile and desktop.
- Each template has a working interactive preview available without authentication.
- Users can begin editing a selected template in one action.
- Each template has a dedicated, indexable landing page.

### 6.2 No-code experience editor — P0

Creators can configure:

- Event title and host names
- Date and time
- Venue name and Google Maps link
- Invitation description
- Cover image
- Theme colours
- Language
- RSVP availability
- Countdown visibility

**Acceptance criteria**

- A creator can configure a complete event using form inputs without writing code.
- Changes update the preview immediately.
- Valid changes persist after saving.
- Publishing rejects missing mandatory information.
- Editing can begin before signup; an account is required to save or publish.

### 6.3 Interactive experience engine — P0

| Template | Signature interaction |
|---|---|
| Wedding | Tap to open animated doors |
| Birthday | Scratch or tap to reveal a surprise |
| Garba/Navratri | Tap to animate dandiya sticks |
| Grand Opening | Tap to cut a ribbon |

Use CSS, SVG, and GSAP for browser-side effects rather than costly AI video generation.

**Acceptance criteria**

- Interactions work on touchscreens.
- Event information remains understandable if animations fail.
- The experience respects reduced-motion preferences.
- No application installation is required.

### 6.4 Publishing and sharing — P0

Publishing creates a unique URL, for example `wowlink.example/e/7fK29p`. The domain is illustrative; availability has not been checked.

Creators can copy and open the link, generate a QR code, or start a WhatsApp share. Browser-native sharing should be used where available. Published information can be edited or unpublished by its owner. Personal event pages are excluded from search indexing by default.

**Acceptance criteria**

- Every published experience has a unique URL and is available on mobile browsers.
- Owners can edit event information and unpublish their experiences.
- Private event pages are excluded from search indexing by default.
- Sharing is user-initiated; no paid messaging API is required for the MVP.

### 6.5 Guest RSVP — P0

Guests may respond **Attending**, **Not Attending**, or **Maybe**. Guest name and attendee count are optional fields. Organisers can review response totals and details in their dashboard.

**Acceptance criteria**

- Guests can respond without authentication.
- Responses are associated with the correct experience.
- Organisers can view response summaries.
- RSVP endpoints have basic spam protection and rate limits.

### 6.6 Authentication and creator dashboard — P0

Users can create accounts, sign in and out, view their experiences, create/edit/duplicate/delete experiences, see publication status, and review subscription status. Account creation is required to save or publish an experience.

### 6.7 Subscription and payments — P0

Offer a self-service Professional subscription through an Indian payment provider that supports the selected recurring payment method.

Required capabilities:

- Professional checkout
- Server-verified payment status
- Subscription activation, renewal, cancellation, and failure states
- Plan-based feature restrictions
- Billing history
- Subscription management and cancellation

Paid features must never be enabled solely because the client reports payment success. Subscription entitlements must be based on verified server-side provider status.

### 6.8 Basic administration — P0 for launch operations

Provide an internal interface for template management, abusive-content removal, account support, subscription status inspection, and aggregate product metrics.

## 7. Plans and limits

| Capability | Free | Professional |
|---|---:|---:|
| Price | ₹0 | ₹1,999/month |
| Active published experiences | 1 | Up to 20 |
| Starter templates | 4 | 4 plus available Pro features |
| Personalisation | Basic | Custom colours, logos, and branding |
| WowLink attribution | Visible | Removable |
| RSVP functionality | Included; up to 100 submissions per event | Up to 5,000 RSVP submissions per billing month |
| Shareable URL and QR code | Included | Included |
| Hosting | Expires after 60 days unless republished within available limits | Within active experience limits |
| Brand presets | — | Included |
| Experience duplication | — | Included |
| Client preview and review links | — | Included |
| Engagement statistics | Basic | More detailed |
| RSVP CSV export | — | Included |
| Support | Standard self-service | Priority support |

Limits are adjustable after usage and cost data are collected. The precise enforcement and user experience for expiry, republishing, and monthly RSVP caps should be finalised before launch implementation.

### Future monetisation (not MVP)

Consider a one-time consumer upgrade, tentatively ₹399–₹699, for premium branding or extended hosting. Launch only after testing willingness to pay.

## 8. Public pages and authenticated areas

### Public pages

| Page | Purpose |
|---|---|
| Homepage | Explain WowLink and show an interactive demo |
| Explore Templates | Browse occasion categories |
| Template Detail | Preview a template and start editing |
| Pricing | Compare Free and Professional |
| Published Experience | Guest-facing interactive event |
| Login / Signup | Authentication |
| Help / FAQ | Self-service support |

### Authenticated pages

| Page | Purpose |
|---|---|
| Dashboard | Manage experiences |
| Experience Editor | Create and customise |
| RSVP Dashboard | Review guest responses |
| Analytics | Review engagement metrics |
| Brand Presets | Manage professional branding |
| Billing | Manage subscription and billing history |
| Account Settings | Manage profile and preferences |

## 9. Growth and discovery

### Product attribution

Free experiences display a small, unobtrusive **“Made with WowLink · Create Yours Free”** link. It leads to a relevant template landing page or creation flow.

### Sharing

Support WhatsApp sharing, link copying, QR-code generation, and browser-native sharing where available. Sharing is user-initiated.

### Search acquisition

Create useful, indexable template pages and examples for candidate searches such as:

- Gujarati wedding invitation website maker
- Free interactive birthday invitation
- Garba invitation maker online
- Digital grand opening invitation
- Online engagement invitation maker

These are keyword candidates to validate, not confirmed search-volume opportunities. Publish useful previews and examples rather than mass-generated keyword pages.

### Geographic and language expansion

- **Phase 1:** Gujarati and English; Surat, Navsari, Valsad, and Vapi.
- **Phase 2:** Hindi support and broader Indian occasion templates.
- **Phase 3:** Additional regional languages and professional creator partnerships.

## 10. Technical approach

Recommended architecture, subject to validation against deployment requirements and current provider limits:

| Layer | Candidate technology |
|---|---|
| Frontend | Next.js with React |
| Styling | Tailwind CSS |
| Animation | GSAP, CSS, and SVG |
| Backend | Next.js server routes |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Payments | Razorpay or equivalent Indian provider |
| Hosting | Cloudflare-compatible hosting or Vercel |
| Analytics | Privacy-conscious first-party event tracking |

Hosting selection should account for actual Next.js deployment requirements and free-tier limits. Payment provider and recurring payment method remain to be selected. Jev integration is optional and is not an MVP dependency.

### Core data entities

| Entity | Key fields |
|---|---|
| User | ID, email, name, created date |
| Subscription | User ID, plan, provider subscription ID, status, renewal date |
| Template | ID, category, name, version, configuration schema |
| Experience | ID, owner ID, template ID, title, JSON content configuration, language, public slug, status, created/updated/expiry dates |
| RSVP | ID, experience ID, guest name, attendance status, guest count, submitted date |
| Experience analytics | Experience ID, event type, timestamp, anonymous session identifier where appropriate |
| Professional brand preset | User ID, brand name, logo, colours |

### Cost and implementation principles

- Use reusable templates rather than unique generated videos.
- Run visual effects in the browser.
- Prefer SVG illustrations and compressed WebP images.
- Avoid generative AI inference during ordinary event views.
- Use pre-filled WhatsApp share links rather than automated messaging.
- Restrict upload file types, dimensions, and sizes.
- Cache public experience assets.
- Begin on suitable free tiers and monitor resource consumption.
- Use a schema-driven editor to reduce duplicated form logic.

## 11. Non-functional requirements

### Performance

- Mobile-first responsive design.
- Target main experience loading within 3 seconds at the 75th percentile on representative mobile connections.
- Lazy-load images and animations.
- Support low- and mid-range Android devices.

### Accessibility

- Keyboard navigation for primary controls.
- Legible text and sufficient contrast.
- Respect reduced-motion preferences.
- Provide a usable fallback for scratch/reveal interactions.

### Security

- Enforce permissions on the server.
- Use Supabase row-level security.
- Validate subscriptions server-side.
- Rate-limit RSVP and publishing endpoints.
- Restrict executable content and unsafe links.
- Validate uploads securely.

### Privacy

- Collect only RSVP information needed for the event.
- Explain guest-data handling to organisers.
- Provide a clear privacy policy and deletion controls.
- Make clear that a shareable event link is not secure private access.
- Disable search indexing for personal event pages by default.
- Review consent and retention requirements before production launch.

## 12. Delivery roadmap

The following four-sprint sequence is indicative. Actual timing depends on developer availability, polish, and payment integration complexity.

| Sprint | Focus | Deliverables |
|---|---|---|
| 1 — Foundation | Application and data foundation | Next.js project, Supabase configuration, homepage, template gallery, authentication, template JSON configuration |
| 2 — Interactive builder | Creation and previews | Experience editor, four templates, colour/content customisation, preview, draft saving |
| 3 — Publishing and sharing | Guest experience and management | Public URLs, guest-facing pages, WhatsApp sharing, QR codes, RSVPs, basic dashboard |
| 4 — Monetisation and launch | Paid plan and readiness | Subscription checkout and webhooks, Free/Pro limits, professional branding, basic analytics, SEO pages, mobile/privacy/security readiness |

## 13. Analytics and success metrics

| Funnel area | Measures |
|---|---|
| Acquisition | Organic search impressions/clicks; visits from attribution links; visits from social sharing |
| Activation | Template previews; editor starts; experiences published; time to first publish |
| Engagement | Unique experience visitors; interaction completions; RSVP completion rate; share-button clicks |
| Revenue | Free-to-Pro conversion; monthly recurring revenue; churn; revenue per Professional subscriber; estimated serving cost per event |
| Viral growth | Attribution clicks; creator registrations from shared experiences; new published experiences attributable to those registrations |

Do not assume a fixed number of new users per shared event. Measure the referral funnel.

## 14. Release acceptance criteria

The MVP is ready for public testing when:

- [ ] A new user can create an experience without programming or design skills.
- [ ] Four templates work on common mobile browsers.
- [ ] Every published experience has a valid shareable link.
- [ ] Guests can open and interact with experiences without signing in.
- [ ] RSVP responses work reliably.
- [ ] Free-plan usage limits are enforced.
- [ ] A professional can upgrade and pay through the website.
- [ ] Paid features activate only after payment status is verified server-side.
- [ ] Users can cancel or manage subscriptions.
- [ ] Creators can delete their experiences.
- [ ] The public website has a sitemap and required search metadata.
- [ ] Basic moderation and anti-spam controls are operational.
- [ ] Product analytics are recorded and can be inspected.

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Users enjoy the product but do not pay | Focus Professional features on repeat creators |
| High traffic produces little revenue | Cache experiences and limit file storage |
| Competitors offer similar templates | Emphasise delightful interactions and instant self-service |
| Search visibility is limited | Combine search pages with attribution and social sharing |
| Professional plan feels too expensive | Test ₹1,999 pricing with real creator usage |
| Consumers use the product once | Consider one-time upgrades later; target repeat professional use for recurring revenue |
| Abusive or misleading event pages | Add moderation, reporting, rate limits, and account controls |

## 16. Future roadmap

### V1.1

- More Gujarati and regional Indian themes
- One-time premium event purchases
- Advanced guest engagement
- Additional professional brand controls

### V2

- AI-assisted invitation copy
- Richer interactive scenes
- Guest polls
- Improved client approval workflows
- Advanced creator analytics

### V3

- Marketplace for professionally designed experiences
- Revenue sharing with template creators
- Multi-language template marketplace
- Agency collaboration features

## 17. Open decisions and launch dependencies

The PRD identifies the following items for validation or implementation planning; it does not claim they have been resolved:

- Verify WowLink name, trademark, and domain availability.
- Select hosting based on the chosen Next.js deployment model and measured limits.
- Select an Indian payment provider and recurring payment method.
- Define mandatory event fields and validation rules for publishing.
- Specify the exact expiry and republishing flow for Free experiences.
- Specify how Professional monthly RSVP limits are counted and what happens at the cap.
- Validate candidate search terms and Professional pricing with real users.
- Review consent, data retention, and deletion requirements before production launch.

## 18. Product rule

Do not introduce expensive generative AI, custom design services, or complex collaboration features until actual usage demonstrates demand.
