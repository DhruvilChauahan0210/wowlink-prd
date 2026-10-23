"use client";

import type { CSSProperties } from "react";
import { SHARE_CHANNELS, dayKey, lastDays, percent } from "../../lib/insights";
import { formatInvitationDate, formatShortDay } from "../../lib/invitations";
import type { Experience, Rsvp } from "../../lib/store";
import { useHostText } from "../../ui/host-lang";

const DAY_MS = 86_400_000;

/**
 * How an invitation is doing: how many people opened it, played the opening and replied, visits from the QR code,
 * visits over the last two weeks, and how the host has shared it. Plain counts (see insights.ts).
 */
export function Insights({ experience, rsvps }: { experience: Experience; rsvps: Rsvp[] }) {
  const h = useHostText();
  // Made before WowLink counted visits, and not visited since: say so, rather than "no visits yet".
  if (!experience.stats) return <>
    <p className="manage-muted">{h.countingNew}</p>
    <p className="manage-muted manage-insights-note">{h.insightsNote("")}</p>
  </>;
  const stats = experience.stats;
  // Replies compared with people counted over the same time (counting may have started after replies came in).
  const repliedSince = rsvps.filter(r => r.createdAt >= stats.since).length;
  const days = lastDays(14, Date.now());
  const counts = days.map(day => stats.days[day] ?? 0);
  const top = Math.max(1, ...counts);
  // Invitations made before counting existed say when it started.
  const startedLate = Date.parse(stats.since) - Date.parse(experience.createdAt) > DAY_MS;
  const since = startedLate ? formatInvitationDate(dayKey(Date.parse(stats.since)), true, h.lang) : "";
  const shares = SHARE_CHANNELS.filter(channel => stats.shares[channel]).map(channel => `${h.shareNames[channel]} ${stats.shares[channel]}`);

  return <>
    {stats.views === 0 ? <p className="manage-muted">{h.noVisitsYet}</p> : <>
      <dl className="manage-insights">
        <div><dt>{h.peopleOpened}</dt><dd>{stats.visitors}</dd><span>{h.visitsN(stats.views)}</span></div>
        <div><dt>{h.playedOpening}</dt><dd>{stats.played}</dd>{stats.visitors > 0 && <span>{h.ofThem(percent(stats.played, stats.visitors))}</span>}</div>
        <div><dt>{h.repliedLabel}</dt><dd>{rsvps.length}</dd>{stats.visitors > 0 && <span>{h.ofThem(percent(repliedSince, stats.visitors))}</span>}</div>
        {stats.viaQr > 0 && <div><dt>{h.fromQr}</dt><dd>{stats.viaQr}</dd><span>{h.qrVisits(stats.viaQr)}</span></div>}
      </dl>
      <figure className="manage-chart">
        <figcaption>{h.visitsChart}</figcaption>
        <ol>{days.map((day, i) => <li key={day} style={{ "--bar": `${(counts[i] / top) * 100}%` } as CSSProperties} className={counts[i] ? "" : "is-empty"}>
          <span className="studio-sr-only">{h.chartDay(formatShortDay(day, h.lang), counts[i])}</span>
        </li>)}</ol>
        <div className="manage-chart-axis" aria-hidden="true"><span>{formatShortDay(days[0], h.lang)}</span><span>{formatShortDay(days.at(-1)!, h.lang)}</span></div>
      </figure>
    </>}
    <p className="manage-shared">{shares.length ? `${h.sharedIt} ${shares.join(" · ")}` : h.notSharedYet}</p>
    <p className="manage-muted manage-insights-note">{h.insightsNote(since)}</p>
  </>;
}
