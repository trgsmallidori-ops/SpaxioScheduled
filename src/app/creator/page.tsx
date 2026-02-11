"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import type { CreatorUserRow } from "@/app/api/creator/users/route";
import { formatDisplayDate } from "@/lib/formatDate";

export default function CreatorPage() {
  const { t } = useLocale();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<{ totalUsers: number; revenue: number } | null>(null);
  const [users, setUsers] = useState<CreatorUserRow[]>([]);
  const [testReminderStatus, setTestReminderStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testReminderMessage, setTestReminderMessage] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAllowed(false);
        return;
      }
      Promise.all([
        fetch("/api/creator/stats").then((r) => r.json()),
        fetch("/api/creator/users").then((r) => r.json()),
      ]).then(([statsData, usersData]) => {
        if (statsData.error || usersData.error) {
          setAllowed(false);
          return;
        }
        setAllowed(true);
        setStats({
          totalUsers: statsData.totalUsers ?? 0,
          revenue: statsData.revenue ?? 0,
        });
        setUsers(usersData.users ?? []);
      }).catch(() => setAllowed(false));
    });
  }, []);

  if (allowed === null) {
    return (
      <div className="mx-auto max-w-4xl bg-[var(--bg)] px-6 py-10">
        <p className="text-base font-semibold text-[var(--muted)]">Loading...</p>
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-4xl bg-[var(--bg)] px-6 py-10">
        <p className="text-base font-bold text-[var(--text)]">Access denied. Creator portal is for the account set in CREATOR_USER_ID.</p>
        <Link href="/dashboard" className="mt-3 inline-block font-bold text-[var(--accent)] underline hover:no-underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">{t.creatorPortalTitle}</h1>
      <p className="mt-2 text-base text-[var(--muted)]">{t.youHaveFreeAccess}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-soft">
          <h2 className="text-sm font-bold text-[var(--muted)]">{t.totalUsers}</h2>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">
            {stats?.totalUsers ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-soft">
          <h2 className="text-sm font-bold text-[var(--muted)]">{t.revenue}</h2>
          <p className="mt-2 text-3xl font-bold text-[var(--text)]">
            ${((stats?.revenue ?? 0) / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-[var(--text)]">{t.testReminderSectionTitle}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {t.testReminderSectionDesc}
        </p>
        <button
          type="button"
          disabled={testReminderStatus === "sending"}
          onClick={async () => {
            setTestReminderStatus("sending");
            setTestReminderMessage("");
            try {
              const res = await fetch("/api/creator/test-reminders", { method: "POST" });
              const data = await res.json();
              if (!res.ok) {
                setTestReminderStatus("error");
                setTestReminderMessage(data.error || t.testReminderFailed);
                return;
              }
              setTestReminderStatus("sent");
              setTestReminderMessage(t.testReminderSent);
            } catch {
              setTestReminderStatus("error");
              setTestReminderMessage(t.testReminderFailed);
            }
          }}
          className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-semibold text-white shadow-soft transition hover:opacity-90 disabled:opacity-60"
        >
          {testReminderStatus === "sending" ? t.testReminderSending : t.testReminderEmail}
        </button>
        {testReminderStatus === "sent" && (
          <p className="mt-2 text-sm font-medium text-green-600">{testReminderMessage}</p>
        )}
        {testReminderStatus === "error" && (
          <p className="mt-2 text-sm font-medium text-red-600">{testReminderMessage}</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-[var(--text)]">👥 {t.allUsers}</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-[var(--surface)] shadow-soft">
          <table className="w-full min-w-[400px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--divider)] bg-[var(--bg)]">
                <th className="px-5 py-4 font-bold text-[var(--muted)]">Email</th>
                <th className="px-5 py-4 font-bold text-[var(--muted)]">Name</th>
                <th className="px-5 py-4 font-bold text-[var(--muted)]">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center font-semibold text-[var(--muted)]">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--divider)] last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-[var(--text)]">{u.email ?? "—"}</td>
                    <td className="px-5 py-4 font-medium text-[var(--text)]">{u.full_name ?? "—"}</td>
                    <td className="px-5 py-4 text-[var(--muted)]">
                      {formatDisplayDate(u.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/dashboard" className="mt-8 inline-block font-bold text-[var(--accent)] underline hover:no-underline">
        ← {t.back} {t.dashboard}
      </Link>
    </div>
  );
}
