import type { Metadata } from "next";
import Link from "next/link";
import { formatInvitationDate, type Lang } from "../lib/invitations";
import { WowLinkBrand } from "../ui/brand";

/*
 * What WowLink keeps, who sees it, and how it's deleted, in plain words, in English and Gujarati (?lang=gu). Guests
 * reach it from the reply form and the invitation's footer, hosts from the manage page. Everything it says is how the
 * app works today; it will be reviewed before public launch (see README, "Current limits").
 */

const UPDATED = "2026-10-23";

type Section = { heading: string; items: string[] };
type Content = { title: string; description: string; heading: readonly [string, string]; intro: string; early: string; earlyLabel: string; updated: string; sections: Section[]; other: string; back: string; footer: string; templates: string };

const CONTENT: Record<Lang, Content> = {
  en: {
    title: "Privacy — WowLink",
    description: "What WowLink keeps when you make an invitation or reply to one, who can see it, and how it’s deleted.",
    heading: ["What we keep, and", "who sees it"],
    intro: "WowLink makes invitation pages. To do that it keeps what hosts write and what guests reply, and nothing more. Here is all of it, in plain words.",
    earlyLabel: "early days",
    early: "WowLink is still being tried out. This page says how it works today. It will be reviewed and updated before WowLink opens to everyone, including where information is stored and for how long.",
    updated: "Last updated",
    sections: [
      {
        heading: "What a host’s invitation keeps",
        items: [
          "The invitation as the host wrote it: names, dates, places, the schedule, the messages, the colours and the language.",
          "Personal invitations: the name of each household, and a WhatsApp number if the host adds one.",
          "When each personal link was first and last opened. The page itself reports this, so a link preview in WhatsApp doesn’t count.",
          "The private manage key, kept only in scrambled form (a hash), so it can’t be read back or recovered.",
        ],
      },
      {
        heading: "What a guest’s reply keeps",
        items: [
          "Whether you’re coming, to which celebrations, and how many of you.",
          "Your name, if you write one, and your wish or blessing, if you leave one.",
          "When you replied.",
          "That’s all. Guests never need an account, and WowLink never asks them for an email address, a phone number or their contacts.",
        ],
      },
      {
        heading: "What isn’t kept",
        items: [
          "There are no tracking cookies, no ads and no outside analytics services on any page.",
          "Your internet address (IP) is used to slow down spam. It’s held only in the server’s memory, and never saved with your reply or anywhere else.",
          "Your choice of language, and a host’s manage links, are remembered in your own browser, not by WowLink.",
          "Links to Google Maps, Google Calendar and WhatsApp open those services only when you tap them.",
        ],
      },
      {
        heading: "Who sees what",
        items: [
          "Hosts (anyone with the invitation’s manage link) see every reply, every wish, and their list of households with any numbers.",
          "Guests see the invitation as their own link shows it. They never see the guest list, other people’s replies or anyone’s number.",
          "Wishes appear on the invitation only if the host turns that on, and only with the name the writer typed. The host can hide any one of them.",
          "Search engines are asked not to list invitations.",
        ],
      },
      {
        heading: "A link isn’t a lock",
        items: [
          "Anyone who has an invitation’s link can open it, including anyone it’s forwarded to. Don’t put anything on an invitation you’d mind being passed on.",
          "Personal links are hard to guess, but they’re links too. If one goes further than meant, the host can replace it, and the old one stops working.",
          "Keep the manage link private: whoever has it can edit the invitation and read every reply.",
        ],
      },
      {
        heading: "Changing and deleting",
        items: [
          "Guests with a personal link can change their reply from that link. To have a reply removed, ask the host.",
          "From the manage page, a host can delete one reply with its wish, remove a personal invitation (its reply goes with it), or delete the whole invitation with every reply, wish, household and number in it.",
          "Deleting happens straight away and can’t be undone. Only the link’s short code is kept, so it’s never given to a different invitation.",
          "Unpublishing hides an invitation from guests but keeps its replies, so it can be published again.",
        ],
      },
      {
        heading: "Nothing is passed on",
        items: ["Nothing here is shared with advertisers or other companies. There are no ads and no outside trackers on any page."],
      },
    ],
    other: "ગુજરાતીમાં વાંચો",
    back: "← Back to home",
    footer: "Made with love, shared with one link.",
    templates: "Templates",
  },
  gu: {
    title: "ગોપનીયતા — WowLink",
    description: "આમંત્રણ બનાવો કે તેનો જવાબ આપો ત્યારે WowLink શું સાચવે છે, તે કોણ જોઈ શકે છે, અને તે કેવી રીતે કાઢી નખાય છે.",
    heading: ["અમે શું સાચવીએ છીએ, અને", "કોણ જુએ છે"],
    intro: "WowLink આમંત્રણનાં પાનાં બનાવે છે. એ માટે યજમાન જે લખે અને મહેમાનો જે જવાબ આપે તે સાચવે છે, એથી વધુ કંઈ નહીં. બધું અહીં સાદી ભાષામાં છે.",
    earlyLabel: "હજી શરૂઆત છે",
    early: "WowLink હજી અજમાયશમાં છે. આ પાનું આજે તે જે રીતે કામ કરે છે તે જણાવે છે. બધા માટે શરૂ થાય તે પહેલાં તેની સમીક્ષા થશે, અને માહિતી ક્યાં અને કેટલો સમય સચવાય છે તે સહિત તેને અપડેટ કરાશે.",
    updated: "છેલ્લું અપડેટ",
    sections: [
      {
        heading: "યજમાનના આમંત્રણમાં શું સચવાય છે",
        items: [
          "યજમાને લખેલું આમંત્રણ: નામ, તારીખ, સ્થળ, કાર્યક્રમ, સંદેશ, રંગ અને ભાષા.",
          "વ્યક્તિગત આમંત્રણો: દરેક પરિવારનું નામ, અને યજમાન ઉમેરે તો WhatsApp નંબર.",
          "દરેક વ્યક્તિગત લિંક પહેલી અને છેલ્લી વાર ક્યારે ખોલાઈ. પાનું પોતે જ આ જણાવે છે, એટલે WhatsAppમાં લિંકનું પ્રીવ્યૂ ગણાતું નથી.",
          "મેનેજ લિંકની ખાનગી ચાવી, ફક્ત ગૂંચવેલા રૂપમાં (hash), એટલે તે પાછી વાંચી કે મેળવી શકાતી નથી.",
        ],
      },
      {
        heading: "મહેમાનના જવાબમાં શું સચવાય છે",
        items: [
          "આપ આવો છો કે નહીં, કયા પ્રસંગોમાં, અને કેટલા લોકો.",
          "આપનું નામ, જો આપ લખો, અને આપની શુભેચ્છા કે આશીર્વાદ, જો આપ લખો.",
          "આપે ક્યારે જવાબ આપ્યો.",
          "બસ એટલું જ. મહેમાનોને ક્યારેય એકાઉન્ટ બનાવવું પડતું નથી, અને WowLink તેમની પાસે ક્યારેય ઇમેઇલ, ફોન નંબર કે સંપર્કો માગતું નથી.",
        ],
      },
      {
        heading: "શું સચવાતું નથી",
        items: [
          "કોઈ પાના પર ટ્રેકિંગ કૂકી, જાહેરાતો કે બહારની એનાલિટિક્સ સેવા નથી.",
          "આપનું ઇન્ટરનેટ સરનામું (IP) સ્પામ રોકવા માટે વપરાય છે. તે ફક્ત સર્વરની મેમરીમાં રહે છે, અને આપના જવાબ સાથે કે બીજે ક્યાંય સચવાતું નથી.",
          "આપની ભાષાની પસંદગી, અને યજમાનની મેનેજ લિંક, આપના પોતાના બ્રાઉઝરમાં યાદ રહે છે, WowLink પાસે નહીં.",
          "Google Maps, Google Calendar અને WhatsAppની લિંક આપ દબાવો ત્યારે જ એ સેવાઓ ખોલે છે.",
        ],
      },
      {
        heading: "કોણ શું જુએ છે",
        items: [
          "યજમાન (જેની પાસે આમંત્રણની મેનેજ લિંક હોય) દરેક જવાબ, દરેક શુભેચ્છા, અને નંબર સાથે પોતાના પરિવારોની યાદી જુએ છે.",
          "મહેમાનો આમંત્રણ તેમની પોતાની લિંક બતાવે તે રીતે જ જુએ છે. તેઓ મહેમાનોની યાદી, બીજાના જવાબો કે કોઈનો નંબર ક્યારેય જોતા નથી.",
          "શુભેચ્છાઓ આમંત્રણ પર ત્યારે જ દેખાય જ્યારે યજમાન તે ચાલુ કરે, અને ફક્ત લખનારે લખેલા નામ સાથે. યજમાન કોઈ પણ શુભેચ્છા છુપાવી શકે છે.",
          "સર્ચ એન્જિનને આમંત્રણો ન બતાવવા કહેવામાં આવે છે.",
        ],
      },
      {
        heading: "લિંક તાળું નથી",
        items: [
          "જેની પાસે આમંત્રણની લિંક હોય તે તેને ખોલી શકે, જેને આગળ મોકલાઈ હોય તે પણ. આગળ મોકલાય તો વાંધો હોય એવું કંઈ આમંત્રણમાં ન મૂકો.",
          "વ્યક્તિગત લિંક ધારવી અઘરી છે, પણ તે પણ લિંક જ છે. ધાર્યા કરતાં આગળ ગઈ હોય તો યજમાન નવી લિંક બનાવી શકે છે, અને જૂની બંધ થઈ જાય છે.",
          "મેનેજ લિંક ખાનગી રાખો: જેની પાસે તે હોય તે આમંત્રણમાં ફેરફાર કરી શકે અને દરેક જવાબ વાંચી શકે.",
        ],
      },
      {
        heading: "બદલવું અને કાઢી નાખવું",
        items: [
          "વ્યક્તિગત લિંકવાળા મહેમાનો એ જ લિંક પરથી પોતાનો જવાબ બદલી શકે છે. જવાબ કઢાવવો હોય તો યજમાનને કહો.",
          "મેનેજ પાના પરથી યજમાન એક જવાબ તેની શુભેચ્છા સાથે કાઢી શકે, વ્યક્તિગત આમંત્રણ કાઢી શકે (તેનો જવાબ પણ જાય), અથવા આખું આમંત્રણ તેના દરેક જવાબ, શુભેચ્છા, પરિવાર અને નંબર સાથે કાઢી શકે.",
          "કાઢી નાખવું તરત થાય છે અને પાછું લાવી શકાતું નથી. ફક્ત લિંકનો ટૂંકો કોડ રખાય છે, જેથી તે ક્યારેય બીજા આમંત્રણને ન મળે.",
          "બંધ કરવાથી આમંત્રણ મહેમાનોથી છુપાય છે પણ જવાબો સચવાય છે, જેથી તે ફરી પ્રકાશિત કરી શકાય.",
        ],
      },
      {
        heading: "કોઈને આપવામાં આવતું નથી",
        items: ["અહીંની કોઈ માહિતી જાહેરાતકારો કે બીજી કંપનીઓને અપાતી નથી. કોઈ પાના પર જાહેરાતો કે બહારના ટ્રેકર નથી."],
      },
    ],
    other: "Read in English",
    back: "← મુખ્ય પાના પર",
    footer: "પ્રેમથી બનાવેલું, એક લિંકથી મોકલેલું.",
    templates: "આમંત્રણના નમૂના",
  },
};

type Props = { searchParams: Promise<{ lang?: string | string[] }> };
const langOf = async ({ searchParams }: Props): Promise<Lang> => ((await searchParams).lang === "gu" ? "gu" : "en");

export async function generateMetadata(props: Props): Promise<Metadata> {
  const lang = await langOf(props);
  const { title, description } = CONTENT[lang];
  return { title, description, alternates: { canonical: lang === "gu" ? "/privacy?lang=gu" : "/privacy", languages: { en: "/privacy", gu: "/privacy?lang=gu" } } };
}

export default async function PrivacyPage(props: Props) {
  const lang = await langOf(props);
  const c = CONTENT[lang];
  const other: Lang = lang === "en" ? "gu" : "en";
  return <div className="cinema cin-catalog theme-paper privacy-page" lang={lang}>
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/" className="cin-catalog-back">{c.back}</Link></header>
    <main className="privacy">
      <Link className="privacy-lang" href={other === "gu" ? "/privacy?lang=gu" : "/privacy"} hrefLang={other} lang={other}>{c.other}</Link>
      <h1>{c.heading[0]} <span className="scribble">{c.heading[1]}</span></h1>
      <p className="privacy-intro">{c.intro}</p>
      <aside className="privacy-early"><span>{c.earlyLabel}</span><p>{c.early}</p></aside>
      {c.sections.map((section) => <section key={section.heading}>
        <h2>{section.heading}</h2>
        <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>)}
      <p className="privacy-updated">{c.updated}: <time dateTime={UPDATED}>{formatInvitationDate(UPDATED, true, lang)}</time></p>
    </main>
    <footer className="cin-catalog-footer"><span>{c.footer}</span><span className="cin-catalog-footer-links"><Link href="/templates">{c.templates}</Link><Link href="/">© 2026 WowLink</Link></span></footer>
  </div>;
}
