import Link from "next/link";
import { invitationTemplates, type TemplateId } from "../lib/invitations";
import { ArtImage } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { Flower } from "../ui/doodles";

export const metadata = {
  title: "Explore invitation templates — WowLink",
  description: "Find an interactive invitation for weddings, engagements, birthdays, Garba, baby showers, housewarmings, anniversaries and grand openings.",
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
};

export default function TemplatesPage() {
  return <div className="cinema cin-catalog theme-paper">
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/" className="cin-catalog-back">← Back to home</Link></header>
    <main>
      <div className="cin-catalog-heading"><h1>Pick a <em>drawing.</em><Flower className="doodle h-flower"/></h1><p>Every invitation starts as a sketch. Choose one that feels like your day, add your story, share one link.</p></div>
      <div className="cin-catalog-grid">{invitationTemplates.map(item => <article className="cin-occasion-card" key={item.id}>
        <Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview ${item.category.toLowerCase()}`}><span className="cin-photo"><ArtImage name={item.id} fit="slice"/></span><span className="cin-card-title"><span className="cin-card-kind">{item.category}</span><h3>{collection[item.id].title}</h3></span></Link>
        <div className="cin-card-bottom"><p>{collection[item.id].detail}</p><Link href={`/create?template=${item.id}`}>Make it yours <span aria-hidden="true">→</span></Link></div>
      </article>)}</div>
    </main>
    <footer className="cin-catalog-footer"><span>Made with love, shared with one link.</span><Link href="/">© 2026 WowLink</Link></footer>
  </div>;
}
