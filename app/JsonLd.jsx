// Server component. Renders structured data as <script type="application/ld+json">.
// Callers build `data` from the SAME object the page renders, so the two cannot disagree.
// "<" is escaped so a dish description containing "</script>" cannot break out of the tag.
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
