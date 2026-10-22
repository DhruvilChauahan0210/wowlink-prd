"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { clamp, ease, onSceneFrame, progress, range, sceneNavigate, startSceneScroll } from "./lib/scene-scroll";
import "./cinematic.css";

function Mark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2c0 9-5 14-14 14 9 0 14 5 14 14 0-9 5-14 14-14C21 16 16 11 16 2Z" fill="none" stroke="currentColor" strokeWidth="1.3"/><circle cx="16" cy="16" r="3" fill="currentColor"/></svg>;
}

function NavLink({ id, children, onNavigate }: { id: string; children: React.ReactNode; onNavigate?: () => void }) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); onNavigate?.(); sceneNavigate(id); };
  return <a href={`#${id}`} onClick={go}>{children}</a>;
}

function Chrome() {
  const [open, setOpen] = useState(false);
  return <header className="cin-nav"><NavLink id="top" onNavigate={() => setOpen(false)}><span className="cin-logo"><Mark/>WOWLINK<span className="cin-logo-dot">®</span></span></NavLink><nav aria-label="Main navigation"><NavLink id="occasions">The occasions</NavLink><NavLink id="experience">How it feels</NavLink><NavLink id="plans">The plans</NavLink></nav><Link className="cin-nav-cta" href="/templates">Create your moment <span>↗</span></Link><button className="cin-menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="cin-menu">{open ? "Close −" : "Menu +"}</button><div id="cin-menu" className={`cin-menu${open ? " is-open" : ""}`} inert={!open}><NavLink id="occasions" onNavigate={() => setOpen(false)}>The occasions</NavLink><NavLink id="experience" onNavigate={() => setOpen(false)}>How it feels</NavLink><NavLink id="plans" onNavigate={() => setOpen(false)}>The plans</NavLink><Link href="/templates">Create your moment ↗</Link></div></header>;
}

function InvitationScene({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const event = useRef<HTMLDivElement>(null);
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const morph = useRef<SVGPathElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const dust = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = dust.current!;
    const ctx = canvas.getContext("2d");
    const sync = () => {
      const dpr = Math.min(devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    sync();
    const unframe = onSceneFrame((time) => {
      if (!root.current) return;
      const { p, rect } = progress(root.current);
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const reveal = reduced ? 1 : ease(range(p, 0, 0.36));
      const exit = reduced ? 0 : range(p, 0.74, 1);
      picture.current!.style.transform = `translate3d(${reduced ? 0 : pointer.current.x * 8}px,${reduced ? 0 : -p * 35}px,0) scale(${1.13 - reveal * 0.13})`;
      left.current!.style.transform = `translate3d(${-reveal * 102}%,0,0)`;
      right.current!.style.transform = `translate3d(${reveal * 102}%,0,0)`;
      copy.current!.style.opacity = String(reduced ? 1 : 1 - range(p, 0.16, 0.36));
      copy.current!.style.pointerEvents = p < 0.32 || reduced ? "auto" : "none";
      copy.current!.inert = !reduced && p >= 0.32;
      copy.current!.setAttribute("aria-hidden", String(!reduced && p >= 0.36));
      copy.current!.style.transform = `translate3d(0,${reduced ? 0 : -p * 70}px,0)`;
      event.current!.style.opacity = String(reduced ? 0 : range(p, 0.40, 0.53) * (1 - exit));
      event.current!.style.pointerEvents = !reduced && p > 0.46 && p < 0.94 ? "auto" : "none";
      event.current!.inert = reduced || p <= 0.46 || p >= 0.94;
      event.current!.setAttribute("aria-hidden", String(reduced || p <= 0.40 || p >= 1));
      event.current!.style.transform = `translate3d(0,${(1 - reveal) * 35 - exit * 60}px,0)`;
      readout.current!.textContent = `${Math.round(reveal * 100).toString().padStart(3, "0")}%`;
      let d = "";
      // The petaled contour becomes an oval and settles around the invitation.
      for (let i = 0; i <= 120; i++) {
        const a = i / 120 * Math.PI * 2;
        const r = 245 * (1 + Math.sin(a * 5 + time * (reduced ? 0 : 0.00015)) * 0.13 * (1 - reveal));
        const x = 350 + Math.cos(a) * r * (1.18 - reveal * 0.39) + pointer.current.x * 7;
        const y = 350 + Math.sin(a) * r * (0.85 + reveal * 0.3) + pointer.current.y * 7;
        d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      morph.current!.setAttribute("d", `${d}Z`);
      if (ctx) {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const ratio = canvas.width / Math.max(w, 1);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, w, h);
        if (!reduced) for (let i = 0; i < 55; i++) {
          const x = (i * 173.7 + time * 0.003 * (i % 3 + 1)) % w;
          const y = ((i * 97.1 - time * 0.005 + h * 100) % h);
          ctx.fillStyle = `rgba(244,217,173,${0.12 + (i % 4) * 0.07})`;
          ctx.beginPath(); ctx.arc(x, y, i % 6 === 0 ? 1.25 : 0.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
    return () => { observer.disconnect(); unframe(); };
  }, [reduced]);

  return <section id="top" className="cin-hero" ref={root} onPointerMove={(e) => { pointer.current = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 }; }}>
    <div className="cin-hero-sticky">
      <img ref={picture} className="cin-scene-image" src="/media/celebration.jpg" alt="A candlelit celebration pavilion opening onto a lake at blue hour" fetchPriority="high"/>
      <div className="cin-scene-shade"/>
      <div className="cin-curtain cin-curtain-left" ref={left}/><div className="cin-curtain cin-curtain-right" ref={right}/>
      <svg className="cin-morph" viewBox="0 0 700 700" aria-hidden="true"><path ref={morph} fill="none" stroke="currentColor" strokeWidth="0.65"/></svg>
      <canvas className="cin-dust" ref={dust} aria-hidden="true"/>
      <div className="cin-hero-copy" ref={copy}>
        <span className="cin-label cin-kicker"><span/> THE OCCASION STARTS WITH THE INVITATION</span>
        <h1>Make it<br/><em>unforgettable.</em></h1>
        <p>Beautiful, interactive invitations.<br/>A little world for your biggest moments.</p>
        <Link className="cin-cta cin-cta-light" href="/templates">Create your moment <span>↗</span></Link>
      </div>
      <div className="cin-event-title" ref={event}><span className="cin-label">TOGETHER WITH THEIR FAMILIES</span><h2>Aarav <i>&</i> Meera</h2><p>08 NOVEMBER 2026 <span>·</span> SURAT, GUJARAT</p><Link href="/e/preview?template=wedding">Step into the invitation <span>↗</span></Link></div>
      <div className="cin-hero-bottom"><span className="cin-label">DESIGNED TO BE FELT.<br/><span className="cin-dim">MADE TO BE SHARED.</span></span><div className="cin-scroll-prompt"><span className="cin-scroll-line"/><span className="cin-label">SCROLL TO OPEN THE INVITATION</span><span>↓</span></div><span className="cin-label cin-hero-readout">THE REVEAL <span ref={readout}>000%</span><br/><span className="cin-dim">01 — A MOMENT BEGINS</span></span></div>
    </div>
  </section>;
}

const occasions = [
  { id: "wedding", tag: "01 / THE FOREVER KIND", title: "For your forever.", kind: "WEDDINGS & ENGAGEMENTS", image: "celebration.jpg", detail: "A door opens. A new chapter begins." },
  { id: "birthday", tag: "02 / ANOTHER TRIP AROUND THE SUN", title: "Make a wish.", kind: "BIRTHDAYS & MILESTONES", image: "birthday.jpg", detail: "A little surprise, just waiting to be revealed." },
  { id: "garba", tag: "03 / NIGHTS TO REMEMBER", title: "Feel the rhythm.", kind: "GARBA & NAVRATRI", image: "garba.jpg", detail: "Bring your people together. Let the night begin." },
  { id: "opening", tag: "04 / THE START OF SOMETHING", title: "Here’s to new.", kind: "GRAND OPENINGS", image: "opening.jpg", detail: "Cut the ribbon on your next big thing." },
];

function OccasionReel({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => onSceneFrame(() => {
    if (!root.current || !track.current || reduced) return;
    const { p, rect } = progress(root.current);
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const k = range(p, 0.04, 0.96);
    const travel = Math.max(0, track.current.scrollWidth + track.current.offsetLeft - innerWidth * 0.94);
    track.current.style.transform = `translate3d(${-k * travel}px,0,0)`;
    let nearest = 0, best = Infinity;
    cards.current.forEach((card, i) => {
      if (!card) return;
      const r = card.getBoundingClientRect();
      const delta = (r.left + r.width / 2 - innerWidth * (innerWidth < 768 ? 0.5 : 0.65)) / innerWidth;
      const dim = clamp(Math.abs(delta) * 1.5);
      card.style.opacity = String(1 - dim * 0.55);
      card.style.transform = `scale(${1 - dim * 0.05})`;
      const image = card.querySelector("img");
      if (image) image.style.transform = `translate3d(${-delta * 35}px,0,0) scale(1.14)`;
      if (Math.abs(delta) < best) { best = Math.abs(delta); nearest = i; }
    });
    count.current!.textContent = `0${nearest + 1}`;
    bar.current!.style.transform = `scaleX(${k})`;
  }), [reduced]);
  return <section className="cin-reel" id="occasions" ref={root}><div className="cin-reel-sticky"><div className="cin-reel-intro"><span className="cin-label cin-gold">A FEELING FOR EVERY OCCASION</span><h2>Some days<br/>deserve<br/><em>their own world.</em></h2><p>Not just where and when.<br/>The feeling of being invited.</p><div className="cin-reel-meter" aria-hidden="true"><span><b ref={count}>01</b> / 04</span><span className="cin-meter"><span ref={bar}/></span></div><Link className="cin-text-link" href="/templates">Explore the collection <span>↗</span></Link></div><div className="cin-reel-track" ref={track}>{occasions.map((item, i) => <article key={item.id} className="cin-occasion-card" ref={(el) => { cards.current[i] = el; }}><Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview ${item.kind.toLowerCase()} invitation`}><img src={`/media/${item.image}`} alt={item.kind.toLowerCase()} loading="lazy"/><div className="cin-card-shade"/><span className="cin-card-tag cin-label">{item.tag}</span><div className="cin-card-title"><span className="cin-label">{item.kind}</span><h3>{item.title}</h3><span className="cin-card-preview">OPEN THE EXPERIENCE <b>↗</b></span></div></Link><div className="cin-card-bottom"><p>{item.detail}</p><Link href={`/create?template=${item.id}`}>Make it yours ↗</Link></div></article>)}</div></div></section>;
}

const journeySteps = [
  ["01 / FIND YOUR FEELING", "Start with a little inspiration.", "Choose an occasion and an interactive scene that feels like you."],
  ["02 / MAKE IT YOURS", "Put your story into it.", "Your names, your words, your colours. Watch your invitation come to life as you create."],
  ["03 / SEND THE FEELING", "One link. All your people.", "Send it on WhatsApp, share a QR code, and let your guests open the experience anywhere."],
  ["04 / BRING EVERYONE TOGETHER", "The joy comes full circle.", "Guests RSVP right inside your invitation. Every response has a place, every detail stays up to date."],
];
const route = ["M130 240C180 240 210 125 370 125", "M440 125C555 125 525 300 675 300", "M745 300C875 300 845 170 1000 170", "M1070 170C1160 170 1150 80 1080 80C1035 80 1035 110 1035 135"];

function ShareJourney({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const capsule = useRef<SVGGElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => onSceneFrame(() => {
    if (!root.current) return;
    const { p, rect } = progress(root.current);
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    const u = (reduced ? 1 : range(p, 0.04, 0.94)) * 4;
    const active = Math.min(3, Math.floor(u));
    paths.current.forEach((path, i) => {
      if (!path) return;
      const k = ease(clamp(u - i));
      path.style.strokeDashoffset = String(1 - k);
      if (i === active) { const point = path.getPointAtLength(path.getTotalLength() * k); capsule.current?.setAttribute("transform", `translate(${point.x} ${point.y})`); }
    });
    label.current!.textContent = journeySteps[active][0];
    title.current!.textContent = journeySteps[active][1];
    body.current!.textContent = journeySteps[active][2];
    bar.current!.style.transform = `scaleX(${u / 4})`;
  }), [reduced]);
  return <section className="cin-journey" id="experience" ref={root}><div className="cin-journey-sticky"><div className="cin-section-top"><div><span className="cin-label cin-gold">FROM YOUR IDEA TO THEIR FIRST WOW</span><h2>A little link.<br/><em>A beautiful journey.</em></h2></div><p>Made in minutes.<br/>Remembered for much longer.</p></div><svg className="cin-route" viewBox="0 0 1200 450" role="img" aria-label="An invitation’s journey: choose, personalise, share, and receive guest RSVPs"><defs><linearGradient id="route-gold"><stop stopColor="#b58d61"/><stop offset="1" stopColor="#f5ddaf"/></linearGradient></defs>{route.map((d, i) => <path d={d} key={`ghost${i}`} fill="none" stroke="#d8bc91" strokeOpacity=".15" strokeDasharray="3 8"/>)}{route.map((d, i) => <path key={i} ref={(el) => { paths.current[i] = el; }} d={d} pathLength="1" fill="none" stroke="url(#route-gold)" strokeWidth="1.6" strokeDasharray="1 1" strokeDashoffset="1"/>)}<g className="cin-route-node"><rect x="65" y="180" width="65" height="104" rx="4"/><path d="M76 191h43v55H76zM77 258h40m-40 10h27"/><text x="98" y="320" textAnchor="middle">CHOOSE</text></g><g className="cin-route-node"><circle cx="405" cy="125" r="35"/><path d="m386 135 6-17 22-17 9 11-22 17-15 6Zm6-17 9 11m13-28 9 11"/><text x="405" y="195" textAnchor="middle">PERSONALISE</text></g><g className="cin-route-node"><rect x="675" y="266" width="70" height="70" rx="15"/><path d="m693 302 37-20-12 39-10-12-15-7Zm15 7 22-27"/><text x="710" y="377" textAnchor="middle">SHARE</text></g><g className="cin-route-node"><circle cx="1035" cy="170" r="35"/><path d="m1020 169 11 11 20-24"/><text x="1035" y="242" textAnchor="middle">TOGETHER</text></g><g ref={capsule} transform="translate(130 240)"><circle r="13" fill="#dcb17b" opacity=".14"/><circle r="3.5" fill="#f5ddaf"/></g></svg><div className="cin-journey-caption"><span className="cin-label cin-gold" ref={label}>{journeySteps[0][0]}</span><div><h3 ref={title}>{journeySteps[0][1]}</h3><p ref={body}>{journeySteps[0][2]}</p></div><span className="cin-journey-progress"><span ref={bar}/></span></div></div></section>;
}

function Plans() {
  return <section className="cin-plans" id="plans"><div className="cin-section-top"><div><span className="cin-label cin-gold">FOR YOUR DAY. OR YOUR EVERYDAY.</span><h2>Good things start<br/><em>with a link.</em></h2></div><p>Celebrate your own occasion.<br/>Or help your clients celebrate theirs.</p></div><div className="cin-plan-grid"><article className="cin-plan"><span className="cin-label">01 / THE PERSONAL TOUCH</span><h3>Your moment.</h3><p>One beautiful occasion. Every essential.</p><div className="cin-price">₹0<span>FREE TO CREATE</span></div><ul><li>One active invitation</li><li>Four interactive starter templates</li><li>Up to 100 guest RSVPs</li><li>Shareable link & QR code</li></ul><Link className="cin-cta cin-cta-outline" href="/templates">Create your invitation <span>↗</span></Link></article><article className="cin-plan cin-plan-pro"><span className="cin-label">02 / THE CREATOR’S STUDIO</span><h3>Your signature.</h3><p>A home for the occasions you create for others.</p><div className="cin-price">₹1,999<span>PER MONTH · PROFESSIONAL</span></div><ul><li>Up to 20 active experiences</li><li>Your brand, colours & logo</li><li>Reusable presets & client previews</li><li>RSVP exports & engagement insights</li></ul><Link className="cin-cta cin-cta-light" href="/create?template=wedding">Preview the creator studio <span>↗</span></Link></article></div></section>;
}

export default function CinematicHome() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => startSceneScroll(reduced), [reduced]);
  return <div className={`cinema${reduced ? " cin-reduced" : ""}`}><Chrome/><main><InvitationScene reduced={reduced}/><OccasionReel reduced={reduced}/><ShareJourney reduced={reduced}/><Plans/><section className="cin-finale"><img src="/media/celebration.jpg" alt="" loading="lazy"/><div className="cin-finale-shade"/><span className="cin-label">DON’T JUST INVITE. CREATE AN EXPERIENCE.</span><h2>Your day.<br/><em>Their first wow.</em></h2><Link href="/templates" className="cin-cta cin-cta-light">Let’s make your moment <span>↗</span></Link><span className="cin-finale-note cin-label">FREE TO START. LOVELY TO SHARE.</span></section></main><footer className="cin-footer"><div><span className="cin-logo"><Mark/>WOWLINK</span><p>A little world for your biggest moments.</p></div><span className="cin-label">GUJARATI SOUL. EVERY OCCASION.<br/>© 2026 WOWLINK</span><NavLink id="top">BACK TO THE BEGINNING ↑</NavLink></footer></div>;
}
