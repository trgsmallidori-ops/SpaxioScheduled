"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Please provide a reason for your refund request.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "refund", email: email.trim(), reason: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send request.");
        setSending(false);
        return;
      }
      setSent(true);
      setReason("");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-2xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">{t.contact} — {t.refunds}</h1>
      <p className="mt-2 text-[var(--muted)]">
        Use this form to request a refund. We will respond at the email you provide.
      </p>

      <div className="mt-6 rounded-xl border-2 border-[var(--accent)]/50 bg-[var(--accent-light)]/20 px-5 py-4">
        <p className="font-semibold text-[var(--text)]">{t.refundPolicy}</p>
      </div>

      {sent ? (
        <div className="mt-6 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
          <p className="font-semibold text-green-800">{t.refundRequestSent}</p>
          <Link href="/" className="mt-3 inline-block font-semibold text-[var(--accent)] hover:underline">
            ← Back to home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-[var(--text)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">{t.refundReason}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.refundReasonPlaceholder}
              rows={5}
              required
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 py-3 text-[var(--text)]"
            />
          </div>
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {sending ? "Sending…" : t.sendRefundRequest}
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-[var(--muted)]">
        <Link href="/terms" className="font-semibold text-[var(--accent)] hover:underline">{t.terms}</Link>
        {" · "}
        <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">{t.privacy}</Link>
      </p>
    </div>
  );
}
