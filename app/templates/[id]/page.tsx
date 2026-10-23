import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvitationTemplate, invitationTemplates, isTemplateId } from "../../lib/invitations";
import { FAQ, GUEST_GETS, OCCASION_PAGES, STEPS } from "../../lib/occasion-pages";
import { ArtImage } from "../../ui/art";
import { WowLinkBrand } from "../../ui/brand";
import { OPEN_HINT } from "../../ui/openers";
import { OccasionDemo } from "./demo";

/*
 * Each occasion's own page: what its invitation does, a sample to open right here, and a way to start. These are the
 * pages search engines list (see sitemap.ts); the invitations people make are not.
 */

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => invitationTemplates.map((template) => ({ id: template.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isTemplateId(id)) return {};
  const { title, description } = OCCASION_PAGES[id];
  const url = `/templates/${id}`;
  return { title: `${title} — WowLink`, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website", siteName: "WowLink" } };
}

export default async function OccasionPage({ params }: Props) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();
  const template = getInvitationTemplate(id);
  const page = OCCASION_PAGES[id];
  const start = `/create?template=${id}`;

  return <div className="cinema cin-catalog theme-paper occasion-page">
    <header className="cin-catalog-nav"><WowLinkBrand/><Link href="/templates" className="cin-catalog-back">← All occasions</Link></header>
    <main>
      <section className="occasion-hero">
        <div className="occasion-hero-text">
          <span className="occasion-kind">{template.category}</span>
          <h1>{page.heading[0]} <span className="scribble">{page.heading[1]}</span></h1>
          <p className="occasion-intro">{page.intro}</p>
          <div className="occasion-ctas">
            <Link className="cin-cta cin-cta-light" href={start}>Make yours, free</Link>
            <Link className="cin-text-link" href={`/e/preview?template=${id}`}>Open the full sample <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="occasion-demo">
          <OccasionDemo id={id}/>
          <p className="occasion-demo-note">try it: {OPEN_HINT[id]}</p>
        </div>
      </section>

      <section className="occasion-section" aria-labelledby="made-for">
        <h2 id="made-for">Made for your {page.noun}</h2>
        <div className="occasion-points">{page.points.map((point) => <article className="sketch-card occasion-point" key={point.title}>
          <h3>{point.title}</h3>
          <p>{point.body}</p>
        </article>)}</div>
      </section>

      <section className="occasion-section occasion-split">
        <div aria-labelledby="guests-get">
          <h2 id="guests-get">What your guests get</h2>
          <ul className="occasion-ticks">{GUEST_GETS.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div aria-labelledby="three-steps">
          <h2 id="three-steps">Ready in three steps</h2>
          <ol className="occasion-steps">{STEPS.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
          <Link className="cin-cta cin-cta-light" href={start}>Start with this drawing</Link>
        </div>
      </section>

      <section className="occasion-section" aria-labelledby="questions">
        <h2 id="questions">Questions</h2>
        <dl className="occasion-faq">{FAQ.map(({ q, a }) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}</dl>
      </section>

      <section className="occasion-section" aria-labelledby="other-occasions">
        <h2 id="other-occasions">Other occasions</h2>
        <ul className="occasion-others">{invitationTemplates.filter((other) => other.id !== id).map((other) => <li key={other.id}>
          <Link href={`/templates/${other.id}`}><span className="cin-photo"><ArtImage name={other.id} fit="slice"/></span><span>{other.category}</span></Link>
        </li>)}</ul>
      </section>
    </main>
    <footer className="cin-catalog-footer"><span>Made with love, shared with one link.</span><span className="cin-catalog-footer-links"><Link href="/help">Help</Link><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/">© 2026 WowLink</Link></span></footer>
  </div>;
}
