"use client";

import Link from "next/link";
import { PlanCards } from "./ui/plan-cards";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Art, ArtImage } from "./ui/art";
import { ArrowCurl, Diya, Flower, Pen, Star } from "./ui/doodles";
import { clamp, ease, onSceneFrame, progress, range, sceneNavigate, startSceneScroll } from "./lib/scene-scroll";

function Mark() {
  return <svg  viewBox="0 0 32 32" aria-hidden="true"><path d="M5 29V15.5a11 11 0 0 1 22 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 29V16.5a5.5 5.5 0 0 1 11 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="22" r="2.1" fill="currentColor"/></svg>;
}

function NavLink({ id, children, onNavigate }: { id: string; children: React.ReactNode; onNavigate?: () => void }) {
  const go = (event: MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); onNavigate?.(); sceneNavigate(id); };
  return <a href={`#${id}`} onClick={go}>{children}</a>;
}

function Chrome() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 24);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`cin-nav${scrolled ? " is-scrolled" : ""}${open ? " is-menu-open" : ""}`}>
    <NavLink id="top" onNavigate={() => setOpen(false)}><span className="cin-logo"><Mark/>WowLink</span></NavLink>
    <nav aria-label="Main navigation"><NavLink id="occasions">Occasions</NavLink><NavLink id="experience">How it works</NavLink><NavLink id="plans">Pricing</NavLink></nav>
    <Link className="cin-nav-mine" href="/mine">My invitations</Link>
    <Link className="cin-nav-cta" href="/templates">Create invitation</Link>
    <button className="cin-menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="cin-menu">{open ? "Close" : "Menu"}</button>
    <div id="cin-menu" className={`cin-menu${open ? " is-open" : ""}`} inert={!open}><NavLink id="occasions" onNavigate={() => setOpen(false)}>Occasions</NavLink><NavLink id="experience" onNavigate={() => setOpen(false)}>How it works</NavLink><NavLink id="plans" onNavigate={() => setOpen(false)}>Pricing</NavLink><Link href="/mine">My invitations</Link><Link href="/templates">Create invitation</Link></div>
  </header>;
}

function InvitationScene() {
  return <section id="top" className="cin-hero theme-paper">
    <div className="cin-hero-grid">
      <div className="cin-hero-copy">
        <span className="cin-hero-gu"><Flower className="doodle"/><span lang="gu">આમંત્રણ</span><Flower className="doodle"/></span>
        <h1>Invitations,<br/><em>drawn with love.</em></h1>
        <p>Hand-drawn invitation pages for weddings, birthdays, Garba and grand openings. Pick a drawing, add your story, and share it with one link.</p>
        <div className="cin-hero-actions">
          <Link className="cin-cta cin-cta-light" href="/templates">Create your invitation</Link>
          <Link className="cin-text-link" href="/e/preview?template=wedding">See a sample <span aria-hidden="true">→</span></Link>
        </div>
        <span className="cin-note cin-hero-note">watch it draw itself <ArrowCurl className="doodle-curl"/></span>
      </div>
      <div className="cin-hero-stage">
        <div className="cin-sketchbook">
          <svg className="cin-spiral" viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <g key={i}><circle cx={18 + i * 24.4} cy="27" r="3.4"/><path d={`M${18 + i * 24.4} 27C${12 + i * 24.4} 12 ${26 + i * 24.4} 2 ${30 + i * 24.4} 14`}/></g>)}</svg>
          <Art name="wedding" drawing className="cin-hero-art boil"/>
          <div className="cin-sketch-text">
            <span className="cin-event-eyebrow">together with their families</span>
            <h2>Aarav <i>&amp;</i> Meera</h2>
            <p>8 November 2026<span aria-hidden="true">·</span>Surat, Gujarat</p>
            <Link className="cin-text-link" href="/e/preview?template=wedding">Open their invitation <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <Pen className="cin-pen"/>
        <Star className="doodle sk-star"/>
      </div>
    </div>
  </section>;
}

const occasions = [
  { id: "wedding", title: "For your forever.", kind: "Weddings", detail: "A door opens. A new chapter begins." },
  { id: "engagement", title: "Say yes, together.", kind: "Engagements & sagai", detail: "Two rings, two families, one beginning." },
  { id: "birthday", title: "Make a wish.", kind: "Birthdays & milestones", detail: "A little surprise, waiting to be revealed." },
  { id: "garba", title: "Feel the rhythm.", kind: "Garba & Navratri", detail: "Bring your people together. Let the night begin." },
  { id: "babyshower", title: "Little blessings.", kind: "Baby showers & seemant", detail: "Shower the parents-to-be with love." },
  { id: "housewarming", title: "Step inside.", kind: "Housewarmings & vastu puja", detail: "Open the door to your new home." },
  { id: "anniversary", title: "Still us.", kind: "Anniversaries", detail: "Raise a cup of chai to the years together." },
  { id: "opening", title: "Here’s to new.", kind: "Grand openings", detail: "Cut the ribbon on your next big thing." },
  { id: "diwali", title: "Light it up.", kind: "Diwali get-togethers", detail: "Diyas, mithai and the whole family." },
  { id: "janoi", title: "A sacred thread.", kind: "Janoi & upanayan", detail: "Blessings for a new beginning." },
  { id: "puja", title: "With faith.", kind: "Katha & puja", detail: "Gather for the katha and the aarti." },
  { id: "naming", title: "Hello, little one.", kind: "Naamkaran", detail: "Be there to hear the name first." },
] as const;

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
      const image = card.querySelector<HTMLElement>(".cin-photo > img");
      if (image) image.style.transform = `translate3d(${-delta * 35}px,0,0) scale(1.14)`;
      if (Math.abs(delta) < best) { best = Math.abs(delta); nearest = i; }
    });
    count.current!.textContent = String(nearest + 1);
    bar.current!.style.transform = `scaleX(${k})`;
  }), [reduced]);
  return <section className="cin-reel theme-paper" id="occasions" ref={root}><div className="cin-reel-sticky">
    <div className="cin-reel-intro"><h2>Every occasion gets its own drawing.</h2><p>Pick a sketch made for your day, then make it yours.</p><span className="cin-note cin-reel-note">tap a drawing to peek inside <ArrowCurl className="doodle-curl"/></span><div className="cin-reel-meter" aria-hidden="true"><span><b ref={count}>1</b> / {occasions.length}</span><span className="cin-meter"><span ref={bar}/></span></div><Link className="cin-text-link" href="/templates">Browse all templates <span aria-hidden="true">→</span></Link></div>
    <div className="cin-reel-track" ref={track}>{occasions.map((item, i) => <article key={item.id} className="cin-occasion-card" ref={(el) => { cards.current[i] = el; }}>
      <Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview the ${item.kind.toLowerCase()} invitation`}><span className="cin-photo"><ArtImage name={item.id} fit="slice"/></span><span className="cin-card-title"><span className="cin-card-kind">{item.kind}</span><h3>{item.title}</h3></span></Link>
      <div className="cin-card-bottom"><p>{item.detail}</p><Link href={`/create?template=${item.id}`}>Make it yours <span aria-hidden="true">→</span></Link></div>
    </article>)}</div>
  </div></section>;
}

const journeySteps = [
  ["Step 1", "Choose a template", "Pick an occasion and an interactive scene that feels like you."],
  ["Step 2", "Add your details", "Names, date, venue and a personal note. The preview updates as you type."],
  ["Step 3", "Share one link", "Send it on WhatsApp or share a QR code. Guests open it on any phone."],
  ["Step 4", "Collect RSVPs", "Guests reply inside the invitation, and every response lands in one place."],
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
  return <section className="cin-journey theme-paper" id="experience" ref={root}><div className="cin-journey-sticky"><div className="cin-section-top"><h2>From idea to first wow, <span className="scribble">in minutes</span>.</h2><p>Four steps, no design skills needed.</p></div><svg className="cin-route" viewBox="0 0 1200 450" role="img" aria-label="An invitation’s journey: choose, personalise, share, and receive guest RSVPs">{route.map((d, i) => <path className="cin-route-ghost" d={d} key={`ghost${i}`} fill="none" strokeDasharray="2 9" strokeLinecap="round"/>)}{route.map((d, i) => <path className="cin-route-line" key={i} ref={(el) => { paths.current[i] = el; }} d={d} pathLength="1" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 1" strokeDashoffset="1"/>)}<g className="cin-route-node">
    <path d="M68 187C82 184 112 185 129 183L131 277C112 282 83 280 66 283C64 262 66 208 68 187Z"/>
    <path d="M71 190C86 188 110 189 126 187" strokeOpacity=".3" fill="none"/>
    <path d="M83 242V222C83 206 111 206 111 222V242" fill="none"/>
    <path d="M80 256C90 254 102 258 117 255M80 267C88 266 98 268 107 266" fill="none"/>
    <text x="98" y="322" textAnchor="middle">Choose</text></g>
  <g className="cin-route-node">
    <path d="M405 90C425 89 441 105 440 126C439 146 423 161 404 160C384 159 370 144 370 124C370 105 385 91 405 90Z"/>
    <path d="M407 93C427 95 438 110 437 128C436 147 421 158 402 157" strokeOpacity=".3" fill="none"/>
    <path d="M386 146L389 133L419 104L428 112L398 142Z" fill="none"/>
    <path d="M389 133L398 142M412 111L421 120" fill="none"/>
    <path d="M382 151C391 149 398 153 409 150" fill="none"/>
    <text x="405" y="195" textAnchor="middle">Personalise</text></g>
  <g className="cin-route-node">
    <path d="M678 272C697 270 722 271 742 273C746 292 745 314 743 334C722 337 697 336 677 334C674 314 675 291 678 272Z"/>
    <path d="M681 275C700 274 721 275 739 276" strokeOpacity=".3" fill="none"/>
    <path d="M691 307L732 285L719 324L710 312Z" fill="none"/>
    <path d="M710 312L732 285" fill="none"/>
    <text x="710" y="377" textAnchor="middle">Share</text></g>
  <g className="cin-route-node">
    <path d="M1035 135C1055 134 1071 150 1070 171C1069 191 1053 206 1034 205C1014 204 1000 189 1000 169C1000 150 1015 136 1035 135Z"/>
    <path d="M1038 138C1057 141 1068 154 1067 172C1066 190 1052 202 1033 202" strokeOpacity=".3" fill="none"/>
    <path d="M1018 170C1023 175 1028 181 1031 186C1038 174 1046 164 1054 156" fill="none" strokeWidth="2.2"/>
    <text x="1035" y="242" textAnchor="middle">RSVPs</text></g>
  <text className="cin-note-svg" x="22" y="152">start here</text><path className="cin-note-arrow" d="M104 162C112 168 114 172 110 180M104 174 110 182 118 174"/>
  <text className="cin-note-svg" x="878" y="92">ta-da!</text><path className="cin-note-arrow" d="M946 98C966 108 982 120 994 136M980 136 995 140 996 122"/>
  <g ref={capsule} transform="translate(130 240)"><circle className="cin-route-dot-halo" r="12"/><circle className="cin-route-dot" r="5"/></g></svg><div className="cin-journey-caption"><span className="cin-step-label" ref={label}>{journeySteps[0][0]}</span><div><h3 ref={title}>{journeySteps[0][1]}</h3><p ref={body}>{journeySteps[0][2]}</p></div><span className="cin-journey-progress"><span ref={bar}/></span></div></div></section>;
}

function Plans() {
  return <section className="cin-plans theme-paper" id="plans"><div className="cin-section-top"><h2>Free for your own <span className="scribble">occasion</span>.</h2><p>Planning for clients? The Creator studio is opening soon.</p></div>
    <PlanCards lang="en"/>
    <p className="cin-plans-more"><Link href="/pricing">Compare the plans <span aria-hidden="true">→</span></Link></p></section>;
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
  return <div className={`cinema${reduced ? " cin-reduced" : ""}`}><Chrome/><main><InvitationScene/><OccasionReel reduced={reduced}/><ShareJourney reduced={reduced}/><Plans/><section className="cin-finale theme-paper">
    <div className="cin-print fin-print fin-p1"><span className="cin-photo"><ArtImage name="birthday" fit="slice"/></span></div>
    <div className="cin-print fin-print fin-p2"><span className="cin-photo"><ArtImage name="garba" fit="slice"/></span></div>
    <Flower className="doodle fin-a"/><Star className="doodle fin-b"/><Diya className="doodle fin-c"/><Flower className="doodle fin-d"/>
    <span className="cin-note cin-finale-note">come on in</span><h2>Your day.<br/><em>Their first wow.</em></h2><p>Free to start. Lovely to share.</p><Link href="/templates" className="cin-cta cin-cta-light">Create your invitation</Link>
  </section></main>
      <footer className="cin-footer"><div className="cin-footer-brand"><span className="cin-logo"><Mark/>WowLink</span><p>Made with love, shared with one link.</p></div><nav aria-label="Footer"><NavLink id="occasions">Occasions</NavLink><NavLink id="experience">How it works</NavLink><NavLink id="plans">Pricing</NavLink><Link href="/templates">Templates</Link><Link href="/mine">My invitations</Link><Link href="/help">Help</Link><Link href="/privacy">Privacy</Link></nav><span className="cin-footer-note">© 2026 WowLink</span></footer></div>;
}
