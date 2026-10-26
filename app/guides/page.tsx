import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, readMinutes } from "../lib/guides";
import { breadcrumbs, itemList } from "../lib/structured-data";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { JsonLd } from "../ui/json-ld";
import { SiteFooter } from "../ui/site-footer";

// The how-to guides (see lib/guides.ts).

export const metadata: Metadata = {
  title: "Invitation guides: sending, timing and RSVPs — WowLink",
  description: "How to send an invitation on WhatsApp, when to send it, how to collect replies, and how to invite guests in Gujarati, Hindi and English.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return <div className="cinema cin-catalog theme-paper wording-page">
    <JsonLd data={[breadcrumbs([["WowLink", "/"], ["Guides", "/guides"]]), itemList("Invitation guides", GUIDES.map((guide) => [guide.title, `/guides/${guide.slug}`] as const))]}/>
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/wording" className="cin-catalog-back">Invitation wording <span aria-hidden="true">→</span></Link></header>
    <main>
      <div className="cin-catalog-heading">
        <h1>Guides for sending your <span className="scribble">invitation</span></h1>
        <p>Short, practical answers to the questions that come up before you press send: how, when and in which language.</p>
      </div>
      <ol className="guide-list">{GUIDES.map((guide, i) => <li key={guide.slug}>
        <Link href={`/guides/${guide.slug}`}>
          <span className="guide-list-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <span className="guide-list-text">
            <span className="guide-list-title">{guide.title}</span>
            <span className="guide-list-desc">{guide.description}</span>
            <span className="guide-list-meta">{readMinutes(guide)} min read <span aria-hidden="true">→</span></span>
          </span>
          <span className="cin-photo guide-list-thumb"><ArtImage name={guide.template} fit="slice"/></span>
        </Link>
      </li>)}</ol>
    </main>
    <SiteFooter/>
  </div>;
}
