import { AbsoluteFill, Img, interpolate, Sequence, Audio, staticFile, useCurrentFrame } from "remotion";
import { C, Chip, F, Logo, Mark, Paper, Phone, Pop, Sparkle, Tap, Bunting, onScreen, useIn, useRange, useShape } from "./kit";

/*
 * The scenes, one per line of the voiceover. Frames count from each scene's own start. The vertical Reel has the
 * caption on top and the phone below; the wide version has the caption on the left and the phone on the right.
 */

/** Where the phone and the caption go, for the frame's shape. */
export function useLayout() {
  const { wide } = useShape();
  return wide
    ? { wide, phoneW: 440, phoneX: 1290, phoneY: 82, centerX: 1510, centerY: 540 }
    : { wide, phoneW: 630, phoneX: 225, phoneY: 560, centerX: 540, centerY: 1220 };
}

const sfx = (name: string, at: number, volume = 0.5) => <Sequence from={at} durationInFrames={60} key={`${name}-${at}`}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume}/></Sequence>;

/** The phone sliding up into place as a scene starts. */
function usePhoneIn(delay = 0) {
  const p = useIn(delay, { damping: 15, stiffness: 110 });
  return { transform: `translateY(${(1 - p) * 500}px) rotate(${(1 - p) * 6}deg)`, opacity: Math.min(1, p * 2) };
}

// ---------- 1. "Shaadi ka invitation... abhi bhi PDF mein?" ----------

function Bubble({ delay, children, wide }: { delay: number; children: React.ReactNode; wide: boolean }) {
  return <Pop delay={delay} from={0.8} style={{ alignSelf: "flex-start", maxWidth: "88%", background: C.surface, border: `2.5px solid ${C.ink}`, borderRadius: "8px 28px 28px 28px", padding: wide ? "16px 22px" : "20px 26px", font: `500 ${wide ? 30 : 38}px/1.3 ${F.sans}`, color: C.ink, boxShadow: "0 6px 0 rgba(36,26,19,.12)" }}>{children}</Pop>;
}

export function Hook() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneW } = useLayout();
  const card = useIn(0, { damping: 16 });
  const scribble = useRange(98, 116);
  const shake = frame > 112 && frame < 128 ? Math.sin(frame * 2.2) * 10 : 0;
  const leave = useRange(140, 159);
  const left = wide ? phoneX - 120 : 70;
  const width = wide ? phoneW + 200 : 940;
  return <AbsoluteFill>
    <div style={{ position: "absolute", left, top: wide ? 150 : 700, width, transform: `translateY(${(1 - card) * 300 + leave * 500}px) rotate(${leave * 10 + shake * 0.15}deg) translateX(${shake}px)`, opacity: card * (1 - leave) }}>
      <div style={{ background: "#efe4cf", border: `3px solid ${C.ink}`, borderRadius: 40, padding: wide ? 28 : 34, display: "flex", flexDirection: "column", gap: wide ? 18 : 24, boxShadow: "0 30px 70px rgba(36,26,19,.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 14, borderBottom: `2px dashed ${C.ink}33` }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.marigold, display: "grid", placeItems: "center", font: `700 30px ${F.serif}`, color: C.dark }}>S</div>
          <div><div style={{ font: `700 ${wide ? 30 : 36}px ${F.sans}`, color: C.ink }}>Sharma Parivar</div><div style={{ font: `500 ${wide ? 22 : 26}px ${F.sans}`, color: C.muted }}>23 members</div></div>
        </div>
        <Bubble delay={8} wide={wide}>
          <div style={{ position: "relative", display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 84, height: 100, borderRadius: 12, background: "#d64532", color: "white", display: "grid", placeItems: "center", font: `800 26px ${F.sans}` }}>PDF</div>
            <div><div style={{ font: `600 ${wide ? 28 : 34}px/1.2 ${F.sans}` }}>Shaadi_Card_FINAL_v3.pdf</div><div style={{ color: C.muted, font: `500 ${wide ? 22 : 26}px ${F.sans}`, marginTop: 6 }}>4.2 MB · 12 pages</div></div>
            <svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="none" style={{ position: "absolute", left: -10, top: -20, overflow: "visible" }}>
              <path d="M10 15C120 60 260 100 390 125" fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, scribble * 2)}/>
              <path d="M390 15C260 50 130 95 10 125" fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, scribble * 2 - 1)}/>
            </svg>
          </div>
        </Bubble>
        <Bubble delay={52} wide={wide}>Bhai, download hi nahi ho raha</Bubble>
        <Bubble delay={76} wide={wide}>Venue kaunsa hai??</Bubble>
        <Bubble delay={100} wide={wide}>Zoom karke bhi padh nahi paa raha</Bubble>
      </div>
    </div>
    {[8, 52, 76, 100].map((at) => sfx("pop", at, 0.35))}
    {sfx("whoosh", 140, 0.6)}
  </AbsoluteFill>;
}

// ---------- 2. "Milo WowLink se. Haath se bana, animated invitation, bas ek link mein." ----------

export function Reveal() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW, centerX, centerY } = useLayout();
  const draw = useRange(4, 36);
  const logoIn = useIn(2, { damping: 10, stiffness: 150 });
  const logoOut = useRange(46, 62);
  const phone = usePhoneIn(50);
  const float = Math.sin(frame / 18) * 8;
  return <AbsoluteFill>
    <Bunting delay={0} top={wide ? 0 : 0}/>
    <div style={{ position: "absolute", left: centerX, top: centerY, transform: `translate(-50%, -50%) scale(${(0.6 + logoIn * 0.4) * (1 - logoOut * 0.5)})`, opacity: 1 - logoOut }}>
      <Logo size={wide ? 120 : 140} draw={draw}/>
    </div>
    <div style={{ position: "absolute", left: phoneX, top: phoneY + float, ...phone }}>
      <Phone screen="footage/guest-closed.png" width={phoneW}/>
    </div>
    <Sparkle x={phoneX - 40} y={phoneY + 220} delay={70} size={70} kind="flower"/>
    <Sparkle x={phoneX + phoneW + 40} y={phoneY + 120} delay={78} size={56} color={C.red}/>
    <Sparkle x={phoneX + phoneW + 30} y={phoneY + 700} delay={86} size={64} kind="flower"/>
    <Sparkle x={phoneX - 30} y={phoneY + 900} delay={94} size={50} color={C.red}/>
    <Pop delay={128} style={{ position: "absolute", left: wide ? phoneX - 210 : 90, top: wide ? phoneY + 760 : 1700, transform: "rotate(-3deg)" }}>
      <Chip size={wide ? 30 : 38}><LinkIcon/> wowlink-one.vercel.app/e/isha-kabir</Chip>
    </Pop>
    {sfx("whoosh", 0, 0.5)}{sfx("whoosh", 48, 0.4)}{sfx("pop", 128, 0.5)}
  </AbsoluteFill>;
}

function LinkIcon() {
  return <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth={2.4} strokeLinecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>;
}

// ---------- 3. "Occasion chuno, naam aur date likho, aur publish karo." ----------

export function Studio() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const phone = usePhoneIn(0);
  const scroll = interpolate(frame, [4, 34], [0, 260], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t * (3 - 2 * t) });
  const toStudio = useRange(38, 46);
  const toPublish = useRange(100, 108);
  const name = "Isha & Kabir";
  const typed = name.slice(0, Math.max(0, Math.floor((frame - 50) / 2.4)));
  const typing = useIn(44, { damping: 13 });
  const typingOut = useRange(96, 104);
  const tapCard = onScreen(phoneW, 585, 1456 - 240);
  const tapPublish = onScreen(phoneW, 993, 95);
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <Phone width={phoneW}>
        <Img src={staticFile("footage/templates.png")} style={{ position: "absolute", top: -scroll * ((phoneW * 0.93) / 1170), width: "100%", opacity: 1 - toStudio }}/>
        <Img src={staticFile("footage/studio-edit.png")} style={{ position: "absolute", top: 0, width: "100%", opacity: toStudio * (1 - toPublish), transform: `translateX(${(1 - toStudio) * 60}px)` }}/>
        <Img src={staticFile("footage/publish.png")} style={{ position: "absolute", top: 0, width: "100%", opacity: toPublish, transform: `scale(${0.94 + toPublish * 0.06})` }}/>
      </Phone>
      <Tap at={30} {...tapCard}/>
      <Tap at={94} {...tapPublish} size={70}/>
    </div>
    <div style={{ position: "absolute", left: wide ? phoneX - 330 : 120, top: wide ? phoneY + 560 : phoneY + 820, width: wide ? 560 : 840, opacity: typing * (1 - typingOut), transform: `translateY(${(1 - typing) * 60}px) rotate(-2deg)` }}>
      <div style={{ background: C.surface, border: `3px solid ${C.ink}`, borderRadius: 24, padding: wide ? "20px 26px" : "26px 34px", boxShadow: `8px 10px 0 ${C.red}` }}>
        <div style={{ font: `700 ${wide ? 32 : 40}px ${F.hand}`, color: C.muted }}>Names or occasion title</div>
        <div style={{ font: `500 ${wide ? 50 : 64}px ${F.serif}`, color: C.ink, marginTop: 6 }}>{typed}<span style={{ opacity: Math.floor(frame / 8) % 2 ? 1 : 0.15, color: C.red }}>|</span></div>
      </div>
    </div>
    {sfx("whoosh", 0, 0.45)}{sfx("tap", 30, 0.8)}
    {Array.from({ length: name.length }, (_, i) => sfx("tap", 50 + Math.round(i * 2.4), 0.25))}
    {sfx("tap", 94, 0.8)}{sfx("pop", 102, 0.6)}
  </AbsoluteFill>;
}

// ---------- 4. "Mehmaan link kholte hain, toh invitation sach mein khulta hai." ----------

export function Guest() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const phone = usePhoneIn(0);
  const note = useIn(4, { damping: 14 });
  const noteOut = useRange(24, 32);
  const open = Math.max(0, Math.min(102, frame - 30));
  const tapKnot = onScreen(phoneW, 585, 1515);
  const inner = phoneW * 0.93;
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <Phone width={phoneW}>
        {frame < 30
          ? <Img src={staticFile("footage/guest-closed.png")} style={{ position: "absolute", width: "100%" }}/>
          : <Img src={staticFile(`footage/opening/${String(open).padStart(3, "0")}.jpg`)} style={{ position: "absolute", width: "100%" }}/>}
        <div style={{ position: "absolute", left: inner * 0.04, right: inner * 0.04, top: inner * 0.05, transform: `translateY(${(1 - note) * -160 - noteOut * 200}px)`, opacity: 1 - noteOut, background: "rgba(250,245,234,.97)", borderRadius: inner * 0.05, padding: inner * 0.035, boxShadow: "0 12px 30px rgba(0,0,0,.25)", display: "flex", gap: inner * 0.03, alignItems: "center" }}>
          <div style={{ width: inner * 0.12, height: inner * 0.12, borderRadius: inner * 0.03, background: "#25a85a", display: "grid", placeItems: "center", color: "white", font: `800 ${inner * 0.06}px ${F.sans}` }}>W</div>
          <div style={{ font: `500 ${inner * 0.037}px/1.3 ${F.sans}`, color: C.ink }}><b>Isha</b> · now<br/>Hamari shaadi mein zaroor aana! wowlink-one.vercel.app/e/isha-kabir</div>
        </div>
      </Phone>
      <Tap at={26} {...tapKnot}/>
    </div>
    <Sparkle x={phoneX - 30} y={phoneY + 300} delay={70} size={64} kind="flower"/>
    <Sparkle x={phoneX + phoneW + 30} y={phoneY + 500} delay={78} size={58} color={C.red}/>
    <Sparkle x={phoneX + phoneW - 10} y={phoneY + 120} delay={90} size={50}/>
    {sfx("pop", 4, 0.4)}{sfx("tap", 26, 0.8)}{sfx("whoosh", 32, 0.35)}{sfx("chime", 96, 0.3)}
  </AbsoluteFill>;
}

// ---------- 5. "Countdown, calendar, aur ek tap mein RSVP." ----------

export function Rsvp() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const toForm = useRange(52, 60);
  const toDone = useRange(88, 94);
  const tapSend = onScreen(phoneW, 585, 1988);
  const check = useIn(92, { damping: 9, stiffness: 160 });
  const side = (left: boolean) => (left ? phoneX - (wide ? 250 : 175) : wide ? phoneX + phoneW - 60 : 545);
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY }}>
      <Phone width={phoneW}>
        <Img src={staticFile("footage/guest-details.png")} style={{ position: "absolute", width: "100%", opacity: 1 - toForm }}/>
        <Img src={staticFile("footage/guest-rsvp.png")} style={{ position: "absolute", width: "100%", opacity: toForm * (1 - toDone) }}/>
        <Img src={staticFile("footage/guest-replied.png")} style={{ position: "absolute", width: "100%", opacity: toDone }}/>
      </Phone>
      <Tap at={84} {...tapSend}/>
    </div>
    <Pop delay={6} style={{ position: "absolute", left: side(true), top: phoneY + 160, transform: "rotate(-4deg)" }}><Chip size={wide ? 30 : 38}>⏳ 49 din baaki</Chip></Pop>
    <Pop delay={30} style={{ position: "absolute", left: side(false), top: phoneY + 470, transform: "rotate(3deg)" }}><Chip size={wide ? 30 : 38}>📅 Calendar mein add</Chip></Pop>
    <div style={{ position: "absolute", left: phoneX + phoneW - (wide ? 110 : 120), top: phoneY + (wide ? 150 : 210), width: 170, height: 170, borderRadius: "50%", background: C.red, display: "grid", placeItems: "center", transform: `scale(${check})`, opacity: Math.min(1, check * 1.5) * interpolate(frame, [118, 132], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), boxShadow: "0 20px 50px rgba(168,52,31,.45)" }}>
      <svg width="100" height="100" viewBox="0 0 24 24"><path d="M3 13C6 15 8 18 10 21C13 13 17 8 22 3" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, (frame - 94) / 10))}/></svg>
    </div>
    <Pop delay={100} style={{ position: "absolute", left: side(false), top: phoneY + (wide ? 690 : 900), transform: "rotate(-3deg)" }}><Chip dark size={wide ? 30 : 38}>RSVP sent!</Chip></Pop>
    {sfx("pop", 6, 0.4)}{sfx("pop", 30, 0.4)}{sfx("tap", 84, 0.8)}{sfx("chime", 92, 0.55)}
  </AbsoluteFill>;
}

// ---------- 6. "Gujarati, Hindi ya English, jismein chaho." ----------

export function Languages() {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const w = wide ? 300 : 420;
  const y = wide ? 170 : 640;
  const phones = wide
    ? [{ screen: "gujarati-opened", label: "ગુજરાતી", font: F.guj, x: 1010, rot: -8, delay: 4 }, { screen: "hindi-opened", label: "हिन्दी", font: F.deva, x: 1560, rot: 8, delay: 28 }, { screen: "guest-opened", label: "English", font: F.hand, x: 1285, rot: 0, delay: 52 }]
    : [{ screen: "gujarati-opened", label: "ગુજરાતી", font: F.guj, x: 40, rot: -9, delay: 4 }, { screen: "hindi-opened", label: "हिन्दी", font: F.deva, x: 640, rot: 9, delay: 28 }, { screen: "guest-opened", label: "English", font: F.hand, x: 340, rot: 0, delay: 52 }];
  return <AbsoluteFill>
    {phones.map((p) => <PhoneIn key={p.screen} {...p} w={w} y={y + (p.rot ? 60 : 0)}/>)}
    {phones.map((p) => sfx("pop", p.delay, 0.45))}
  </AbsoluteFill>;

  function PhoneIn({ screen, label, font, x, rot, delay, w: width, y: top }: { screen: string; label: string; font: string; x: number; rot: number; delay: number; w: number; y: number }) {
    const p = useIn(delay, { damping: 12, stiffness: 130 });
    const bob = Math.sin((frame + delay * 3) / 16) * 6;
    return <div style={{ position: "absolute", left: x, top: top + bob, transform: `translateY(${(1 - p) * 400}px) rotate(${rot * p}deg)`, opacity: Math.min(1, p * 2) }}>
      <div style={{ position: "absolute", top: -96, left: 0, width, textAlign: "center" }}><span style={{ display: "inline-block", font: `700 ${font === F.hand ? 64 : 52}px ${font}`, color: C.red, transform: `rotate(${-rot / 2}deg) scale(${p})` }}>{label}</span></div>
      <Phone screen={`footage/${screen}.png`} width={width}/>
    </div>;
  }
}

// ---------- 7. "Aur saare jawaab, ek hi jagah." ----------

export function Host() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const phone = usePhoneIn(0);
  const coming = Math.round(interpolate(frame, [14, 44], [0, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const guests = Math.round(interpolate(frame, [26, 60], [0, 19], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <Phone screen="footage/host-replies.png" width={phoneW}/>
    </div>
    <Pop delay={12} style={{ position: "absolute", left: wide ? phoneX - 240 : 60, top: phoneY + (wide ? 220 : 300), transform: "rotate(-4deg)" }}>
      <Stat n={coming} label="aa rahe hain" wide={wide}/>
    </Pop>
    <Pop delay={24} style={{ position: "absolute", left: wide ? phoneX + phoneW - 60 : 700, top: phoneY + (wide ? 520 : 760), transform: "rotate(4deg)" }}>
      <Stat n={guests} label="mehmaan" wide={wide} dark/>
    </Pop>
    {sfx("whoosh", 0, 0.4)}{sfx("pop", 12, 0.45)}{sfx("pop", 24, 0.45)}
  </AbsoluteFill>;
}

function Stat({ n, label, wide, dark = false }: { n: number; label: string; wide: boolean; dark?: boolean }) {
  return <div style={{ background: dark ? C.dark : C.surface, color: dark ? C.cream : C.ink, border: `3px solid ${C.ink}`, borderRadius: 28, padding: wide ? "16px 28px" : "20px 34px", boxShadow: `8px 10px 0 ${dark ? C.marigold : C.red}`, textAlign: "center" }}>
    <div style={{ font: `600 ${wide ? 88 : 110}px/1 ${F.serif}` }}>{n}</div>
    <div style={{ font: `700 ${wide ? 34 : 42}px ${F.hand}`, color: dark ? C.gold : C.red }}>{label}</div>
  </div>;
}

// ---------- 8. "Apna pehla invitation free mein banao." and the end card ----------

export function Cta() {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const { width, height } = useShape();
  const hit = useIn(0, { damping: 8, stiffness: 180 });
  const line1 = useIn(6, { damping: 13 });
  const line2 = useIn(16, { damping: 11 });
  const underline = useRange(30, 46);
  const url = useIn(46, { damping: 12 });
  const langs = useIn(70, { damping: 14 });
  const glow = 0.85 + 0.15 * Math.sin(frame / 10);
  const cx = width / 2;
  const big = wide ? 104 : 112;
  return <AbsoluteFill>
    <Paper dark/>
    <Bunting delay={2}/>
    <div style={{ position: "absolute", left: cx, top: wide ? 230 : 520, transform: `translate(-50%, -50%) scale(${hit})` }}>
      <div style={{ filter: `drop-shadow(0 0 ${40 * glow}px rgba(229,179,106,.45))` }}><Logo size={wide ? 96 : 120} color={C.cream} mark={C.gold}/></div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 360 : 760, textAlign: "center", color: C.cream }}>
      <div style={{ font: `500 ${big * 0.62}px/1.1 ${F.serif}`, opacity: line1, transform: `translateY(${(1 - line1) * 40}px)` }}>Apna pehla invitation</div>
      <div style={{ font: `700 ${big}px/1.15 ${F.serif}`, marginTop: 14, opacity: Math.min(1, line2 * 1.4), transform: `scale(${0.7 + 0.3 * line2})` }}>
        <span style={{ position: "relative", color: C.gold, display: "inline-block" }}>free
          <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: -18 }}><path d="M4 18C50 8 110 26 196 12" fill="none" stroke={C.marigold} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - underline}/></svg>
        </span> mein banao.
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 720 : 1240, display: "flex", justifyContent: "center", opacity: Math.min(1, url * 1.4), transform: `translateY(${(1 - url) * 50}px) scale(${0.8 + 0.2 * url})` }}>
      <div style={{ background: C.cream, color: C.dark, borderRadius: 999, padding: wide ? "22px 48px" : "28px 56px", font: `700 ${wide ? 48 : 54}px ${F.sans}`, boxShadow: `0 0 0 4px ${C.dark}, 0 0 0 8px ${C.gold}`, display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={wide ? 46 : 54} color={C.red}/> wowlink-one.vercel.app
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 870 : 1420, textAlign: "center", color: C.gold, opacity: langs, font: `700 ${wide ? 46 : 54}px ${F.hand}` }}>
      English · <span style={{ fontFamily: F.guj, fontWeight: 600, fontSize: "0.82em" }}>ગુજરાતી</span> · <span style={{ fontFamily: F.deva, fontWeight: 600, fontSize: "0.82em" }}>हिन्दी</span>
    </div>
    {[...Array(9)].map((_, i) => <Sparkle key={i} x={(width * (i + 0.5)) / 9 + (i % 2 ? 30 : -30)} y={wide ? (i % 3 === 0 ? 120 : i % 3 === 1 ? 980 : 560) : (i % 3 === 0 ? 250 : i % 3 === 1 ? 1700 : 1080)} delay={4 + i * 3} size={44 + (i % 3) * 14} color={i % 2 ? C.gold : C.marigold} kind={i % 2 ? "star" : "flower"}/>)}
    {height > 0 && sfx("pop", 46, 0.5)}
  </AbsoluteFill>;
}
