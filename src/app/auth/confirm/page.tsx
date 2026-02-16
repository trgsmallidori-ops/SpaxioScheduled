"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

function AuthConfirmContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-soft-lg text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="SpaxioScheduled"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-[var(--green-light)] px-4 py-2">
          <span className="text-2xl" aria-hidden>✓</span>
          <h1 className="ml-2 text-xl font-bold text-[var(--green)]">
            {t.emailConfirmedTitle}
          </h1>
        </div>
        <p className="text-lg font-semibold text-[var(--text)]">
          {t.emailConfirmedMessage}
        </p>
        <p className="mt-4 text-[var(--text-secondary)]">
          {t.emailConfirmedReturnTab}
        </p>
        {userEmail && (
          <p className="mt-2 text-sm text-[var(--muted)]">{userEmail}</p>
        )}
        <Link
          href={next}
          className="mt-8 inline-block w-full rounded-xl bg-[var(--accent)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--accent-hover)]"
        >
          {t.emailConfirmedGoToDashboard}
        </Link>
      </div>
    </div>
  );
}

function AuthConfirmFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-soft-lg animate-pulse">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-[var(--border-subtle)]" />
        <div className="mx-auto h-8 w-48 rounded bg-[var(--border-subtle)]" />
        <div className="mt-4 h-4 w-full rounded bg-[var(--border-subtle)]" />
        <div className="mt-2 h-4 w-3/4 rounded bg-[var(--border-subtle)]" />
        <div className="mt-8 h-12 w-full rounded-xl bg-[var(--border-subtle)]" />
      </div>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<AuthConfirmFallback />}>
      <AuthConfirmContent />
    </Suspense>
  );
}
