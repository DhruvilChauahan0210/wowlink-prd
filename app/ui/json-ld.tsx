/** Structured data for search engines (lib/structured-data.ts), in the page's HTML. */
export function JsonLd({ data }: { data: object | object[] }) {
  // "<" escaped, so nothing in the data can close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}/>;
}
