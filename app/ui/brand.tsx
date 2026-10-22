import Link from "next/link";

export function MomentMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2c0 9-5 14-14 14 9 0 14 5 14 14 0-9 5-14 14-14C21 16 16 11 16 2Z" fill="none" stroke="currentColor" strokeWidth="1.3"/><circle cx="16" cy="16" r="3" fill="currentColor"/></svg>;
}

export function WowLinkBrand() {
  return <Link className="cin-logo" href="/" aria-label="WowLink home"><MomentMark/>WOWLINK<span className="cin-logo-dot">®</span></Link>;
}
