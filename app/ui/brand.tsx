import Link from "next/link";

/** The arch doodle: a doorway, drawn inside invitations (it was the logo before the seal). */
export function MomentMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="M5 29V15.5a11 11 0 0 1 22 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 29V16.5a5.5 5.5 0 0 1 11 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="22" r="2.1" fill="currentColor"/></svg>;
}

/*
 * WowLink's seal: a sindoor-red wax seal, its edge scalloped like a marigold, and a w written in one stroke that loops
 * on, like a pen joining the next letter. An invitation is sealed; opening it is the wow. The paths are shared with
 * the icons and share images, which can't use the page's components.
 */
export const SEAL_EDGE = "M50 10A8.6 8.6 0 0 1 65.31 13.04A8.6 8.6 0 0 1 78.28 21.72A8.6 8.6 0 0 1 86.96 34.69A8.6 8.6 0 0 1 90 50A8.6 8.6 0 0 1 86.96 65.31A8.6 8.6 0 0 1 78.28 78.28A8.6 8.6 0 0 1 65.31 86.96A8.6 8.6 0 0 1 50 90A8.6 8.6 0 0 1 34.69 86.96A8.6 8.6 0 0 1 21.72 78.28A8.6 8.6 0 0 1 13.04 65.31A8.6 8.6 0 0 1 10 50A8.6 8.6 0 0 1 13.04 34.69A8.6 8.6 0 0 1 21.72 21.72A8.6 8.6 0 0 1 34.69 13.04A8.6 8.6 0 0 1 50 10Z";
export const SEAL_W = "M24 39.5C25.6 49.5 29 58.5 33.5 63.8C36.8 56.6 40.6 49.4 45.4 43.8C48.8 50.8 52.6 58.6 57 63.8C60.8 57 64.2 48.8 65.6 41.6C67.2 34 64 27.6 59.4 29.4C55.2 31.2 56.2 38.4 62 40.4C67 42.1 72.6 41.6 77 39";
export const SEAL_W_TRANSFORM = "translate(4 7.5) scale(.92)";
export const SEAL_RED = "#a8341f";
export const SEAL_CREAM = "#f6efe3";

/** The seal on its own. `ring`: the dashed inner ring, for sizes where it shows (not tiny icons). */
export function SealMark({ className = "", ring = true }: { className?: string; ring?: boolean }) {
  return <svg className={`seal-mark ${className}`} viewBox="0 0 100 100" aria-hidden="true">
    <path d={SEAL_EDGE} fill={SEAL_RED}/>
    {ring && <circle cx="50" cy="50" r="31" fill="none" stroke={SEAL_CREAM} strokeOpacity=".4" strokeWidth="1.4" strokeDasharray="1.6 3.2" strokeLinecap="round"/>}
    <path d={SEAL_W} transform={SEAL_W_TRANSFORM} fill="none" stroke={SEAL_CREAM} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

/** The logo: the seal and "wowlink", "link" in the page's accent. */
export function BrandLockup() {
  return <><SealMark/><span className="cin-wordmark">wow<b>link</b></span></>;
}

export function WowLinkBrand() {
  return <Link className="cin-logo" href="/" aria-label="WowLink home"><BrandLockup/></Link>;
}
