"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export default function AdminPage() {
  const { t } = useLocale();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setAllowed(false);
        return;
      }
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          setAllowed(Boolean(data.isAdmin));
        })
        .catch(() => setAllowed(false));
    });
  }, []);

  if (allowed === null) {
    return (
      <div className="mx-auto max-w-2xl bg-[var(--bg)] px-6 py-10">
        <p className="text-base font-semibold text-[var(--muted)]">Loading...</p>
      </div>
    );
  }
  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl bg-[var(--bg)] px-6 py-10">
        <p className="text-base font-bold text-[var(--text)]">Access denied.</p>
        <Link href="/dashboard" className="mt-3 inline-block font-bold text-[var(--accent)] underline hover:no-underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">{t.adminTitle}</h1>
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-soft">
        <p className="text-base font-semibold text-[var(--text)]">
          {t.adminFreeUploadsOnly}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Admin access is set via ADMIN_USER_IDS in .env (comma-separated Supabase user IDs).
        </p>
      </div>
      <Link href="/dashboard" className="mt-6 inline-block font-bold text-[var(--accent)] underline hover:no-underline">
        ← {t.dashboard}
      </Link>
    </div>
  );
}
