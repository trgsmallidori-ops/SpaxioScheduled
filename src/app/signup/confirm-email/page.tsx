"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

function ConfirmEmailContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<"success" | "error" | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  async function handleResend() {
    if (!email.trim() || resendCooldown > 0) return;
    setResendLoading(true);
    setResendMessage(null);
    const supabase = createClient();
    const baseUrl =
      typeof window !== "undefined"
        ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${baseUrl.replace(/\/$/, "")}/auth/callback?next=/dashboard`,
      },
    });
    setResendLoading(false);
    setResendMessage(error ? "error" : "success");
    if (!error) setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-soft-lg">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {t.confirmEmailTitle}
        </h1>
        <p className="mt-4 text-[var(--text)]">
          {t.confirmEmailMessage}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t.confirmEmailCheckInbox}
        </p>
        {email && (
          <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] p-4">
            <p className="text-sm font-semibold text-[var(--muted)]">
              {t.didntReceiveEmail}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {email}
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {resendLoading
                ? "..."
                : resendCooldown > 0
                  ? t.resendInSeconds.replace("{{seconds}}", String(resendCooldown))
                  : t.resendVerificationEmail}
            </button>
            {resendMessage === "success" && (
              <p className="mt-3 text-sm font-medium text-[var(--green)]">
                {t.resendVerificationSent}
              </p>
            )}
            {resendMessage === "error" && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {t.resendVerificationError}
              </p>
            )}
          </div>
        )}
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link href="/login" className="font-bold text-[var(--accent)] underline hover:no-underline">
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
}

function ConfirmEmailFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-8 shadow-soft-lg animate-pulse">
        <div className="h-8 w-48 rounded bg-[var(--border-subtle)]" />
        <div className="mt-4 h-4 w-full rounded bg-[var(--border-subtle)]" />
        <div className="mt-2 h-4 w-3/4 rounded bg-[var(--border-subtle)]" />
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
