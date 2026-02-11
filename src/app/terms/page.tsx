import type { Metadata } from "next";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/formatDate";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Terms of Use",
    description: "Terms of use for SpaxioScheduled — AI school calendar and course outline calendar service.",
    path: "/terms",
  }),
};

export default function TermsPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">Terms of Use</h1>
      <p className="mt-3 text-sm font-semibold text-[var(--muted)]">Last updated: {formatDisplayDate(today)}</p>
      <div className="mt-6 space-y-5 text-base text-[var(--text)]">
        <p>
          By using SpaxioScheduled you agree to use it only for organizing your own course schedules.
          You get 2 free syllabus uploads; additional uploads require a one-time payment as described on the site.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)] mt-6">Limitation of liability</h2>
        <p>
          SpaxioScheduled and its operators are not liable for any loss or damage arising from your use of the service,
          including but not limited to: missed tests, exams, or assignments; errors or omissions in AI-parsed data;
          failed or delayed payments; service interruptions or unavailability; or any decisions you make based on
          calendar or reminder information. You are responsible for verifying important dates with your syllabus and
          institution. The service is provided &quot;as is&quot; without warranties of any kind.
        </p>

        <p>
          We are not responsible for errors in AI-parsed data. Please verify important dates with your syllabus and
          course materials.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)] mt-6">Payments and refunds</h2>
        <p>
          Payments for additional uploads are processed by Stripe. Refund requests are handled as described in our{" "}
          <Link href="/contact" className="font-semibold text-[var(--accent)] hover:underline">contact / refunds</Link>{" "}
          page. Refunds are only considered within 7 days of the date of purchase.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)] mt-6">Cookies and privacy</h2>
        <p>
          Use of the service is also governed by our{" "}
          <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">Privacy Policy</Link>
          {" "}and our{" "}
          <Link href="/cookies" className="font-semibold text-[var(--accent)] hover:underline">Cookie Policy</Link>.
        </p>
      </div>
    </div>
  );
}
