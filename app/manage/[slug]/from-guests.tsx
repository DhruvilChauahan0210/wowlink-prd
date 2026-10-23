"use client";

import { DIETS } from "../../lib/extras";
import type { Experience, Rsvp } from "../../lib/store";
import { useHostText } from "../../ui/host-lang";

/**
 * What guests said besides "coming": food needs as counts for the caterer (households and people), the songs they
 * asked for, and the poll's results. Only from replies that are coming or maybe.
 */
export function FromGuests({ experience, rsvps, pro }: { experience: Experience; rsvps: Rsvp[]; pro: boolean }) {
  const h = useHostText();
  const coming = rsvps.filter(r => r.attendance !== "Not attending");
  const diets = DIETS.map(diet => {
    const replies = coming.filter(r => r.diet?.includes(diet));
    return { diet, households: replies.length, people: replies.reduce((n, r) => n + r.guestCount, 0) };
  }).filter(d => d.households > 0);
  const notes = coming.filter(r => r.dietNote).map(r => ({ id: r.id, who: r.name, note: r.dietNote! }));
  const songs = coming.filter(r => r.song).map(r => ({ id: r.id, who: r.name, song: r.song! }));
  const poll = pro ? experience.poll : null;
  const votes = poll ? poll.options.map((_, i) => coming.filter(r => r.pick === i).length) : [];
  const total = votes.reduce((a, b) => a + b, 0);

  return <div className="manage-extras">
    {experience.askDiet && <div>
      <h3>{h.foodNeeds}</h3>
      {diets.length ? <ul className="manage-extras-list">{diets.map(d => <li key={d.diet}><strong>{h.dietNames[d.diet]}</strong><span>{h.dietCount(d.households, d.people)}</span></li>)}</ul> : <p className="manage-muted">{h.noFoodNeeds}</p>}
      {notes.length > 0 && <><h4>{h.foodNotes}</h4><ul className="manage-extras-notes">{notes.map(n => <li key={n.id}>{n.who && <strong>{n.who}: </strong>}{n.note}</li>)}</ul></>}
    </div>}
    {pro && experience.askSong && <div>
      <h3>{h.songsHeading}</h3>
      {songs.length ? <ul className="manage-extras-notes">{songs.map(s => <li key={s.id}>{s.song}{s.who && <span className="manage-muted"> · {s.who}</span>}</li>)}</ul> : <p className="manage-muted">{h.noSongs}</p>}
    </div>}
    {poll && <div>
      <h3>{h.pollHeading}: {poll.question}</h3>
      <ul className="manage-poll">{poll.options.map((option, i) => <li key={i}>
        <span>{option}</span><span className="manage-muted">{h.answersN(votes[i])}</span>
        <i aria-hidden="true" style={{ width: `${total ? (votes[i] / total) * 100 : 0}%` }}/>
      </li>)}</ul>
    </div>}
  </div>;
}
