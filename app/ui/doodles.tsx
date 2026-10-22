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

/** A henna-style leaf with a curl, for the mehndi. */
export function Leaf({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="2"><path d="M8 32C8 18 18 8 32 8 32 22 22 32 8 32Z"/><path d="M8 32 26 14M15 25l-3-6M20 20l-2-7M21 25l6-1M26 19l5-1"/></svg>;
}

/** A bowl of haldi paste. */
export function Bowl({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="2"><path d="M6 20C7 31 33 31 34 20Z"/><path d="M10 20C12 15 28 15 30 20"/><path d="M15 17l1-2M20 16v-2M25 17l-1-2"/></svg>;
}

/** Two quavers, for the sangeet and anything with music. */
export function Note({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="2.2"><path d="M15 29V9L31 6V26"/><path d="M15 13 31 10"/><ellipse cx="11" cy="29" rx="4.5" ry="3.5"/><ellipse cx="27" cy="26" rx="4.5" ry="3.5"/></svg>;
}

/** A ring with a little stone, for an engagement. */
export function Ring({ className }: Props) {
  return <svg className={className} viewBox="0 0 40 40" {...ink} strokeWidth="2.2"><circle cx="20" cy="25" r="10"/><path d="M15 12 20 6 25 12 20 16Z"/></svg>;
}
