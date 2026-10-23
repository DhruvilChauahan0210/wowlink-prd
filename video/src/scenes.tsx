import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Confetti, F, Logo, Mark, Phone, Pop, Shockwave, Sparkle, Stamp, Sticker, Tap, Bunting, onScreen, bump, useIn, useRange, useShape, useWord } from "./kit";

/*
 * The scenes, one per line of the voiceover, cut like a Reel: every beat lands on a spoken word (useWord), with
 * stamps, stickers, smooth pushes and a little confetti, all on calm springs, so it moves with purpose. Frames count from each scene's own start. The vertical Reel has the
 * phone below the captions; the wide version has it on the right.
 */

/** Where the phone and the middle of the action go, for the frame's shape. */
export function useLayout() {
  const { wide } = useShape();
  return wide
    ? { wide, phoneW: 440, phoneX: 1290, phoneY: 82, centerX: 1510, centerY: 540 }
    : { wide, phoneW: 630, phoneX: 225, phoneY: 560, centerX: 540, centerY: 1220 };
}

export const sfx = (name: string, at: number, volume = 0.5) => <Sequence from={Math.max(0, at)} durationInFrames={90} key={`${name}-${at}`}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume}/></Sequence>;

/** A phone gliding in: up from below, in from the right, or zooming up from smaller, easing into place. */
function useWhipIn(delay = 0, from: "below" | "right" | "zoom" = "below") {
  const p = useIn(delay, { damping: 17, stiffness: 150 });
  if (from === "right") return { transform: `translateX(${(1 - p) * 900}px) rotate(${(1 - p) * 5}deg)`, opacity: Math.min(1, p * 3) };
  if (from === "zoom") return { transform: `translateY(${(1 - p) * 140}px) scale(${0.82 + 0.18 * p})`, opacity: Math.min(1, p * 2.5) };
  return { transform: `translateY(${(1 - p) * 900}px) rotate(${(1 - p) * -4}deg)`, opacity: Math.min(1, p * 3) };
}

// ---------- 1. "Shaadi ka invitation... abhi bhi PDF mein?!" ----------

function Bubble({ delay, children, wide }: { delay: number; children: React.ReactNode; wide: boolean }) {
  return <Pop delay={delay} from={0.5} style={{ alignSelf: "flex-start", maxWidth: "90%", background: C.surface, border: `3px solid ${C.ink}`, borderRadius: "8px 30px 30px 30px", padding: wide ? "16px 22px" : "20px 28px", font: `600 ${wide ? 30 : 40}px/1.25 ${F.sans}`, color: C.ink, boxShadow: `0 7px 0 ${C.ink}22` }}>{children}</Pop>;
}

export function Hook() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneW } = useLayout();
  const { width } = useShape();
  const pdf = useWord("PDF", 50);
  const card = useIn(0, { damping: 16, stiffness: 170 });
  const dead = interpolate(frame, [pdf, pdf + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const left = wide ? phoneX - 140 : 60;
  const boxW = wide ? phoneW + 240 : 960;
  const top = wide ? 140 : 640;
  return <AbsoluteFill>
    <div style={{ position: "absolute", left, top, width: boxW, transform: `translateY(${(1 - card) * 700}px) rotate(${(1 - card) * 4}deg)`, filter: `grayscale(${dead * 0.85}) blur(${dead * 1.5}px)` }}>
      <div style={{ background: "#efe4cf", border: `3.5px solid ${C.ink}`, borderRadius: 44, padding: wide ? 26 : 34, display: "flex", flexDirection: "column", gap: wide ? 16 : 22, boxShadow: `14px 16px 0 ${C.ink}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 14, borderBottom: `2px dashed ${C.ink}33` }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: C.marigold, display: "grid", placeItems: "center", font: `800 32px ${F.serif}`, color: C.dark }}>S</div>
          <div><div style={{ font: `800 ${wide ? 30 : 38}px ${F.sans}`, color: C.ink }}>Sharma Parivar 💍</div><div style={{ font: `500 ${wide ? 22 : 26}px ${F.sans}`, color: C.muted }}>23 members</div></div>
        </div>
        <Bubble delay={3} wide={wide}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 84, height: 100, borderRadius: 12, background: "#d64532", color: "white", display: "grid", placeItems: "center", font: `900 26px ${F.sans}` }}>PDF</div>
            <div><div style={{ font: `700 ${wide ? 28 : 34}px/1.2 ${F.sans}` }}>Shaadi_Card_FINAL_v3.pdf</div><div style={{ color: C.muted, font: `500 ${wide ? 22 : 26}px ${F.sans}`, marginTop: 6 }}>4.2 MB · 12 pages</div></div>
          </div>
        </Bubble>
        <Bubble delay={11} wide={wide}>Bhai, download hi nahi ho raha</Bubble>
        <Bubble delay={19} wide={wide}>Venue kaunsa hai??</Bubble>
        <Bubble delay={27} wide={wide}>Zoom karke bhi padh nahi paa raha</Bubble>
      </div>
    </div>
    <Sticker at={14} emoji="😭" x={left + boxW - 90} y={top + (wide ? 250 : 330)} rotate={12}/>
    <Sticker at={30} emoji="💀" x={left + boxW - 120} y={top + (wide ? 470 : 620)} rotate={-10} size={110}/>
    <Stamp at={pdf} style={{ left: wide ? left + boxW / 2 : width / 2, top: top + (wide ? 300 : 380) }} size={wide ? 120 : 150} rotate={-12}>PDF?! ✗</Stamp>
    {[3, 11, 19, 27].map((at) => sfx("pop", at, 0.4))}
    {sfx("scratch", pdf - 4, 0.7)}{sfx("stamp", pdf, 0.9)}
  </AbsoluteFill>;
}

// ---------- 2. "Toh milo WowLink se! Haath se bana, animated invitation, bas ek link mein!" ----------

export function Reveal() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW, centerX, centerY } = useLayout();
  const haath = useWord("Haath", 50);
  const link = useWord("link", 120);
  const slam = useIn(1, { damping: 14, stiffness: 190 });
  const away = interpolate(frame, [haath - 8, haath], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const phone = useWhipIn(haath - 4);
  const float = Math.sin(frame / 30) * 6;
  return <AbsoluteFill>
    <Bunting delay={0}/>
    <Shockwave at={1} x={centerX} y={centerY}/>
    <Confetti at={2} x={centerX} y={centerY} count={44} power={1.1}/>
    <div style={{ position: "absolute", left: centerX, top: centerY, transform: `translate(-50%, -50%) scale(${(1.7 - 0.7 * slam) * (1 - away)}) rotate(${(1 - slam) * -4 + away * 12}deg)`, opacity: 1 - away }}>
      <div style={{ background: C.surface, border: `5px solid ${C.dark}`, borderRadius: 40, padding: "34px 48px", boxShadow: `0 16px 0 ${C.dark}` }}>
        <Logo size={wide ? 110 : 130}/>
      </div>
    </div>
    <div style={{ position: "absolute", left: phoneX, top: phoneY + float, ...phone }}>
      <div style={{ transform: `scale(${bump(frame, [link], 0.03)})` }}><Phone screen="footage/guest-closed.png" width={phoneW}/></div>
    </div>
    <Sticker at={haath + 10} emoji="✨" x={phoneX - 20} y={phoneY + 260} size={110}/>
    <Sticker at={haath + 22} emoji="🎨" x={phoneX + phoneW + 10} y={phoneY + 520} size={110} rotate={10}/>
    <Stamp at={link} color={C.cream} ink={C.dark} rotate={-4} size={wide ? 40 : 46} style={{ left: wide ? phoneX + phoneW / 2 - 60 : 540, top: wide ? phoneY + 830 : 1730 }}>🔗 wowlink-one.vercel.app/e/isha-kabir</Stamp>
    {sfx("boom", 0, 0.85)}{sfx("swoosh-up", haath - 8, 0.5)}{sfx("stamp", link, 0.7)}{sfx("sparkle", haath + 10, 0.4)}
  </AbsoluteFill>;
}

// ---------- 3. "Occasion chuno, naam likho, aur publish! Bas!" ----------

export function Studio() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const naam = useWord("naam", 26);
  const publish = useWord("publish", 57);
  const phone = useWhipIn(0, "zoom");
  const scroll = interpolate(frame, [2, 20], [0, 240], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => t * t * (3 - 2 * t) });
  const toStudio = useRange(naam - 6, naam);
  const toPublish = useRange(publish + 2, publish + 7);
  const name = "Isha & Kabir";
  const typed = name.slice(0, Math.max(0, Math.floor((frame - naam) / 1.6)));
  const typing = useIn(naam - 2, { damping: 16, stiffness: 190 });
  const typingOut = useRange(publish - 4, publish + 2);
  const tapCard = onScreen(phoneW, 585, 1456 - 240);
  const tapPublish = onScreen(phoneW, 993, 95);
  // The screen pushes into the card that's tapped and dissolves into the studio, which settles into place.
  const k = (phoneW * 0.93) / 1170;
  const into = interpolate(frame, [14, naam], [1, 1.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <div style={{ transform: `scale(${bump(frame, [publish + 4], 0.03)})` }}>
        <Phone width={phoneW}>
          <Img src={staticFile("footage/templates.png")} style={{ position: "absolute", top: -scroll * k, width: "100%", opacity: 1 - toStudio, transform: `scale(${into})`, transformOrigin: `${585 * k}px ${1456 * k}px` }}/>
          <Img src={staticFile("footage/studio-edit.png")} style={{ position: "absolute", top: 0, width: "100%", opacity: toStudio * (1 - toPublish), transform: `scale(${1.08 - 0.08 * toStudio})` }}/>
          <Img src={staticFile("footage/publish.png")} style={{ position: "absolute", top: 0, width: "100%", opacity: toPublish, transform: `scale(${0.92 + toPublish * 0.08})` }}/>
        </Phone>
        <Tap at={16} {...tapCard}/>
        <Tap at={publish} {...tapPublish} size={70}/>
      </div>
    </div>
    <div style={{ position: "absolute", left: wide ? phoneX - 360 : 90, top: wide ? phoneY + 560 : phoneY + 760, width: wide ? 600 : 900, opacity: typing * (1 - typingOut), transform: `translateY(${(1 - typing) * 80}px) rotate(-3deg) scale(${0.9 + 0.1 * typing})` }}>
      <div style={{ background: C.surface, border: `4px solid ${C.ink}`, borderRadius: 28, padding: wide ? "20px 28px" : "26px 36px", boxShadow: `10px 12px 0 ${C.red}` }}>
        <div style={{ font: `700 ${wide ? 32 : 40}px ${F.hand}`, color: C.muted }}>Names or occasion title</div>
        <div style={{ font: `600 ${wide ? 54 : 72}px ${F.serif}`, color: C.ink, marginTop: 4 }}>{typed}<span style={{ opacity: Math.floor(frame / 6) % 2 ? 1 : 0.15, color: C.red }}>|</span></div>
      </div>
    </div>
    <Stamp at={publish + 5} color={C.green} rotate={8} size={wide ? 90 : 120} style={{ left: wide ? phoneX + phoneW / 2 : 540, top: wide ? phoneY + 420 : phoneY + 560 }}>LIVE! 🎉</Stamp>
    <Confetti at={publish + 5} x={wide ? phoneX + phoneW / 2 : 540} y={wide ? phoneY + 420 : phoneY + 560} count={40}/>
    {sfx("whoosh", 0, 0.5)}{sfx("tap", 16, 0.8)}
    {Array.from({ length: name.length }, (_, i) => sfx("tap", naam + Math.round(i * 1.6), 0.22))}
    {sfx("tap", publish, 0.8)}{sfx("stamp", publish + 5, 0.8)}{sfx("sparkle", publish + 7, 0.45)}
  </AbsoluteFill>;
}

// ---------- 4. "Mehmaan link kholte hain, aur invitation sach mein khulta hai!" ----------

export function Guest() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const khulta = useWord("khulta", 60);
  const phone = useWhipIn(0, "right");
  const note = useIn(2, { damping: 16 });
  const noteOut = useRange(13, 18);
  const tapAt = 14;
  // The real opening (made at 30 fps), sped up a little to finish on "khulta hai".
  const speed = 102 / Math.max(30, khulta + 18 - tapAt);
  // Between two captured frames, the next one fades over the last, so the sped-up opening stays smooth.
  const at = Math.max(0, Math.min(102, (frame - tapAt - 2) * speed));
  const open = Math.floor(at);
  const next = Math.min(102, open + 1);
  const opening = (n: number) => staticFile(`footage/opening/${String(n).padStart(3, "0")}.jpg`);
  const tapKnot = onScreen(phoneW, 585, 1515);
  const inner = phoneW * 0.93;
  const bloom = spring({ frame: frame - khulta, fps, config: { damping: 15 } });
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <div style={{ transform: `scale(${bump(frame, [khulta], 0.03)})` }}>
        <Phone width={phoneW}>
          {frame < tapAt + 2
            ? <Img src={staticFile("footage/guest-closed.png")} style={{ position: "absolute", width: "100%" }}/>
            : <><Img src={opening(open)} style={{ position: "absolute", width: "100%" }}/><Img src={opening(next)} style={{ position: "absolute", width: "100%", opacity: at - open }}/></>}
          <div style={{ position: "absolute", left: inner * 0.04, right: inner * 0.04, top: inner * 0.04, transform: `translateY(${(1 - note) * -180 - noteOut * 220}px)`, opacity: 1 - noteOut, background: "rgba(250,245,234,.97)", borderRadius: inner * 0.05, padding: inner * 0.035, boxShadow: "0 12px 30px rgba(0,0,0,.3)", display: "flex", gap: inner * 0.03, alignItems: "center" }}>
            <div style={{ width: inner * 0.12, height: inner * 0.12, borderRadius: inner * 0.03, background: "#25a85a", display: "grid", placeItems: "center", color: "white", font: `800 ${inner * 0.06}px ${F.sans}` }}>W</div>
            <div style={{ font: `500 ${inner * 0.037}px/1.3 ${F.sans}`, color: C.ink }}><b>Isha 💌</b> · now<br/>Hamari shaadi mein zaroor aana! wowlink-one.vercel.app/e/isha-kabir</div>
          </div>
        </Phone>
        <Tap at={tapAt} {...tapKnot}/>
      </div>
    </div>
    {frame >= khulta && [0, 1, 2, 3, 4, 5].map((i) => <Sparkle key={i} x={phoneX + phoneW / 2 + Math.cos(i * 1.05) * (phoneW * 0.62) * bloom} y={phoneY + 640 + Math.sin(i * 1.05) * 520 * bloom} delay={khulta + i} size={60} color={i % 2 ? C.gold : C.cream} kind={i % 2 ? "star" : "flower"}/>)}
    <Sticker at={khulta + 2} emoji="😍" x={wide ? phoneX - 70 : 150} y={phoneY + 360} size={140} rotate={-10}/>
    {sfx("pop", 2, 0.45)}{sfx("tap", tapAt, 0.8)}{sfx("swoosh-up", tapAt + 2, 0.4)}{sfx("sparkle", khulta, 0.55)}{sfx("boom", khulta, 0.35)}
  </AbsoluteFill>;
}

// ---------- 5. "Countdown! Calendar! Aur ek tap mein RSVP!" ----------

export function Rsvp() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const countdown = useWord("Countdown", 0);
  const calendar = useWord("Calendar", 38);
  const rsvp = useWord("RSVP", 105);
  const phone = useWhipIn(0);
  const toForm = useRange(rsvp - 16, rsvp - 10);
  const toDone = useRange(rsvp + 2, rsvp + 6);
  const tapSend = onScreen(phoneW, 585, 1988);
  const check = useIn(rsvp + 4, { damping: 13, stiffness: 190 });
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <div style={{ transform: `scale(${bump(frame, [countdown + 2, calendar + 2, rsvp + 4], 0.025)})` }}>
        <Phone width={phoneW}>
          <Img src={staticFile("footage/guest-details.png")} style={{ position: "absolute", width: "100%", opacity: 1 - toForm }}/>
          <Img src={staticFile("footage/guest-rsvp.png")} style={{ position: "absolute", width: "100%", opacity: toForm * (1 - toDone) }}/>
          <Img src={staticFile("footage/guest-replied.png")} style={{ position: "absolute", width: "100%", opacity: toDone }}/>
        </Phone>
        <Tap at={rsvp} {...tapSend}/>
      </div>
    </div>
    <Stamp at={countdown + 2} color={C.cream} ink={C.dark} rotate={-6} size={wide ? 46 : 62} style={wide ? { left: phoneX - 20, top: phoneY + 200 } : { left: 330, top: phoneY + 170 }}>⏳ 49 din baaki</Stamp>
    <Stamp at={calendar + 2} color={C.cream} ink={C.dark} rotate={5} size={wide ? 46 : 60} style={wide ? { left: phoneX + phoneW / 2, top: phoneY + 470 } : { left: 560, top: phoneY + 600 }}>📅 Calendar mein add</Stamp>
    <div style={{ position: "absolute", left: phoneX + phoneW - (wide ? 120 : 140), top: phoneY + (wide ? 140 : 200), width: 190, height: 190, borderRadius: "50%", background: C.green, border: `6px solid ${C.dark}`, display: "grid", placeItems: "center", transform: `scale(${check}) rotate(${(1 - check) * -20}deg)`, boxShadow: `0 12px 0 ${C.dark}` }}>
      <svg width="110" height="110" viewBox="0 0 24 24"><path d="M3 13C6 15 8 18 10 21C13 13 17 8 22 3" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, Math.max(0, (frame - rsvp - 6) / 7))}/></svg>
    </div>
    <Stamp at={rsvp + 9} color={C.red} rotate={-7} size={wide ? 70 : 90} style={{ left: wide ? phoneX + phoneW / 2 : 540, top: phoneY + (wide ? 760 : 1050) }}>RSVP done ✅</Stamp>
    {sfx("whoosh", 0, 0.4)}{sfx("stamp", countdown + 2, 0.6)}{sfx("stamp", calendar + 2, 0.6)}{sfx("tap", rsvp, 0.8)}{sfx("chime", rsvp + 4, 0.55)}{sfx("stamp", rsvp + 9, 0.7)}
  </AbsoluteFill>;
}

// ---------- 6. "Gujarati, Hindi ya English, aapki marzi!" ----------

export function Languages() {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const gujarati = useWord("Gujarati", 0);
  const hindi = useWord("Hindi", 22);
  const english = useWord("English", 37);
  const marzi = useWord("marzi", 65);
  const w = wide ? 300 : 420;
  const y = wide ? 190 : 650;
  const phones = wide
    ? [{ screen: "gujarati-opened", label: "ગુજરાતી", font: F.guj, x: 1010, rot: -9, at: gujarati }, { screen: "hindi-opened", label: "हिन्दी", font: F.deva, x: 1560, rot: 9, at: hindi }, { screen: "guest-opened", label: "English", font: F.hand, x: 1285, rot: 0, at: english }]
    : [{ screen: "gujarati-opened", label: "ગુજરાતી", font: F.guj, x: 30, rot: -10, at: gujarati }, { screen: "hindi-opened", label: "हिन्दी", font: F.deva, x: 630, rot: 10, at: hindi }, { screen: "guest-opened", label: "English", font: F.hand, x: 330, rot: 0, at: english }];
  return <AbsoluteFill>
    {phones.map((p) => <Slammed key={p.screen} {...p} w={w} y={y + (p.rot ? 70 : 0)}/>)}
    <Sticker at={marzi} emoji="😎" x={wide ? 1700 : 900} y={wide ? 150 : 600} size={140} rotate={12}/>
    {phones.map((p) => sfx("stamp", p.at + 2, 0.55))}{sfx("pop", marzi, 0.5)}
  </AbsoluteFill>;

  function Slammed({ screen, label, font, x, rot, at, w: width, y: top }: { screen: string; label: string; font: string; x: number; rot: number; at: number; w: number; y: number }) {
    const p = useIn(at, { damping: 16, stiffness: 190 });
    return <div style={{ position: "absolute", left: x, top, transform: `scale(${1.35 - 0.35 * p}) rotate(${rot * p + (1 - p) * 8}deg)`, opacity: Math.min(1, p * 3) }}>
      <div style={{ position: "absolute", top: -112, left: 0, width, textAlign: "center" }}><span style={{ display: "inline-block", background: C.red, color: C.cream, border: `4px solid ${C.dark}`, borderRadius: 18, padding: "4px 22px", font: `700 ${font === F.hand ? 58 : 46}px ${font}`, transform: `rotate(${-rot / 2}deg)`, boxShadow: `0 7px 0 ${C.dark}` }}>{label}</span></div>
      <Phone screen={`footage/${screen}.png`} width={width}/>
    </div>;
  }
}

// ---------- 7. "Aur saare jawaab, ek hi jagah!" ----------

export function Host() {
  const frame = useCurrentFrame();
  const { wide, phoneX, phoneY, phoneW } = useLayout();
  const jagah = useWord("jagah", 44);
  const phone = useWhipIn(0, "right");
  const coming = Math.round(interpolate(frame, [6, 26], [0, 7], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const guests = Math.round(interpolate(frame, [12, 34], [0, 19], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <AbsoluteFill>
    <div style={{ position: "absolute", left: phoneX, top: phoneY, ...phone }}>
      <div style={{ transform: `scale(${bump(frame, [jagah], 0.03)})` }}><Phone screen="footage/host-replies.png" width={phoneW}/></div>
    </div>
    <Pop delay={4} style={{ position: "absolute", left: wide ? phoneX - 250 : 40, top: phoneY + (wide ? 200 : 260), transform: "rotate(-6deg)" }}>
      <Stat n={coming} label="aa rahe hain 🎉" wide={wide}/>
    </Pop>
    <Pop delay={10} style={{ position: "absolute", left: wide ? phoneX + phoneW - 70 : 690, top: phoneY + (wide ? 500 : 720), transform: "rotate(6deg)" }}>
      <Stat n={guests} label="mehmaan" wide={wide} dark/>
    </Pop>
    <Sticker at={jagah} emoji="🙌" x={wide ? phoneX + phoneW / 2 : 540} y={phoneY + (wide ? 880 : 1250)} size={150}/>
    {sfx("whoosh", 0, 0.45)}{sfx("pop", 4, 0.45)}{sfx("pop", 10, 0.45)}{sfx("pop", jagah, 0.5)}
  </AbsoluteFill>;
}

function Stat({ n, label, wide, dark = false }: { n: number; label: string; wide: boolean; dark?: boolean }) {
  return <div style={{ background: dark ? C.dark : C.surface, color: dark ? C.cream : C.ink, border: `4px solid ${dark ? C.gold : C.ink}`, borderRadius: 30, padding: wide ? "16px 30px" : "20px 36px", boxShadow: `10px 12px 0 ${dark ? C.marigold : C.red}`, textAlign: "center" }}>
    <div style={{ font: `700 ${wide ? 96 : 120}px/1 ${F.serif}` }}>{n}</div>
    <div style={{ font: `700 ${wide ? 34 : 42}px ${F.hand}`, color: dark ? C.gold : C.red }}>{label}</div>
  </div>;
}

// ---------- 8. "Toh der kis baat ki? Apna pehla invitation free mein banao!" and the end card ----------

export function Cta() {
  const frame = useCurrentFrame();
  const { wide } = useLayout();
  const { width, height } = useShape();
  const apna = useWord("Apna", 52);
  const free = useWord("free", 80);
  const logo = useIn(apna, { damping: 14, stiffness: 190 });
  const line1 = useIn(apna + 4, { damping: 16 });
  const url = useIn(free + 14, { damping: 16, stiffness: 190 });
  const langs = useIn(free + 34, { damping: 14 });
  const glow = 0.85 + 0.15 * Math.sin(frame / 24);
  const cx = width / 2;
  return <AbsoluteFill>
    <Bunting delay={apna}/>
    {frame >= apna && <>
      <div style={{ position: "absolute", left: cx, top: wide ? 210 : 470, transform: `translate(-50%, -50%) scale(${1.6 - 0.6 * logo}) rotate(${(1 - logo) * -4}deg)`, opacity: Math.min(1, logo * 3) }}>
        <div style={{ filter: `drop-shadow(0 0 ${40 * glow}px rgba(229,179,106,.5))` }}><Logo size={wide ? 96 : 120} color={C.cream} mark={C.gold}/></div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 330 : 680, textAlign: "center", color: C.cream, font: `600 ${wide ? 70 : 76}px/1.1 ${F.serif}`, opacity: line1, transform: `translateY(${(1 - line1) * 60}px)` }}>Apna pehla invitation</div>
    </>}
    <Stamp at={free} color={C.gold} ink={C.dark} rotate={-7} size={wide ? 120 : 170} style={{ left: cx, top: wide ? 565 : 975, textAlign: "center" }}>FREE<div style={{ fontSize: "0.5em", marginTop: "0.1em" }}>mein banao!</div></Stamp>
    <Shockwave at={free} x={cx} y={wide ? 565 : 975} color={C.gold} size={1200}/>
    <Confetti at={free} x={cx} y={wide ? 565 : 975} count={60} power={1.3}/>
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 735 : 1230, display: "flex", justifyContent: "center", opacity: Math.min(1, url * 2), transform: `translateY(${(1 - url) * 80}px) scale(${0.9 + 0.1 * url})` }}>
      <div style={{ background: C.cream, color: C.dark, borderRadius: 999, padding: wide ? "22px 48px" : "28px 56px", font: `800 ${wide ? 50 : 56}px ${F.sans}`, boxShadow: `0 0 0 5px ${C.dark}, 0 0 0 10px ${C.gold}, 0 18px 40px rgba(0,0,0,.4)`, display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={wide ? 48 : 56} color={C.red}/> wowlink-one.vercel.app
      </div>
    </div>
    <Sticker at={free + 26} emoji="👆" x={wide ? cx + 470 : cx + 300} y={wide ? 860 : 1400} size={wide ? 110 : 130} rotate={-12}/>
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? 905 : 1480, textAlign: "center", color: C.gold, opacity: langs, font: `700 ${wide ? 48 : 56}px ${F.hand}` }}>
      English · <span style={{ fontFamily: F.guj, fontWeight: 600, fontSize: "0.82em" }}>ગુજરાતી</span> · <span style={{ fontFamily: F.deva, fontWeight: 600, fontSize: "0.82em" }}>हिन्दी</span>
    </div>
    {frame > free + 40 && [...Array(8)].map((_, i) => <Sparkle key={i} x={(width * (i + 0.5)) / 8} y={wide ? (i % 2 ? 90 : 1000) : (i % 2 ? 230 : 1750)} delay={free + 40 + i * 2} size={50 + (i % 3) * 12} color={i % 2 ? C.gold : C.marigold} kind={i % 2 ? "star" : "flower"}/>)}
    {height > 0 && <>{sfx("boom", 0, 0.7)}{sfx("boom", apna, 0.6)}{sfx("stamp", free, 0.9)}{sfx("sparkle", free + 2, 0.6)}{sfx("pop", free + 14, 0.5)}{sfx("pop", free + 26, 0.45)}</>}
  </AbsoluteFill>;
}
