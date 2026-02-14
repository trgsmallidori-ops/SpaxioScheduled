"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="w-full max-w-full border-t border-[var(--divider)] bg-[var(--surface)] px-4 py-6 sm:px-6 sm:py-8 mt-auto">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
        <div className="flex-1 min-w-0" />
        <span className="shrink-0">© {new Date().getFullYear()} {t.siteName}</span>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-6 min-w-0">
          <Link href="/privacy" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
            {t.privacy}
          </Link>
          <Link href="/terms" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
            {t.terms}
          </Link>
          <Link href="/cookies" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
            {t.cookies}
          </Link>
          <Link href="/contact" className="font-semibold text-[var(--text)] hover:text-[var(--accent)]">
            {t.refunds}
          </Link>
        </div>
      </div>
    </footer>
  );
}
