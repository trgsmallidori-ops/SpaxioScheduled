"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";
import type { NotificationPreferences } from "@/types/database";

export default function AccountPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [email, setEmail] = useState("");
  const [remindDays, setRemindDays] = useState(3);
  const [remindWeeks, setRemindWeeks] = useState(0);
  const [frequency, setFrequency] = useState("daily");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data as Profile | null));
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPrefs(data as NotificationPreferences);
            setEmail((data as NotificationPreferences).email);
            setRemindDays((data as NotificationPreferences).remind_days_before);
            setRemindWeeks((data as NotificationPreferences).remind_weeks_before);
            setFrequency((data as NotificationPreferences).frequency);
          }
        });
    });
  }, []);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      email: email || user.email,
      remind_days_before: remindDays,
      remind_weeks_before: remindWeeks,
      frequency,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  async function deleteAccount() {
    if (!confirm(t.deleteAccountConfirm)) return;
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    setDeleting(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl bg-[var(--bg)] px-6 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)]">{t.myAccount}</h1>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-bold text-[var(--text)]">🔔 {t.notifications}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Set when and how often to get reminders for tests and assignments.
        </p>
        <form onSubmit={savePrefs} className="mt-5 space-y-5">
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.reminderEmail}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[var(--text)]">
                {t.daysBefore}
              </label>
              <input
                type="number"
                min={0}
                value={remindDays}
                onChange={(e) => setRemindDays(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text)]">
                {t.weeksBefore}
              </label>
              <input
                type="number"
                min={0}
                value={remindWeeks}
                onChange={(e) => setRemindWeeks(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text)]">
              {t.frequency}
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
            >
              <option value="daily">{t.daily}</option>
              <option value="weekly">{t.weekly}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? "..." : t.save}
          </button>
        </form>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-6 shadow-soft">
        <h2 className="text-lg font-bold text-[var(--text)]">{t.editProfile}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Profile is synced with your login. Change email/password in Supabase Auth if needed.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6">
        <h2 className="text-lg font-bold text-[var(--text)]">{t.deleteAccount}</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Permanently delete your account and all data.
        </p>
        <button
          type="button"
          onClick={deleteAccount}
          disabled={deleting}
          className="mt-4 rounded-xl bg-red-600 px-6 py-3 text-base font-bold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "..." : t.deleteAccount}
        </button>
      </section>
    </div>
  );
}
