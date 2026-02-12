"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function LoginForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("error") === "confirm") {
      setError(t.confirmLinkInvalid);
    }
  }, [searchParams, t.confirmLinkInvalid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] shadow-soft-lg p-8 shadow-soft-lg">
        <h1 className="text-2xl font-bold text-[var(--text)]">{t.login}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text)]"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-[var(--orange-light)] p-3 text-sm font-semibold text-[var(--text)]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "..." : t.login}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {t.noAccount}{" "}
          <Link href="/signup" className="font-bold text-[var(--accent)] underline hover:no-underline">
            {t.signUp}
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-soft-lg animate-pulse">
        <div className="h-8 w-32 rounded bg-[var(--border-subtle)]" />
        <div className="mt-6 space-y-5">
          <div className="h-4 w-20 rounded bg-[var(--border-subtle)]" />
          <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
          <div className="h-4 w-24 rounded bg-[var(--border-subtle)]" />
          <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
          <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
          <div className="h-12 rounded-xl bg-[var(--border-subtle)]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
