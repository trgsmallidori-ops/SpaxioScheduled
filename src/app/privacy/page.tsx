import type { Metadata } from "next";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/formatDate";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Privacy Policy",
    description: "Privacy policy for SpaxioScheduled — how we handle your data for the school calendar and syllabus planner service.",
    path: "/privacy",
  }),
};

export default function PrivacyPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">Privacy Policy</h1>
      <p className="mt-3 text-sm font-semibold text-[var(--muted)]">Last updated: {formatDisplayDate(today)}</p>
      <div className="mt-6 space-y-4 text-base text-[var(--text)]">
        <p>
          SpaxioScheduled stores your account data, uploaded syllabi, and parsed calendar events to provide the service.
          We use Supabase for auth and storage and Stripe for payments. We do not sell your data.
        </p>
        <p>
          Reminder emails are sent according to your notification preferences. You can update or disable them in your account.
        </p>
        <p>
          For how we use cookies, see our{" "}
          <Link href="/cookies" className="font-semibold text-[var(--accent)] hover:underline">Cookie Policy</Link>.
        </p>
      </div>
    </div>
  );
}
