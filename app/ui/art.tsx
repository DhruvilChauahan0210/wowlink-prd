import type { CSSProperties, ReactNode } from "react";

/*
 * The twelve hand-drawn occasion illustrations. Every one is ink line work over loose colour washes,
 * drawn on a 360 × 440 sheet.
 *  - `.wash` groups are the colour, roughened by the #wash filter and set slightly off the lines.
 *  - `.ink` groups are the line work. With `drawing`, each group draws itself in order like a pen
 *    going over the page, and the washes bleed in afterwards.
 */

export const ART_NAMES = ["wedding", "birthday", "garba", "opening", "engagement", "babyshower", "housewarming", "anniversary", "diwali", "janoi", "puja", "naming"] as const;
export type ArtName = (typeof ART_NAMES)[number];
export const isArtName = (value: unknown): value is ArtName => ART_NAMES.includes(value as ArtName);

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
  engagement: "A hand-drawn open ring box with two rings on a brass thali, with rose petals and a bowl of gol dhana",
  babyshower: "A hand-drawn wooden cradle hung with little toys, under a crescent moon and stars",
  housewarming: "A hand-drawn front door with a mango-leaf toran, a kalash, a tulsi pot and kumkum footprints leading in",
  anniversary: "Two hand-drawn glasses of chai with their steam curling into a heart, under a string of fairy lights",
  diwali: "A hand-drawn row of lit clay diyas on a rangoli, with star lanterns, a marigold toran and an open box of mithai",
  janoi: "A hand-drawn brass thali with the sacred thread coiled on it beside kumkum and rice, a small havan kund in flame and a kalash with mango leaves and a coconut",
  puja: "A hand-drawn puja chowki in red cloth between two banana plants, with a kalash topped by a coconut and mango leaves, a conch, a bowl of sheera prasad, and an aarti thali with a lit diya beside curling incense",
  naming: "A hand-drawn brass thali of rice with a swirl traced in it, a pipal leaf, silver payal and a wooden toy elephant, under strings of little bells",
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

/**
 * A drawing that doesn't animate, as an image (/art/<name>.svg, prerendered). A browser paints an SVG image once and
 * reuses the result, while inline SVG with paint filters is repainted whenever it moves or scales. On a phone that's
 * the difference between a smooth and a stuttering scroll through the reel or the catalogue.
 */
export function ArtImage({ name, fit = "meet", className = "" }: { name: ArtName; fit?: "meet" | "slice"; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a prerendered SVG drawing; next/image adds nothing here
  return <img className={`art-image ${className}`} src={`/art/${name}.svg`} alt="" width={360} height={440} decoding="async" draggable={false} style={{ objectFit: fit === "slice" ? "cover" : "contain" }} />;
}

/** The same drawing as a self-contained SVG: its own filters and no page CSS. For images (ArtImage, share previews). */
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
        {/* "OPEN", lettered by hand (so it reads the same wherever the drawing goes, images included) */}
        <ellipse cx="151" cy="86" rx="9" ry="12" />
        <path d="M167 98V74H174C182 74 182 87 174 87H167M199 74H187V98H199M187 86H196M205 98V74L219 98V74" />
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

// ---------- the engagement: an open ring box on a brass thali ----------

function Engagement() {
  const garland = along(13, [14, 34, 120, 84, 240, 84, 346, 34]);
  const petals: [number, number, number, string][] = [[66, 334, 20, C.red], [94, 356, -30, C.pink], [252, 360, 40, C.red], [286, 300, -10, C.pink], [124, 366, 70, C.blush], [222, 368, -60, C.red], [56, 352, 10, C.blush]];
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="136" fill={C.blush} opacity=".3" />
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={i % 3 === 1 ? C.red : C.marigold} />)}
        <ellipse cx="180" cy="340" rx="140" ry="36" fill={C.sun} opacity=".55" />
        <path d="M120 176H240L248 252H112Z" fill={C.berry} />
        <path d="M132 186H228L234 244H126Z" fill={C.pink} opacity=".7" />
        <path d="M112 252H248V318C248 326 242 330 234 330H126C118 330 112 326 112 318Z" fill={C.berry} />
        <ellipse cx="180" cy="262" rx="58" ry="14" fill={C.blush} />
        <circle cx="162" cy="236" r="20" fill="none" stroke={C.marigold} strokeWidth="7" />
        <circle cx="198" cy="232" r="20" fill="none" stroke={C.sun} strokeWidth="7" />
        <path d="M198 194L208 204L198 214L188 204Z" fill={C.sky} />
        {petals.map(([x, y, a, f], i) => <ellipse key={i} cx={x} cy={y} rx="10" ry="6" fill={f} transform={`rotate(${a} ${x} ${y})`} />)}
        <path d="M264 318C266 336 314 336 316 318Z" fill={C.clay} />
        <path d="M268 318C274 302 306 302 312 318Z" fill={C.marigold} />
      </Wash>
      <Ink d={0}>
        <ellipse cx="180" cy="340" rx="142" ry="37" />
        <ellipse cx="180" cy="336" rx="118" ry="26" strokeWidth="1.4" />
        <path d="M112 252H248V318C248 326 242 330 234 330H126C118 330 112 326 112 318Z" />
        <path d="M112 252L120 176H240L248 252" />
        <path d="M132 186H228L234 244H126Z" strokeWidth="1.6" />
        <ellipse cx="180" cy="262" rx="58" ry="14" />
      </Ink>
      <Ink d={0.9} w={2}>
        <circle cx="162" cy="236" r="20" /><circle cx="162" cy="236" r="14" strokeWidth="1.4" />
        <circle cx="198" cy="232" r="20" /><circle cx="198" cy="232" r="14" strokeWidth="1.4" />
        <path d="M198 194L208 204L198 214L188 204ZM188 204H208M198 194V214" strokeWidth="1.4" />
        {petals.map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="10" ry="6" transform={`rotate(${a} ${x} ${y})`} strokeWidth="1.4" />)}
        <path d="M264 318C266 336 314 336 316 318Z" />
        <path d="M268 318C274 302 306 302 312 318" strokeWidth="1.6" />
        <path d="M280 310h1M292 306h1M300 312h1M286 314h1" strokeWidth="3" />
      </Ink>
      <Ink d={1.6} w={1.8}>
        <path d="M14 34C120 84 240 84 346 34" strokeWidth="1.3" />
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" />)}
        <path d="M300 236C290 226 290 216 300 220C310 216 310 226 300 236Z" />
        <Sparkle x={60} y={150} s={0.8} />
        <Sparkle x={306} y={160} s={0.6} />
        <Sparkle x={244} y={130} s={0.5} />
        <Sparkle x={86} y={226} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- the baby shower: a wooden ghodiyu cradle under the moon ----------

/** A five-pointed star centred on x, y. */
const star = (x: number, y: number, r: number) => Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const d = i % 2 ? r * 0.45 : r;
  return `${i ? "L" : "M"}${r2(x + Math.cos(a) * d)} ${r2(y + Math.sin(a) * d)}`;
}).join("") + "Z";

function BabyShower() {
  return (
    <>
      <Bunting y={20} sag={14} colors={[C.sky, C.blush, C.sun, C.teal]} />
      <Wash>
        <circle cx="180" cy="250" r="138" fill={C.sky} opacity=".35" />
        <path d="M300 92C276 92 262 110 262 130C262 152 280 168 300 168C286 160 278 146 278 130C278 112 288 98 300 92Z" fill={C.sun} />
        <path d="M86 392L120 116H132L102 392ZM274 392L240 116H228L258 392Z" fill={C.clay} opacity=".75" />
        <path d="M112 106H248V122H112Z" fill={C.clay} />
        <path d="M104 262C104 330 256 330 256 262Z" fill={C.marigold} />
        <path d="M112 262C118 300 242 300 248 262Z" fill={C.red} opacity=".3" />
        <path d="M118 262C124 252 236 252 242 262Z" fill={C.blush} />
        <circle cx="160" cy="186" r="9" fill={C.red} />
        <path d={star(182, 178, 11)} fill={C.sun} />
        <path d="M200 190C196 178 210 170 216 178C222 186 212 196 200 190Z" fill={C.leaf} />
        <ellipse cx="180" cy="396" rx="130" ry="12" fill={C.leaf} opacity=".25" />
      </Wash>
      <Ink d={0}>
        <path d="M86 392L120 116M102 392L132 116M274 392L240 116M258 392L228 116" />
        <path d="M112 106H248V122H112Z" />
        <path d="M80 392H108M252 392H280" />
        <path d="M144 122V262M216 122V262" strokeWidth="1.6" />
        <path d="M104 262C104 330 256 330 256 262Z" />
        <path d="M96 262H264" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d="M112 262C118 300 242 300 248 262" strokeWidth="1.4" />
        <path d={`M120 294${"q8 8 16 0".repeat(8)}`} strokeWidth="1.3" />
        <path d="M118 262C124 252 236 252 242 262" />
        <path d="M160 122V177M182 122V167M206 122V174" strokeWidth="1.2" />
        <circle cx="160" cy="186" r="9" />
        <path d={star(182, 178, 11)} />
        <path d="M200 190C196 178 210 170 216 178C222 186 212 196 200 190ZM216 178L222 176" />
        <path d="M300 92C276 92 262 110 262 130C262 152 280 168 300 168C286 160 278 146 278 130C278 112 288 98 300 92Z" />
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M40 398C120 392 240 402 320 394" />
        <path d="M296 250c4-6 10-6 14 0M44 300c4-6 10-6 14 0M60 208c4-6 10-6 14 0" />
        <Sparkle x={52} y={84} s={0.7} />
        <Sparkle x={240} y={84} s={0.5} />
        <Sparkle x={318} y={206} s={0.6} />
      </Ink>
    </>
  );
}

// ---------- the housewarming: the front door, with a toran, a kalash and footsteps going in ----------

function foot(x: number, y: number, a: number) {
  return <g transform={`rotate(${a} ${x} ${y})`}><ellipse cx={x} cy={y} rx="5" ry="9" />{[[-4, -12], [-1.5, -14], [1.5, -14.5], [4, -13]].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy} r="1.5" />)}</g>;
}

function Housewarming() {
  const toran = along(9, [132, 244, 156, 258, 204, 258, 228, 244]);
  const leaf = (x: number, y: number) => `M${x} ${y}C${x - 6} ${y + 8} ${x - 4} ${y + 18} ${x} ${y + 24}C${x + 4} ${y + 18} ${x + 6} ${y + 8} ${x} ${y}Z`;
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.sun} opacity=".25" />
        <path d="M46 172L180 70L314 172Z" fill={C.clay} />
        <path d="M64 166H296V380H64Z" fill={C.cream} />
        <path d="M130 240H230V380H130Z" fill={C.berry} opacity=".8" />
        <path d="M84 196H120V238H84ZM240 196H276V238H240Z" fill={C.sky} />
        {toran.map(([x, y], i) => (i % 2 ? <circle key={i} cx={x} cy={y + 6} r="6" fill={C.marigold} /> : <path key={i} d={leaf(x, y)} fill={C.leaf} />))}
        <path d="M250 352C238 358 238 382 264 386C290 382 290 358 278 352Z" fill={C.marigold} />
        <circle cx="264" cy="334" r="10" fill={C.clay} />
        <path d="M80 344H116L112 380H84Z" fill={C.red} opacity=".7" />
        <path d="M98 344C88 330 90 316 98 308C106 316 108 330 98 344Z" fill={C.leaf} />
        <path d="M112 380H248V394H112Z" fill={C.cream} />
        <g fill={C.red}>{foot(170, 426, -8)}{foot(190, 412, 8)}</g>
        {[[138, 388], [222, 388]].map(([x, y]) => <path key={x} d={`M${x} ${y - 4}C${x - 5} ${y - 10} ${x - 2} ${y - 16} ${x} ${y - 21}C${x + 2} ${y - 16} ${x + 5} ${y - 10} ${x} ${y - 4}Z`} fill={C.sun} />)}
      </Wash>
      <Ink d={0}>
        <path d="M46 172L180 70L314 172" />
        <path d="M64 166V380H296V166" />
        <path d="M130 380V240H230V380M180 240V380" />
        <path d="M140 252H172V312H140ZM188 252H220V312H188Z" strokeWidth="1.5" />
        <path d="M84 196H120V238H84ZM240 196H276V238H240ZM102 196V238M258 196V238" />
        <path d="M112 380H248V394H112Z" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <circle cx="174" cy="330" r="4" /><circle cx="186" cy="330" r="4" />
        <path d="M132 244C156 258 204 258 228 244" strokeWidth="1.3" />
        {toran.map(([x, y], i) => (i % 2 ? <circle key={i} cx={x} cy={y + 6} r="5.5" /> : <path key={i} d={leaf(x, y)} strokeWidth="1.4" />))}
        <path d="M250 352C238 358 238 382 264 386C290 382 290 358 278 352ZM254 344H274V352H254Z" />
        <circle cx="264" cy="334" r="10" />
        <path d="M256 344C244 338 238 328 240 320M272 344C284 338 290 328 288 320" strokeWidth="1.4" />
        <path d="M80 344H116L112 380H84Z" />
        <path d="M98 344C88 330 90 316 98 308C106 316 108 330 98 344ZM98 344V320" strokeWidth="1.4" />
      </Ink>
      <Ink d={1.6} w={1.6}>
        {[[138, 388], [222, 388]].map(([x, y]) => <g key={x}><path d={`M${x - 10} ${y - 2}C${x - 8} ${y + 6} ${x + 8} ${y + 6} ${x + 10} ${y - 2}Z`} /><path d={`M${x} ${y - 4}C${x - 5} ${y - 10} ${x - 2} ${y - 16} ${x} ${y - 21}C${x + 2} ${y - 16} ${x + 5} ${y - 10} ${x} ${y - 4}Z`} /></g>)}
        <path d="M30 380H330" />
        <Sparkle x={40} y={100} s={0.7} />
        <Sparkle x={322} y={92} s={0.6} />
        <Sparkle x={300} y={300} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- the anniversary: two glasses of chai, their steam curling into a heart ----------

function Anniversary() {
  const bulbs = along(9, [10, 30, 120, 76, 240, 76, 350, 30]);
  const jasmine = along(14, [70, 376, 120, 394, 240, 394, 290, 376]);
  const heart = (x: number, y: number) => `M${x} ${y + 12}C${x - 14} ${y + 2} ${x - 14} ${y - 10} ${x - 6} ${y - 12}C${x - 2} ${y - 13} ${x} ${y - 9} ${x} ${y - 6}C${x} ${y - 9} ${x + 2} ${y - 13} ${x + 6} ${y - 12}C${x + 14} ${y - 10} ${x + 14} ${y + 2} ${x} ${y + 12}Z`;
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.blush} opacity=".3" />
        {bulbs.map(([x, y], i) => <circle key={i} cx={x} cy={y + 12} r="7" fill={i % 2 ? C.sun : C.marigold} />)}
        <path d="M118 104H242V196H118Z" fill={C.cream} />
        <path d={heart(166, 150)} fill={C.red} />
        <path d={heart(194, 150)} fill={C.pink} />
        <ellipse cx="180" cy="352" rx="136" ry="30" fill={C.sun} opacity=".5" />
        <path d="M112 262L118 340H158L164 262Z" fill={C.paper} />
        <path d="M115 290L118 340H158L161 290Z" fill={C.clay} />
        <path d="M196 262L202 340H242L248 262Z" fill={C.paper} />
        <path d="M199 290L202 340H242L245 290Z" fill={C.clay} />
        {jasmine.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill={C.paper} />)}
      </Wash>
      <Ink d={0}>
        <path d="M118 104H242V196H118Z" />
        <path d="M126 112H234V188H126Z" strokeWidth="1.4" />
        <path d="M156 104L180 82L204 104" strokeWidth="1.4" />
        <ellipse cx="180" cy="352" rx="138" ry="31" />
        <path d="M112 262L118 340H158L164 262ZM196 262L202 340H242L248 262Z" />
        <path d="M126 262L128 340M150 262L148 340M210 262L212 340M234 262L232 340" strokeWidth="1.1" />
        <path d="M115 290H161M199 290H245" strokeWidth="1.4" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d={heart(166, 150)} />
        <path d={heart(194, 150)} />
        <path d="M138 252C130 238 146 230 138 216C134 208 150 204 164 210" />
        <path d="M222 252C230 238 214 230 222 216C226 208 210 204 196 210" />
        <path d="M180 236C164 224 156 212 164 204C170 198 178 202 180 208C182 202 190 198 196 204C204 212 196 224 180 236Z" />
        <path d="M70 376C120 394 240 394 290 376" strokeWidth="1.2" />
        {jasmine.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" strokeWidth="1.2" />)}
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M10 30C120 76 240 76 350 30" />
        {bulbs.map(([x, y], i) => <g key={i}><path d={`M${x} ${y}V${y + 5}`} /><circle cx={x} cy={y + 12} r="6.5" /></g>)}
        <Sparkle x={52} y={160} s={0.6} />
        <Sparkle x={310} y={150} s={0.7} />
        <Sparkle x={300} y={254} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- diwali: clay diyas lit along a rangoli, star lanterns, a marigold toran and a box of mithai ----------

function Diwali() {
  const toran = along(13, [-6, 22, 110, 46, 250, 46, 366, 22]);
  const leaf = (x: number, y: number) => `M${x} ${y}C${x - 6} ${y + 8} ${x - 4} ${y + 18} ${x} ${y + 24}C${x + 4} ${y + 18} ${x + 6} ${y + 8} ${x} ${y}Z`;
  const kandils: [number, number, number, string][] = [[72, 134, 34, C.red], [290, 116, 28, C.marigold]];
  const facets = (x: number, y: number, r: number) => Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return `M${x} ${y}L${r2(x + Math.cos(a) * r)} ${r2(y + Math.sin(a) * r)}`;
  }).join("");
  const tails = (x: number, y: number) => `M${x - 6} ${y}c-3 12 3 22-1 34M${x} ${y + 1}c-3 14 3 26 0 40M${x + 6} ${y}c3 12-3 22 1 34`;
  const petals = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return [r2(180 + Math.cos(a) * 138), r2(352 + Math.sin(a) * 39), r2((a * 180) / Math.PI)] as const;
  });
  const dots = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return `M${r2(180 + Math.cos(a) * 98)} ${r2(352 + Math.sin(a) * 27)}h1`;
  }).join("");
  const diyas: [number, number][] = [[69, 370], [116, 383], [180, 388], [244, 383], [291, 370]];
  const bowl = (x: number, y: number) => `M${x - 16} ${y - 4}C${x - 14} ${y + 9} ${x + 10} ${y + 10} ${x + 16} ${y - 1}L${x + 23} ${y - 7}C${x + 12} ${y - 9} ${x - 6} ${y - 9} ${x - 16} ${y - 4}Z`;
  const flame = (x: number, y: number) => `M${x + 21} ${y - 9}C${x + 15} ${y - 15} ${x + 18} ${y - 23} ${x + 21} ${y - 30}C${x + 24} ${y - 23} ${x + 27} ${y - 15} ${x + 21} ${y - 9}Z`;
  const core = (x: number, y: number) => `M${x + 21} ${y - 11}C${x + 18} ${y - 14} ${x + 20} ${y - 18} ${x + 21} ${y - 21}C${x + 22} ${y - 18} ${x + 24} ${y - 14} ${x + 21} ${y - 11}Z`;
  const laddoos: [number, number][] = [[146, 211], [162, 211], [138, 221], [154, 221], [170, 221]];
  const katli: [number, number][] = [[199, 211], [217, 211], [190, 221], [208, 221], [226, 221]];
  const diamond = (x: number, y: number) => `M${x} ${y - 5}L${x + 8} ${y}L${x} ${y + 5}L${x - 8} ${y}Z`;
  const flower = "M180 162C175 167 175 172 180 174C185 172 185 167 180 162ZM180 186C175 181 175 176 180 174C185 176 185 181 180 186ZM168 174C173 169 178 169 180 174C178 179 173 179 168 174ZM192 174C187 169 182 169 180 174C182 179 187 179 192 174Z";
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.sun} opacity=".3" />
        {kandils.map(([x, y, r]) => <circle key={`g${x}`} cx={x} cy={y} r={r + 12} fill={C.sun} opacity=".4" />)}
        {kandils.map(([x, y, r], i) => <path key={`t${x}`} d={tails(x, y + Math.round(r * 0.45))} fill="none" stroke={i ? C.red : C.sun} strokeWidth="4" />)}
        {kandils.map(([x, y, r, f]) => <path key={x} d={star(x, y, r)} fill={f} />)}
        {kandils.map(([x, y, r]) => <circle key={`c${x}`} cx={x} cy={y} r={Math.round(r / 3)} fill={C.sun} />)}
        {toran.map(([x, y], i) => (i % 2 ? <path key={i} d={leaf(x, y)} fill={C.leaf} /> : <circle key={i} cx={x} cy={y + 7} r="8" fill={i % 4 ? C.sun : C.marigold} />))}
        <path d="M128 204L136 140H224L232 204Z" fill={C.berry} />
        <path d="M140 196L146 152H214L220 196Z" fill={C.blush} />
        <path d={flower} fill={C.red} />
        <path d="M112 228L128 204H232L248 228Z" fill={C.sun} />
        {laddoos.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={C.marigold} />)}
        {katli.map(([x, y]) => <path key={`${x}-${y}`} d={diamond(x, y)} fill={C.paper} />)}
        <path d="M112 228H248V280H112Z" fill={C.berry} opacity=".85" />
        <path d="M112 244H248V256H112Z" fill={C.sun} />
        <ellipse cx="180" cy="352" rx="150" ry="44" fill={C.blush} opacity=".45" />
        {petals.map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="5" fill={i % 2 ? C.marigold : C.red} transform={`rotate(${a + 90} ${x} ${y})`} />)}
        <ellipse cx="180" cy="352" rx="98" ry="27" fill="none" stroke={C.teal} strokeWidth="16" opacity=".6" />
        <ellipse cx="180" cy="352" rx="56" ry="15" fill={C.sun} />
        <ellipse cx="180" cy="352" rx="16" ry="5" fill={C.red} />
        {diyas.map(([x, y]) => <circle key={`g${x}`} cx={x + 21} cy={y - 19} r="15" fill={C.sun} opacity=".5" />)}
        {diyas.map(([x, y]) => <path key={x} d={bowl(x, y)} fill={C.clay} />)}
        {diyas.map(([x, y]) => <path key={`f${x}`} d={flame(x, y)} fill={C.sun} />)}
        {diyas.map(([x, y]) => <path key={`c${x}`} d={core(x, y)} fill={C.marigold} />)}
      </Wash>
      <Ink d={0}>
        <path d="M128 204L136 140H224L232 204" />
        <path d="M112 228L128 204H232L248 228" />
        <path d="M112 228H248V280H112Z" />
        <ellipse cx="180" cy="352" rx="152" ry="45" />
        {diyas.map(([x, y]) => <path key={x} d={bowl(x, y)} />)}
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d="M140 196L146 152H214L220 196Z" strokeWidth="1.4" />
        <path d={flower} strokeWidth="1.4" />
        <circle cx="180" cy="174" r="2.5" />
        <path d="M112 244H248M112 256H248" strokeWidth="1.4" />
        <path d={Array.from({ length: 8 }, (_, i) => `M${124 + i * 16} 250h1`).join("")} strokeWidth="3" />
        {laddoos.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6.5" strokeWidth="1.5" />)}
        {katli.map(([x, y]) => <path key={`${x}-${y}`} d={diamond(x, y)} strokeWidth="1.4" />)}
        <ellipse cx="180" cy="352" rx="112" ry="31" strokeWidth="1.4" />
        <ellipse cx="180" cy="352" rx="84" ry="23" strokeWidth="1.4" />
        <ellipse cx="180" cy="352" rx="56" ry="15" />
        <ellipse cx="180" cy="352" rx="16" ry="5" strokeWidth="1.4" />
        {petals.map(([x, y, a], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="5" transform={`rotate(${a + 90} ${x} ${y})`} strokeWidth="1.3" />)}
        <path d={dots} strokeWidth="3" />
        {diyas.map(([x, y]) => <g key={x}><path d={`M${x - 16} ${y - 4}C${x - 8} ${y} ${x + 8} ${y} ${x + 17} ${y - 3}`} strokeWidth="1.3" /><path d={flame(x, y)} /><path d={`M${x - 8} ${y + 3}h1M${x} ${y + 5}h1M${x + 8} ${y + 3}h1`} strokeWidth="2.5" /></g>)}
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M-6 22C110 46 250 46 366 22" strokeWidth="1.3" />
        {toran.map(([x, y], i) => (i % 2 ? <path key={i} d={leaf(x, y)} strokeWidth="1.4" /> : <g key={i}><circle cx={x} cy={y + 7} r="7.5" /><circle cx={x} cy={y + 7} r="3" strokeWidth="1.2" /></g>))}
        {kandils.map(([x, y, r]) => <g key={x}><path d={`M${x} 33V${y - r}`} strokeWidth="1.2" /><path d={star(x, y, r)} /><path d={facets(x, y, r)} strokeWidth="1.2" /><path d={tails(x, y + Math.round(r * 0.45))} strokeWidth="1.3" /></g>)}
        <path d="M30 116l-9-5M32 134h-10M114 116l9-5M112 134h10M326 100l8-5M324 116h9M254 100l-8-5M256 116h-9" strokeWidth="1.4" />
        <path d="M24 280H112M248 280H336" />
        <Sparkle x={180} y={104} s={0.8} />
        <Sparkle x={230} y={82} s={0.5} />
        <Sparkle x={330} y={236} s={0.6} />
        <Sparkle x={28} y={250} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- the janoi: the sacred thread coiled on a brass thali, by the havan and the kalash ----------

function Janoi() {
  const toran = along(13, [8, 28, 120, 70, 240, 70, 352, 28]);
  const leaf = (x: number, y: number) => `M${x} ${y}C${x - 6} ${y + 8} ${x - 4} ${y + 18} ${x} ${y + 24}C${x + 4} ${y + 18} ${x + 6} ${y + 8} ${x} ${y}Z`;
  /** a marigold head: nine ruffled petals round a centre */
  const bloom = (x: number, y: number, r: number) => Array.from({ length: 9 }, (_, i) => {
    const at = (a: number, d: number) => `${r2(x + Math.cos(a) * d)} ${r2(y + Math.sin(a) * d)}`;
    const a = (i * 2 * Math.PI) / 9;
    return `${i ? "" : `M${at(a, r)}`}Q${at(a + Math.PI / 9, r * 1.4)} ${at(a + (2 * Math.PI) / 9, r)}`;
  }).join("") + "Z";
  const flowers: [number, number, number, string][] = [[34, 386, 9, C.marigold], [330, 386, 8, C.sun], [128, 370, 7, C.marigold], [214, 368, 7, C.marigold]];
  // the janoi, coiled in two loops of three strands each: [cx, cy, rx, ry, tilt]
  const coils: [number, number, number, number, number][] = [[174, 342, 50, 14, -5], [188, 338, 42, 11, 6]];
  const mango = "M272 226C262 214 263 196 272 184C281 196 282 214 272 226Z";
  const flame = "M62 248C52 230 60 210 70 200C70 214 76 220 82 216C80 196 88 174 96 154C104 174 116 190 110 214C116 210 120 202 120 194C130 210 132 232 122 248Z";
  const core = "M76 248C70 234 78 220 84 212C86 224 92 226 94 218C96 206 100 194 102 186C110 202 114 228 108 248Z";
  const kund = "M40 248H144V260H136V274H126V288H116V300H68V288H58V274H48V260H40Z";
  const body = "M262 238C230 246 226 296 252 302H292C318 296 314 246 282 238";
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.marigold} opacity=".22" />
        {toran.map(([x, y], i) => (i % 2 ? <circle key={i} cx={x} cy={y + 6} r="6" fill={i % 4 === 1 ? C.red : C.marigold} /> : <path key={i} d={leaf(x, y)} fill={C.leaf} />))}
        <path d={kund} fill={C.clay} />
        <path d={flame} fill={C.marigold} />
        <path d={core} fill={C.sun} />
        {[-66, -34, 34, 66].map((a) => <path key={a} d={mango} fill={C.leaf} transform={`rotate(${a} 272 226)`} />)}
        <path d={`${body}Z`} fill={C.marigold} />
        <ellipse cx="272" cy="228" rx="18" ry="5" fill={C.marigold} />
        <path d="M262 232H282V238H262Z" fill={C.red} />
        <circle cx="272" cy="280" r="5" fill={C.red} />
        <ellipse cx="272" cy="206" rx="15" ry="19" fill={C.clay} />
        <path d="M44 342C46 408 314 408 316 342C316 398 44 398 44 342Z" fill={C.marigold} />
        <ellipse cx="180" cy="340" rx="134" ry="42" fill={C.sun} opacity=".6" />
        <path d="M84 334C86 346 114 346 116 334ZM244 334C246 346 274 346 276 334Z" fill={C.marigold} />
        <path d="M86 334C90 324 110 324 114 334Z" fill={C.red} />
        <path d="M246 334C250 324 270 324 274 334Z" fill={C.paper} />
        {[[126, 320], [136, 316], [232, 318]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" fill={C.red} />)}
        {coils.map(([cx, cy, rx, ry, a]) => <g key={cx} transform={`rotate(${a} ${cx} ${cy})`} fill="none" strokeWidth="10"><ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={C.paper} /><ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={C.marigold} strokeDasharray="9 27" /></g>)}
        <circle cx="175" cy="356" r="6.5" fill={C.marigold} />
        <circle cx="175" cy="356" r="2.2" fill={C.red} />
        {flowers.map(([x, y, r, f]) => <path key={x} d={bloom(x, y, r)} fill={f} />)}
      </Wash>
      <Ink d={0}>
        <ellipse cx="180" cy="340" rx="136" ry="43" />
        <ellipse cx="180" cy="336" rx="110" ry="30" strokeWidth="1.4" />
        <path d="M44 342C46 408 314 408 316 342" />
        <path d={kund} />
        <path d="M48 260H136M58 274H126M68 288H116" strokeWidth="1.6" />
        <path d={body} />
        <path d="M262 238V231M282 238V231" />
        <ellipse cx="272" cy="228" rx="18" ry="5" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d={flame} />
        <path d={core} strokeWidth="1.4" />
        <path d="M50 248L70 236M134 248L114 236" />
        <path d="M50 254h1M64 254h1M78 254h1M92 254h1M106 254h1M120 254h1M134 254h1" strokeWidth="2.6" />
        {[-66, -34, 34, 66].map((a) => <g key={a} transform={`rotate(${a} 272 226)`}><path d={mango} /><path d="M272 222V190" strokeWidth="1.2" /></g>)}
        <ellipse cx="272" cy="206" rx="15" ry="19" />
        <path d="M267 189L262 177M272 187V173M277 189L282 177" strokeWidth="1.6" />
        <path d="M263 198C267 206 267 214 265 220M281 198C277 206 277 214 279 220" strokeWidth="1.2" />
        <path d="M262 235H282M282 235L290 247M283 236L285 249" strokeWidth="1.4" />
        <path d="M240 262C258 270 286 270 304 262" strokeWidth="1.3" />
        <circle cx="272" cy="280" r="5" strokeWidth="1.4" />
        <path d="M262 282h1M282 282h1M272 291h1" strokeWidth="2.4" />
        <path d="M82 334H118M84 334C86 346 114 346 116 334M242 334H278M244 334C246 346 274 346 276 334" />
        <path d="M86 334C90 324 110 324 114 334M246 334C250 324 270 324 274 334M254 330h3M261 327h3M266 331h2M257 332h2" strokeWidth="1.4" />
        {coils.map(([cx, cy, rx, ry, a]) => <g key={cx} transform={`rotate(${a} ${cx} ${cy})`}>{[-3.5, 0, 3.5].map((o) => <ellipse key={o} cx={cx} cy={cy} rx={rx + o} ry={ry + o} strokeWidth="1.2" />)}</g>)}
        <circle cx="175" cy="356" r="6" />
        <path d="M170 353C173 356 177 356 180 353" strokeWidth="1.2" />
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M8 28C120 70 240 70 352 28" strokeWidth="1.3" />
        {toran.map(([x, y], i) => (i % 2 ? <circle key={i} cx={x} cy={y + 6} r="5.5" /> : <path key={i} d={leaf(x, y)} strokeWidth="1.4" />))}
        <path d="M14 398C110 392 250 402 346 394" />
        {flowers.map(([x, y, r]) => <g key={x}><path d={bloom(x, y, r)} /><circle cx={x} cy={y} r={r2(r * 0.35)} strokeWidth="1.2" /></g>)}
        <path d="M100 150C92 136 108 128 100 114C94 102 106 90 124 94C140 98 146 116 164 114C176 112 180 102 176 94M72 182C66 172 74 164 70 156" strokeWidth="1.3" />
        <path d="M128 170h1M140 152h1M116 140h1" strokeWidth="3" />
        <path d="M150 372l3 1M170 376l3-1M196 374l3 1M236 360l3-1M108 352l3 0" strokeWidth="2" />
        <Sparkle x={186} y={150} s={0.8} />
        <Sparkle x={322} y={124} s={0.6} />
        <Sparkle x={210} y={236} s={0.5} />
        <Sparkle x={34} y={148} s={0.5} />
      </Ink>
    </>
  );
}

// ---------- the puja: a red chowki between banana plants, with the kalash, a conch, sheera prasad and the aarti thali ----------

/** A pointed leaf or petal from x0, y0 to x1, y1, w across at its widest. */
function lens(x0: number, y0: number, x1: number, y1: number, w: number) {
  const l = Math.hypot(x1 - x0, y1 - y0);
  const nx = ((y0 - y1) / l) * w;
  const ny = ((x1 - x0) / l) * w;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return `M${x0} ${y0}Q${r2(mx + nx)} ${r2(my + ny)} ${x1} ${y1}Q${r2(mx - nx)} ${r2(my - ny)} ${x0} ${y0}Z`;
}

/** A banana plant standing by the chowki: its stem and three big leaves. s is 1 for the one on the left, -1 for its mirror on the right. */
function banana(x: number, s: 1 | -1) {
  const X = (dx: number) => x + s * dx;
  const ribs: [number, number, number, number, number, number, number, number][] = [
    [X(0), 120, X(-8), 86, X(-12), 50, X(-14), 14],
    [X(-2), 132, X(-20), 104, X(-40), 104, X(-40), 158],
    [X(2), 128, X(18), 84, X(62), 66, X(96), 86],
  ];
  const vein: [number, number][] = [[-9, -4], [-2, -6], [3, -7]];
  return {
    stem: `M${X(-9)} 364C${X(-7)} 300 ${X(-7)} 200 ${X(-6)} 116H${X(6)}C${X(7)} 200 ${X(7)} 300 ${X(9)} 364Z`,
    edges: `M${X(-9)} 364C${X(-7)} 300 ${X(-7)} 200 ${X(-6)} 118M${X(9)} 364C${X(7)} 300 ${X(7)} 200 ${X(6)} 124`,
    sheaths: `M${X(-7)} 320L${X(7)} 302M${X(-7)} 250L${X(7)} 232M${X(-6)} 180L${X(6)} 164`,
    leaves: [
      `M${X(0)} 120C${X(-26)} 92 ${X(-30)} 50 ${X(-14)} 14C${X(4)} 48 ${X(14)} 90 ${X(0)} 120Z`,
      `M${X(-2)} 128C${X(-18)} 94 ${X(-46)} 92 ${X(-40)} 158C${X(-34)} 126 ${X(-20)} 116 ${X(-2)} 138Z`,
      `M${X(2)} 122C${X(14)} 70 ${X(66)} 54 ${X(96)} 86C${X(70)} 84 ${X(28)} 100 ${X(4)} 136Z`,
    ],
    ribs: ribs.map((p) => `M${p[0]} ${p[1]}C${p[2]} ${p[3]} ${p[4]} ${p[5]} ${p[6]} ${p[7]}`).join(""),
    veins: ribs.map((p, k) => along(5, p).slice(1, -1).map(([vx, vy]) => `M${vx} ${vy}l${s * vein[k][0]} ${vein[k][1]}${k ? "" : `M${vx} ${vy}l${s * 7} -5`}`).join("")).join(""),
  };
}

function Puja() {
  const plants = [banana(50, 1), banana(310, -1)];
  const garland = along(13, [52, 108, 120, 142, 240, 142, 308, 108]);
  const strands: [number, number][] = [[124, 3], [152, 5], [180, 7], [208, 5], [236, 3]];
  const beads = (n: number) => Array.from({ length: n }, (_, j) => 8 + j * 13);
  const tassel = (x: number, n: number) => lens(x, 14 + (n - 1) * 13, x, 26 + (n - 1) * 13, 8);
  const mango = [lens(166, 200, 136, 186, 10), lens(164, 190, 146, 166, 10), lens(196, 190, 214, 166, 10), lens(194, 200, 224, 186, 10)];
  const tulsi = [lens(234, 246, 227, 237, 6), lens(234, 246, 242, 238, 6)];
  const petals: [string, string][] = [[lens(212, 404, 222, 398, 6), C.marigold], [lens(230, 410, 240, 412, 6), C.red], [lens(236, 394, 244, 388, 6), C.marigold]];
  const leg = (x: number) => `M${x} 324H${x + 16}L${x + 14} 338C${x + 19} 344 ${x + 19} 352 ${x + 14} 356L${x + 16} 364H${x}L${x + 2} 356C${x - 3} 352 ${x - 3} 344 ${x + 2} 338Z`;
  const kalash = "M166 206C166 212 170 214 170 216C146 222 142 262 160 270H200C218 262 214 222 190 216C190 214 194 212 194 206";
  const conch = "M104 256C110 246 126 240 140 245C150 249 151 260 144 266C132 271 114 268 104 256Z";
  const flame = "M140 388C134 382 137 374 140 366C143 374 146 382 140 388Z";
  return (
    <>
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.sun} opacity=".3" />
        <path d="M18 362C110 356 250 368 342 360L342 420L18 420Z" fill={C.marigold} opacity=".22" />
        {strands.map(([x, n]) => <g key={x}>{beads(n).map((y, j) => <circle key={y} cx={x} cy={y} r="6" fill={j % 2 ? C.sun : C.marigold} />)}<path d={tassel(x, n)} fill={C.leaf} /></g>)}
        {plants.map((b, i) => <g key={i}><path d={b.stem} fill={C.leaf} opacity=".55" />{b.leaves.map((d) => <path key={d} d={d} fill={C.leaf} />)}</g>)}
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill={i % 3 === 1 ? C.red : C.marigold} />)}
        <path d="M114 262H246L260 276H100Z" fill={C.red} />
        <path d="M100 276H260V316H100Z" fill={C.red} />
        <path d={`M260 316${"l-10 10l-10-10".repeat(8)}Z`} fill={C.sun} />
        <path d={`${leg(106)}${leg(238)}`} fill={C.clay} />
        <ellipse cx="180" cy="269" rx="28" ry="5" fill={C.cream} />
        <path d={`${kalash}Z`} fill={C.marigold} />
        <path d="M167 209H193V214H167Z" fill={C.red} />
        {mango.map((d) => <path key={d} d={d} fill={C.leaf} />)}
        <ellipse cx="180" cy="205" rx="17" ry="4" fill={C.marigold} />
        <ellipse cx="180" cy="186" rx="15" ry="19" fill={C.clay} />
        <circle cx="180" cy="248" r="3.5" fill={C.red} /><circle cx="169" cy="252" r="2.5" fill={C.red} /><circle cx="191" cy="252" r="2.5" fill={C.red} />
        <path d={conch} fill={C.cream} />
        <path d="M216 258C218 272 250 272 252 258Z" fill={C.sky} />
        <path d="M218 258C220 242 248 242 250 258Z" fill={C.sun} />
        {tulsi.map((d) => <path key={d} d={d} fill={C.leaf} />)}
        <ellipse cx="140" cy="394" rx="56" ry="13" fill={C.sun} />
        <circle cx="140" cy="376" r="17" fill={C.sun} opacity=".6" />
        <path d="M98 392C99 400 115 400 116 392Z" fill={C.red} />
        <path d="M126 390C128 400 152 400 154 390Z" fill={C.clay} />
        <path d={flame} fill={C.sun} />
        <circle cx="170" cy="392" r="6" fill={C.marigold} /><circle cx="183" cy="398" r="5" fill={C.red} />
        <path d="M268 400C268 392 284 392 284 400Z" fill={C.marigold} />
        <circle cx="268" cy="349" r="2.5" fill={C.red} /><circle cx="286" cy="351" r="2.5" fill={C.red} />
        {petals.map(([d, f]) => <path key={d} d={d} fill={f} />)}
      </Wash>
      <Ink d={0}>
        {plants.map((b, i) => <path key={i} d={b.edges} />)}
        <path d="M100 276L114 262H246L260 276ZM100 276V316M260 276V316" />
        <path d={`M260 316${"l-10 10l-10-10".repeat(8)}`} />
        <path d={leg(106)} /><path d={leg(238)} />
        <path d={kalash} />
        <ellipse cx="180" cy="205" rx="17" ry="4" />
        <path d="M16 364C110 358 250 370 344 362" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        {plants.map((b, i) => <g key={i}>{b.leaves.map((d) => <path key={d} d={d} />)}<path d={b.ribs} strokeWidth="1.4" /><path d={b.veins} strokeWidth="1.1" /><path d={b.sheaths} strokeWidth="1.3" /></g>)}
        <path d="M100 316H260M100 306H260" strokeWidth="1.3" />
        <path d={Array.from({ length: 9 }, (_, i) => `M${112 + i * 17} 294h1`).join("")} strokeWidth="3" />
        <path d="M151 271C154 266 158 265 161 267M199 267C202 265 206 266 209 271" strokeWidth="1.3" />
        <path d="M167 209H193M167 214H193M190 214l3 7M192 214l6 4M151 236C164 232 196 232 209 236" strokeWidth="1.3" />
        {mango.map((d) => <path key={d} d={d} />)}
        <path d="M166 200L136 186M164 190L146 166M196 190L214 166M194 200L224 186" strokeWidth="1.1" />
        <ellipse cx="180" cy="186" rx="15" ry="19" />
        <path d="M172 173C176 180 176 193 172 200M188 173C184 180 184 193 188 200" strokeWidth="1.2" />
        <path d="M178 167C176 162 180 158 179 154M182 167C184 162 188 160 188 156" strokeWidth="1.4" />
        <path d={conch} />
        <path d="M120 266C128 259 140 257 147 262M110 250C113 254 113 259 109 262M117 246C121 252 121 260 116 266" strokeWidth="1.4" />
        <path d="M127 242l1-5M136 244l3-4" strokeWidth="1.6" />
        <path d="M216 258C218 272 250 272 252 258M213 258H255" />
        <path d="M218 258C220 242 248 242 250 258" strokeWidth="1.5" />
        {tulsi.map((d) => <path key={d} d={d} strokeWidth="1.3" />)}
        <path d="M225 252h1M243 252h1M232 255h1" strokeWidth="3" />
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M52 108C120 142 240 142 308 108" strokeWidth="1.3" />
        {garland.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" />)}
        {strands.map(([x, n]) => <g key={x}><path d={`M${x} 0V${8 + (n - 1) * 13}`} strokeWidth="1.2" />{beads(n).map((y) => <circle key={y} cx={x} cy={y} r="5.5" />)}<path d={tassel(x, n)} strokeWidth="1.3" /></g>)}
        <ellipse cx="140" cy="394" rx="57" ry="13.5" />
        <path d="M98 392C99 400 115 400 116 392ZM126 390C128 400 152 400 154 390Z" />
        <path d={flame} />
        <path d="M122 372l-7-3M158 372l7-3M140 358v-7" strokeWidth="1.4" />
        <circle cx="170" cy="392" r="5.5" /><circle cx="170" cy="392" r="2" strokeWidth="1.2" />
        <circle cx="183" cy="398" r="4.5" /><circle cx="183" cy="398" r="1.6" strokeWidth="1.2" />
        <path d="M268 400C268 392 284 392 284 400M264 400H288M274 394L268 350M278 394L286 352" />
        <path d="M268 346C260 334 276 324 268 312C260 300 278 290 272 276C268 266 278 260 284 264M286 348C292 338 280 328 288 318C296 308 284 298 292 288" strokeWidth="1.3" />
        {petals.map(([d]) => <path key={d} d={d} strokeWidth="1.3" />)}
        <Sparkle x={92} y={34} s={0.6} />
        <Sparkle x={268} y={34} s={0.6} />
        <Sparkle x={84} y={212} s={0.5} />
        <Sparkle x={290} y={206} s={0.6} />
      </Ink>
    </>
  );
}

// ---------- the naamkaran: a thali of rice with a swirl traced in it, a pipal leaf, payal and a wooden elephant ----------

function Naming() {
  const pipal = "M180 226C164 234 136 230 132 208C128 184 148 162 168 138C174 130 178 116 184 92C184 114 188 128 194 138C214 160 234 184 230 208C226 230 198 234 180 226Z";
  const swirl = "M132 270C138 256 162 252 172 260C180 266 170 276 160 272C150 268 158 256 176 256C198 256 208 274 224 268C234 264 234 256 228 254";
  const grains: [number, number][] = [[108, 262], [118, 276], [140, 282], [196, 282], [150, 248], [204, 248], [232, 248], [254, 266], [170, 286], [212, 284]];
  const kumkum: [number, number][] = [[273, 273], [237, 286], [180, 291], [123, 286], [87, 273], [87, 253], [273, 253]];
  const bells: [number, number[]][] = [[51, [62, 94, 126]], [304, [56, 86, 116]]];
  const bell = (x: number, y: number) => `M${x} ${y - 7}C${x - 6} ${y - 7} ${x - 6} ${y + 1} ${x - 8} ${y + 6}H${x + 8}C${x + 6} ${y + 1} ${x + 6} ${y - 7} ${x} ${y - 7}Z`;
  const anklets: [number, number][] = [[68, 376], [124, 394]];
  const ghungroo: [number, number][] = [[26, 5.5], [15, 9.5], [0, 11], [-15, 9.5], [-26, 5.5]];
  const head = "M272 355C266 352 251 356 251 370C251 384 264 388 272 385";
  const ear = "M272 355C284 352 290 368 285 378C282 384 274 385 272 385";
  const trunk = "M252 375C245 382 243 393 249 399C253 403 260 399 257 395C254 391 255 387 260 384";
  const apron = `M80 318${"q10 10 20 0".repeat(10)}`;
  return (
    <>
      <Bunting y={20} sag={14} colors={[C.pink, C.teal, C.sun, C.blush]} />
      <Wash>
        <circle cx="180" cy="230" r="138" fill={C.blush} opacity=".3" />
        <path d="M20 346C110 340 250 352 340 344L344 424C250 432 110 422 16 428Z" fill={C.cream} opacity=".6" />
        {bells.flatMap(([x, ys]) => ys.map((y) => <path key={`${x}-${y}`} d={bell(x, y)} fill={C.sun} />))}
        <path d={pipal} fill={C.leaf} />
        <ellipse cx="180" cy="268" rx="108" ry="32" fill={C.marigold} />
        <ellipse cx="180" cy="262" rx="108" ry="32" fill={C.sun} />
        <ellipse cx="180" cy="265" rx="88" ry="23" fill={C.cream} />
        <path d={swirl} fill="none" stroke={C.clay} strokeWidth="5" opacity=".35" />
        {kumkum.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill={C.red} />)}
        <path d="M56 304H304V318H56ZM64 318H80L78 344H66ZM280 318H296L294 344H282Z" fill={C.berry} opacity=".7" />
        <path d={`${apron}Z`} fill={C.pink} />
        {[76, 112, 146, 180, 214, 248, 284].map((x) => <circle key={x} cx={x} cy="311" r="3" fill={C.sun} />)}
        <path d="M276 362C286 356 296 356 304 356C320 356 330 364 330 380V394H276ZM280 394H292V400H280ZM316 394H328V400H316Z" fill={C.teal} opacity=".75" />
        <ellipse cx="266" cy="370" rx="15" ry="16" fill={C.teal} opacity=".75" />
        <path d={`${trunk}Z`} fill={C.teal} opacity=".75" />
        <path d={`${ear}Z`} fill={C.blush} />
        <path d="M294 358C304 355 314 355 322 360L320 382Q314 388 308 382Q302 388 296 382Z" fill={C.pink} />
        {[[302, 368], [314, 368], [308, 376]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={C.sun} />)}
        <path d="M262 400H338V408H262Z" fill={C.clay} />
        <circle cx="276" cy="415" r="7" fill={C.marigold} />
        <circle cx="324" cy="415" r="7" fill={C.marigold} />
        {anklets.map(([cx, cy]) => <g key={cx}><ellipse cx={cx} cy={cy} rx="30" ry="11" fill="none" stroke={C.sky} strokeWidth="5" />{ghungroo.map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy + 5} r="3.4" fill={C.sky} />)}</g>)}
      </Wash>
      <Ink d={0}>
        <path d={pipal} />
        <ellipse cx="180" cy="262" rx="108" ry="32" />
        <path d="M72 262V268C72 311 288 311 288 268V262" />
        <path d="M56 304H304V318H56Z" />
        <path d="M64 318L66 344H78L80 318M280 318L282 344H294L296 318" />
      </Ink>
      <Ink d={0.9} w={1.8}>
        <path d="M180 226C181 194 182 154 184 96" strokeWidth="1.4" />
        <path d="M181 210C168 202 154 200 142 202M181 210C194 202 208 200 220 202M181 188C171 178 160 174 150 175M181 188C191 178 202 174 212 175M182 166C176 156 170 152 164 150M182 166C188 156 194 152 200 150" strokeWidth="1.2" />
        <ellipse cx="180" cy="264" rx="90" ry="25" strokeWidth="1.4" />
        <path d={swirl} />
        <path d="M240 274h1" strokeWidth="3" />
        <path d={grains.map(([x, y]) => `M${x} ${y}l4 -1`).join("")} strokeWidth="1.3" />
        <path d={apron} strokeWidth="1.5" />
        {/* the wooden elephant on wheels */}
        <path d={head} />
        <path d={ear} strokeWidth="1.6" />
        <path d={trunk} />
        <path d="M287 358C292 356 298 356 304 356C320 356 330 364 330 380V394H278V385" />
        <path d="M294 358L296 382Q302 388 308 382Q314 388 320 382L322 361" strokeWidth="1.4" />
        <path d="M280 400V394M292 394V400M316 400V394M328 394V400" />
        <path d="M262 400H338V408H262Z" />
        <circle cx="276" cy="415" r="7" /><circle cx="324" cy="415" r="7" />
        <path d="M276 415h1M324 415h1M262 364h1" strokeWidth="3" />
        <path d="M264 386C262 390 264 393 268 392M330 370C337 372 339 378 336 384M336 384l-3 4M336 384l2 4" strokeWidth="1.4" />
        {/* a pair of silver payal with their little ghungroo */}
        {anklets.map(([cx, cy]) => <g key={cx}><ellipse cx={cx} cy={cy} rx="30" ry="11" /><ellipse cx={cx} cy={cy} rx="26" ry="8" strokeWidth="1.1" />{ghungroo.map(([dx, dy], i) => <g key={i}><path d={`M${cx + dx} ${cy + dy}v2`} strokeWidth="1.2" /><circle cx={cx + dx} cy={cy + dy + 5} r="3" strokeWidth="1.4" /></g>)}</g>)}
      </Ink>
      <Ink d={1.6} w={1.6}>
        <path d="M20 346C110 340 250 352 340 344" />
        {bells.map(([x, ys]) => <path key={x} d={`M${x} 26V${ys[0] - 7}${ys.slice(1).map((y, i) => `M${x} ${ys[i] + 11}V${y - 7}`).join("")}`} strokeWidth="1.2" />)}
        {bells.flatMap(([x, ys]) => ys.map((y) => <g key={`${x}-${y}`}><path d={bell(x, y)} /><circle cx={x} cy={y + 9} r="2" /></g>))}
        <path d="M84 236c4-6 10-6 14 0M268 220c4-6 10-6 14 0" />
        <Sparkle x={100} y={164} s={0.6} />
        <Sparkle x={262} y={128} s={0.7} />
        <Sparkle x={330} y={206} s={0.5} />
        <Sparkle x={36} y={214} s={0.5} />
      </Ink>
    </>
  );
}

const SCENES: Record<ArtName, () => ReactNode> = { wedding: Wedding, birthday: Birthday, garba: Garba, opening: Opening, engagement: Engagement, babyshower: BabyShower, housewarming: Housewarming, anniversary: Anniversary, diwali: Diwali, janoi: Janoi, puja: Puja, naming: Naming };
