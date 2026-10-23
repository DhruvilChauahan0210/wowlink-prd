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
*  - diwali:   five clay diyas and a phuljhadi. Light the sparkler, it fizzes along the row and the diyas catch one after another.
*  - janoi:        a sacred thread lying loose on a brass thali. Tie the brahmagranthi, the three strands draw together, a haldi-kumkum dot appears and the rice hops.
*  - puja:         a little mandir with a brass ghanti on a curved hook. Ring the bell, it swings, the sound ripples out and marigold petals drift down.
*  - naming:       a bandhani cloth over a brass thali. Pull its tassel, the cloth slides away and little stars rise over the swirl in the rice.
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
  diwali: "light the diyas",
  janoi: "tie the thread",
  puja: "ring the bell",
  naming: "lift the cloth",
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

function Diyas({ label, onOpen }: { label: string; onOpen: () => void }) {
  const y = 232;
  const xs = [104, 178, 252, 326, 400];
  const at = (v: number) => Math.round(v * 10) / 10;
  // little sparks around the phuljhadi's tip (53, 96), each flying out along its own line
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 + 10) * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return { d: `M${at(53 + c * 4)} ${at(96 + s * 4)}L${at(53 + c * 9)} ${at(96 + s * 9)}`, tx: Math.round(c * 18), ty: Math.round(s * 18) };
  });
  const coat = "M34 48L56 92A4.5 4.5 0 0 1 48 96L26 52Z";
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="258" cy="248" rx="196" ry="8" />
        {Array.from({ length: 17 }, (_, i) => <circle key={i} className="o-wash" fill={[RED, MARIGOLD, "#e8899e"][i % 3]} cx={83 + i * 22} cy="272" r="4" />)}
        <g className="o-ink"><path d={`M72 258${"q11 10 22 0".repeat(17)}`} strokeWidth="1.6" /></g>
        {xs.map((x, i) => {
          const fx = x + 32;
          const fy = y - 14;
          const bowl = `M${x - 24} ${y - 6}C${x - 21} ${y + 14} ${x + 15} ${y + 15} ${x + 24} ${y - 2}L${x + 35} ${y - 11}C${x + 18} ${y - 13} ${x - 9} ${y - 13} ${x - 24} ${y - 6}Z`;
          const flame = `M${fx} ${fy}C${fx - 9} ${fy - 9} ${fx - 4} ${fy - 21} ${fx} ${fy - 32}C${fx + 4} ${fy - 21} ${fx + 9} ${fy - 9} ${fx} ${fy}Z`;
          const core = `M${fx} ${fy - 3}C${fx - 5} ${fy - 8} ${fx - 2} ${fy - 14} ${fx} ${fy - 19}C${fx + 2} ${fy - 14} ${fx + 5} ${fy - 8} ${fx} ${fy - 3}Z`;
          return (
            <g key={x} className="o-diya" style={vars({ "--i": i, "--fx": `${fx}px`, "--fy": `${fy}px` })}>
              <circle className="o-wash o-diya-glow" fill={SUN} cx={fx} cy={fy - 14} r="24" />
              <path className="o-wash" fill="#c8693f" d={bowl} />
              <g className="o-ink">
                <path d={bowl} />
                <path d={`M${x - 24} ${y - 6}C${x - 12} ${y} ${x + 12} ${y} ${x + 26} ${y - 4}`} strokeWidth="1.5" />
                <path d={`M${fx - 3} ${fy + 4}L${fx} ${fy}`} strokeWidth="2.5" />
                <path d={`M${x - 12} ${y + 5}h1M${x} ${y + 7}h1M${x + 12} ${y + 5}h1`} strokeWidth="3" />
              </g>
              <g className="o-diya-flame">
                <path className="o-wash" fill={SUN} d={flame} />
                <path className="o-wash o-diya-core" fill={MARIGOLD} d={core} />
                <g className="o-ink"><path d={flame} /></g>
              </g>
            </g>
          );
        })}
      </svg>
      <Trigger at={["21.8%", "57%", "12%"]} label={label} onOpen={onOpen} viewBox="0 0 64 104">
        <path className="o-wash" fill="#7d6e60" d={coat} />
        <circle className="o-wash o-tip" fill={SUN} cx="53" cy="96" r="6" />
        {sparks.map((s, i) => <path key={i} className="o-spark" d={s.d} fill="none" stroke={i % 2 ? SUN : MARIGOLD} strokeWidth="2.2" strokeLinecap="round" style={vars({ "--i": i, "--tx": `${s.tx}px`, "--ty": `${s.ty}px` })} />)}
        <g className="o-ink">
          <path d="M30 50L10 10" strokeWidth="2" />
          <path d={coat} />
          <path d="M31.3 58.3l4.5-2.2M34.9 65.4l4.5-2.2M38.5 72.6l4.5-2.2M42.1 79.7l4.5-2.2M45.6 86.9l4.5-2.2" strokeWidth="1.2" />
        </g>
        <path d="M61 89l4-4M63 99h5M57 104l3 3M48 104l-3 3" fill="none" stroke={MARIGOLD} strokeWidth="2" strokeLinecap="round" />
      </Trigger>
    </>
  );
}

function Thread({ label, onOpen }: { label: string; onOpen: () => void }) {
  // one loop, drawn once for each of the janoi's three strands; studio.css lets them lie apart until the knot is tied
  const loop = "M260 232C202 236 140 220 138 190C136 160 198 148 256 148C322 148 384 160 382 190C380 220 318 230 260 232";
  const tie = "M243 236C239 222 250 213 263 214C277 215 282 229 275 239C268 248 251 248 247 238";
  const grains: [number, number, number][] = [[214, 130, -20], [242, 126, 15], [300, 128, -10], [338, 126, 25], [256, 176, 30], [264, 190, -25], [176, 236, 20], [344, 236, -30], [108, 210, 10], [414, 208, -15]];
  /** a marigold head: nine ruffled petals (rounded, so server and browser print the same markup) */
  const bloom = (x: number, y: number, r: number) => Array.from({ length: 9 }, (_, i) => {
    const at = (a: number, d: number) => `${Math.round((x + Math.cos(a) * d) * 100) / 100} ${Math.round((y + Math.sin(a) * d) * 100) / 100}`;
    const a = (i * 2 * Math.PI) / 9;
    return `${i ? "" : `M${at(a, r)}`}Q${at(a + Math.PI / 9, r * 1.4)} ${at(a + (2 * Math.PI) / 9, r)}`;
  }).join("") + "Z";
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="266" rx="196" ry="10" />
        <path className="o-wash" fill={MARIGOLD} d="M72 182C76 286 444 286 448 182C448 274 72 274 72 182Z" />
        <ellipse className="o-wash" fill={SUN} cx="260" cy="180" rx="186" ry="70" />
        <g className="o-ink">
          <ellipse cx="260" cy="180" rx="188" ry="71" />
          <ellipse cx="260" cy="176" rx="158" ry="55" strokeWidth="1.4" />
          <path d="M72 182C76 286 444 286 448 182" />
        </g>
        <path className="o-wash" fill={MARIGOLD} d="M208 196C210 212 242 212 244 196ZM276 196C278 212 310 212 312 196Z" />
        <path className="o-wash" fill={RED} d="M210 196C214 182 238 182 242 196Z" />
        <path className="o-wash" fill="#fbf6ec" d="M278 196C282 182 306 182 310 196Z" />
        <g className="o-ink">
          <path d="M206 196H246M208 196C210 212 242 212 244 196M274 196H314M276 196C278 212 310 212 312 196" />
          <path d="M210 196C214 182 238 182 242 196M278 196C282 182 306 182 310 196M288 190h3M296 187h3M300 192h3M291 193h2" strokeWidth="1.5" />
        </g>
        {[[100, 186], [420, 182]].map(([x, y]) => (
          <g key={x}>
            <path className="o-wash" fill={MARIGOLD} d={bloom(x, y, 9)} />
            <g className="o-ink"><path d={bloom(x, y, 9)} strokeWidth="1.6" /><circle cx={x} cy={y} r="3.4" strokeWidth="1.4" /></g>
          </g>
        ))}
        {grains.map(([x, y, a], i) => (
          <g key={i} className="o-grain" style={vars({ "--i": i })}>
            <ellipse cx={x} cy={y} rx="3.6" ry="1.8" fill="#fbf6ec" stroke="#2a1d14" strokeWidth="1.1" transform={`rotate(${a} ${x} ${y})`} />
          </g>
        ))}
        {["a", "b", "c"].map((s) => (
          <g key={s} className={`o-strand o-strand-${s}`}>
            <path className="o-wash" fill="none" stroke="#fbf6ec" strokeWidth="5" d={loop} />
            <path className="o-wash" fill="none" stroke={MARIGOLD} strokeWidth="5" strokeDasharray="12 40" d={loop} />
            <g className="o-ink"><path d={loop} strokeWidth="1.5" /></g>
          </g>
        ))}
        <g className="o-tie">
          <path className="o-wash" fill="none" stroke="#fbf6ec" strokeWidth="5" strokeLinecap="round" pathLength={1} d={tie} />
          <g className="o-ink"><path pathLength={1} strokeWidth="1.6" d={tie} /></g>
        </g>
        <g className="o-knot">
          <circle className="o-wash" fill={SUN} cx="260" cy="232" r="11" />
          <g className="o-ink"><circle cx="260" cy="232" r="11" /><path d="M251 227C255 230 255 236 252 239M260 221C264 227 264 237 260 243M269 227C265 230 265 236 268 239" strokeWidth="1.4" /></g>
        </g>
        <g className="o-dot">
          <circle className="o-wash" fill={MARIGOLD} cx="260" cy="232" r="7" />
          <circle cx="260" cy="232" r="3.4" fill={RED} />
        </g>
      </svg>
      <Trigger at={["50%", "77.3%", "12%"]} label={label} onOpen={onOpen} viewBox="0 0 60 60">
        <path className="o-wash" fill="none" stroke="#fbf6ec" strokeWidth="4" strokeLinecap="round" d="M38 38C44 44 47 50 53 52M35 41C38 48 38 53 43 57" />
        <circle className="o-wash" fill={SUN} cx="30" cy="30" r="13" />
        <g className="o-ink"><path d="M38 38C44 44 47 50 53 52M35 41C38 48 38 53 43 57" strokeWidth="1.5" /><circle cx="30" cy="30" r="13" /><path d="M20 24C25 28 25 35 21 39M30 17C35 24 35 36 30 43M40 24C35 28 35 35 39 39" strokeWidth="1.5" /></g>
      </Trigger>
    </>
  );
}

function Bell({ label, onOpen }: { label: string; onOpen: () => void }) {
  const garland: [number, number][] = [[163, 110], [182, 89], [210, 72], [241, 57], [260, 47], [279, 57], [310, 72], [338, 89], [357, 110]];
  // the ring of sound on both sides of the bell, as arcs around its middle (260, 126)
  const chime = (r: number) => {
    const dx = Math.round(r * 0.85);
    const dy = Math.round(r * 0.53);
    return `M${260 - dx} ${126 + dy}A${r} ${r} 0 0 1 ${260 - dx} ${126 - dy}M${260 + dx} ${126 - dy}A${r} ${r} 0 0 1 ${260 + dx} ${126 + dy}`;
  };
  const petals: [number, number, number, number, string][] = [
    [206, 82, -12, -160, SUN], [316, 82, 12, 180, MARIGOLD], [170, 106, 14, 200, MARIGOLD], [350, 106, -10, -200, SUN],
    [236, 66, 10, 240, MARIGOLD], [286, 66, -14, -220, RED], [112, 60, 16, 260, MARIGOLD], [410, 66, -16, -240, RED],
  ];
  const petal = (x: number, y: number) => `M${x} ${y}C${x - 4} ${y - 4} ${x - 4} ${y - 10} ${x} ${y - 12}C${x + 4} ${y - 10} ${x + 4} ${y - 4} ${x} ${y}Z`;
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="284" rx="150" ry="9" />
        <path className="o-wash" fill={RED} opacity=".25" d="M176 120C182 92 228 78 260 60C292 78 338 92 344 120H350V250H170V120Z" />
        <path className="o-wash" fill="#f6e3bf" d="M144 120C150 76 214 60 260 34C306 60 370 76 376 120H344C338 92 292 78 260 60C228 78 182 92 176 120Z" />
        <path className="o-wash" fill="#f6e3bf" d="M150 130H170V250H150ZM350 130H370V250H350ZM146 250H374V262H146Z" />
        <path className="o-wash" fill={MARIGOLD} d="M144 120H176V130H144ZM344 120H376V130H344Z" />
        <path className="o-wash" fill="#c8693f" d="M132 262H388V280H132Z" />
        <path className="o-wash" fill={SUN} d="M252 34C248 28 252 22 260 22C268 22 272 28 268 34Z" />
        <path className="o-wash" fill={MARIGOLD} d="M260 8L282 13L260 18Z" />
        {garland.map(([x, y], i) => <circle key={x} className="o-wash" fill={i % 3 === 1 ? RED : MARIGOLD} cx={x} cy={y} r="7" />)}
        <path className="o-wash" fill="#c8693f" d="M184 242C186 251 206 251 208 242ZM312 242C314 251 334 251 336 242Z" />
        <path className="o-wash" fill={SUN} d="M196 240C191 235 193 228 196 222C199 228 201 235 196 240ZM324 240C319 235 321 228 324 222C327 228 329 235 324 240Z" />
        <g className="o-ink">
          <path d="M144 120C150 76 214 60 260 34C306 60 370 76 376 120M176 120C182 92 228 78 260 60C292 78 338 92 344 120" />
          <path d="M144 120H176V130H144ZM344 120H376V130H344Z" />
          <path d="M150 130V250M170 130V250M350 130V250M370 130V250" />
          <path d="M157 138V242M163 138V242M357 138V242M363 138V242" strokeWidth="1.2" />
          <path d="M146 250H374V262H146ZM132 262H388V280H132Z" />
          <path d="M252 34C248 28 252 22 260 22C268 22 272 28 268 34ZM260 22V6M260 8L282 13L260 18" />
          <path d="M260 60V68C260 74 266 75 266 80C266 86 260 88 256 84" strokeWidth="2.8" />
          {garland.map(([x, y]) => <circle key={x} cx={x} cy={y} r="6.5" />)}
          <path d="M184 242C186 251 206 251 208 242ZM312 242C314 251 334 251 336 242Z" />
          <path d="M196 240C191 235 193 228 196 222C199 228 201 235 196 240ZM324 240C319 235 321 228 324 222C327 228 329 235 324 240Z" strokeWidth="1.6" />
        </g>
        <g className="o-ink">
          {[34, 50, 66].map((r, i) => <path key={r} className="o-chime" style={vars({ "--i": i })} d={chime(r)} />)}
        </g>
        <g className="o-petals">
          {petals.map(([x, y, dx, r, f], i) => <path key={i} className="o-petal" fill={f} d={petal(x, y)} style={vars({ "--i": i, "--dx": `${dx}px`, "--r": `${r}deg` })} />)}
        </g>
      </svg>
      <Trigger at={["50%", "42%", "11%"]} label={label} onOpen={onOpen} viewBox="0 0 60 88">
        <path className="o-wash" fill={SUN} d="M30 17C21 17 17 23 17 32C17 46 13 56 6 64H54C47 56 43 46 43 32C43 23 39 17 30 17Z" />
        <ellipse className="o-wash" fill={MARIGOLD} cx="30" cy="65" rx="25" ry="4.5" />
        <path className="o-wash" fill={MARIGOLD} d="M25 18C25 13 35 13 35 18Z" />
        <g className="o-ink">
          <ellipse cx="30" cy="8" rx="5" ry="6" />
          <path d="M25 18C25 13 35 13 35 18Z" strokeWidth="1.8" />
          <path d="M30 17C21 17 17 23 17 32C17 46 13 56 6 64H54C47 56 43 46 43 32C43 23 39 17 30 17Z" />
          <ellipse cx="30" cy="65" rx="25" ry="4.5" />
          <path d="M18 30H42M16 43C24 46 36 46 44 43" strokeWidth="1.4" />
          <path d="M24 37h1M30 37h1M36 37h1" strokeWidth="2.6" />
          <g className="o-clapper"><path d="M30 70V77" /><circle cx="30" cy="81" r="4" fill={MARIGOLD} /></g>
        </g>
      </Trigger>
    </>
  );
}

function Cloth({ label, onOpen }: { label: string; onOpen: () => void }) {
  const cloth = "M112 226C104 196 112 162 146 144C178 130 220 126 260 126C300 126 342 130 374 144C408 162 416 196 408 226C384 212 356 204 326 204C302 204 282 220 260 236C238 220 218 204 194 204C164 204 136 212 112 226Z";
  const swirl = "M206 190C212 176 238 172 248 180C256 186 246 196 236 192C226 188 234 176 252 176C274 176 284 194 300 188C310 184 310 176 304 174";
  const grains: [number, number][] = [[180, 184], [192, 198], [224, 200], [290, 200], [330, 174], [214, 170], [296, 168], [344, 190]];
  const kumkum: [number, number][] = [[367, 192], [325, 205], [260, 210], [195, 205], [153, 192], [153, 174], [367, 174]];
  const bandhani = ([[146, [180, 220, 260, 300, 340]], [166, [160, 200, 240, 280, 320, 360]], [186, [140, 180, 220, 260, 300, 340, 380]], [208, [260]]] as [number, number[]][]).flatMap(([y, xs]) => xs.map((x) => [x, y] as const));
  const twinkles: [number, number, number][] = [[206, 158, 8], [244, 146, 6], [282, 152, 9], [318, 160, 6]];
  return (
    <>
      <svg className="o-art" viewBox="0 0 520 300" aria-hidden="true">
        <ellipse className="o-shadow" cx="260" cy="258" rx="160" ry="8" />
        {/* the low bajot */}
        <path className="o-wash" fill="#4f9a94" d="M120 220H400V234H120ZM124 234H138L136 256H126ZM382 234H396L394 256H384Z" />
        <path className="o-wash" fill="#e8899e" d={`M140 234${"q8 8 16 0".repeat(15)}Z`} />
        {[148, 184, 220, 300, 336, 372].map((x) => <circle key={x} cx={x} cy="227" r="2.5" fill={SUN} />)}
        <g className="o-ink"><path d="M120 220H400V234H120ZM124 234L126 256H136L138 234M382 234L384 256H394L396 234" /><path d={`M140 234${"q8 8 16 0".repeat(15)}`} strokeWidth="1.5" /></g>
        {/* the brass thali: only its rim shows under the cloth */}
        <ellipse className="o-wash" fill={MARIGOLD} cx="260" cy="188" rx="124" ry="30" />
        <ellipse className="o-wash" fill={SUN} cx="260" cy="182" rx="124" ry="30" />
        <g className="o-ink"><ellipse cx="260" cy="182" rx="124" ry="30" /><path d="M136 182V188C136 228 384 228 384 188V182" /></g>
        <g className="o-rice">
          <ellipse className="o-wash" fill="#f6e3bf" cx="260" cy="185" rx="100" ry="21" />
          <path className="o-wash" fill="none" stroke="#c8693f" strokeWidth="5" opacity=".35" d={swirl} />
          {kumkum.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill={RED} />)}
          <g className="o-ink">
            <ellipse cx="260" cy="184" rx="104" ry="23" strokeWidth="1.4" />
            <path d={swirl} strokeWidth="2" />
            <path d="M316 194h1" strokeWidth="3" />
            <path d={grains.map(([x, y]) => `M${x} ${y}l4 -1`).join("")} strokeWidth="1.3" />
          </g>
        </g>
        {/* the bandhani cloth (a solid layer under the wash, so the rice doesn't show through) */}
        <g className="o-cloth">
          <path fill="#c2457a" d={cloth} transform="matrix(.96 0 0 .96 10.4 7.2)" />
          <path className="o-wash" fill="#c2457a" d={cloth} />
          <path fill="none" stroke="#4f9a94" strokeWidth="6" strokeLinecap="round" d="M132 210C150 202 170 197 194 197C218 197 240 212 260 228C280 212 302 197 326 197C350 197 370 202 388 210" />
          {bandhani.map(([x, y], i) => <g key={i} fill={i % 3 ? "#fbf6ec" : SUN}><circle cx={x} cy={y - 4} r="1.8" /><circle cx={x + 4} cy={y} r="1.8" /><circle cx={x} cy={y + 4} r="1.8" /><circle cx={x - 4} cy={y} r="1.8" /></g>)}
          <g className="o-ink"><path d={cloth} /></g>
        </g>
        <g className="o-twinkles">
          {twinkles.map(([x, y, r], i) => (
            <g key={x} className="o-twinkle" style={vars({ "--i": i })}>
              <path className="o-wash" fill={SUN} d={star(x, y, r)} />
              <g className="o-ink"><path d={star(x, y, r)} strokeWidth="1.8" /></g>
            </g>
          ))}
        </g>
      </svg>
      <Trigger at={["78.5%", "86%", "10%"]} label={label} onOpen={onOpen} viewBox="0 0 48 64">
        <circle className="o-wash" fill={MARIGOLD} cx="24" cy="13" r="6" />
        <path className="o-wash" fill="#4f9a94" d="M18 22H30L37 55C31 61 17 61 11 55Z" />
        <path className="o-wash" fill={SUN} d="M17 23H31V30H17Z" />
        <g className="o-ink"><path d="M24 0V7M24 19V22" /><circle cx="24" cy="13" r="6" /><path d="M18 22H30L37 55C31 61 17 61 11 55Z" /><path d="M17 30H31" strokeWidth="1.6" /><path d="M20 34L17 56M24 33V58M28 34L31 56" strokeWidth="1.3" /></g>
      </Trigger>
    </>
  );
}

const OPENERS: Record<ArtName, (p: { label: string; onOpen: () => void }) => ReactNode> = { wedding: Scroll, birthday: GiftBox, garba: Rangoli, opening: Ribbon, engagement: RingBox, babyshower: Cradle, housewarming: Door, anniversary: Letter, diwali: Diyas, janoi: Thread, puja: Bell, naming: Cloth };

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
