import { SealMark, WowLinkBrand } from "./brand";
import { SiteFooter } from "./site-footer";

/*
 * What a guest sees when an invitation's link doesn't open: unpublished, ended, taken down, or a personal link the
 * hosts replaced. The guest's language isn't known here, so it says it in all three, plainly: no error codes, no
 * selling, just who to ask.
 */
const SAY = [
  { lang: "en", title: ["This invitation", "isn’t open right now."], body: "Please check with the hosts: they may have a new link for you." },
  { lang: "gu", title: ["આ આમંત્રણ", "અત્યારે ખુલ્લું નથી."], body: "કૃપા કરીને યજમાનને પૂછો: કદાચ તેમની પાસે આપના માટે નવી લિંક હોય." },
  { lang: "hi", title: ["यह निमंत्रण", "अभी खुला नहीं है।"], body: "कृपया मेज़बानों से पूछें: हो सकता है उनके पास आपके लिए नया लिंक हो।" },
] as const;

export function InvitationClosed() {
  const [first, ...others] = SAY;
  return <div className="cinema inv-not-found theme-paper"><header><WowLinkBrand/></header><main><SealMark/>
    <h1 lang={first.lang}>{first.title[0]} <em>{first.title[1]}</em></h1><p lang={first.lang}>{first.body}</p>
    {others.map(say => <p key={say.lang} lang={say.lang} className="inv-nf-other"><strong>{say.title.join(" ")}</strong> {say.body}</p>)}
  </main><SiteFooter/></div>;
}
