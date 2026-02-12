"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function Header() {
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [quota, setQuota] = useState<{ totalLeft: number; hasUpgraded: boolean } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      setQuota(null);
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setIsAdmin(data.isAdmin ?? false);
        setIsCreator(data.isCreator ?? false);
        setQuota(data.quota ?? null);
      });
  }, [user]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const navLink = (href: string, label: string, active = false, highlight = false, mobile = false) => (
    <Link
      href={href}
      onClick={mobile ? closeMenu : undefined}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition block ${
        active
          ? "bg-[var(--accent)] text-white"
          : highlight
            ? "text-[var(--accent)] hover:bg-[var(--accent-light)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
      } ${mobile ? "py-3 text-base" : ""}`}
    >
      {label}
    </Link>
  );

  const navContent = (mobile: boolean) => (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-xl p-2.5 text-[var(--text)] hover:bg-[var(--border-subtle)] transition"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as "en" | "fr")}
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
      >
        <option value="en">{t.english}</option>
        <option value="fr">{t.french}</option>
      </select>
      {user ? (
        <>
          {!isCreator && !isAdmin && quota && (quota.totalLeft <= 0 || !quota.hasUpgraded) && (
            <div className="flex flex-col items-center">
              <Link
                href="/dashboard"
                onClick={mobile ? closeMenu : undefined}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)] block"
              >
                {t.upgrade}
              </Link>
              <span className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight">{t.upgradeSecureNote}</span>
            </div>
          )}
          {navLink("/dashboard", t.dashboard, pathname === "/dashboard", false, mobile)}
          {navLink("/dashboard/courses", t.byCourse, pathname === "/dashboard/courses", false, mobile)}
          {navLink("/account", t.myAccount, pathname === "/account", false, mobile)}
          {isCreator && navLink("/creator", t.creatorPortal, pathname === "/creator", true, mobile)}
          {isAdmin && navLink("/admin", t.admin, pathname === "/admin", false, mobile)}
          <form action="/api/auth/signout" method="post" className="inline">
            <button
              type="submit"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] ${mobile ? "w-full text-left" : ""}`}
            >
              {t.logout}
            </button>
          </form>
        </>
      ) : (
        <>
          <Link
            href="/login"
            onClick={mobile ? closeMenu : undefined}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] no-underline transition hover:bg-[var(--border-subtle)] ${mobile ? "block" : ""}`}
          >
            {t.login}
          </Link>
          <Link
            href="/signup"
            onClick={mobile ? closeMenu : undefined}
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)] block"
          >
            {t.signUp}
          </Link>
        </>
      )}
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[var(--divider)] bg-[var(--surface)] shadow-soft">
        <div className="mx-auto flex h-14 md:h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="text-lg md:text-xl font-bold text-[var(--text)] no-underline transition opacity-95 hover:opacity-100 min-w-0 truncate"
            aria-label={t.siteName}
            onClick={menuOpen ? closeMenu : undefined}
          >
            SpaxioScheduled
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navContent(false)}
          </nav>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl text-[var(--text)] hover:bg-[var(--border-subtle)] transition shrink-0"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className={`w-5 h-0.5 bg-current rounded-full transition ${menuOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`w-5 h-0.5 bg-current rounded-full my-1 transition ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-current rounded-full transition ${menuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile side menu overlay + drawer */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={closeMenu}
          aria-hidden
        />
        <div
          className={`absolute top-0 right-0 h-full w-[min(280px,85vw)] max-w-full bg-[var(--surface)] border-l border-[var(--divider)] shadow-soft-lg flex flex-col transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--divider)]">
            <span className="text-lg font-bold text-[var(--text)]">Menu</span>
            <button
              type="button"
              onClick={closeMenu}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text)] hover:bg-[var(--border-subtle)] text-2xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl p-2.5 text-[var(--text)] hover:bg-[var(--border-subtle)] transition"
                aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as "en" | "fr")}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] flex-1"
              >
                <option value="en">{t.english}</option>
                <option value="fr">{t.french}</option>
              </select>
            </div>
            {user ? (
              <>
                {!isCreator && !isAdmin && quota && (quota.totalLeft <= 0 || !quota.hasUpgraded) && (
                  <div className="flex flex-col items-center">
                    <Link
                      href="/dashboard"
                      onClick={closeMenu}
                      className="rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white no-underline transition hover:bg-[var(--accent-hover)] block text-center"
                    >
                      {t.upgrade}
                    </Link>
                    <span className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight">{t.upgradeSecureNote}</span>
                  </div>
                )}
                {navLink("/dashboard", t.dashboard, pathname === "/dashboard", false, true)}
                {navLink("/dashboard/courses", t.byCourse, pathname === "/dashboard/courses", false, true)}
                {navLink("/account", t.myAccount, pathname === "/account", false, true)}
                {isCreator && navLink("/creator", t.creatorPortal, pathname === "/creator", true, true)}
                {isAdmin && navLink("/admin", t.admin, pathname === "/admin", false, true)}
                <form action="/api/auth/signout" method="post" className="mt-2">
                  <button
                    type="submit"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] w-full text-left"
                  >
                    {t.logout}
                  </button>
                </form>
              </>
            ) : (
              <>
                {navLink("/login", t.login, false, false, true)}
                {navLink("/signup", t.signUp, false, false, true)}
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
