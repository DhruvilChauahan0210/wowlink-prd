import { siteUrl } from "./site";

/*
 * What search engines read about WowLink beyond the words on a page (schema.org, as JSON-LD): who WowLink is, the site
 * itself, the web app and what it costs to start, each page's questions and answers, and where a page sits. Only
 * things that are true and on the page.
 */

const ORG = `${siteUrl}/#organization`;

export const organization = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG,
  name: "WowLink",
  url: `${siteUrl}/`,
  logo: `${siteUrl}/apple-icon`,
  slogan: "One link. A whole celebration.",
});

export const website = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "WowLink",
  url: `${siteUrl}/`,
  publisher: { "@id": ORG },
  inLanguage: ["en", "gu", "hi"],
});

export const webApplication = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "WowLink",
  url: `${siteUrl}/`,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Any (in a web browser)",
  description: "Hand-drawn online invitations for weddings, Garba, birthdays, pujas and more, in Gujarati, Hindi or English, shared as one link on WhatsApp, with replies.",
  inLanguage: ["en", "gu", "hi"],
  publisher: { "@id": ORG },
  // The free plan; the Creator studio isn't sold online yet.
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", name: "Personal (free)" },
});

/** A page's questions and their answers, exactly as the page shows them. */
export const faqPage = (items: readonly { q: string; a: string }[], lang = "en") => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: lang,
  mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

/** Where a page sits: [name, path] from the home page down. */
export const breadcrumbs = (trail: readonly (readonly [string, string])[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${siteUrl}${path}` })),
});

/** A page listing other pages, in order: [name, path]. */
export const itemList = (name: string, items: readonly (readonly [string, string])[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: items.map(([title, path], i) => ({ "@type": "ListItem", position: i + 1, name: title, url: `${siteUrl}${path}` })),
});

/** A how-to guide: its title, when it was written and by whom. */
export const article = (headline: string, path: string, description: string, published: string, lang = "en") => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline,
  description,
  url: `${siteUrl}${path}`,
  mainEntityOfPage: `${siteUrl}${path}`,
  datePublished: published,
  dateModified: published,
  author: { "@id": ORG },
  publisher: { "@id": ORG },
  inLanguage: lang,
});
