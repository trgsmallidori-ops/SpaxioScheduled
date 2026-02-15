"use client";

import { useState } from "react";
import Link from "next/link";
import { HOMEPAGE_FAQS } from "@/lib/faq";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="w-full border-t border-[var(--divider)] bg-[var(--bg)] px-4 py-10 sm:px-6 sm:py-14"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[800px]">
        <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-[var(--text)]">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-base text-[var(--text-secondary)]">
          Common questions about SpaxioScheduled, our AI school calendar, and course outline calendar.
        </p>
        <dl className="mt-8 space-y-4">
          {HOMEPAGE_FAQS.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl bg-[var(--surface)] shadow-soft p-4 sm:p-5"
            >
              <dt>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold text-[var(--text)] hover:text-[var(--accent)] transition"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  {faq.question}
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[var(--muted)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted)]" />
                  )}
                </button>
              </dt>
              <dd
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`mt-3 text-[var(--text-secondary)] overflow-hidden transition-all ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p className="pb-2 text-base leading-relaxed">{faq.answer}</p>
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            View all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
