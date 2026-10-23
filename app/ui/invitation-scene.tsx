"use client";

import { GUEST_TEXT, OCCASION_GU } from "../lib/i18n";
import { formatEventDay, formatInvitationDate, formatInvitationTime, sortSchedule, type InvitationDraft, type InvitationTemplate, type Lang } from "../lib/invitations";
import { paletteFor, paletteStyle } from "../lib/palette";
import { Art, type ArtName } from "./art";
import { Flower, Star } from "./doodles";
import { OPEN_HINT, Opener, ScrollRod } from "./openers";

type Props = {
  template: InvitationTemplate;
  /** `pending`: the details are being updated, so the date and place are left off. */
  draft: InvitationDraft & { pending?: boolean };
  opened: boolean;
  onOpen: () => void;
  onReplay: () => void;
  onDetails?: () => void;
  compact?: boolean;
  /** Who a personal link is for ("the Patel family"), written on the invitation like an envelope. */
  addressee?: string;
  /** The language to show it in (the draft's own, unless the guest switched). */
  lang?: Lang;
};

/*
 * The guest's invitation. Each occasion opens with its own hand-drawn ritual (see openers.tsx),
 * then the illustrated card comes up in its place.
 */
export function InvitationScene({ template, draft, opened, onOpen, onReplay, onDetails, compact = false, addressee, lang = draft.language ?? "en" }: Props) {
  const t = GUEST_TEXT[lang];
  const words = lang === "gu" ? OCCASION_GU[template.id] : { eyebrow: template.eyebrow, action: template.action, hint: OPEN_HINT[template.id as ArtName] };
  const Title = compact ? "h2" : "h1";
  const long = draft.title.length > 32 ? " is-long" : "";
  const art = template.id as ArtName;
  const city = draft.venue.split(",").at(-1)?.trim() || t.venueFallback;
  const schedule = sortSchedule(draft.events);
  const palette = paletteFor(draft.palette);
  return <section className={`inv-scene inv-${template.id}${opened ? " is-open" : ""}${compact ? " is-compact" : ""}${palette ? " has-palette" : ""}`} style={palette ? paletteStyle(palette) : undefined} aria-label={`${template.category} invitation preview`}>
    <div className="inv-backdrop" aria-hidden="true">
      <Flower className="doodle inv-d1"/><Star className="doodle inv-d2"/><Flower className="doodle inv-d3"/><Star className="doodle inv-d4"/>
    </div>

    <div className="inv-intro" aria-hidden={opened} inert={opened}>
      {addressee && <span className="inv-addressee">{t.addressedTo(addressee)}</span>}
      <span className="inv-overline">{words.eyebrow}</span>
      <Title className={`inv-title${long}`}>{draft.title || t.occasionFallback}</Title>
      {draft.pending ? <span className="inv-date">{t.detailsToFollow}</span> : <span className="inv-date">{formatInvitationDate(draft.date, false, lang)}<i aria-hidden="true">·</i>{city}</span>}
      <Opener name={art} label={words.action} onOpen={onOpen}/>
      <span className="inv-hint">{words.hint}</span>
    </div>

    <article className="inv-card" aria-hidden={!opened} inert={!opened}>
      {art === "wedding" && <ScrollRod/>}
      <div className="inv-card-art"><Art name={art} drawing={opened}/></div>
      <span className="inv-overline">{addressee ? t.addressedTo(addressee) : t.momentComplete}</span>
      <h2 className={`inv-title${long}`}>{draft.title || t.occasionFallback}</h2>
      {draft.message && <p className="inv-revealed-message">{draft.message}</p>}
      {!draft.pending && <div className="inv-revealed-details"><span>{formatInvitationDate(draft.date, true, lang)}{draft.time && ` · ${formatInvitationTime(draft.time, lang)}`}</span><span>{draft.venue || t.venueFallback}</span></div>}
      {schedule.length > 1 && <span className="inv-card-schedule">{t.celebrationsSpan(schedule.length, formatEventDay(schedule[0].date, lang), formatEventDay(schedule.at(-1)!.date, lang))}</span>}
      <button className="cin-cta cin-cta-light inv-open-button" onClick={compact ? onReplay : onDetails}>{compact ? t.watchAgain : t.seeDetails}</button>
    </article>
  </section>;
}
