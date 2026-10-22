import Link from "next/link";
import { invitationTemplates } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";

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
  return <div className="cinema cin-catalog">
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/" className="cin-label">BACK TO THE BEGINNING ↗</Link></header>
    <main>
      <div className="cin-catalog-heading"><span className="cin-label cin-gold">THE WOWLINK COLLECTION / 01—04</span><h1>An occasion.<br/><em>A whole world.</em></h1><p>Choose a scene that feels like your day.<br/>Add your story. Make it yours.</p></div>
      <div className="cin-catalog-grid">{invitationTemplates.map((item, index) => <article className="cin-occasion-card" key={item.id}>
        <Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview ${item.category.toLowerCase()}`}><img src={`/media/${item.image}`} alt={item.category.toLowerCase()} loading={index === 0 ? "eager" : "lazy"}/><div className="cin-card-shade"/><span className="cin-card-tag cin-label">0{index + 1} / {item.category}</span><div className="cin-card-title"><h3>{collection[index].title}</h3><span className="cin-card-preview">PREVIEW THE EXPERIENCE <b>↗</b></span></div></Link>
        <div className="cin-card-bottom"><p>{collection[index].detail}</p><Link href={`/create?template=${item.id}`}>Make it yours ↗</Link></div>
      </article>)}</div>
    </main>
    <footer className="cin-catalog-footer"><span className="cin-label">A LITTLE WORLD FOR YOUR BIGGEST MOMENTS.</span><Link href="/" className="cin-label">© 2026 WOWLINK</Link></footer>
  </div>;
}
