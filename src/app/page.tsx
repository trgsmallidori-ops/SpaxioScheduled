"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import { HeroImageCarousel } from "@/components/HeroImageCarousel";

export default function HomePage() {
  const { t } = useLocale();
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="w-full max-w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)] overflow-x-hidden">
      <section className="relative w-full min-h-screen overflow-hidden">
        <HeroImageCarousel fullScreen />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 pointer-events-none" aria-hidden />
        <div className="relative z-10 flex min-h-screen flex-col justify-center px-4 py-16 sm:px-6 md:py-20">
          <div className="w-full max-w-[min(50vw,26rem)] rounded-2xl bg-black/50 backdrop-blur-md p-5 shadow-xl sm:p-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
              {t.siteName}
            </h1>
            <p className="mt-3 text-base text-white/95">
              {t.tagline}
            </p>
            <p className="mt-1.5 text-sm text-white/80">
              {t.uploadSyllabusDesc}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
                >
                  {t.goToDashboard}
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
                  >
                    {t.getStarted}
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl shadow-soft bg-white/20 backdrop-blur px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-white/30"
                  >
                    {t.login}
                  </Link>
                </>
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl bg-white/15 backdrop-blur px-4 py-3">
              <span className="text-sm font-bold text-white">{t.freeUploads}</span>
              <span className="text-lg text-white/90" aria-hidden>→</span>
              <span className="text-sm font-bold text-[var(--accent)]">{t.thenPay}</span>
              <p className="w-full text-xs text-white/80 sm:w-auto">{t.pricingSubline}</p>
            </div>
            <div className="mt-4 flex flex-col items-start gap-0.5">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
              >
                {t.upgrade}
              </Link>
              <span className="text-xs text-white/70">{t.upgradeSecureNote}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[var(--bg)] px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-[1600px]">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text)]">
            {t.features}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-2xl bg-[var(--surface)] shadow-soft p-6 shadow-soft">
              <div className="mb-3 text-3xl">📚</div>
              <h3 className="font-bold text-[var(--text)]">{t.feature1}</h3>
            </li>
            <li className="rounded-2xl bg-[var(--surface)] shadow-soft p-6 shadow-soft">
              <div className="mb-3 text-3xl">📅</div>
              <h3 className="font-bold text-[var(--text)]">{t.feature2}</h3>
            </li>
            <li className="rounded-2xl bg-[var(--surface)] shadow-soft p-6 shadow-soft">
              <div className="mb-3 text-3xl">🔔</div>
              <h3 className="font-bold text-[var(--text)]">{t.feature3}</h3>
            </li>
            <li className="rounded-2xl bg-[var(--surface)] shadow-soft p-6 shadow-soft">
              <div className="mb-3 text-3xl">💬</div>
              <h3 className="font-bold text-[var(--text)]">{t.feature4}</h3>
            </li>
          </ul>
        </div>
      </section>

      <section className="w-full border-t border-[var(--divider)] bg-[var(--surface)] px-4 py-10 sm:px-6 sm:py-14" aria-labelledby="seo-heading">
        <div className="mx-auto max-w-[1600px]">
          <h2 id="seo-heading" className="text-xl sm:text-2xl font-bold text-[var(--text)]">
            {t.seoHeading}
          </h2>
          <div className="mt-6 grid gap-6 text-[var(--text-secondary)] sm:grid-cols-2">
            <p className="text-base leading-relaxed">
              {t.seoParagraph1.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
            <p className="text-base leading-relaxed">
              {t.seoParagraph2.split(/\*\*(.+?)\*\*/g).map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
