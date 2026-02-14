"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { CalendarView } from "@/components/CalendarView";
import { UploadSyllabus } from "@/components/UploadSyllabus";
import { QuotaCard } from "@/components/QuotaCard";
import { AddClassTime } from "@/components/AddClassTime";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FREE_UPLOADS } from "@/lib/stripe";
import { DEFAULT_COURSE_COLOR } from "@/lib/courseColors";
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
  const [syllabusCollapsed, setSyllabusCollapsed] = useState(true);

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

  const refetchEvents = useCallback(() => {
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

  useEffect(() => {
    const handler = () => refetchEvents();
    window.addEventListener("spaxio:calendar-updated", handler);
    return () => window.removeEventListener("spaxio:calendar-updated", handler);
  }, [refetchEvents]);

  const filteredEvents =
    courseFilterId === "all"
      ? events
      : events.filter((e) => e.course_id === courseFilterId);

  const courseNames: Record<string, string> = {};
  const courseColors: Record<string, string> = {};
  courses.forEach((c) => {
    courseNames[c.id] = c.code ? `${c.name} (${c.code})` : c.name;
    courseColors[c.id] = c.color ?? DEFAULT_COURSE_COLOR;
  });

  async function handleDeleteEvent(eventId: string) {
    const supabase = createClient();
    await supabase.from("calendar_events").delete().eq("id", eventId);
    refetchEvents();
  }

  async function handleUpdateEvent(
    eventId: string,
    payload: { title: string; event_date: string; event_time: string | null; event_type: "class" | "assignment" | "test" | "exam" | "other" }
  ) {
    const res = await fetch(`/api/calendar-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) refetchEvents();
  }

  async function handleAddEvent(payload: { title: string; event_date: string; event_time: string | null }) {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("calendar_events").insert({
      user_id: userId,
      course_id: null,
      title: payload.title,
      event_type: "other",
      event_date: payload.event_date,
      event_time: payload.event_time || null,
    });
    refetchEvents();
  }

  async function handleDeleteCourse(courseId: string) {
    const supabase = createClient();
    await supabase.from("courses").delete().eq("id", courseId);
    setCourseFilterId("all");
    refetchEvents();
  }

  return (
    <div className="flex flex-1 w-full max-w-full flex-col gap-2 sm:gap-3 bg-[var(--bg)] px-3 py-4 sm:px-6 sm:py-6 min-w-0 min-h-0">
      {success && (
        <div className="rounded-2xl bg-[var(--green-light)] px-5 py-3 text-base font-semibold text-[var(--text)] shadow-soft">
          Payment successful. You have 10 more uploads.
        </div>
      )}
      {canceled && (
        <div className="rounded-2xl bg-[var(--orange-light)] px-5 py-3 text-base font-semibold text-[var(--text)] shadow-soft">
          Payment canceled.
        </div>
      )}
      {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 && (
        <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/50 px-5 py-4 text-base font-semibold text-[var(--text)] shadow-soft">
          <p>{t.outOfUploads}</p>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">{t.outOfUploadsMessage}</p>
        </div>
      )}

      {/* Collapsible syllabus upload — above calendar, compact so calendar is in view */}
      <section className="shrink-0 rounded-xl bg-[var(--surface)] shadow-soft min-w-0 overflow-hidden">
        <button
          type="button"
          className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-[var(--divider)] px-3 py-2 sm:px-4 text-left hover:bg-[var(--bg)]/50 transition-colors"
          onClick={() => setSyllabusCollapsed((c) => !c)}
          aria-expanded={!syllabusCollapsed}
        >
          <h2 className="text-sm sm:text-base font-bold text-[var(--text)]">
            {t.uploadSyllabus}
          </h2>
          <span className="text-sm text-[var(--muted)]" aria-hidden>
            {syllabusCollapsed ? "▼" : "▲"}
          </span>
        </button>
        {!syllabusCollapsed && (
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              {t.uploadSyllabusDesc}
            </p>
            {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 ? (
              <>
                <div className="mt-3 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-light)]/30 px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--text)]">{t.outOfUploads}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{t.outOfUploadsMessage}</p>
                </div>
                <div className="mt-3">
                  <QuotaCard
                    quota={quota}
                    isCreatorOrAdmin={false}
                    onPurchaseComplete={refetchEvents}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="mt-3">
                  <UploadSyllabus onSuccess={refetchEvents} compact />
                </div>
                <div className="mt-3">
                  <AddClassTime onSave={refetchEvents} compact />
                </div>
                {!isCreatorOrAdmin && (
                  <div className="mt-3">
                    <QuotaCard
                      quota={quota}
                      isCreatorOrAdmin={false}
                      onPurchaseComplete={refetchEvents}
                    />
                  </div>
                )}
              </>
            )}
            {isCreatorOrAdmin && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[var(--green-light)] px-3 py-2 shadow-soft">
                <p className="text-xs font-semibold text-[var(--text)]">
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
          </div>
        )}
      </section>

      {/* Calendar — fills remaining viewport */}
      <section className="flex flex-1 flex-col min-h-0 rounded-2xl bg-[var(--surface)] shadow-soft min-w-0 overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--divider)] px-3 py-2 sm:px-4">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate min-w-0">
            {t.calendar}
          </h2>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
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
        <div className="flex-1 min-h-0 overflow-auto">
          <CalendarView events={filteredEvents} courseNames={courseNames} courseColors={courseColors} onUpdate={refetchEvents} onDeleteEvent={handleDeleteEvent} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} />
        </div>
      </section>

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
