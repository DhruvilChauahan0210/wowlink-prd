import Link from "next/link";
import { invitationTemplates } from "../lib/invitations";
import { Art } from "../ui/art";
import { WowLinkBrand } from "../ui/brand";
import { Flower } from "../ui/doodles";

export const metadata = {
  title: "Explore invitation templates — WowLink",
  description: "Find an interactive invitation for weddings, birthdays, Garba, and grand openings.",
};
const collection = [
  { title: "For your forever.", detail: "Open the doors to your next chapter." },
  { title: "Make a wish.", detail: "A little surprise, waiting to be revealed." },
  { title: "Feel the rhythm.", detail: "Bring your people together for a night to remember." },
  { title: "Here’s to new.", detail: "Cut the ribbon on your next big thing." },
];

export default function TemplatesPage() {
  return <div className="cinema cin-catalog theme-paper">
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/" className="cin-catalog-back">← Back to home</Link></header>
    <main>
      <div className="cin-catalog-heading"><h1>Pick a <em>drawing.</em><Flower className="doodle h-flower"/></h1><p>Every invitation starts as a sketch. Choose one that feels like your day, add your story, share one link.</p></div>
      <div className="cin-catalog-grid">{invitationTemplates.map((item, index) => <article className="cin-occasion-card" key={item.id}>
        <Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview ${item.category.toLowerCase()}`}><span className="cin-photo"><Art name={item.id} fit="slice" decorative/></span><span className="cin-card-title"><span className="cin-card-kind">{item.category}</span><h3>{collection[index].title}</h3></span></Link>
        <div className="cin-card-bottom"><p>{collection[index].detail}</p><Link href={`/create?template=${item.id}`}>Make it yours <span aria-hidden="true">→</span></Link></div>
      </article>)}</div>
    </main>
    <footer className="cin-catalog-footer"><span>Made with love, shared with one link.</span><Link href="/">© 2026 WowLink</Link></footer>
  </div>;
}
