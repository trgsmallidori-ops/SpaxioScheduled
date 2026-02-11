"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
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
      <div className="w-full max-w-md rounded-2xl bg-white shadow-soft-lg p-8 shadow-soft-lg">
        <h1 className="text-2xl font-bold text-[var(--text)]">{t.signUp}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.fullName}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
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
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3.5 text-base font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "..." : t.signUp}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          {t.hasAccount}{" "}
          <Link href="/login" className="font-bold text-[var(--accent)] underline hover:no-underline">
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
