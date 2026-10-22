"use client";

import { useState } from "react";

export function HeroDemo() {
  const [opened, setOpened] = useState(false);
  const [rsvp, setRsvp] = useState(false);

  return <div className="phone-stage">
    <div className="phone-halo"/>
    <div className="phone-shell">
      <div className="phone-screen">
        <div className="phone-status"><span>9:41</span><span>••• &nbsp;◖ &nbsp;▰</span></div>
        {!opened ? <div className="phone-cover">
          <span className="phone-kicker">A LITTLE SOMETHING SPECIAL</span>
          <svg className="phone-flower" viewBox="0 0 120 90" aria-hidden="true"><path d="M60 72C34 54 33 38 46 34c7-2 13 2 14 8 1-6 7-10 14-8 13 4 12 20-14 38Z"/><path d="M25 68C9 50 14 40 24 43c6 2 7 7 5 12 5-4 11-2 11 4 0 7-7 10-15 9Zm70 0c16-18 11-28 1-25-6 2-7 7-5 12-5-4-11-2-11 4 0 7 7 10 15 9ZM60 24V13m-6 6 6-6 6 6"/></svg>
          <span className="phone-overline">WITH FULL HEARTS & OPEN ARMS</span>
          <h2>Aarav <i>&</i><br/>Meera</h2>
          <span className="phone-caption">INVITE YOU TO CELEBRATE</span>
          <span className="phone-date">08 NOVEMBER · SURAT</span>
          <button className="phone-action" onClick={() => setOpened(true)}>OPEN YOUR INVITATION <span>↓</span></button>
        </div> : <div className="phone-details">
          <span className="phone-detail-kicker">SUNDAY · 08 NOVEMBER 2026</span>
          <div className="phone-detail-flower">✿</div>
          <h2>We saved you<br/>a seat.</h2>
          <p>Join us for an evening of good food, happy tears, and the start of forever.</p>
          <div className="phone-venue"><span>THE GARDEN HOUSE</span><b>SURAT, GUJARAT</b></div>
          <button className={`phone-action${rsvp ? " phone-action-done" : ""}`} onClick={() => setRsvp(true)}>{rsvp ? "YOU’RE ON THE LIST ✓" : "JOYFULLY ACCEPT"}</button>
          <button className="phone-back" onClick={() => { setOpened(false); setRsvp(false); }}>BACK TO INVITATION</button>
          <span className="phone-live" aria-live="polite">{rsvp ? "Aarav & Meera can’t wait to see you." : ""}</span>
        </div>}
        <div className="phone-home-indicator"/>
      </div>
    </div>
    <div className="phone-note phone-note-top"><span className="note-icon">↗</span><span><b>A little invite</b><br/>with a lot of feeling</span></div>
    <div className="phone-note phone-note-bottom"><span className="note-dot"/><span>MADE FOR YOUR<br/><b>BIG LITTLE DAY</b></span></div>
    <span className="phone-spark phone-spark-one">✳</span><span className="phone-spark phone-spark-two">✦</span>
  </div>;
}
