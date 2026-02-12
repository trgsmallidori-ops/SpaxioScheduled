"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import type { NotificationPreferences } from "@/types/database";

export type ReminderMode = "days" | "weeks" | "custom";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const WEEK_OPTIONS = [1, 2, 3, 4, 5] as const;

type ReminderSettingsProps = {
  userId: string;
  userEmail: string;
  onSaved?: () => void;
};

export function ReminderSettings({ userId, userEmail, onSaved }: ReminderSettingsProps) {
  const { t, locale } = useLocale();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState(userEmail);
  const [mode, setMode] = useState<ReminderMode>("days");
  const [days, setDays] = useState(3);
  const [weeks, setWeeks] = useState(0);
  const [customDays, setCustomDays] = useState(0);
  const [customWeeks, setCustomWeeks] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setEmail(userEmail);
  }, [userEmail]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          const p = data as NotificationPreferences;
          setPrefs(p);
          setEmail(p.email || userEmail);
          const d = p.remind_days_before ?? 0;
          const w = p.remind_weeks_before ?? 0;
          setCustomDays(d);
          setCustomWeeks(w);
          if (w > 0 && d === 0) {
            setMode("weeks");
            setWeeks(WEEK_OPTIONS.includes(w as 1 | 2 | 3 | 4 | 5) ? w : 1);
          } else if (d > 0 && DAY_OPTIONS.includes(d as 1 | 2 | 3 | 4 | 5 | 6) && w === 0) {
            setMode("days");
            setDays(d as 1 | 2 | 3 | 4 | 5 | 6);
          } else {
            setMode("custom");
          }
        }
        setLoading(false);
      })
      .then(undefined, () => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, userEmail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    let remindDays: number;
    let remindWeeks: number;
    if (mode === "days") {
      remindDays = days;
      remindWeeks = 0;
    } else if (mode === "weeks") {
      remindDays = 0;
      remindWeeks = weeks;
    } else {
      remindDays = customDays;
      remindWeeks = customWeeks;
    }
    setSaving(true);
    setSaved(false);
    await supabase.from("notification_preferences").upsert({
      user_id: userId,
      email: email.trim() || userEmail,
      remind_days_before: remindDays,
      remind_weeks_before: remindWeeks,
      frequency: "daily",
      locale: locale === "fr" ? "fr" : "en",
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--divider)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--muted)]">
        Loading reminder settings…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--divider)] bg-[var(--bg)] overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-[var(--bg)]/80 transition-colors"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text)]">🔔</span>
          <span className="text-xs font-bold text-[var(--text)]">{t.remindMe}</span>
        </span>
        <span className="text-[var(--muted)] transition-transform duration-200" aria-hidden>
          {collapsed ? "▼" : "▲"}
        </span>
      </button>
      {!collapsed && (
        <form onSubmit={handleSave} className="border-t border-[var(--divider)] p-3 pt-2 space-y-2">
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)]">{t.reminderEmail}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)]">{t.reminderWhen}</label>
          <div className="mt-1 flex flex-wrap gap-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as ReminderMode)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
            >
              <option value="days">{t.reminderPresetDays}</option>
              <option value="weeks">{t.reminderPresetWeeks}</option>
              <option value="custom">{t.reminderPresetCustom}</option>
            </select>
            {mode === "days" && (
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {DAY_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? t.reminder1Day : t.reminderNDays.replace("{{n}}", String(n))}
                  </option>
                ))}
              </select>
            )}
            {mode === "weeks" && (
              <select
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
              >
                {WEEK_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? t.reminder1Week : t.reminderNWeeks.replace("{{n}}", String(n))}
                  </option>
                ))}
              </select>
            )}
            {mode === "custom" && (
              <>
                <select
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? t.reminder0Days : n === 1 ? t.reminder1Day : t.reminderNDays.replace("{{n}}", String(n))}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-[var(--muted)]">+</span>
                <select
                  value={customWeeks}
                  onChange={(e) => setCustomWeeks(Number(e.target.value))}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? t.reminder0Weeks : n === 1 ? t.reminder1Week : t.reminderNWeeks.replace("{{n}}", String(n))}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? "..." : t.save}
          </button>
          {saved && (
            <span className="text-sm font-semibold text-green-600">{t.reminderSaved}</span>
          )}
        </div>
        </form>
      )}
    </div>
  );
}
