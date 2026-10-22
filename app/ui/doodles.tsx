// Small hand-drawn marks. Everything is drawn with currentColor so the surrounding theme decides the ink.
type Props = { className?: string };

const ink = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export function Flower({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="1.8">{Array.from({ length: 10 }, (_, i) => <ellipse key={i} cx="20" cy="9.5" rx="3.6" ry="7.2" transform={`rotate(${i * 36} 20 20)`}/>)}<circle cx="20" cy="20" r="3" fill="currentColor"/></svg>;
}

export function Rays({ className }: Props) {
  return <svg className={className} viewBox="0 0 44 40" {...ink} strokeWidth="3"><path d="M16 24 14 8M26 22 37 11M30 31 43 31"/></svg>;
}

export function ArrowCurl({ className }: Props) {
  return <svg className={className} viewBox="0 0 80 48" {...ink} strokeWidth="2.4"><path d="M4 38C18 8 50 4 72 22M62 13 73 23 61 31"/></svg>;
}

export function ArrowDown({ className }: Props) {
  return <svg className={className} viewBox="0 0 32 56" {...ink} strokeWidth="2.4"><path d="M18 3C12 16 22 30 16 50M6 40 16 52 27 40"/></svg>;
}

export function Star({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="2"><path d="M20 4 24.5 15.5 36 16 27 24 30 36 20 29.5 10 36 13 24 4 16 15.5 15.5Z"/></svg>;
}

export function Diya({ className }: Props) {
  return <svg className={className} viewBox="0 0 48 40" {...ink} strokeWidth="2"><path d="M5 24C6 36 42 36 43 24Z"/><path d="M24 22C17 16 22 10 24 2 28 9 31 17 24 22Z"/></svg>;
}

export function Pen({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 200" aria-hidden="true"><path d="M13 6C13 2 27 2 27 6V128H13Z" fill="#241a13"/><path d="M13 128H27L25 146H15Z" fill="#e0922f"/><path d="M15 146H25L20 196Z" fill="#d9c49a"/><path d="M20 160V184" stroke="#241a13" strokeWidth="1.4" strokeLinecap="round"/><path d="M27 14H31V64C31 68 27 70 27 70" fill="none" stroke="#e0922f" strokeWidth="2.2" strokeLinecap="round"/><path d="M13 6C13 2 27 2 27 6V128H13ZM13 128H27L25 146H15ZM15 146H25L20 196Z" fill="none" stroke="#241a13" strokeWidth="2" strokeLinejoin="round"/></svg>;
}
