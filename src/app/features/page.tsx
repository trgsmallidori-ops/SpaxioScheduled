import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Features",
    description:
      "Explore SpaxioScheduled features: AI syllabus parsing, course outline calendar, school calendar export to Google/Apple/Outlook, and AI chatbot. The complete syllabus planner for students.",
    path: "/features",
  }),
};

export default function FeaturesPage() {
  const features = [
    {
      title: "AI Syllabus Parsing",
      description:
        "Upload your PDF or Word syllabus and our AI extracts assignments, tests, exams, class times, and weights. No manual data entry—just upload and go.",
      icon: "📚",
    },
    {
      title: "Unified Course Outline Calendar",
      description:
        "See all your courses in one school calendar. Color-coded by course, with a month view that shows every assignment and exam at a glance.",
      icon: "📅",
    },
    {
      title: "Export to Your Calendar",
      description:
        "Export to Google Calendar, Apple Calendar, or Outlook via .ics file. Your schedule syncs across all your devices with one click.",
      icon: "🔔",
    },
    {
      title: "AI Chatbot Assistant",
      description:
        "Ask questions like 'What do I have due today?' or 'When is my next test?' Get instant answers from your calendar. The best syllabus planner has a brain.",
      icon: "💬",
    },
    {
      title: "Manual Editing",
      description:
        "Add, edit, or delete any event. Add class times if the AI missed them. You have full control over your academic calendar.",
      icon: "✏️",
    },
    {
      title: "Multi-Language Support",
      description:
        "SpaxioScheduled works in English and French. Parse syllabi in either language.",
      icon: "🌐",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl bg-[var(--bg)] px-6 py-12">
      <h1 className="text-3xl font-bold text-[var(--text)]">Features</h1>
      <p className="mt-4 text-lg text-[var(--text-secondary)]">
        Everything you need to turn your syllabi into a smart school calendar and course outline calendar.
      </p>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-2xl bg-[var(--surface)] shadow-soft p-6"
          >
            <div className="mb-3 text-3xl">{feature.icon}</div>
            <h2 className="text-xl font-bold text-[var(--text)]">{feature.title}</h2>
            <p className="mt-2 text-base text-[var(--text-secondary)] leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
        >
          Try SpaxioScheduled free
        </Link>
      </div>
    </div>
  );
}
