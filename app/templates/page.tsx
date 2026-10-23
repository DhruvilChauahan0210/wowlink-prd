import Link from "next/link";
import { CatalogFooter } from "../ui/public-page";
import { STARTER_OCCASIONS } from "../lib/plans";
import { invitationTemplates, type TemplateId } from "../lib/invitations";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { Flower } from "../ui/doodles";

export const metadata = {
  title: "Hand-drawn invitation templates — WowLink",
  description: "Interactive, hand-drawn invitations for weddings, engagements, birthdays, Garba, seemant and baby showers, housewarmings, anniversaries and grand openings. In Gujarati, Hindi or English, free to make.",
  alternates: { canonical: "/templates" },
};
const collection: Record<TemplateId, { title: string; detail: string }> = {
  wedding: { title: "For your forever.", detail: "Open the doors to your next chapter." },
  engagement: { title: "Say yes, together.", detail: "Two rings, two families, one beginning." },
  birthday: { title: "Make a wish.", detail: "A little surprise, waiting to be revealed." },
  garba: { title: "Feel the rhythm.", detail: "Bring your people together for a night to remember." },
  babyshower: { title: "Little blessings.", detail: "Shower the parents-to-be with love." },
  housewarming: { title: "Step inside.", detail: "Open the door to your new home." },
  anniversary: { title: "Still us.", detail: "Raise a cup of chai to the years together." },
  opening: { title: "Here’s to new.", detail: "Cut the ribbon on your next big thing." },
  diwali: { title: "Light it up.", detail: "Diyas, mithai and the whole family." },
  janoi: { title: "A sacred thread.", detail: "Blessings for a new beginning." },
  puja: { title: "With faith.", detail: "Gather for the katha and the aarti." },
  naming: { title: "Hello, little one.", detail: "Be there to hear the name first." },
};

export default function TemplatesPage() {
  return <div className="cinema cin-catalog theme-paper">
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/" className="cin-catalog-back">← Back to home</Link></header>
    <main>
      <div className="cin-catalog-heading"><h1>Pick a <em>drawing.</em><Flower className="doodle h-flower"/></h1><p>Every invitation starts as a sketch. Choose one that feels like your day, add your story, share one link.</p></div>
      <div className="cin-catalog-grid">{invitationTemplates.map(item => <article className="cin-occasion-card" key={item.id}>
        <Link className="cin-occasion-image" href={`/templates/${item.id}`} aria-label={`${item.category}: see how it opens`}><span className="cin-photo"><ArtImage name={item.id} fit="slice"/></span><span className="cin-card-title"><span className="cin-card-kind">{item.category}{!STARTER_OCCASIONS.includes(item.id) && <span className="studio-pro-badge cin-card-pro">Creator studio</span>}</span><h3>{collection[item.id].title}</h3></span></Link>
        <div className="cin-card-bottom"><p>{collection[item.id].detail}</p><Link href={`/create?template=${item.id}`}>Make it yours <span aria-hidden="true">→</span></Link></div>
      </article>)}</div>
    </main>
    <CatalogFooter lang="en"/>
  </div>;
}
