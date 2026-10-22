import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return <Link className={`brand${light ? " brand-light" : ""}`} href="/" aria-label="WowLink home"><span className="brand-mark">w</span><span>wowlink</span></Link>;
}

export function Header() {
  return <header className="site-header"><div className="header-inner"><Brand /><nav className="main-nav" aria-label="Main navigation"><Link href="/templates">Explore templates</Link><a href="/#how-it-works">How it works</a><a href="/#pricing">Pricing</a></nav><Link className="button button-dark button-small" href="/templates">Create yours <span aria-hidden="true">↗</span></Link></div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner"><Brand /><p>Made for the moments you’ll remember.</p><span>© 2026 WowLink</span></div></footer>;
}

export const templates = [
  { id: "wedding", title: "The Wedding Edit", category: "WEDDING", description: "A little ceremony, a lot of heart.", emoji: "💍", color: "lavender", label: "Open the doors" },
  { id: "birthday", title: "Make a Wish", category: "BIRTHDAY", description: "A surprise worth showing up for.", emoji: "🎂", color: "peach", label: "Reveal the surprise" },
  { id: "garba", title: "Raas & Rhythm", category: "GARBA · NAVRATRI", description: "Come for the beats. Stay for the magic.", emoji: "🪷", color: "pink", label: "Start the garba" },
  { id: "opening", title: "A New Beginning", category: "GRAND OPENING", description: "Something lovely is opening up.", emoji: "✂️", color: "mint", label: "Cut the ribbon" },
];

export function TemplateCard({ template }: { template: (typeof templates)[number] }) {
  return <article className="template-card"><Link href={`/e/preview?template=${template.id}`} className={`template-art art-${template.color}`} aria-label={`Preview ${template.title}`}><span className="art-index">WOWLINK STUDIO <span>0{templates.indexOf(template) + 1}</span></span><span className={`template-motif motif-${template.id}`} aria-hidden="true">{template.id === "wedding" ? <svg viewBox="0 0 220 180"><path d="M34 162V91a76 76 0 0 1 152 0v71M54 162V92a56 56 0 0 1 112 0v70"/><path d="M110 145c-28-20-31-40-15-48 8-4 15 1 15 8 0-7 7-12 15-8 16 8 13 28-15 48Z"/><path d="M63 126c-10-12-8-21 0-22 6-1 8 4 7 8 3-5 9-5 11 0 2 7-5 13-18 14ZM157 126c10-12 8-21 0-22-6-1-8 4-7 8-3-5-9-5-11 0-2 7 5 13 18 14Z"/></svg> : template.id === "birthday" ? <svg viewBox="0 0 220 180"><path d="M38 61c18-21 38-21 56 0s38 21 56 0 25-19 34-10M42 134h136v25H42zM55 112h110v22H55zM68 89h84v23H68zM75 73V47m35 26V38m35 35V47"/><path d="M70 45c-7-8 8-10 4-18m32 8c-7-8 8-10 4-18m32 28c-7-8 8-10 4-18"/><circle cx="43" cy="43" r="3"/><circle cx="180" cy="91" r="4"/></svg> : template.id === "garba" ? <svg viewBox="0 0 220 180"><circle cx="110" cy="91" r="61"/><circle cx="110" cy="91" r="42"/><circle cx="110" cy="91" r="18"/><path d="M110 30v43m0 36v43M49 91h43m36 0h43M67 48l30 30m26 26 30 30m0-86-30 30M97 104l-30 30"/><path d="M110 30c-14 12-14 25 0 35 14-10 14-23 0-35Zm61 61c-12-14-25-14-35 0 10 14 23 14 35 0Zm-61 61c14-12 14-25 0-35-14 10-14 23 0 35ZM49 91c12 14 25 14 35 0-10-14-23-14-35 0Z"/></svg> : <svg viewBox="0 0 220 180"><path d="M52 157V54a58 58 0 0 1 116 0v103M69 157V58a41 41 0 0 1 82 0v99M52 157h116M110 22v45m-16-16 16 16 16-16"/><path d="M47 47 30 30m143 17 17-17"/><circle cx="110" cy="112" r="13"/></svg>}</span><span className="art-title">{template.title}</span><span className="art-date">A MOMENT MADE YOURS</span><span className="art-open">↗</span></Link><div className="template-info"><div><span className="eyebrow">{template.category}</span><h3>{template.title}</h3><p>{template.description}</p></div><Link className="text-link" href={`/create?template=${template.id}`} aria-label={`Use ${template.title} template`}>Make it yours <span>→</span></Link></div></article>;
}
