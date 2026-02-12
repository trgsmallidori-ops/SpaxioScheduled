"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import { COURSE_COLOR_PRESETS, DEFAULT_COURSE_COLOR } from "@/lib/courseColors";
import type { Course } from "@/types/database";
import type { CalendarEvent } from "@/types/database";
import { formatDisplayDate } from "@/lib/formatDate";

export default function CoursesPage() {
  const { t } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | "all">("all");
  const [deleteConfirmCourseId, setDeleteConfirmCourseId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updatingColorCourseId, setUpdatingColorCourseId] = useState<string | null>(null);

  function refetch() {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .order("name")
        .then(({ data }) => setCourses((data as Course[]) || []));
      supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date")
        .then(({ data }) => setEvents((data as CalendarEvent[]) || []));
    });
  }

  useEffect(() => {
    refetch();
  }, []);

  async function handleDeleteCourse(courseId: string) {
    const supabase = createClient();
    await supabase.from("courses").delete().eq("id", courseId);
    if (selectedId === courseId) setSelectedId("all");
    refetch();
  }

  async function handleCourseColorChange(courseId: string, color: string) {
    setUpdatingColorCourseId(courseId);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (res.ok) refetch();
    } finally {
      setUpdatingColorCourseId(null);
    }
  }

  const filteredEvents =
    selectedId === "all"
      ? events
      : events.filter((e) => e.course_id === selectedId);

  const coursesToShow =
    selectedId === "all"
      ? courses
      : courses.filter((c) => c.id === selectedId);

  function formatClassBlock(c: Course): string[] {
    const lines: string[] = [];
    const schedule = c.class_schedule;
    if (Array.isArray(schedule) && schedule.length > 0) {
      for (const block of schedule) {
        if (block.days?.length && block.start && block.end) {
          lines.push(`${block.days.join(", ")} ${block.start}–${block.end}`);
        }
      }
    } else if (c.class_time_start && c.class_time_end && c.class_days?.length) {
      lines.push(
        `${c.class_days.join(", ")} ${c.class_time_start}–${c.class_time_end}`
      );
    }
    return lines;
  }

  const byCourseId = new Map<string, { class: string[]; assignment: CalendarEvent[]; test: CalendarEvent[]; exam: CalendarEvent[] }>();
  for (const c of courses) {
    byCourseId.set(c.id, {
      class: formatClassBlock(c),
      assignment: [],
      test: [],
      exam: [],
    });
  }
  for (const e of filteredEvents) {
    if (!e.course_id) continue;
    const row = byCourseId.get(e.course_id);
    if (!row) continue;
    if (e.event_type === "class") continue;
    if (e.event_type === "assignment") row.assignment.push(e);
    else if (e.event_type === "test") row.test.push(e);
    else if (e.event_type === "exam") row.exam.push(e);
  }

  return (
    <div className="w-full bg-[var(--bg)] px-6 py-8">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--text)]">
            📚 {t.byCourse}
          </h1>
          <Link
            href="/dashboard"
            className="font-bold text-[var(--accent)] underline hover:no-underline"
          >
            ← {t.calendar}
          </Link>
        </div>

        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold text-[var(--text)]">
            {t.filterByCourse}
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value as string | "all")}
            className="w-full max-w-sm rounded-xl border border-[var(--divider)] bg-[var(--surface)] px-4 py-3 text-base font-medium text-[var(--text)] shadow-soft focus:border-[var(--accent)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
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

        <div className="space-y-6">
          {coursesToShow.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              {courses.length === 0
                ? "Upload a syllabus to see courses here."
                : "Select a course to see its schedule."}
            </p>
          ) : (
            coursesToShow.map((course) => {
              const row = byCourseId.get(course.id);
              const classLines = row?.class ?? formatClassBlock(course);
              const assignments = row?.assignment ?? [];
              const tests = row?.test ?? [];
              const exams = row?.exam ?? [];
              const hasAny =
                classLines.length > 0 ||
                assignments.length > 0 ||
                tests.length > 0 ||
                exams.length > 0;

              return (
                <section
                  key={course.id}
                  className="rounded-2xl bg-[var(--surface)] p-6 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-[var(--text)]">
                      {course.name}
                      {course.code && (
                        <span className="ml-2 font-sans text-sm font-normal text-[var(--muted)]">
                          {course.code}
                        </span>
                      )}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--muted)]">{t.courseColor ?? "Colour"}:</span>
                      <div className="flex flex-wrap gap-1">
                        {COURSE_COLOR_PRESETS.map((hex) => {
                          const current = course.color ?? DEFAULT_COURSE_COLOR;
                          const isSelected = current.toLowerCase() === hex.toLowerCase();
                          return (
                            <button
                              key={hex}
                              type="button"
                              disabled={updatingColorCourseId === course.id}
                              onClick={() => handleCourseColorChange(course.id, hex)}
                              className={`h-7 w-7 rounded-full border-2 transition hover:opacity-90 disabled:opacity-50 ${
                                isSelected ? "border-[var(--text)] ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-[var(--accent)]" : "border-transparent"
                              }`}
                              style={{ backgroundColor: hex }}
                              title={hex}
                              aria-label={t.courseColor ?? "Course colour"}
                            />
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmCourseId(course.id)}
                        className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
                      >
                        {t.deleteCourse}
                      </button>
                    </div>
                  </div>

                  {!hasAny && (
                    <p className="mt-3 text-2xs text-[var(--muted)]">
                      {t.noItemsForCourse}
                    </p>
                  )}

                  {classLines.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[var(--text)]">
                        {t.classSchedule}
                      </h3>
                      <ul className="mt-1 space-y-0.5 text-sm text-[var(--text)]">
                        {classLines.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assignments.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[var(--text)]">
                        {t.assignments}
                      </h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--text)]">
                        {assignments.map((e) => (
                          <li key={e.id} className="flex gap-2">
                            <span className="shrink-0 text-sm font-medium text-[var(--muted)]">
                              {formatDisplayDate(e.event_date)}
                            </span>
                            <span className="text-[var(--text)]">{e.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tests.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[var(--text)]">
                        {t.tests}
                      </h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--text)]">
                        {tests.map((e) => (
                          <li key={e.id} className="flex gap-2">
                            <span className="shrink-0 text-sm font-medium text-[var(--muted)]">
                              {formatDisplayDate(e.event_date)}
                            </span>
                            <span>{e.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exams.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-sm font-bold text-[var(--text)]">
                        {t.exams}
                      </h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--text)]">
                        {exams.map((e) => (
                          <li key={e.id} className="flex gap-2">
                            <span className="shrink-0 text-sm font-medium text-[var(--muted)]">
                              {formatDisplayDate(e.event_date)}
                            </span>
                            <span>{e.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmCourseId !== null}
        title={t.deleteCourse}
        message={t.deleteCourseConfirm}
        confirmLabel={t.deleteCourse}
        cancelLabel={t.cancel}
        variant="danger"
        loading={deleteLoading}
        onConfirm={async () => {
          if (!deleteConfirmCourseId) return;
          setDeleteLoading(true);
          try {
            await handleDeleteCourse(deleteConfirmCourseId);
            setDeleteConfirmCourseId(null);
          } finally {
            setDeleteLoading(false);
          }
        }}
        onCancel={() => !deleteLoading && setDeleteConfirmCourseId(null)}
      />
    </div>
  );
}
