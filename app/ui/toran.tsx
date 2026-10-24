/**
 * The toran over WowLink's doorways: a bandhanwar drawn like the occasions' art (ink over washes of colour), mango
 * leaves hanging from a cord, small marigolds between them, and here and there a short string of marigolds ending in a
 * brass bell. It hangs across the top of the home page and of every page's footer (`dark`: drawn in light ink).
 */
export function Toran({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const ink = dark ? "#f6efe3" : "#2a1d14";
  const width = 2400, step = 240;
  // Whole-number arithmetic, rounded: the server and the browser draw exactly the same garland (Math.sin can differ
  // in the last digits between them, and React would see a mismatch).
  const rand = (n: number) => ((n * 2654435761 + 1013904223) % 4294967296) / 4294967296;
  const round = (n: number) => Math.round(n * 100) / 100;
  const greens = ["#6f8f4e", "#7d9a52", "#5e7d43", "#88a35b"];
  const cord: string[] = [];
  const leaves: { x: number; y: number; turn: number; size: number; fill: string }[] = [];
  const flowers: { x: number; y: number; r: number; fill: string }[] = [];
  const drops: number[] = [];
  for (let k = 0; k * step < width; k++) {
    const x0 = k * step;
    cord.push(`M${x0} 10Q${x0 + step / 2} 40 ${x0 + step} 10`);
    const at = (t: number) => ({ x: round(x0 + t * step), y: round(10 + 60 * t * (1 - t)) });
    for (let j = 0; j < 8; j++) {
      const n = k * 8 + j;
      const leaf = at((j + 0.5) / 8);
      leaves.push({ ...leaf, turn: round((rand(n) - 0.5) * 16), size: round(0.84 + rand(n + 7) * 0.3), fill: greens[n % greens.length] });
      if (j > 0) flowers.push({ ...at(j / 8), r: round(6 + rand(n + 3) * 1.5), fill: j % 4 === 0 ? "#c2412d" : j % 2 ? "#f0a03a" : "#f6c453" });
    }
    drops.push(x0);
  }
  const leaf = "M0 0C-9 9-11 29 0 47C11 29 9 9 0 0Z";
  return <svg className={className} viewBox={`0 0 ${width} 84`} preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <g filter="url(#wash)">
      {leaves.map((l, i) => <path key={i} d={leaf} fill={l.fill} transform={`translate(${l.x} ${l.y}) rotate(${l.turn}) scale(${l.size})`}/>)}
      {flowers.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.fill}/>)}
      {drops.map((x) => <g key={x} transform={`translate(${x} 0)`}>
        {[22, 35, 48].map((y, i) => <circle key={y} cy={y} r="6.5" fill={i % 2 ? "#f6c453" : "#f0a03a"}/>)}
        <path d="M-7 68C-7 58 7 58 7 68L9 72H-9Z" fill="#e5b36a"/>
        <circle cy="10" r="8.5" fill="#c2412d"/>
      </g>)}
    </g>
    <g filter="url(#wobble)" fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
      {cord.map((d, i) => <path key={i} d={d} strokeOpacity=".55" strokeWidth="1.5"/>)}
      {leaves.map((l, i) => <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.turn}) scale(${l.size})`} strokeOpacity=".6" strokeWidth="1.3">
        <path d={leaf}/><path d="M0 3C1 18 1 32 0 44" strokeOpacity=".35"/>
      </g>)}
      {flowers.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={f.r} strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="2.2 1.7"/>)}
      {drops.map((x) => <g key={x} transform={`translate(${x} 0)`} strokeOpacity=".55" strokeWidth="1.2">
        <path d="M0 14V62" strokeOpacity=".4"/>
        {[22, 35, 48].map((y) => <circle key={y} cy={y} r="6.5" strokeDasharray="2.2 1.7"/>)}
        <path d="M-7 68C-7 58 7 58 7 68L9 72H-9Z"/><circle cy="75" r="2" fill={ink} fillOpacity=".6"/>
        <circle cy="10" r="8.5" strokeDasharray="2.6 2"/>
      </g>)}
    </g>
  </svg>;
}
