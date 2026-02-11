"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import type { Course } from "@/types/database";
import type { ClassScheduleBlock } from "@/types/database";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function courseNeedsClassTime(c: Course): boolean {
  if (Array.isArray(c.class_schedule) && c.class_schedule.length > 0) return false;
  if (c.class_time_start) return false;
  return true;
}

function courseToBlocks(c: Course): ClassScheduleBlock[] {
  if (Array.isArray(c.class_schedule) && c.class_schedule.length > 0) {
    return c.class_schedule.map((b) => ({
      days: Array.isArray(b.days) ? b.days : [],
      start: b.start || "09:00",
      end: b.end || "10:00",
    }));
  }
  if (c.class_time_start && c.class_time_end && c.class_days?.length) {
    return [{ days: c.class_days, start: c.class_time_start.slice(0, 5), end: c.class_time_end.slice(0, 5) }];
  }
  return [{ days: [], start: "09:00", end: "10:00" }];
}

function refetchCourses(setCourses: (c: Course[]) => void) {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => setCourses((data as Course[]) || []));
  });
}

export function AddClassTime({ onSave }: { onSave: () => void }) {
  const { t } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ClassScheduleBlock[]>([{ days: [], start: "09:00", end: "10:00" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refetchCourses(setCourses);
  }, []);

  const needClassTime = courses.filter(courseNeedsClassTime);
  if (needClassTime.length === 0) return null;

  function updateBlock(i: number, upd: Partial<ClassScheduleBlock>) {
    setBlocks((b) => b.map((block, j) => (j === i ? { ...block, ...upd } : block)));
  }
  function toggleDay(blockIndex: number, day: string) {
    setBlocks((b) =>
      b.map((block, j) =>
        j === blockIndex
          ? { ...block, days: block.days.includes(day) ? block.days.filter((x) => x !== day) : [...block.days, day] }
          : block
      )
    );
  }
  function addBlock() {
    setBlocks((b) => [...b, { days: [], start: "09:00", end: "10:00" }]);
  }
  function removeBlock(i: number) {
    setBlocks((b) => (b.length <= 1 ? b : b.filter((_, j) => j !== i)));
  }

  async function submit(courseId: string) {
    const valid = blocks.filter((b) => b.start && b.end && b.days.length > 0);
    if (valid.length === 0) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${courseId}/class-time`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classSchedule: valid }),
    });
    setSaving(false);
    if (res.ok) {
      setEditingId(null);
      setBlocks([{ days: [], start: "09:00", end: "10:00" }]);
      refetchCourses(setCourses);
      onSave();
    }
  }

  function startEdit(c: Course) {
    setEditingId(c.id);
    setBlocks(courseToBlocks(c));
  }

  return (
    <div className="mt-5 rounded-xl bg-[var(--orange-light)] shadow-soft p-5">
      <h3 className="text-base font-bold text-[var(--text)]">🕐 {t.addClassTime}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        These courses have no class time. Add one or more times (e.g. lecture Mon/Wed, lab Tue) to show them on the calendar.
      </p>
      <ul className="mt-4 space-y-4">
        {needClassTime.map((c) => (
          <li key={c.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4">
            <span className="font-semibold text-[var(--text)]">{c.name}</span>
            {editingId === c.id ? (
              <div className="mt-3 space-y-3">
                {blocks.map((block, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3">
                    <input
                      type="time"
                      value={block.start.slice(0, 5)}
                      onChange={(e) => updateBlock(i, { start: e.target.value })}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <span className="text-[var(--muted)]">–</span>
                    <input
                      type="time"
                      value={block.end.slice(0, 5)}
                      onChange={(e) => updateBlock(i, { end: e.target.value })}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <div className="flex gap-1">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(i, day)}
                          className={`rounded-lg px-2.5 py-1 text-sm font-bold ${
                            block.days.includes(day) ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)]"
                          }`}
                        >
                          {day.slice(0, 1)}
                        </button>
                      ))}
                    </div>
                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBlock(i)}
                        className="text-sm font-semibold text-red-600 hover:underline"
                      >
                        {t.removeBlock}
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addBlock}
                    className="rounded-xl border border-dashed border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--accent)]"
                  >
                    + {t.addAnotherTime}
                  </button>
                  <button
                    type="button"
                    onClick={() => submit(c.id)}
                    disabled={saving}
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white"
                  >
                    {t.save}
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-sm font-semibold text-[var(--muted)]">
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => startEdit(c)} className="mt-2 block text-sm font-bold text-[var(--accent)] underline">
                {t.addClassTime}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
