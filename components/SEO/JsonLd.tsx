// Renders a JSON-LD <script> tag. Escapes "<" so user-submitted content
// (event/deal/business titles, descriptions) can never prematurely close the
// script tag or inject markup — JSON.stringify alone does not do this.
export default function JsonLd({ data }: { data: object | object[] }) {
  let json: string;
  try {
    json = JSON.stringify(data).replace(/</g, "\\u003c");
  } catch (err) {
    console.error("JsonLd: failed to stringify schema data", err);
    return null;
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
