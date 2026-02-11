import type { Metadata } from "next";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/formatDate";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Cookie Policy",
    description: "Cookie policy for SpaxioScheduled — how we use cookies for the school calendar and syllabus planner service.",
    path: "/cookies",
  }),
};

export default function CookiesPage() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="mx-auto max-w-3xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">Cookie Policy</h1>
      <p className="mt-3 text-sm font-semibold text-[var(--muted)]">Last updated: {formatDisplayDate(today)}</p>
      <div className="mt-6 space-y-4 text-base text-[var(--text)]">
        <p>
          SpaxioScheduled uses cookies and similar technologies to provide and secure the service.
        </p>
        <h2 className="text-lg font-bold text-[var(--text)] mt-4">What we use</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Authentication cookies</strong> — So you stay logged in. These are required for the service to work
            and are set when you sign in (via our auth provider).
          </li>
          <li>
            <strong>Session / security</strong> — To maintain your session and protect against abuse.
          </li>
        </ul>
        <p>
          We do not use third-party advertising or tracking cookies. We do not sell cookie data.
        </p>
        <h2 className="text-lg font-bold text-[var(--text)] mt-4">Your choices</h2>
        <p>
          You can clear cookies in your browser settings; doing so will log you out. Blocking all cookies will prevent
          you from using the logged-in areas of the site.
        </p>
        <p>
          For more about how we handle your data, see our{" "}
          <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
