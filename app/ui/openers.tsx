import type { CSSProperties, ReactNode } from "react";
import type { ArtName } from "./art";

/*
 * Each occasion opens in its own way, all hand-drawn on a 520 × 300 sheet:
 *  - wedding:  a kankotri scroll tied with red thread. Untie the knot and it unrolls.
 *  - birthday: a gift box. Pull the bow, the lid pops and confetti bursts out.
 *  - garba:    a rangoli around a diya. Light it, the dandiya clack and the petals bloom.
 *  - opening:  a ribbon and a "soon" sign. Snip the ribbon and the sign flips to "open".
 *  - engagement:   a ring box. Press the heart clasp, the lid swings open and the rings rise and glint.
 *  - babyshower:   a ghodiyu cradle. Shake the rattle, the cradle rocks and the little stars float up.
 *  - housewarming: a front door with a toran. Lift the saankal, the doors swing in and footsteps lead inside.
 *  - anniversary:  a sealed letter. Break the wax seal, the flap turns over and the letter rises out.
 * The drawing sits in an SVG; the thing you tap is a real button laid over it.
 * The movement itself lives in studio.css, keyed off .is-open on the scene.
 */

export const OPEN_HINT: Record<ArtName, string> = {
  wedding: "untie the knot",
  birthday: "pull the bow",
  garba: "light the diya",
  opening: "cut the ribbon",
  engagement: "press the clasp",
  babyshower: "shake the rattle",
  housewarming: "lift the latch",
  anniversary: "break the seal",
};

const RED = "#c2412d";
const MARIGOLD = "#f0a03a";
const SUN = "#f6c453";
const vars = (v: Record<string, string | number>) => v as CSSProperties;

function Trigger({ at, label, onOpen, viewBox, children }: { at: [string, string, string]; label: string; onOpen: () => void; viewBox: string; children: ReactNode }) {
  return (
    <button type="button" className="inv-trigger" style={{ left: at[0], top: at[1], width: at[2] }} onClick={onOpen} aria-label={label}>
      <svg viewBox={viewBox} aria-hidden="true">{children}</svg>
    </button>
  );
}

function Scroll({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="262" cy="222" rx="200" ry="10" />
        <g className="o-scroll">
          <path className="o-wash" fill="#f7ecd6" d="M70 118C200 114 330 120 450 116L452 184C330 188 200 182 72 186Z" />
          <ellipse className="o-wash" fill="#ead9b8" cx="70" cy="152" rx="16" ry="34" />
          <circle className="o-wash" fill={MARIGOLD} cx="46" cy="152" r="10" />
          <circle className="o-wash" fill={MARIGOLD} cx="476" cy="150" r="10" />
          {[104, 140, 176, 212, 308, 344, 380, 416].map((x) => <circle key={x} cx={x} cy="151" r="3.4" fill={RED} />)}
          <path d="M80 128C200 124 330 130 444 126M80 176C200 172 330 178 444 174" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" />
          <g className="o-ink">
            <path d="M70 118C200 114 330 120 450 116M72 186C200 182 330 188 452 184" />
            <ellipse cx="70" cy="152" rx="16" ry="34" />
            <path d="M66 152C66 140 76 140 76 152S66 166 62 156" />
            <path d="M450 116C462 120 468 134 468 150 468 166 462 180 452 184" />
            <circle cx="46" cy="152" r="10" />
            <circle cx="476" cy="150" r="10" />
          </g>
        </g>
        <g className="o-thread" fill="none" stroke={RED} strokeLinecap="round">
          <path d="M246 112C240 140 240 166 246 190M274 112C268 140 268 166 274 190" strokeWidth="5" />
          <path d="M258 170C252 196 248 214 244 236M262 170C266 196 270 216 276 240" strokeWidth="2.5" />
          <path d="M238 236L244 252 250 236M270 240L276 256 282 240" strokeWidth="2" />
        </g>
      </svg>
      <Trigger at={["50%", "51%", "18%"]} label={label} onOpen={onOpen} viewBox="0 0 90 70">
        <path className="o-wash" fill={RED} d="M45 35C30 14 8 18 12 32 16 46 34 44 45 35ZM45 35C60 14 82 18 78 32 74 46 56 44 45 35Z" />
        <g className="o-ink"><path d="M45 35C30 14 8 18 12 32 16 46 34 44 45 35ZM45 35C60 14 82 18 78 32 74 46 56 44 45 35Z" /><circle cx="45" cy="35" r="8" fill={RED} /></g>
      </Trigger>
    </>
  );
}

const BITS: [number, number, number, string][] = [
  [-190, -120, 220, "#e8899e"], [-150, -170, -140, SUN], [-90, -200, 300, "#4f9a94"], [-30, -215, -260, RED],
  [30, -210, 180, MARIGOLD], [90, -195, -320, "#e8899e"], [150, -165, 250, "#4f9a94"], [190, -115, -200, SUN],
  [-210, -50, 160, MARIGOLD], [210, -40, -180, RED], [-120, -110, 90, "#4f9a94"], [120, -120, -90, "#e8899e"],
  [-60, -150, 400, SUN], [60, -150, -400, MARIGOLD], [-170, -10, 120, "#e8899e"], [170, -20, -120, "#4f9a94"],
];

function GiftBox({ label, onOpen }: { label: string; onOpen: () => void }) {
  const dots: [number, number][] = [[176, 156], [216, 196], [176, 232], [304, 158], [344, 200], [300, 236], [206, 150], [334, 236]];
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="262" cy="262" rx="150" ry="10" />
        <g className="o-confetti">
          {BITS.map(([tx, ty, r, f], i) => <rect key={i} className="bit" x="255" y="128" width="11" height="6" rx="1.5" fill={f} style={vars({ "--tx": `${tx}px`, "--ty": `${ty}px`, "--r": `${r}deg` })} />)}
        </g>
        <g className="o-box">
          <path className="o-wash" fill="#b9d3d0" d="M150 130H370V258H150Z" />
          {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#f2b6c6" />)}
          <path className="o-wash" fill="#e8899e" d="M248 130H272V258H248Z" />
          <g className="o-ink"><path d="M150 130H370V258H150ZM248 130V258M272 130V258" /></g>
        </g>
        <g className="o-lid">
          <path className="o-wash" fill="#9fc6c2" d="M136 100H384V132H136Z" />
          <path className="o-wash" fill="#e8899e" d="M246 100H274V132H246Z" />
          <g className="o-ink"><path d="M136 100H384V132H136ZM246 100V132M274 100V132" /></g>
        </g>
      </svg>
      <Trigger at={["50%", "27%", "27%"]} label={label} onOpen={onOpen} viewBox="0 0 130 74">
        <path className="o-wash" fill="#e8899e" d="M65 52C44 20 10 14 14 34 18 52 46 56 65 52ZM65 52C86 20 120 14 116 34 112 52 84 56 65 52Z" />
        <g className="o-ink"><path d="M65 52C44 20 10 14 14 34 18 52 46 56 65 52ZM65 52C86 20 120 14 116 34 112 52 84 56 65 52ZM60 56L48 72M70 56L82 72" /><ellipse cx="65" cy="52" rx="8" ry="6" fill="#c9506d" /></g>
      </Trigger>
    </>
  );
}

function Rangoli({ label, onOpen }: { label: string; onOpen: () => void }) {
  const stick = (cls: string, x: number, colors: [string, string]) => (
    <g className={`stick ${cls}`}>
      <rect x={x - 6} y="116" width="12" height="170" rx="6" fill={colors[0]} />
      {[130, 160, 190, 220, 250].map((y) => <rect key={y} x={x - 6} y={y} width="12" height="11" fill={colors[1]} />)}
      <g className="o-ink"><rect x={x - 6} y="116" width="12" height="170" rx="6" /></g>
    </g>
  );
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <circle className="o-ring" cx="260" cy="150" r="118" />
        <g className="o-petals">
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i} className="petal" style={vars({ "--a": `${i * 45}deg`, "--i": i })}>
              <path className="o-wash" fill={i % 2 ? MARIGOLD : "#d0607a"} d="M260 122C246 98 248 66 260 44 272 66 274 98 260 122Z" />
              <g className="o-ink"><path d="M260 122C246 98 248 66 260 44 272 66 274 98 260 122Z" /><path d="M260 112V60" strokeWidth="1.4" /></g>
            </g>
          ))}
        </g>
        {stick("stick-l", 150, [RED, SUN])}
        {stick("stick-r", 370, ["#4f9a94", MARIGOLD])}
        <g className="o-clack o-ink"><path d="M240 118L228 104M260 112V94M280 118L292 104" strokeWidth="3" /></g>
      </svg>
      <Trigger at={["50%", "50%", "17%"]} label={label} onOpen={onOpen} viewBox="0 0 80 80">
        <circle className="o-glow" cx="40" cy="42" r="30" fill={SUN} opacity=".45" />
        <path className="o-wash" fill={RED} d="M16 50C18 66 62 66 64 50Z" />
        <path className="o-wash o-flame" fill={SUN} d="M40 46C32 38 36 28 40 16 44 28 48 38 40 46Z" />
        <g className="o-ink"><path d="M16 50C18 66 62 66 64 50Z" /><path className="o-flame" d="M40 46C32 38 36 28 40 16 44 28 48 38 40 46Z" /></g>
      </Trigger>
    </>
  );
}

function Ribbon({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <g className="o-ink"><path d="M200 0L208 60M320 0L312 60M16 150V284M504 150V284M4 284H28M492 284H516" /></g>
        <g className="o-sign">
          <path className="o-wash" fill={MARIGOLD} d="M160 60H360V140H160Z" />
          <g className="o-ink"><path d="M160 60H360V140H160Z" /></g>
          <text className="soon" x="260" y="118" textAnchor="middle" style={{ fontFamily: "var(--font-hand), cursive" }} fontWeight="700" fontSize="56" fill="#2a1d14">SOON</text>
          <text className="open" x="260" y="118" textAnchor="middle" style={{ fontFamily: "var(--font-hand), cursive" }} fontWeight="700" fontSize="56" fill="#2a1d14">OPEN</text>
        </g>
        <g className="o-rib-l">
          <path className="o-wash" fill={RED} d="M16 190C100 186 200 194 300 190L300 206C200 210 100 202 16 206Z" />
          <path className="o-wash" fill={RED} d="M228 198C210 172 184 170 186 186 188 200 212 204 228 198ZM228 198C246 172 272 170 270 186 268 200 244 204 228 198ZM224 202L212 234 220 232 226 240 230 204ZM232 202L244 234 236 232 230 240 226 204Z" />
          <g className="o-ink"><path d="M16 190C100 186 200 194 300 190M16 206C100 202 200 210 300 206" /><path d="M228 198C210 172 184 170 186 186 188 200 212 204 228 198ZM228 198C246 172 272 170 270 186 268 200 244 204 228 198ZM224 202L212 234 220 232 226 240 230 204M232 202L244 234 236 232 230 240 226 204" /><circle cx="228" cy="198" r="6" /></g>
        </g>
        <g className="o-rib-r">
          <path className="o-wash" fill={RED} d="M300 190C380 186 440 194 504 190L504 206C440 210 380 202 300 206Z" />
          <g className="o-ink"><path d="M300 190C380 186 440 194 504 190M300 206C380 202 440 210 504 206" /></g>
        </g>
      </svg>
      <Trigger at={["58%", "70%", "15%"]} label={label} onOpen={onOpen} viewBox="0 0 80 80">
        <circle className="o-wash" fill={MARIGOLD} cx="18" cy="64" r="10" />
        <circle className="o-wash" fill={MARIGOLD} cx="40" cy="70" r="10" />
        <g className="o-ink">
          <circle cx="18" cy="64" r="10" />
          <circle cx="40" cy="70" r="10" />
          <path className="blade-a" d="M24 56L36 44 72 10" />
          <path className="blade-b" d="M38 61L36 44 76 26" />
          <circle cx="36" cy="44" r="2.5" />
        </g>
      </Trigger>
    </>
  );
}

const BERRY = "#9c2f55";

function RingBox({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="262" rx="120" ry="10" />
        <g className="o-rings">
          <circle className="o-wash" cx="244" cy="150" r="22" fill="none" stroke={MARIGOLD} strokeWidth="8" />
          <circle className="o-wash" cx="276" cy="146" r="22" fill="none" stroke={SUN} strokeWidth="8" />
          <path className="o-wash" fill="#b9d3d0" d="M276 112L286 122L276 132L266 122Z" />
          <g className="o-ink">
            <circle cx="244" cy="150" r="22" /><circle cx="244" cy="150" r="15" strokeWidth="1.4" />
            <circle cx="276" cy="146" r="22" /><circle cx="276" cy="146" r="15" strokeWidth="1.4" />
            <path d="M276 112L286 122L276 132L266 122ZM266 122H286" strokeWidth="1.4" />
          </g>
          <g className="o-glints o-ink"><path d="M218 112l-8-8M302 104l8-10M318 138h12M202 142h-12" strokeWidth="2.4" /></g>
        </g>
        <g className="o-box">
          <path className="o-wash" fill={BERRY} d="M180 170H340V240C340 248 334 254 326 254H194C186 254 180 248 180 240Z" />
          <g className="o-ink"><path d="M180 170H340V240C340 248 334 254 326 254H194C186 254 180 248 180 240Z" /><path d="M180 186H340" strokeWidth="1.4" /></g>
        </g>
        <g className="o-lid">
          <path className="o-wash" fill="#b23a63" d="M176 128C176 112 186 104 200 104H320C334 104 344 112 344 128V170H176Z" />
          <g className="o-ink"><path d="M176 128C176 112 186 104 200 104H320C334 104 344 112 344 128V170H176Z" /><path d="M190 120H330" strokeWidth="1.4" /></g>
        </g>
      </svg>
      <Trigger at={["50%", "57%", "12%"]} label={label} onOpen={onOpen} viewBox="0 0 60 60">
        <path className="o-wash" fill={SUN} d="M30 50C14 38 8 26 16 18C22 12 28 16 30 21C32 16 38 12 44 18C52 26 46 38 30 50Z" />
        <g className="o-ink"><path d="M30 50C14 38 8 26 16 18C22 12 28 16 30 21C32 16 38 12 44 18C52 26 46 38 30 50Z" /></g>
      </Trigger>
    </>
  );
}

/** A five-pointed star centred on x, y (rounded, so server and browser print the same markup). */
function star(x: number, y: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    return `${i ? "L" : "M"}${Math.round((x + Math.cos(a) * d) * 100) / 100} ${Math.round((y + Math.sin(a) * d) * 100) / 100}`;
  }).join("") + "Z";
}

function Cradle({ label, onOpen }: { label: string; onOpen: () => void }) {
  const stars: [number, number][] = [[216, 80], [260, 66], [304, 82]];
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="274" rx="150" ry="9" />
        <g className="o-ink"><path d="M150 276L190 40M162 276L200 40M370 276L330 40M358 276L320 40M186 34H334V48H186ZM144 276H168M352 276H376" /></g>
        <g className="o-stars">
          {stars.map(([x, y], i) => (
            <g key={x} className="o-star" style={vars({ "--i": i })}>
              <path className="o-wash" fill={SUN} d={star(x, y, 10)} />
              <g className="o-ink"><path d={star(x, y, 10)} /><path d={`M${x} 48V${y - 10}`} strokeWidth="1.2" /></g>
            </g>
          ))}
        </g>
        <g className="o-cradle">
          <g className="o-ink"><path d="M224 48V170M296 48V170" strokeWidth="1.6" /></g>
          <path className="o-wash" fill={MARIGOLD} d="M196 170C196 232 324 232 324 170Z" />
          <path className="o-wash" fill="#f2b6c6" d="M206 170C212 160 308 160 314 170Z" />
          <g className="o-ink">
            <path d="M196 170C196 232 324 232 324 170Z" />
            <path d="M188 170H332" />
            <path d={`M211 194${"q7 7 14 0".repeat(7)}`} strokeWidth="1.3" />
            <path d="M206 170C212 160 308 160 314 170" strokeWidth="1.6" />
          </g>
        </g>
      </svg>
      <Trigger at={["75%", "78%", "13%"]} label={label} onOpen={onOpen} viewBox="0 0 70 70">
        <circle className="o-wash" fill={RED} cx="24" cy="24" r="16" />
        <circle className="o-wash" fill={SUN} cx="24" cy="24" r="6" />
        <g className="o-ink"><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="6" strokeWidth="1.4" /><path d="M36 36L58 58" strokeWidth="5" /><circle cx="61" cy="61" r="5" /></g>
      </Trigger>
    </>
  );
}

function Door({ label, onOpen }: { label: string; onOpen: () => void }) {
  const toran = Array.from({ length: 9 }, (_, i) => 182 + i * 19.5);
  const footsteps: [number, number, number][] = [[248, 252, -8], [272, 234, 8], [250, 216, -8], [270, 198, 8]];
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="284" rx="170" ry="9" />
        <g className="o-inside">
          <path className="o-wash" fill="#fbe7b5" d="M180 52H340V276H180Z" />
          <circle className="o-wash" fill={SUN} cx="260" cy="140" r="44" opacity=".8" />
          {footsteps.map(([x, y, a], i) => (
            <g key={i} className="o-foot" style={vars({ "--i": i })} fill={RED} transform={`rotate(${a} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="5" ry="9" />
              {[[-4, -12], [-1.5, -14], [1.5, -14.5], [4, -13]].map(([dx, dy], t) => <circle key={t} cx={x + dx} cy={y + dy} r="1.5" />)}
            </g>
          ))}
        </g>
        <g className="o-door-l">
          <path className="o-wash" fill={BERRY} d="M180 52H260V276H180Z" />
          <g className="o-ink"><path d="M180 52H260V276H180Z" /><path d="M194 72H246V154H194ZM194 172H246V258H194Z" strokeWidth="1.5" /><circle cx="250" cy="164" r="4" /></g>
        </g>
        <g className="o-door-r">
          <path className="o-wash" fill={BERRY} d="M260 52H340V276H260Z" />
          <g className="o-ink"><path d="M260 52H340V276H260Z" /><path d="M274 72H326V154H274ZM274 172H326V258H274Z" strokeWidth="1.5" /><circle cx="270" cy="164" r="4" /></g>
        </g>
        <g className="o-ink"><path d="M168 276V40H352V276M140 276H380" /></g>
        {toran.map((x, i) => (i % 2
          ? <circle key={x} className="o-wash" fill={MARIGOLD} cx={x} cy="66" r="6" />
          : <path key={x} className="o-wash" fill="#6f8f4e" d={`M${x} 58C${x - 6} 66 ${x - 4} 76 ${x} 82C${x + 4} 76 ${x + 6} 66 ${x} 58Z`} />))}
        <g className="o-ink">
          <path d="M172 56C220 68 300 68 348 56" strokeWidth="1.3" />
          {toran.map((x, i) => (i % 2 ? <circle key={x} cx={x} cy="66" r="5.5" /> : <path key={x} d={`M${x} 58C${x - 6} 66 ${x - 4} 76 ${x} 82C${x + 4} 76 ${x + 6} 66 ${x} 58Z`} strokeWidth="1.4" />))}
        </g>
      </svg>
      <Trigger at={["50%", "55%", "8%"]} label={label} onOpen={onOpen} viewBox="0 0 40 80">
        <circle className="o-wash" cx="20" cy="58" r="12" fill="none" stroke={MARIGOLD} strokeWidth="5" />
        <g className="o-ink"><ellipse cx="20" cy="12" rx="4" ry="7" /><ellipse cx="20" cy="26" rx="4" ry="7" /><ellipse cx="20" cy="40" rx="4" ry="7" /><circle cx="20" cy="58" r="12" /></g>
      </Trigger>
    </>
  );
}

function Letter({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="272" rx="150" ry="9" />
        <path className="o-wash" fill="#d9b48a" d="M150 100H370V260H150Z" />
        {/* the flap once it's turned up, behind the letter */}
        <g className="o-flap-back">
          <path className="o-wash" fill="#e8c9a0" d="M150 100L260 24L370 100Z" />
          <g className="o-ink"><path d="M150 100L260 24L370 100" /></g>
        </g>
        <g className="o-letter">
          <path className="o-wash" fill="#fbf6ec" d="M172 110H348V250H172Z" />
          <g className="o-ink">
            <path d="M172 110H348V250H172Z" />
            <path d="M192 140C230 136 270 142 300 138M192 160C240 156 290 162 328 158M192 180C228 176 262 182 290 178" strokeWidth="1.3" />
            <path d="M310 206C302 198 302 190 310 192C318 190 318 198 310 206Z" fill={RED} />
          </g>
        </g>
        {/* the front of the envelope, in front of the letter (a solid layer under the wash, so the letter doesn't show through) */}
        <path fill="#ecd2ac" d="M154 108L260 186L366 108V256H154Z" />
        <path className="o-wash" fill="#ecd2ac" d="M150 100L260 182L370 100V260H150Z" />
        <g className="o-ink"><path d="M150 100V260H370V100M150 260L246 176M370 260L274 176" /></g>
        <g className="o-flap-front">
          <path className="o-wash" fill="#e8c9a0" d="M150 100L260 182L370 100Z" />
          <g className="o-ink"><path d="M150 100L260 182L370 100Z" /></g>
        </g>
      </svg>
      <Trigger at={["50%", "60%", "12%"]} label={label} onOpen={onOpen} viewBox="0 0 60 60">
        <path className="o-wash" fill={RED} d="M30 8C36 6 40 12 46 12S52 22 54 28 50 40 50 44 40 50 34 54 24 52 18 52 8 44 6 38 6 28 8 22 14 12 24 10 30 8Z" />
        <g className="o-ink"><path d="M30 8C36 6 40 12 46 12S52 22 54 28 50 40 50 44 40 50 34 54 24 52 18 52 8 44 6 38 6 28 8 22 14 12 24 10 30 8Z" /><path d="M30 40C20 32 18 24 24 22C27 21 29 23 30 26C31 23 33 21 36 22C42 24 40 32 30 40Z" strokeWidth="1.6" /></g>
      </Trigger>
    </>
  );
}

const OPENERS: Record<ArtName, (p: { label: string; onOpen: () => void }) => ReactNode> = { wedding: Scroll, birthday: GiftBox, garba: Rangoli, opening: Ribbon, engagement: RingBox, babyshower: Cradle, housewarming: Door, anniversary: Letter };

export function Opener({ name, label, onOpen }: { name: ArtName; label: string; onOpen: () => void }) {
  const Drawing = OPENERS[name];
  return <div className={`inv-object inv-object-${name}`}><Drawing label={label} onOpen={onOpen} /></div>;
}

/** the scroll rod that rides down the wedding card as it unrolls */
export function ScrollRod() {
  return (
    <span className="inv-roll" aria-hidden="true">
      <svg viewBox="0 0 520 34" preserveAspectRatio="none">
        <path d="M14 6H506V28H14Z" fill="#ead9b8" />
        <path d="M14 11H506M14 23H506" stroke={RED} strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" />
        <path d="M14 6H506V28H14Z" stroke="#2a1d14" strokeWidth="2.2" vectorEffect="non-scaling-stroke" fill="none" />
        <circle cx="8" cy="17" r="8" fill={MARIGOLD} stroke="#2a1d14" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx="512" cy="17" r="8" fill={MARIGOLD} stroke="#2a1d14" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </span>
  );
}
