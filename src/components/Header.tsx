"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsCreator(false);
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false);
        setIsCreator(data.isCreator ?? false);
      });
  }, [user]);

  const navLink = (href: string, label: string, active = false, highlight = false) => (
    <Link
      href={href}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition ${
        active
          ? "bg-[var(--accent)] text-white"
          : highlight
            ? "text-[var(--accent)] hover:bg-[var(--accent-light)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--divider)] bg-white shadow-soft">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-0 no-underline transition opacity-95 hover:opacity-100"
          aria-label={t.siteName}
        >
          <Image
            src="/logo.png"
            alt=""
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <nav className="flex items-center gap-1">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as "en" | "fr")}
            className="rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text)]"
          >
            <option value="en">{t.english}</option>
            <option value="fr">{t.french}</option>
          </select>
          {user ? (
            <>
              {navLink("/dashboard", t.dashboard, pathname === "/dashboard")}
              {navLink("/dashboard/courses", t.byCourse, pathname === "/dashboard/courses")}
              {navLink("/account", t.myAccount, pathname === "/account")}
              {isCreator && navLink("/creator", t.creatorPortal, pathname === "/creator", true)}
              {isAdmin && navLink("/admin", t.admin, pathname === "/admin")}
              <form action="/api/auth/signout" method="post" className="inline">
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
                >
                  {t.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] no-underline transition hover:bg-[var(--border-subtle)]"
              >
                {t.login}
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)]"
              >
                {t.signUp}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
