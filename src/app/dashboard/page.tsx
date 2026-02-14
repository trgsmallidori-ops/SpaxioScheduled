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
import { eventsToIcs, downloadIcs, autoImportIcs } from "@/lib/exportToIcs";
import { ExportPromptModal } from "@/components/ExportPromptModal";
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
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportPromptOpen, setExportPromptOpen] = useState(false);

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

  const refetchEvents = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();
    const supabase = createClient();
    return Promise.all([
      supabase.from("calendar_events").select("*").eq("user_id", userId).order("event_date").then(({ data }) => setEvents((data as CalEvent[]) || [])),
      supabase.from("courses").select("*").eq("user_id", userId).order("name").then(({ data }) => setCourses((data as Course[]) || [])),
      supabase.from("user_quota").select("*").eq("user_id", userId).single().then(({ data }) => setQuota(data as UserQuota | null)),
    ]).then(() => {});
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
    <div className="relative flex w-full max-w-full flex-col bg-[var(--bg)]">
      {/* Alerts overlay — above calendar so calendar stays full height */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none sm:left-6 sm:right-6">
        {success && (
          <div className="rounded-xl bg-[var(--green-light)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-soft pointer-events-auto">
            Payment successful. You have 10 more uploads.
          </div>
        )}
        {canceled && (
          <div className="rounded-xl bg-[var(--orange-light)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-soft pointer-events-auto">
            Payment canceled.
          </div>
        )}
        {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 && (
          <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/80 px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-soft pointer-events-auto">
            {t.outOfUploads} — {t.outOfUploadsMessage}
          </div>
        )}
      </div>

      {/* Calendar — part of page flow; page scrolls as one */}
      <section className="flex flex-col rounded-none sm:rounded-2xl bg-[var(--surface)] shadow-soft min-w-0 mx-0 sm:mx-3 sm:mt-4 sm:mb-4">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--divider)] px-3 py-2 sm:px-4">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)] truncate min-w-0">
            {t.calendar}
          </h2>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[var(--accent-hover)] transition-all hover:shadow-xl flex items-center gap-2"
            >
              <span className="text-base" aria-hidden>📅</span>
              <span>{t.exportCalendar}</span>
            </button>
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
        <div>
          <CalendarView events={filteredEvents} courseNames={courseNames} courseColors={courseColors} onUpdate={refetchEvents} onDeleteEvent={handleDeleteEvent} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} />
        </div>
      </section>

      {/* Prominent floating Upload syllabus button — left side */}
      <button
        type="button"
        onClick={() => setUploadModalOpen(true)}
        className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-base font-bold text-white shadow-lg hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] sm:bottom-6 sm:left-6 sm:px-6 sm:py-4 sm:text-lg"
        aria-label={t.uploadSyllabus}
      >
        <span className="text-xl sm:text-2xl" aria-hidden>↑</span>
        <span>{t.uploadSyllabus}</span>
      </button>

      {/* Upload syllabus modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-modal-title"
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            className="my-8 w-full max-w-lg rounded-2xl bg-[var(--surface)] shadow-soft-lg border border-[var(--border-subtle)] max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--divider)] px-4 py-3 sm:px-6">
              <h2 id="upload-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t.uploadSyllabus}
              </h2>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
              <p className="text-sm text-[var(--muted)]">
                {t.uploadSyllabusDesc}
              </p>
              {!isCreatorOrAdmin && quota && (quota.paid_uploads_purchased ?? 0) - (quota.paid_uploads_used ?? 0) + Math.max(0, FREE_UPLOADS - (quota.free_uploads_used ?? 0)) <= 0 ? (
                <>
                  <div className="mt-4 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-light)]/30 px-4 py-3">
                    <p className="font-semibold text-[var(--text)]">{t.outOfUploads}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{t.outOfUploadsMessage}</p>
                  </div>
                  <div className="mt-4">
                    <QuotaCard
                      quota={quota}
                      isCreatorOrAdmin={false}
                      onPurchaseComplete={refetchEvents}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4">
                    <UploadSyllabus
                      onSuccess={async () => {
                        await refetchEvents();
                      }}
                    />
                  </div>
                  <div className="mt-4">
                    <AddClassTime onSave={refetchEvents} />
                  </div>
                  {!isCreatorOrAdmin && (
                    <div className="mt-4">
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
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-[var(--green-light)] px-4 py-3 shadow-soft">
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
            </div>
          </div>
        </div>
      )}

      {/* Export calendar modal */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          onClick={() => setExportModalOpen(false)}
        >
          <div
            className="my-8 w-full max-w-lg rounded-2xl bg-[var(--surface)] shadow-soft-lg border border-[var(--border-subtle)] max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--divider)] px-4 py-3 sm:px-6">
              <h2 id="export-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t.exportCalendar}
              </h2>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)] transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
              <p className="text-sm text-[var(--muted)]">
                {t.exportCalendarDesc}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ics = eventsToIcs(filteredEvents, courseNames);
                    autoImportIcs(ics);
                  }}
                  disabled={filteredEvents.length === 0}
                  className="w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.exportAutoImport}
                  {filteredEvents.length === 0 && " (no events)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ics = eventsToIcs(filteredEvents, courseNames);
                    downloadIcs(ics);
                  }}
                  disabled={filteredEvents.length === 0}
                  className="w-full rounded-xl border border-[var(--divider)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)] hover:bg-[var(--border-subtle)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.exportDownloadToFiles}
                  {filteredEvents.length === 0 && " (no events)"}
                </button>
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text)] mb-3">
                  {t.howToImport}
                </h3>
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                      {t.importGoogleTitle}
                    </h4>
                    <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                      {(t.importGoogleSteps as string).split("\n").map((line, i) => (
                        <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                      {t.importAppleTitle}
                    </h4>
                    <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                      {(t.importAppleSteps as string).split("\n").map((line, i) => (
                        <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-4">
                    <h4 className="text-sm font-semibold text-[var(--text)] mb-2">
                      {t.importOutlookTitle}
                    </h4>
                    <ol className="text-sm text-[var(--muted)] list-decimal list-inside space-y-1.5 whitespace-pre-line">
                      {(t.importOutlookSteps as string).split("\n").map((line, i) => (
                        <li key={i}>{line.replace(/^\d+\.\s*/, "")}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExportPromptModal
        open={exportPromptOpen}
        onClose={() => setExportPromptOpen(false)}
        events={filteredEvents}
        courseNames={courseNames}
      />

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
