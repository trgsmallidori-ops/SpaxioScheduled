"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/contexts/LocaleContext";
import type { Course } from "@/types/database";
import type { ClassScheduleBlock } from "@/types/database";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  Mon: "M",
  Tue: "T",
  Wed: "W",
  Thu: "T",
  Fri: "F",
  Sat: "S",
  Sun: "S",
};

function courseNeedsClassTime(c: Course): boolean {
  if (Array.isArray(c.class_schedule) && c.class_schedule.length > 0) return false;
  if (c.class_time_start) return false;
  return true;
}

function courseNeedsTermDates(c: Course): boolean {
  if (courseNeedsClassTime(c)) return false;
  return !c.term_end_date || !c.term_start_date;
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

export function AddClassTime({ onSave, compact = false }: { onSave: () => void; compact?: boolean }) {
  const { t } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<ClassScheduleBlock[]>([{ days: [], start: "09:00", end: "10:00" }]);
  const [saving, setSaving] = useState(false);
  const [termDatesId, setTermDatesId] = useState<string | null>(null);
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [savingTerm, setSavingTerm] = useState(false);

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

  const needTermDates = courses.filter(courseNeedsTermDates);

  async function saveTermDates(courseId: string) {
    if (!termStart.trim() || !termEnd.trim()) return;
    setSavingTerm(true);
    try {
      const r = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term_start_date: termStart.trim(), term_end_date: termEnd.trim() }),
      });
      if (r.ok) {
        const c = courses.find((x) => x.id === courseId);
        if (c && (c.class_schedule?.length ?? 0) > 0) {
          await fetch(`/api/courses/${courseId}/class-time`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classSchedule: c.class_schedule }),
          });
        }
        setTermDatesId(null);
        setTermStart("");
        setTermEnd("");
        refetchCourses(setCourses);
        onSave();
      }
    } finally {
      setSavingTerm(false);
    }
  }

  return (
    <div className={compact ? "mt-0 rounded-lg bg-[var(--orange-light)] shadow-soft p-3" : "mt-5 rounded-xl bg-[var(--orange-light)] shadow-soft p-5"}>
      <h3 className={compact ? "text-sm font-bold text-[var(--text)]" : "text-base font-bold text-[var(--text)]"}>🕐 {t.addClassTime}</h3>
      <p className={compact ? "mt-1 text-xs text-[var(--muted)]" : "mt-2 text-sm text-[var(--muted)]"}>
        These courses have no class time. Add one or more times (e.g. lecture Mon/Wed, lab Tue) to show them on the calendar.
      </p>
      <ul className={compact ? "mt-2 space-y-2" : "mt-4 space-y-4"}>
        {needClassTime.map((c) => (
          <li key={c.id} className={compact ? "rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-2" : "rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-4"}>
            <span className="font-semibold text-[var(--text)]">{c.name}</span>
            {editingId === c.id ? (
              <div className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
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
                          title={day}
                          onClick={() => toggleDay(i, day)}
                          className={`rounded-lg px-2.5 py-1 text-sm font-bold ${
                            block.days.includes(day) ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--muted)]"
                          }`}
                        >
                          {DAY_LABELS[day]}
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

      {needTermDates.length > 0 && (
        <div className={compact ? "mt-3 border-t border-[var(--border-subtle)] pt-3" : "mt-6 border-t border-[var(--border-subtle)] pt-5"}>
          <h3 className={compact ? "text-sm font-bold text-[var(--text)]" : "text-base font-bold text-[var(--text)]"}>📅 {t.setTermDates ?? "Set term dates"}</h3>
          <p className={compact ? "mt-0.5 text-xs text-[var(--muted)]" : "mt-1 text-sm text-[var(--muted)]"}>
            {t.setTermDatesPrompt ?? "Set first/last day of term so classes don't extend past your semester."}
          </p>
          <ul className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
            {needTermDates.map((c) => (
              <li key={c.id} className={compact ? "rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-2" : "rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-3"}>
                <span className="font-semibold text-[var(--text)]">{c.name}</span>
                {termDatesId === c.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      type="date"
                      value={termStart}
                      onChange={(e) => setTermStart(e.target.value)}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={termEnd}
                      onChange={(e) => setTermEnd(e.target.value)}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => saveTermDates(c.id)}
                      disabled={savingTerm || !termStart.trim() || !termEnd.trim()}
                      className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {savingTerm ? "..." : t.save}
                    </button>
                    <button type="button" onClick={() => setTermDatesId(null)} className="text-sm font-semibold text-[var(--muted)]">
                      {t.cancel}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTermDatesId(c.id);
                      setTermStart(c.term_start_date ?? "");
                      setTermEnd(c.term_end_date ?? "");
                    }}
                    className="mt-2 block text-sm font-bold text-[var(--accent)] underline"
                  >
                    {t.setTermDates ?? "Set term dates"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
