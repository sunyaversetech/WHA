import Link from "next/link";

const LEGAL_NAV = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms and Conditions", href: "/terms-and-conditions" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

export default function LegalLayout({
  title,
  effectiveDate,
  intro,
  children,
}: {
  title: string;
  effectiveDate: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <p className="text-sm font-semibold text-[#3771db] uppercase tracking-wide mb-3">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-[#051e3a] mb-2">
          {title}
        </h1>
        <p className="text-sm text-[#7c899c] mb-6">
          Effective date: {effectiveDate}
        </p>

        {intro && (
          <p className="text-[15px] leading-relaxed text-[#3f4a5a] mb-8 pb-8 border-b border-[#eef1f5]">
            {intro}
          </p>
        )}

        <nav className="flex flex-wrap gap-2 mb-12">
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#e6ebf2] text-[#5a6a80] hover:border-[#3771db] hover:text-[#3771db] transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          className="
            [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-bold [&_h2]:text-[#051e3a] [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-24
            [&_h3]:text-base [&_h3]:md:text-lg [&_h3]:font-semibold [&_h3]:text-[#0f2748] [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-[#3f4a5a] [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_ul]:text-[15px] [&_ul]:text-[#3f4a5a]
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:mb-4 [&_ol]:text-[15px] [&_ol]:text-[#3f4a5a]
            [&_li]:leading-relaxed
            [&_strong]:text-[#0f2748] [&_strong]:font-semibold
            [&_a]:text-[#3771db] [&_a]:underline [&_a]:underline-offset-2
            [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse
            [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-[#051e3a] [&_th]:border-b [&_th]:border-[#e6ebf2] [&_th]:py-2 [&_th]:pr-4
            [&_td]:text-sm [&_td]:text-[#3f4a5a] [&_td]:border-b [&_td]:border-[#eef1f5] [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top
          ">
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-[#eef1f5] text-sm text-[#94a3b8]">
          <p>
            Questions about this document? Contact us at{" "}
            <a
              href="mailto:privacy@whaustralia.com"
              className="text-[#3771db] underline underline-offset-2">
              privacy@whaustralia.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
