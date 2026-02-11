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
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)]">
      <section className="w-full border-b border-[var(--border)] bg-[var(--surface)] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-[1600px] flex flex-col md:flex-row md:items-center md:justify-between gap-10">
          <div className="flex-1 min-w-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)] md:text-5xl">
            {t.siteName}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--text-secondary)]">
            {t.tagline}
          </p>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            {t.uploadSyllabusDesc}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
              >
                {t.goToDashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
                >
                  {t.getStarted}
                </Link>
                <Link
                  href="/login"
                  className="rounded-2xl shadow-soft bg-transparent px-8 py-4 text-base font-bold text-[var(--accent)] no-underline transition hover:bg-[var(--accent-light)]"
                >
                  {t.login}
                </Link>
              </>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6 rounded-2xl bg-[var(--accent-light)]/50 shadow-soft px-8 py-6">
            <span className="text-xl font-bold text-[var(--text)]">
              {t.freeUploads}
            </span>
            <span className="text-2xl text-[var(--accent)]" aria-hidden>→</span>
            <span className="text-xl font-bold text-[var(--accent)]">
              {t.thenPay}
            </span>
            <p className="w-full text-sm text-[var(--muted)] sm:w-auto">
              {t.pricingSubline}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="inline-block rounded-2xl bg-[var(--accent)] px-8 py-4 text-base font-bold text-white no-underline shadow-soft transition hover:bg-[var(--accent-hover)]"
            >
              {t.upgrade}
            </Link>
          </div>
          </div>
          <div className="flex-shrink-0 md:w-[28rem]">
            <HeroImageCarousel />
          </div>
        </div>
      </section>

      <section className="w-full bg-[var(--bg)] px-6 py-14">
        <div className="mx-auto max-w-[1600px]">
          <h2 className="text-2xl font-bold text-[var(--text)]">
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

      <section className="w-full border-t border-[var(--divider)] bg-[var(--surface)] px-6 py-14" aria-labelledby="seo-heading">
        <div className="mx-auto max-w-[1600px]">
          <h2 id="seo-heading" className="text-2xl font-bold text-[var(--text)]">
            The smart course outline calendar and school calendar for students
          </h2>
          <div className="mt-6 grid gap-6 text-[var(--text-secondary)] sm:grid-cols-2">
            <p className="text-base leading-relaxed">
              SpaxioScheduled is an <strong>AI school calendar</strong> that turns your syllabi into one unified <strong>course outline calendar</strong>. 
              Upload your PDF or Word syllabus and get a <strong>school calendar</strong> with all assignments, tests, exams, and class times in one place—no more juggling multiple <strong>course calendar</strong> tabs or paper planners.
            </p>
            <p className="text-base leading-relaxed">
              Whether you need a <strong>syllabus calendar</strong>, <strong>class schedule planner</strong>, or <strong>assignment calendar</strong> for college or university, 
              our <strong>academic calendar</strong> tool keeps your <strong>student calendar</strong> up to date. Get reminders for your <strong>exam calendar</strong> and deadlines, 
              and ask the AI assistant about your day—the best <strong>syllabus planner</strong> for your <strong>college calendar</strong> or <strong>university calendar</strong>.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
