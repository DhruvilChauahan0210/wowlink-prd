import type { CSSProperties, ReactNode } from "react";

/*
 * The four hand-drawn occasion illustrations. Every one is ink line work over loose colour washes,
 * drawn on a 360 × 440 sheet.
 *  - `.wash` groups are the colour, roughened by the #wash filter and set slightly off the lines.
 *  - `.ink` groups are the line work. With `drawing`, each group draws itself in order like a pen
 *    going over the page, and the washes bleed in afterwards.
 */

export type ArtName = "wedding" | "birthday" | "garba" | "opening";

const INK = "#2a1d14";
const C = {
  red: "#c2412d",
  marigold: "#f0a03a",
  sun: "#f6c453",
  leaf: "#6f8f4e",
  pink: "#e8899e",
  blush: "#f2b6c6",
  teal: "#4f9a94",
  sky: "#b9d3d0",
  cream: "#f6e3bf",
  clay: "#c8693f",
  berry: "#9c2f55",
  paper: "#fbf6ec",
};

type Props = { name: ArtName; className?: string; drawing?: boolean; fit?: "meet" | "slice"; label?: string; decorative?: boolean };

const LABELS: Record<ArtName, string> = {
  wedding: "A hand-drawn mandap hung with marigold garlands, with diyas glowing at its feet",
  birthday: "A hand-drawn three-tier birthday cake with candles, balloons and confetti",
  garba: "A hand-drawn garbo pot glowing with light, crossed dandiya sticks and a rangoli",
  opening: "A hand-drawn shopfront with a striped awning, an open sign and a ribbon tied in a bow",
};

export function Art({ name, className = "", drawing = false, fit = "meet", label, decorative = false }: Props) {
  const Scene = SCENES[name];
  return (
    <svg className={`art${drawing ? " is-drawing" : ""} ${className}`} viewBox="0 0 360 440" preserveAspectRatio={`xMidYMid ${fit}`} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? LABELS[name] })}>
      <Scene />
    </svg>
  );
}

/** The paint filters every drawing uses. The page mounts them once (layout.tsx); standalone images carry their own. */
export function ArtFilters({ boil = false }: { boil?: boolean }) {
  return <>
    {/* a steady hand-drawn wobble for ink */}
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
    {/* the same wobble, redrawn a few times a second, like hand-drawn animation */}
    {boil && <filter id="boil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="1" result="n"><animate attributeName="seed" values="1;4;7" dur="0.42s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>}
    {/* loose, mottled colour that bleeds past the lines */}
    <filter id="wash" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="shape"/><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="8" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.9 1.15" result="mottle"/><feComposite in="shape" in2="mottle" operator="in" result="tex"/><feOffset in="tex" dx="2.5" dy="2"/></filter>
  </>;
}

/** The same drawing as a self-contained SVG: its own filters and no page CSS. For images rendered off the page (share previews). */
export function StandaloneArt({ name }: { name: ArtName }) {
  const Scene = SCENES[name];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440" width="360" height="440">
      <defs>
        <style>{".ink{filter:url(#wobble)}"}</style>
        <ArtFilters/>
      </defs>
      <Scene />
    </svg>
  );
}

// ---------- shared pieces ----------

const delay = (d: number): CSSProperties => ({ "--d": `${d}s` } as CSSProperties);

function Wash({ d = 2.1, children }: { d?: number; children: ReactNode }) {
  return <g className="wash" filter="url(#wash)" style={delay(d)}>{children}</g>;
}
function Ink({ d = 0, w = 2.4, children }: { d?: number; w?: number; children: ReactNode }) {
  return <g className="ink" fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={delay(d)}>{children}</g>;
}

/** coordinates are rounded so the server and the browser print exactly the same markup */
const r2 = (v: number) => Math.round(v * 100) / 100;
const bez = (t: number, a: number, b: number, c: number, d: number) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
/** points along a cubic curve, for stringing marigolds, bunting and the like */
function along(n: number, p: [number, number, number, number, number, number, number, number]) {
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return [r2(bez(t, p[0], p[2], p[4], p[6])), r2(bez(t, p[1], p[3], p[5], p[7]))] as const;
  });
}

function Sparkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y - 8 * s}V${y + 8 * s}M${x - 8 * s} ${y}H${x + 8 * s}M${x - 4 * s} ${y - 4 * s}l${8 * s} ${8 * s}M${x + 4 * s} ${y - 4 * s}l${-8 * s} ${8 * s}`} strokeWidth={1.6} />;
}

function Bunting({ y = 26, sag = 18, colors }: { y?: number; sag?: number; colors: string[] }) {
  const curve: [number, number, number, number, number, number, number, number] = [-6, y, 110, y + sag, 250, y + sag, 366, y];
  const pts = along(13, curve);
  return (
    <>
      <Wash d={2.3}>
        {pts.slice(0, -1).map(([x, yy], i) => <path key={i} d={`M${x + 4} ${yy + 1}L${x + 24} ${yy + 2}L${x + 13} ${yy + 26}Z`} fill={colors[i % colors.length]} />)}
      </Wash>
      <Ink d={1.5} w={1.8}>
        <path d={`M${curve[0]} ${curve[1]}C${curve[2]} ${curve[3]} ${curve[4]} ${curve[5]} ${curve[6]} ${curve[7]}`} />
        {pts.slice(0, -1).map(([x, yy], i) => <path key={i} d={`M${x + 3} ${yy}L${x + 13} ${yy + 25}L${x + 23} ${yy + 1}`} />)}
      </Ink>
    </>
  );
}

// ---------- the wedding mandap ----------

function Wedding() {
  const garland = along(11, [98, 204, 136, 250, 224, 250, 262, 204]);
  const side = [214, 232, 250, 268, 286];
  const diyas: [number, number][] = [[52, 396], [150, 402], [210, 402], [308, 396]];
  return (
    <>
      <Wash>
        <circle cx="180" cy="196" r="134" fill={C.sun} opacity=".3" />
        <path d="M66 176C98 122 142 94 180 72 218 94 262 122 294 176Z" fill={C.red} />
        <path d="M58 176H302V198H58Z" fill={C.marigold} />
        <path d="M84 198H108V378H84ZM252 198H276V378H252Z" fill={C.cream} />
        <path d="M110 384V258C110 222 146 206 180 206 214 206 250 222 250 258V384Z" fill={C.pink} opacity=".45" />
        <path d="M168 62C164 52 196 52 192 62 190 70 170 70 168 62Z" fill={C.marigold} />
        <path d="M176 48C170 36 180 30 180 24 184 32 190 38 184 48Z" fill={C.leaf} />
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={i % 3 === 1 ? C.red : C.marigold} />)}
        {side.map((y) => <circle key={`l${y}`} cx="117" cy={y} r="6" fill={C.marigold} />)}
        {side.map((y) => <circle key={`r${y}`} cx="243" cy={y} r="6" fill={C.marigold} />)}
        {diyas.map(([x, y]) => <g key={x}><path d={`M${x - 15} ${y - 4}C${x - 13} ${y + 8} ${x + 13} ${y + 8} ${x + 15} ${y - 4}Z`} fill={C.red} /><path d={`M${x} ${y - 6}C${x - 6} ${y - 12} ${x - 2} ${y - 20} ${x} ${y - 26}C${x + 3} ${y - 20} ${x + 7} ${y - 12} ${x} ${y - 6}Z`} fill={C.sun} /></g>)}
        <path d="M18 392C110 386 250 398 342 390L342 414L18 414Z" fill={C.leaf} opacity=".28" />
      </Wash>
      <Ink d={0}>
        <path d="M64 176C98 120 142 94 180 72 218 94 262 120 296 176" />
        <path d="M56 176H304M58 198H302" />
        <path d="M56 176L58 198M304 176L302 198" />
        <path d="M84 198V378M108 198V378M252 198V378M276 198V378" />
        <path d="M80 210H112M248 210H280M78 378H114V392H78ZM246 378H282V392H246Z" />
        <path d="M110 384V258C110 222 146 206 180 206 214 206 250 222 250 258V384" />
        <path d="M128 384V264C128 238 152 226 180 226 208 226 232 238 232 264V384" strokeWidth="1.6" />
      </Ink>
      <Ink d={0.9} w={2}>
        <path d={`M58 198${Array.from({ length: 12 }, () => "q10 12 20 0").join("")}`} />
        <path d="M168 72C164 60 196 60 192 72M170 62H190" />
        <path d="M176 48C170 36 180 30 180 24 184 32 190 38 184 48M180 48V58" />
        <path d="M98 204C136 250 224 250 262 204" strokeWidth="1.4" />
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" />)}
        <path d="M117 204V292M243 204V292" strokeWidth="1.4" />
        {side.map((y) => <circle key={`l${y}`} cx="117" cy={y} r="5.5" />)}
        {side.map((y) => <circle key={`r${y}`} cx="243" cy={y} r="5.5" />)}
      </Ink>
      <Ink d={1.6} w={2}>
        <path d="M16 398C110 390 250 404 344 394" />
        {diyas.map(([x, y]) => <g key={x}><path d={`M${x - 16} ${y - 4}C${x - 13} ${y + 9} ${x + 13} ${y + 9} ${x + 16} ${y - 4}Z`} /><path d={`M${x} ${y - 6}C${x - 6} ${y - 12} ${x - 2} ${y - 20} ${x} ${y - 26}C${x + 3} ${y - 20} ${x + 7} ${y - 12} ${x} ${y - 6}Z`} /></g>)}
        <Sparkle x={46} y={92} />
        <Sparkle x={316} y={110} s={0.8} />
        <Sparkle x={300} y={46} s={0.6} />
        <Sparkle x={70} y={150} s={0.6} />
      </Ink>
    </>
  );
}

// ---------- the birthday cake ----------

const DROPS = [22, 12, 28, 16, 24, 10, 26, 14, 20, 12, 24, 16];
function drip(x0: number, x1: number, y: number) {
  const n = Math.round((x1 - x0) / 16);
  const w = r2((x1 - x0) / n);
  let d = `M${x0} ${y}H${x1}V${y + 8}`;
  for (let i = 0; i < n; i++) {
    const x = r2(x1 - i * w);
    const h = DROPS[(i + Math.round(x0)) % DROPS.length];
    d += `C${x - 2} ${y + 8 + h} ${x - w + 2} ${y + 8 + h} ${x - w} ${y + 8}`;
  }
  return `${d}Z`;
}

function Birthday() {
  const tiers: [number, number, number, number, string][] = [
    [84, 276, 300, 382, C.blush],
    [110, 250, 238, 300, C.cream],
    [138, 222, 184, 238, C.sky],
  ];
  const candles = [154, 167, 180, 193, 206];
  const balloons: [number, number, number, number, string, string][] = [
    [66, 116, 26, 32, C.pink, "M66 148C74 190 54 230 70 290"],
    [112, 72, 22, 28, C.teal, "M112 100C120 150 100 180 112 236"],
    [296, 100, 27, 33, C.sun, "M296 133C286 180 306 220 292 300"],
  ];
  const confetti: [number, number, string][] = [[40, 230, C.red], [320, 200, C.teal], [30, 320, C.sun], [330, 300, C.pink], [250, 150, C.marigold], [214, 120, C.pink], [150, 120, C.teal], [56, 380, C.marigold], [312, 372, C.red]];
  return (
    <>
      <Bunting colors={[C.pink, C.sun, C.teal, C.marigold]} />
      <Wash>
        <circle cx="180" cy="250" r="140" fill={C.blush} opacity=".28" />
        <ellipse cx="180" cy="386" rx="128" ry="15" fill={C.cream} />
        {tiers.map(([x0, x1, y0, y1, f]) => <path key={y0} d={`M${x0} ${y0}H${x1}V${y1}H${x0}Z`} fill={f} />)}
        {tiers.map(([x0, x1, y0]) => <path key={`i${y0}`} d={drip(x0, x1, y0)} fill={C.paper} />)}
        {candles.map((x, i) => <path key={x} d={`M${x - 3} 160H${x + 3}V186H${x - 3}Z`} fill={i % 2 ? C.teal : C.red} />)}
        {candles.map((x) => <path key={`f${x}`} d={`M${x} 156C${x - 5} 150 ${x - 2} 142 ${x} 136C${x + 3} 142 ${x + 6} 150 ${x} 156Z`} fill={C.sun} />)}
        {balloons.map(([x, y, rx, ry, f]) => <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill={f} />)}
        {confetti.map(([x, y, f], i) => <rect key={i} x={x} y={y} width="8" height="5" rx="1.5" fill={f} transform={`rotate(${i * 37} ${x} ${y})`} />)}
      </Wash>
      <Ink d={0}>
        <ellipse cx="180" cy="386" rx="130" ry="16" />
        {tiers.map(([x0, x1, y0, y1]) => <path key={y0} d={`M${x0} ${y0}H${x1}V${y1}H${x0}Z`} />)}
      </Ink>
      <Ink d={0.8} w={1.8}>
        {tiers.map(([x0, x1, y0]) => <path key={y0} d={drip(x0, x1, y0)} />)}
        {candles.map((x) => <path key={x} d={`M${x - 3} 160H${x + 3}V186H${x - 3}ZM${x} 160V154`} />)}
        {candles.map((x) => <path key={`f${x}`} d={`M${x} 156C${x - 5} 150 ${x - 2} 142 ${x} 136C${x + 3} 142 ${x + 6} 150 ${x} 156Z`} />)}
        <path d="M100 344C120 350 140 338 160 344S200 352 220 344 252 338 262 346" strokeWidth="1.4" />
        <path d="M126 272C146 278 166 266 186 272S222 280 236 272" strokeWidth="1.4" />
      </Ink>
      <Ink d={1.4} w={2}>
        {balloons.map(([x, y, rx, ry, , str]) => <g key={x}><ellipse cx={x} cy={y} rx={rx} ry={ry} /><path d={`M${x - 4} ${y + ry + 6}L${x} ${y + ry}L${x + 4} ${y + ry + 6}Z`} /><path d={str} strokeWidth="1.4" /><path d={`M${r2(x - rx * 0.45)} ${r2(y - ry * 0.4)}C${r2(x - rx * 0.35)} ${r2(y - ry * 0.65)} ${r2(x - rx * 0.1)} ${r2(y - ry * 0.75)} ${r2(x + rx * 0.05)} ${r2(y - ry * 0.72)}`} strokeWidth="1.4" /></g>)}
        <path d="M30 254c4-6 10-6 14 0s10 6 14 0M300 252c4-6 10-6 14 0s10 6 14 0M232 196c4-6 10-6 14 0" strokeWidth="1.6" />
        <Sparkle x={250} y={92} s={0.7} />
        <Sparkle x={36} y={190} s={0.6} />
      </Ink>
    </>
  );
}

// ---------- the garbo pot ----------

function Garba() {
  const holes: [number, number][] = [];
  [[222, 5], [252, 6], [282, 6], [310, 5]].forEach(([y, n], row) => {
    for (let i = 0; i < n; i++) holes.push([r2(180 + (i - (n - 1) / 2) * 22 + (row % 2) * 4), y]);
  });
  const petals = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [r2(180 + Math.cos(a) * 96), r2(380 + Math.sin(a) * 20), r2((a * 180) / Math.PI)] as const;
  });
  const lanterns: [number, number, string][] = [[62, 70, C.red], [298, 58, C.marigold]];
  const stick = (rot: number, colors: [string, string]) => (
    <g transform={`translate(292 336) rotate(${rot})`}>
      <rect x="-5" y="-92" width="10" height="184" rx="5" fill={colors[0]} />
      {[-70, -40, -10, 20, 50].map((y) => <rect key={y} x="-5" y={y} width="10" height="12" fill={colors[1]} />)}
    </g>
  );
  return (
    <>
      <Wash>
        <circle cx="180" cy="250" r="138" fill={C.sun} opacity=".3" />
        <ellipse cx="180" cy="380" rx="140" ry="30" fill={C.pink} opacity=".4" />
        {petals.map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="13" ry="5" fill={i % 2 ? C.marigold : C.red} transform={`rotate(${a + 90} ${x} ${y})`} />)}
        <ellipse cx="180" cy="380" rx="34" ry="8" fill={C.leaf} />
        {stick(28, [C.red, C.sun])}
        {stick(-28, [C.teal, C.marigold])}
        <path d="M128 196C88 222 92 318 140 336 160 344 200 344 220 336 268 318 272 222 232 196Z" fill={C.clay} />
        <ellipse cx="180" cy="188" rx="42" ry="10" fill={C.berry} />
        {holes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={C.sun} />)}
        <path d="M180 180C170 166 178 154 180 140 186 154 192 166 180 180Z" fill={C.sun} />
        {lanterns.map(([x, y, f]) => <path key={x} d={`M${x} ${y}L${x + 20} ${y + 30}L${x} ${y + 62}L${x - 20} ${y + 30}Z`} fill={f} />)}
      </Wash>
      <Ink d={0}>
        <path d="M128 196C88 222 92 318 140 336 160 344 200 344 220 336 268 318 272 222 232 196" />
        <path d="M146 196C146 184 214 184 214 196" />
        <ellipse cx="180" cy="188" rx="44" ry="10" />
        <path d="M150 340C150 352 210 352 210 340" />
        <g transform="translate(292 336) rotate(28)"><rect x="-5" y="-92" width="10" height="184" rx="5" /></g>
        <g transform="translate(292 336) rotate(-28)"><rect x="-5" y="-92" width="10" height="184" rx="5" /></g>
      </Ink>
      <Ink d={0.9} w={1.8}>
        {holes.map(([x, y], i) => <path key={i} d={`M${x} ${y - 5}C${x - 4} ${y - 1} ${x - 4} ${y + 4} ${x} ${y + 4} ${x + 4} ${y + 4} ${x + 4} ${y - 1} ${x} ${y - 5}Z`} />)}
        <path d="M108 238C150 228 210 228 252 238M104 300C150 310 210 310 256 300" strokeWidth="1.4" />
        <path d="M180 180C170 166 178 154 180 140 186 154 192 166 180 180Z" />
        <ellipse cx="180" cy="380" rx="142" ry="31" />
        <ellipse cx="180" cy="380" rx="34" ry="8" />
        {petals.map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="13" ry="5" transform={`rotate(${a + 90} ${x} ${y})`} />)}
      </Ink>
      <Ink d={1.6} w={1.8}>
        {lanterns.map(([x, y]) => <g key={x}><path d={`M${x} 0V${y}`} strokeWidth="1.3" /><path d={`M${x} ${y}L${x + 20} ${y + 30}L${x} ${y + 62}L${x - 20} ${y + 30}Z`} /><path d={`M${x - 20} ${y + 30}H${x + 20}M${x} ${y + 62}V${y + 76}M${x - 5} ${y + 74}L${x - 7} ${y + 86}M${x + 5} ${y + 74}L${x + 7} ${y + 86}`} strokeWidth="1.4" /></g>)}
        <path d="M40 200c6-8 14-8 20 0M300 180c6-8 14-8 20 0M60 300c6-8 14-8 20 0" strokeWidth="1.6" />
        <Sparkle x={120} y={120} s={0.7} />
        <Sparkle x={244} y={110} s={0.6} />
        <Sparkle x={30} y={134} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- the shop opening ----------

function Opening() {
  const stripes = Array.from({ length: 12 }, (_, i) => 60 + i * 20);
  const leaves = (x: number) => `M${x} 352C${x - 14} 336 ${x - 10} 320 ${x - 2} 312M${x} 352C${x + 2} 332 ${x + 10} 322 ${x + 16} 318M${x} 352C${x - 4} 334 ${x - 2} 316 ${x + 2} 304`;
  return (
    <>
      <Bunting y={18} sag={14} colors={[C.red, C.sun, C.leaf, C.marigold]} />
      <Wash>
        <circle cx="180" cy="250" r="138" fill={C.sun} opacity=".25" />
        <path d="M70 150H290V384H70Z" fill={C.cream} />
        {stripes.map((x, i) => <path key={x} d={`M${x} 118H${x + 20}V148Q${x + 10} 162 ${x} 148Z`} fill={i % 2 ? C.paper : C.red} />)}
        <path d="M150 238H210V384H150Z" fill={C.leaf} />
        <path d="M84 182H138V262H84ZM222 182H276V262H222Z" fill={C.sky} />
        <path d="M118 66H242V104H118Z" fill={C.marigold} />
        <path d="M52 296C120 290 240 304 308 294L308 306C240 316 120 302 52 308Z" fill={C.red} />
        <path d="M180 300C160 278 140 280 140 296 140 312 162 312 180 300ZM180 300C200 278 220 280 220 296 220 312 198 312 180 300ZM176 304L164 336 172 334 178 342 182 306ZM184 304L196 336 188 334 182 342Z" fill={C.red} />
        <path d="M94 352H118L114 380H98ZM242 352H266L262 380H246Z" fill={C.clay} />
        <path d="M100 330C90 314 96 300 106 296 114 304 116 320 106 334ZM248 330C238 314 244 300 254 296 262 304 264 320 254 334Z" fill={C.leaf} />
      </Wash>
      <Ink d={0}>
        <path d="M70 150V384H290V150" />
        <path d="M56 118H304" />
        <path d={`M60 148${Array.from({ length: 12 }, () => "q10 14 20 0").join("")}`} />
        {stripes.map((x) => <path key={x} d={`M${x} 118V148`} strokeWidth="1.5" />)}
        <path d="M60 118V148M300 118V148" />
        <path d="M150 384V238H210V384" />
        <path d="M84 182H138V262H84ZM222 182H276V262H222Z" />
        <path d="M30 384H330" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d="M111 182V262M84 222H138M249 182V262M222 222H276" strokeWidth="1.4" />
        <path d="M160 250H200V320H160Z" strokeWidth="1.4" />
        <circle cx="200" cy="330" r="3" />
        <path d="M118 66H242V104H118ZM140 66L150 30M220 66L210 30M150 30H210" />
        <text x="180" y="96" textAnchor="middle" fill={INK} stroke="none" style={{ fontFamily: "var(--font-hand), cursive" }} fontWeight="700" fontSize="30">OPEN</text>
        <path d="M94 352H118L114 380H98ZM242 352H266L262 380H246Z" />
        <path d={leaves(106)} />
        <path d={leaves(254)} />
      </Ink>
      <Ink d={1.6} w={2}>
        <path d="M52 296C120 290 240 304 308 294M52 308C120 302 240 316 308 306M52 296V308M308 294V306" />
        <path d="M180 300C160 278 140 280 140 296 140 312 162 312 180 300ZM180 300C200 278 220 280 220 296 220 312 198 312 180 300Z" />
        <path d="M176 304L164 336 172 334 178 342 182 306M184 304L196 336 188 334 182 342" />
        <circle cx="180" cy="300" r="5" />
        <g transform="translate(318 362) rotate(-20)"><circle cx="-8" cy="8" r="5" /><circle cx="8" cy="8" r="5" /><path d="M-5 4L10-22M5 4L-10-22" /></g>
        <Sparkle x={38} y={200} s={0.7} />
        <Sparkle x={324} y={214} s={0.6} />
      </Ink>
    </>
  );
}

const SCENES: Record<ArtName, () => ReactNode> = { wedding: Wedding, birthday: Birthday, garba: Garba, opening: Opening };
