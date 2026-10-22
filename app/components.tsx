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
  return <article className="template-card"><Link href={`/e/preview?template=${template.id}`} className={`template-art art-${template.color}`} aria-label={`Preview ${template.title}`}><span className="art-topline">A LITTLE SOMETHING SPECIAL</span><span className="art-emoji">{template.emoji}</span><span className="art-title">{template.title}</span><span className="art-date">YOU’RE INVITED · 2026</span><span className="art-open">↗</span></Link><div className="template-info"><div><span className="eyebrow">{template.category}</span><h3>{template.title}</h3><p>{template.description}</p></div><Link className="text-link" href={`/create?template=${template.id}`} aria-label={`Use ${template.title} template`}>Use template <span>→</span></Link></div></article>;
}
