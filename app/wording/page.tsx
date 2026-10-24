import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbs, itemList } from "../lib/structured-data";
import { WORDING_GUIDES } from "../lib/wording";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { JsonLd } from "../ui/json-ld";
import { SiteFooter } from "../ui/site-footer";

// The invitation wording guides, one for each occasion (see lib/wording.ts).

export const metadata: Metadata = {
  title: "Invitation wording in Gujarati, Hindi and English — WowLink",
  description: "Ready-to-copy invitation wording and WhatsApp messages for weddings, Garba, griha pravesh, birthdays, pujas and more, in English, Gujarati and Hindi.",
  alternates: { canonical: "/wording" },
};

export default function WordingPage() {
  return <div className="cinema cin-catalog theme-paper wording-page">
    <JsonLd data={[breadcrumbs([["WowLink", "/"], ["Invitation wording", "/wording"]]), itemList("Invitation wording", WORDING_GUIDES.map((guide) => [guide.title, `/wording/${guide.slug}`] as const))]}/>
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/templates" className="cin-catalog-back">Occasions <span aria-hidden="true">→</span></Link></header>
    <main>
      <div className="cin-catalog-heading">
        <h1>Invitation wording for every <span className="scribble">occasion</span></h1>
        <p>Words for the invitation and the WhatsApp message, in English, Gujarati and Hindi. Copy them as they are, or make them yours.</p>
      </div>
      <ul className="wording-index">{WORDING_GUIDES.map((guide) => <li key={guide.slug}>
        <Link href={`/wording/${guide.slug}`}>
          <span className="cin-photo"><ArtImage name={guide.template} fit="slice"/></span>
          <span className="wording-index-name">{guide.name}</span>
          <span className="wording-index-title">{guide.title}</span>
        </Link>
      </li>)}</ul>
    </main>
    <SiteFooter/>
  </div>;
}
