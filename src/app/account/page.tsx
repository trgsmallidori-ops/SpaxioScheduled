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
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    if (params.get("type") === "recovery") setRecoveryMode(true);
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

  async function setPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) return;
    const supabase = createClient();
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
    setUpdatingPassword(false);
    if (error) {
      setResetError(error.message);
      return;
    }
    setPasswordUpdated(true);
    setRecoveryMode(false);
    setNewPassword("");
    if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname);
  }

  async function sendPasswordReset() {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u?.email) return;
    setResetting(true);
    setResetError("");
    setResetSent(false);
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/account` : undefined,
    });
    setResetting(false);
    if (error) {
      setResetError(t.resetPasswordError);
      return;
    }
    setResetSent(true);
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

      {recoveryMode && (
        <section className="mt-8 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/30 p-6 shadow-soft">
          <h2 className="text-lg font-bold text-[var(--text)]">{t.setNewPassword}</h2>
          {passwordUpdated ? (
            <p className="mt-3 text-sm font-semibold text-green-600">{t.newPasswordSuccess}</p>
          ) : (
            <form onSubmit={setPassword} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text)]">{t.newPassword}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-3 text-[var(--text)]"
                />
              </div>
              <button
                type="submit"
                disabled={updatingPassword}
                className="rounded-xl bg-[var(--accent)] px-6 py-3 text-base font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {updatingPassword ? "..." : t.save}
              </button>
              {resetError && <p className="text-sm font-semibold text-red-600">{resetError}</p>}
            </form>
          )}
        </section>
      )}

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
          Profile is synced with your login.
        </p>
        <div className="mt-4">
          <p className="text-sm font-semibold text-[var(--text)]">{t.resetPassword}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            We&apos;ll send a link to <strong>{email || "your email"}</strong> to reset your password.
          </p>
          <button
            type="button"
            onClick={sendPasswordReset}
            disabled={resetting}
            className="mt-3 rounded-xl border border-[var(--accent)]/50 bg-white px-5 py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-light)] disabled:opacity-50"
          >
            {resetting ? "..." : t.resetPasswordSendLink}
          </button>
          {resetSent && (
            <p className="mt-3 text-sm font-semibold text-green-600">{t.resetPasswordSent}</p>
          )}
          {resetError && (
            <p className="mt-3 text-sm font-semibold text-red-600">{resetError}</p>
          )}
        </div>
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
