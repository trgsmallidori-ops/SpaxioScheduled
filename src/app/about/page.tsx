import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "About",
    description:
      "Learn about SpaxioScheduled—our mission to help students stay organized with an AI-powered school calendar and course outline calendar. Your syllabus, one calendar.",
    path: "/about",
  }),
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-12">
      <h1 className="text-3xl font-bold text-[var(--text)]">About SpaxioScheduled</h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">
        SpaxioScheduled was built to solve a simple problem: students spend too much time juggling multiple syllabi, each with different due dates, exams, and class times. We believe your course information should live in one place—a smart <strong>school calendar</strong> that works for you.
      </p>

      <h2 className="mt-10 text-xl font-bold text-[var(--text)]">Our Mission</h2>
      <p className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
        We want every student to have access to an <strong>AI school calendar</strong> that turns syllabi into actionable schedules. No more flipping through PDFs. No more missed deadlines. Just one <strong>course outline calendar</strong> that keeps you on track.
      </p>

      <h2 className="mt-10 text-xl font-bold text-[var(--text)]">What We Do</h2>
      <p className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
        SpaxioScheduled uses AI to parse your PDF or Word syllabi and extract assignments, tests, exams, and class times. You get a unified <strong>syllabus calendar</strong> that you can export to Google Calendar, Apple Calendar, or Outlook. We also offer an AI chatbot so you can ask questions like &quot;What do I have due today?&quot; and get instant answers.
      </p>

      <h2 className="mt-10 text-xl font-bold text-[var(--text)]">For Students, By Students</h2>
      <p className="mt-3 text-base text-[var(--text-secondary)] leading-relaxed">
        We understand the student experience. That&apos;s why we built a <strong>student calendar</strong> tool that&apos;s simple, affordable, and effective. Start with 2 free syllabus uploads—no credit card required. Pay only when you need more.
      </p>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/signup"
          className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
        >
          Get started free
        </Link>
        <Link
          href="/contact"
          className="rounded-xl border border-[var(--divider)] px-6 py-3 text-sm font-bold text-[var(--text)] no-underline transition hover:bg-[var(--surface)]"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
