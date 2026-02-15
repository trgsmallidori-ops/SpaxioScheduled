import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, buildFaqSchema } from "@/lib/seo";
import { HOMEPAGE_FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  ...pageMeta({
    title: "FAQ",
    description:
      "Frequently asked questions about SpaxioScheduled: AI school calendar, syllabus parsing, pricing, export options, and more. Get answers about our course outline calendar.",
    path: "/faq",
  }),
};

export default function FAQPage() {
  const faqSchema = buildFaqSchema(HOMEPAGE_FAQS);

  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h1 className="text-3xl font-bold text-[var(--text)]">
        Frequently Asked Questions
      </h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">
        Common questions about SpaxioScheduled, our AI school calendar, and course outline calendar.
      </p>

      <dl className="mt-12 space-y-8">
        {HOMEPAGE_FAQS.map((faq, index) => (
          <div key={index} className="border-b border-[var(--divider)] pb-8 last:border-0">
            <dt className="text-lg font-bold text-[var(--text)]">{faq.question}</dt>
            <dd className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12">
        <p className="text-[var(--text-secondary)]">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-[var(--accent)] hover:underline">
            Contact us
          </Link>
          .
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
        >
          Try SpaxioScheduled free
        </Link>
      </div>
    </div>
  );
}
