"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { useConsent } from "@/contexts/ConsentContext";

export function ConsentModal() {
  const { t } = useLocale();
  const { showConsentModal, acceptConsent, dismissConsentModal } = useConsent();

  if (!showConsentModal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] p-6 shadow-soft-lg border border-[var(--border-subtle)]">
        <h2 id="consent-title" className="text-xl font-bold text-[var(--text)]">
          {t.consentTitle ?? "Terms, Privacy & Cookies"}
        </h2>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {t.consentMessage ??
            "We ask you to accept our Terms of Use, Privacy Policy and Cookie Policy. You may read them or simply accept to continue."}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>
            <Link href="/terms" className="font-semibold text-[var(--accent)] underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {t.terms}
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="font-semibold text-[var(--accent)] underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {t.privacy}
            </Link>
          </li>
          <li>
            <Link href="/cookies" className="font-semibold text-[var(--accent)] underline hover:no-underline" target="_blank" rel="noopener noreferrer">
              {t.cookies}
            </Link>
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={acceptConsent}
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]"
          >
            {t.acceptAll ?? "Accept all"}
          </button>
          <button
            type="button"
            onClick={dismissConsentModal}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--border-subtle)]"
          >
            {t.continueWithoutAccepting ?? "Continue without accepting"}
          </button>
        </div>
      </div>
    </div>
  );
}
