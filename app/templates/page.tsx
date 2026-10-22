import Link from "next/link";
import { Footer, Header, TemplateCard, templates } from "../components";

export const metadata = { title: "Explore invitation templates — WowLink", description: "Find an interactive invitation for weddings, birthdays, Garba, and grand openings." };

export default function TemplatesPage() {
  return <><Header /><main className="browse-page"><div className="browse-heading"><Link href="/" className="back-link">← Home</Link><span className="eyebrow eyebrow-pill"><i /> THE GOOD STUFF</span><h1>What are we<br /><em>celebrating?</em></h1><p>Pick an occasion. Make it yours. Send something worth opening.</p></div><div className="category-row"><span className="category-active">All occasions <b>04</b></span>{templates.map(t => <a key={t.id} href={`#${t.id}`}>{t.category}</a>)}</div><div className="template-grid browse-grid">{templates.map((template) => <div key={template.id} id={template.id}><TemplateCard template={template} /></div>)}</div><div className="browse-bottom"><span>Something else in mind?</span><a href="mailto:hello@wowlink.app">Tell us what you’re celebrating ↗</a></div></main><Footer /></>;
}
