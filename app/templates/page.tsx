import Link from "next/link";
import "../cinematic.css";

export const metadata = { title: "Explore invitation templates — WowLink", description: "Find an interactive invitation for weddings, birthdays, Garba, and grand openings." };

export default function TemplatesPage() {
  const items = [
    { id: "wedding", title: "For your forever.", category: "WEDDING & ENGAGEMENT", image: "celebration.jpg", detail: "Open the doors to your next chapter." },
    { id: "birthday", title: "Make a wish.", category: "BIRTHDAY & MILESTONES", image: "birthday.jpg", detail: "A little surprise, waiting to be revealed." },
    { id: "garba", title: "Feel the rhythm.", category: "GARBA & NAVRATRI", image: "garba.jpg", detail: "Bring your people together for a night to remember." },
    { id: "opening", title: "Here’s to new.", category: "GRAND OPENING", image: "opening.jpg", detail: "Cut the ribbon on your next big thing." },
  ];
  return <div className="cinema cin-catalog"><header className="cin-catalog-nav"><Link href="/" className="cin-logo">✧ WOWLINK</Link><Link href="/" className="cin-label">BACK TO THE BEGINNING ↗</Link></header><main><div className="cin-catalog-heading"><span className="cin-label cin-gold">THE WOWLINK COLLECTION / 01—04</span><h1>An occasion.<br/><em>A whole world.</em></h1><p>Choose a scene that feels like your day.<br/>Add your story. Make it yours.</p></div><div className="cin-catalog-grid">{items.map((item, i) => <article className="cin-occasion-card" key={item.id}><Link className="cin-occasion-image" href={`/e/preview?template=${item.id}`} aria-label={`Preview ${item.category.toLowerCase()}`}><img src={`/media/${item.image}`} alt={item.category.toLowerCase()} loading={i === 0 ? "eager" : "lazy"}/><div className="cin-card-shade"/><span className="cin-card-tag cin-label">0{i + 1} / {item.category}</span><div className="cin-card-title"><h3>{item.title}</h3><span className="cin-card-preview">PREVIEW THE EXPERIENCE <b>↗</b></span></div></Link><div className="cin-card-bottom"><p>{item.detail}</p><Link href={`/create?template=${item.id}`}>Make it yours ↗</Link></div></article>)}</div></main><footer className="cin-catalog-footer"><span className="cin-label">A LITTLE WORLD FOR YOUR BIGGEST MOMENTS.</span><Link href="/" className="cin-label">© 2026 WOWLINK</Link></footer></div>;
}
