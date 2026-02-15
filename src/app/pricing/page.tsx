import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Pricing",
    description:
      "SpaxioScheduled pricing: 2 free syllabus uploads, then $20/year for 50 uploads. Affordable school calendar and course outline calendar for students.",
    path: "/pricing",
  }),
};

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-12">
      <h1 className="text-3xl font-bold text-[var(--text)]">Pricing</h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">
        Simple, transparent pricing. Start free, then subscribe for unlimited access.
      </p>

      <div className="mt-12 rounded-2xl bg-[var(--surface)] shadow-soft p-8 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Free tier</h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              2 syllabus uploads when you sign up. No credit card required.
            </p>
          </div>
          <div className="text-2xl font-bold text-[var(--accent)]">$0</div>
        </div>

        <div className="mt-10 border-t border-[var(--divider)] pt-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text)]">Annual subscription</h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                50 syllabus uploads per year. Renews annually. Cancel anytime.
              </p>
            </div>
            <div className="text-2xl font-bold text-[var(--accent)]">$20/year</div>
          </div>
        </div>

        <ul className="mt-10 space-y-3 text-[var(--text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-[var(--green)] mt-0.5">✓</span>
            <span>All features included—AI parsing, calendar export, chatbot</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--green)] mt-0.5">✓</span>
            <span>Secure payment via Stripe</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--green)] mt-0.5">✓</span>
            <span>50 uploads per year—resets on renewal</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[var(--green)] mt-0.5">✓</span>
            <span>Refunds available—see our contact page</span>
          </li>
        </ul>

        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
          >
            Get started free
          </Link>
        </div>
      </div>
    </div>
  );
}
