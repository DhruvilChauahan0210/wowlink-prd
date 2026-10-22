import Link from "next/link";
import { MomentMark, WowLinkBrand } from "./ui/brand";

export default function NotFound() {
  return <div className="cinema inv-not-found theme-paper"><header><WowLinkBrand/><span className="inv-nf-code">Error 404</span></header><main><MomentMark/><h1>This page <em>slipped away.</em></h1><p>The page you’re looking for isn’t here, but there are plenty of invitations waiting to be made.</p><Link href="/templates" className="cin-cta cin-cta-light">Browse templates</Link><Link href="/" className="inv-replay-link">Back to home</Link></main></div>;
}
