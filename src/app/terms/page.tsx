import type { Metadata } from "next";
import { formatDisplayDate } from "@/lib/formatDate";

export const metadata: Metadata = {
  title: "Terms | SpaxioScheduled",
  description: "Terms of use for SpaxioScheduled",
};

export default function TermsPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">Terms of Use</h1>
      <p className="mt-3 text-sm font-semibold text-[var(--muted)]">Last updated: {formatDisplayDate(today)}</p>
      <div className="mt-6 space-y-4 text-base text-[var(--text)]">
        <p>
          By using SpaxioScheduled you agree to use it only for organizing your own course schedules.
          You get 2 free syllabus uploads; additional uploads require a one-time payment as described on the site.
        </p>
        <p>
          We are not responsible for errors in AI-parsed data. Please verify important dates with your syllabus.
        </p>
      </div>
    </div>
  );
}
