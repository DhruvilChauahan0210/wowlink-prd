import Link from "next/link";

export function MomentMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="M5 29V15.5a11 11 0 0 1 22 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 29V16.5a5.5 5.5 0 0 1 11 0V29" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><circle cx="16" cy="22" r="2.1" fill="currentColor"/></svg>;
}

export function WowLinkBrand() {
  return <Link className="cin-logo" href="/" aria-label="WowLink home"><MomentMark/>WowLink</Link>;
}
