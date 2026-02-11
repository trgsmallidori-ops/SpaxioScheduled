"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { CalendarView } from "@/components/CalendarView";
import { ReminderSettings } from "@/components/ReminderSettings";
import { UploadSyllabus } from "@/components/UploadSyllabus";
import { QuotaCard } from "@/components/QuotaCard";
import { AddClassTime } from "@/components/AddClassTime";
import { ChatBot } from "@/components/ChatBot";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FREE_UPLOADS } from "@/lib/stripe";
import type { CalendarEvent as CalEvent } from "@/types/database";
import type { UserQuota } from "@/types/database";
import type { Course } from "@/types/database";

export default function DashboardPage() {
  const { t } = useLocale();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilterId, setCourseFilterId] = useState<string>("all");
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isCreatorOrAdmin, setIsCreatorOrAdmin] = useState(false);
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [deleteConfirmCourseId, setDeleteConfirmCourseId] = useState<string | null>(null);
  const [deleteCourseLoading, setDeleteCourseLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") setSuccess(true);
    if (params.get("canceled") === "1") setCanceled(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? "");
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setIsCreatorOrAdmin(Boolean(data.isCreator || data.isAdmin));
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date")
      .then(({ data }) => setEvents((data as CalEvent[]) || []));
    supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("name")
      .then(({ data }) => setCourses((data as Course[]) || []));
    supabase
      .from("user_quota")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => setQuota(data as UserQuota | null));
  }, [userId]);

  const refetchEvents = () => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", userId)
      .order("event_date")
      .then(({ data }) => setEvents((data as CalEvent[]) || []));
    supabase
      .from("courses")
      .select("*")
      .eq("user_id", userId)
      .order("name")
      .then(({ data }) => setCourses((data as Course[]) || []));
    supabase
      .from("user_quota")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => setQuota(data as UserQuota | null));
  };

  const filteredEvents =
    courseFilterId === "all"
      ? events
      : events.filter((e) => e.course_id === courseFilterId);

  const courseNames: Record<string, string> = {};
  courses.forEach((c) => {
    courseNames[c.id] = c.code ? `${c.name} (${c.code})` : c.name;
  });

  async function handleDeleteEvent(eventId: string) {
    const supabase = createClient();
    await supabase.from("calendar_events").delete().eq("id", eventId);
    refetchEvents();
  }

  async function handleDeleteCourse(courseId: string) {
    const supabase = createClient();
    await supabase.from("courses").delete().eq("id", courseId);
    setCourseFilterId("all");
    refetchEvents();
  }

  return (
    <div className="flex w-full flex-col gap-6 bg-[var(--bg)] px-6 py-6 lg:flex-row">
      <div className="min-w-0 flex-1 order-2 lg:order-1">
        {success && (
          <div className="mb-4 rounded-2xl bg-[var(--green-light)] px-5 py-3 text-base font-semibold text-[var(--text)] shadow-soft">
            Payment successful. You have 10 more uploads.
          </div>
        )}
        {canceled && (
          <div className="mb-4 rounded-2xl bg-[var(--orange-light)] px-5 py-3 text-base font-semibold text-[var(--text)] shadow-soft">
            Payment canceled.
          </div>
        )}
        {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 && (
          <div className="mb-4 rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/50 px-5 py-4 text-base font-semibold text-[var(--text)] shadow-soft">
            <p>{t.outOfUploads}</p>
            <p className="mt-1 text-sm font-medium text-[var(--muted)]">{t.outOfUploadsMessage}</p>
          </div>
        )}
        <section className="rounded-2xl bg-[var(--surface)] shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--divider)] px-6 py-4">
            <h2 className="text-xl font-bold text-[var(--text)]">
              {t.calendar}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--muted)]">{t.filterByCourse}</span>
                <select
                  value={courseFilterId}
                  onChange={(e) => setCourseFilterId(e.target.value)}
                  className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] shadow-soft"
                >
                  <option value="all">{t.allCourses}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.code ? ` (${c.code})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              {courseFilterId !== "all" && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmCourseId(courseFilterId)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
                >
                  {t.deleteCourse}
                </button>
              )}
            </div>
          </div>
          <div className="border-b border-[var(--divider)] px-6 py-4">
            {userId && (
              <ReminderSettings
                userId={userId}
                userEmail={userEmail}
              />
            )}
          </div>
          <CalendarView events={filteredEvents} courseNames={courseNames} onUpdate={refetchEvents} onDeleteEvent={handleDeleteEvent} />
        </section>
      </div>
      <aside className="order-1 flex w-full flex-col gap-6 shrink-0 lg:order-2 lg:w-[340px]">
        <section className="rounded-2xl bg-[var(--surface)] p-6 shadow-soft">
          <h2 className="text-xl font-bold text-[var(--text)]">
            {t.uploadSyllabus}
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            {t.uploadSyllabusDesc}
          </p>
          {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 ? (
            <>
              <div className="mt-4 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/30 px-4 py-4">
                <p className="font-semibold text-[var(--text)]">{t.outOfUploads}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{t.outOfUploadsMessage}</p>
              </div>
              <QuotaCard
                quota={quota}
                isCreatorOrAdmin={false}
                onPurchaseComplete={refetchEvents}
              />
            </>
          ) : (
            <>
              <UploadSyllabus onSuccess={refetchEvents} />
              <AddClassTime onSave={refetchEvents} />
              {!isCreatorOrAdmin && (
                <QuotaCard
                  quota={quota}
                  isCreatorOrAdmin={false}
                  onPurchaseComplete={refetchEvents}
                />
              )}
            </>
          )}
          {isCreatorOrAdmin && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--green-light)] px-5 py-3 shadow-soft">
              <p className="text-sm font-semibold text-[var(--text)]">
                You have free uploads (creator or admin).
              </p>
              <QuotaCard
                quota={quota}
                isCreatorOrAdmin={true}
                onPurchaseComplete={refetchEvents}
                showTestCheckout
              />
            </div>
          )}
        </section>
        <ChatBot />
      </aside>

      <ConfirmModal
        open={deleteConfirmCourseId !== null}
        title={t.deleteCourse}
        message={t.deleteCourseConfirm}
        confirmLabel={t.deleteCourse}
        cancelLabel={t.cancel}
        variant="danger"
        loading={deleteCourseLoading}
        onConfirm={async () => {
          if (!deleteConfirmCourseId) return;
          setDeleteCourseLoading(true);
          try {
            await handleDeleteCourse(deleteConfirmCourseId);
            setDeleteConfirmCourseId(null);
          } finally {
            setDeleteCourseLoading(false);
          }
        }}
        onCancel={() => !deleteCourseLoading && setDeleteConfirmCourseId(null)}
      />
    </div>
  );
}
