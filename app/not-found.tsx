import Link from "next/link";
import { MomentMark, WowLinkBrand } from "./ui/brand";

export default function NotFound() {
  return <div className="cinema inv-not-found"><header><WowLinkBrand/><span className="cin-label">404 / A MOMENT MISPLACED</span></header><main><MomentMark/><span className="cin-label cin-gold">LET’S FIND YOUR WAY BACK</span><h1>This moment<br/><em>slipped away.</em></h1><p>The page you’re looking for isn’t here.<br/>There are still beautiful moments waiting to be made.</p><Link href="/templates" className="cin-cta cin-cta-light">Explore the collection <span>↗</span></Link><Link href="/" className="inv-replay-link">Back to the beginning ↑</Link></main></div>;
}
