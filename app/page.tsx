import Link from "next/link";
import { Footer, Header, TemplateCard, templates } from "./components";
import { MorphingBackdrop } from "./morphing-backdrop";
import { HeroDemo } from "./hero-demo";

export default function Home() {
  return <>
    <Header />
    <main>
      <div className="hero-journey">
        <MorphingBackdrop />
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-pill"><i /> INTERACTIVE INVITATIONS FOR EVERY OCCASION</span>
            <h1>Give your day<br />a little more<br /><em>wow.</em></h1>
            <p className="hero-intro">A link that opens into an experience. Personal, playful, and lovely to share with everyone you love.</p>
            <div className="hero-actions">
              <Link className="button button-dark" href="/templates">Create your invitation <span>↗</span></Link>
              <a className="button button-quiet" href="#templates">Explore templates <span className="arrow-down">↓</span></a>
            </div>
            <div className="hero-proof"><span className="proof-spark">✳</span><span>Free to start <i>·</i> No app for guests <i>·</i> RSVPs included</span></div>
          </div>
          <div className="hero-visual"><HeroDemo /></div>
          <a className="scroll-cue" href="#templates"><span className="scroll-line"/>SCROLL TO SEE THE MAGIC<span>↓</span></a>
        </section>

        <section className="trust-strip"><span>MADE FOR THE DAYS THAT FEEL LIKE</span><b>“this is really happening”</b><i>✳</i><b>“wish you were here”</b><i>✳</i><b>“let’s celebrate”</b></section>

        <section className="section templates-section" id="templates">
          <div className="section-heading"><div><span className="eyebrow">A GOOD PLACE TO BEGIN</span><h2>Choose your kind<br/>of <em>unforgettable.</em></h2></div><Link className="text-link large-link" href="/templates">See all four occasions <span>→</span></Link></div>
          <div className="template-grid">{templates.map((template) => <TemplateCard key={template.id} template={template} />)}</div>
        </section>
      </div>

      <section className="how-section" id="how-it-works"><div className="how-inner"><div className="how-heading"><span className="eyebrow eyebrow-light">THOUGHTFUL, FROM THE FIRST TAP</span><h2>Easy to make.<br/><em>Impossible to forget.</em></h2><p>All the charm of something made just for them, without the hours of work.</p></div><div className="steps"><div className="step"><span className="step-num">01 / CHOOSE</span><span className="step-icon">✳</span><h3>Find your feeling</h3><p>Start with a scene that feels like the occasion you’re celebrating.</p></div><div className="step"><span className="step-num">02 / PERSONALISE</span><span className="step-icon">⌁</span><h3>Add your story</h3><p>Bring in the names, the details, and all the little things that matter.</p></div><div className="step"><span className="step-num">03 / SEND</span><span className="step-icon">↗</span><h3>Let the joy travel</h3><p>Share one beautiful link. Your guests can RSVP right there.</p></div></div></div></section>

      <section className="quote-section"><span className="quote-mark">“</span><blockquote>Some days deserve more than<br/>a message in the group chat.</blockquote><span className="quote-credit">THEY DESERVE A LITTLE WORLD OF THEIR OWN.</span><span className="quote-flower">✿</span></section>

      <section className="pricing-section" id="pricing"><div className="pricing-copy"><span className="eyebrow">A LITTLE SOMETHING FOR EVERYONE</span><h2>Start with a moment.<br/><em>Stay for the magic.</em></h2><p>Make your first experience for free. Creating for clients? WowLink Pro gives you the tools to make every occasion feel personal.</p><Link className="text-link" href="/templates">Get started for free <span>→</span></Link></div><div className="price-card"><div className="price-card-top"><span className="price-star">✳</span><span className="eyebrow">FOR THE OCCASIONAL “WOW”</span></div><h3>Free, forever.</h3><p>Everything you need to make one occasion feel like yours.</p><ul><li>Four interactive templates</li><li>Your own shareable link</li><li>RSVPs, all in one place</li></ul><Link href="/templates" className="button button-dark button-full">Make something lovely <span>↗</span></Link></div></section>

      <section className="final-cta"><div className="final-flower">✿</div><span className="eyebrow">THE NEXT BIG LITTLE MOMENT IS YOURS</span><h2>Make it a moment.</h2><Link className="button button-dark" href="/templates">Create your invitation <span>↗</span></Link></section>
    </main>
    <Footer />
  </>;
}
