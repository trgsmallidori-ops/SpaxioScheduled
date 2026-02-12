"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { COURSE_COLOR_PRESETS, DEFAULT_COURSE_COLOR } from "@/lib/courseColors";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type TimeBlock = { start: string; end: string; days: string[] };

function emptyBlock(start = "09:00", end = "10:00"): TimeBlock {
  return { start, end, days: [] };
}

export function UploadSyllabus({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { t } = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [needsTermDates, setNeedsTermDates] = useState<{
    courseId: string;
    courseName: string;
    suggestedTermStart?: string;
    suggestedTermEnd?: string;
    /** After saving term dates, show class time with these suggestions */
    suggestedDays?: string[];
    suggestedStart?: string;
    suggestedEnd?: string;
  } | null>(null);
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [savingTermDates, setSavingTermDates] = useState(false);
  const [needsClassTime, setNeedsClassTime] = useState<{
    courseId: string;
    courseName: string;
    suggestedDays?: string[];
    suggestedStart?: string;
    suggestedEnd?: string;
  } | null>(null);
  const [blocks, setBlocks] = useState<TimeBlock[]>([emptyBlock()]);
  const [savingClassTime, setSavingClassTime] = useState(false);
  const [courseColorSaving, setCourseColorSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCourseId = needsTermDates?.courseId ?? needsClassTime?.courseId ?? null;

  async function handleCourseColorChange(courseId: string, color: string) {
    setCourseColorSaving(true);
    try {
      await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
    } finally {
      setCourseColorSaving(false);
    }
  }

  function updateBlock(i: number, upd: Partial<TimeBlock>) {
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
    setBlocks((b) => [...b, emptyBlock()]);
  }
  function removeBlock(i: number) {
    setBlocks((b) => (b.length <= 1 ? b : b.filter((_, j) => j !== i)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    setParsed(null);
    setNeedsTermDates(null);
    setNeedsClassTime(null);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch("/api/parse-syllabus", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "QUOTA_EXCEEDED") {
          setError(t.noUploadsLeftPurchase);
        } else {
          const msg = data.error || "Upload failed";
          setError(data.details ? `${msg}\n${data.details}` : msg);
        }
        setLoading(false);
        return;
      }
      setParsed(data.parsed);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      if (data.courseId) {
        const name = data.parsed?.courseName || data.parsed?.courseCode || "This course";
        const start = data.suggestedStart ? String(data.suggestedStart).slice(0, 5) : "09:00";
        const end = data.suggestedEnd ? String(data.suggestedEnd).slice(0, 5) : "10:00";
        if (data.needsTermDates) {
          setNeedsTermDates({
            courseId: data.courseId,
            courseName: String(name),
            suggestedTermStart: data.suggestedTermStart ? String(data.suggestedTermStart).slice(0, 10) : undefined,
            suggestedTermEnd: data.suggestedTermEnd ? String(data.suggestedTermEnd).slice(0, 10) : undefined,
            suggestedDays: Array.isArray(data.suggestedDays) ? data.suggestedDays : undefined,
            suggestedStart: start,
            suggestedEnd: end,
          });
          setTermStart(data.suggestedTermStart ? String(data.suggestedTermStart).slice(0, 10) : "");
          setTermEnd(data.suggestedTermEnd ? String(data.suggestedTermEnd).slice(0, 10) : "");
        } else {
          setNeedsClassTime({
            courseId: data.courseId,
            courseName: String(name),
            suggestedDays: Array.isArray(data.suggestedDays) ? data.suggestedDays : undefined,
            suggestedStart: start,
            suggestedEnd: end,
          });
          setBlocks([{ start, end, days: Array.isArray(data.suggestedDays) ? data.suggestedDays : [] }]);
        }
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function handleSaveTermDates() {
    if (!needsTermDates || !termStart.trim() || !termEnd.trim()) return;
    setSavingTermDates(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${needsTermDates.courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term_start_date: termStart.trim(), term_end_date: termEnd.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save term dates");
        setSavingTermDates(false);
        return;
      }
      const { courseId, courseName, suggestedDays, suggestedStart, suggestedEnd } = needsTermDates;
      setNeedsTermDates(null);
      setTermStart("");
      setTermEnd("");
      setNeedsClassTime({
        courseId,
        courseName,
        suggestedDays,
        suggestedStart: suggestedStart ?? "09:00",
        suggestedEnd: suggestedEnd ?? "10:00",
      });
      setBlocks([{ start: suggestedStart ?? "09:00", end: suggestedEnd ?? "10:00", days: suggestedDays ?? [] }]);
    } catch {
      setError("Network error");
    }
    setSavingTermDates(false);
  }

  async function handleSaveClassTime() {
    const valid = blocks.filter((b) => b.start && b.end && b.days.length > 0);
    if (!needsClassTime || valid.length === 0) return;
    setSavingClassTime(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${needsClassTime.courseId}/class-time`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classSchedule: valid.map((b) => ({ start: b.start, end: b.end, days: b.days })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to save class time");
        setSavingClassTime(false);
        return;
      }
      setNeedsClassTime(null);
      setBlocks([emptyBlock()]);
      onSuccess();
    } catch {
      setError("Network error");
    }
    setSavingClassTime(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className="min-h-[140px] cursor-pointer rounded-2xl border border-dashed border-[var(--accent)]/40 bg-[var(--accent-light)]/50 p-8 text-center transition hover:border-[var(--accent-hover)] hover:bg-[var(--accent-light)]"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          aria-label="Choose syllabus file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        <div className="mb-2 text-4xl">📄</div>
        {file ? (
          <p className="text-base font-bold text-[var(--text)]">{file.name}</p>
        ) : (
          <p className="text-base font-semibold text-[var(--muted)]">{t.dragDrop}</p>
        )}
      </div>
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700 whitespace-pre-wrap">{error}</div>
      )}
      <button
        type="submit"
        disabled={!file || loading}
        className="mt-5 rounded-xl bg-[var(--accent)] px-8 py-3.5 text-base font-bold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? t.parsing : t.upload}
      </button>
      {parsed && !needsTermDates && !needsClassTime && (
        <div className="mt-5 rounded-xl bg-[var(--green-light)] shadow-soft p-4 text-sm font-semibold text-[var(--text)]">
          <p>Course saved.</p>
          {parsed.classTime || parsed.classSchedule ? (
            <p>Class time added to calendar.</p>
          ) : (
            <p>Add class time in the section below to show recurring classes.</p>
          )}
        </div>
      )}

      {needsTermDates && (
        <div className="mt-5 rounded-xl bg-[var(--orange-light)] shadow-soft p-5">
          <p className="text-sm font-bold text-[var(--text)]">
            {t.setTermDates ?? "Set term dates"} — {needsTermDates.courseName}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t.setTermDatesPrompt ?? "We couldn't find the first/last day of class in the syllabus. Enter them so your calendar only shows classes within the term."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
              <span>{t.firstDayOfTerm ?? "First day of term"}</span>
              <input
                type="date"
                value={termStart}
                onChange={(e) => setTermStart(e.target.value)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text)]">
              <span>{t.lastDayOfTerm ?? "Last day of term"}</span>
              <input
                type="date"
                value={termEnd}
                onChange={(e) => setTermEnd(e.target.value)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleSaveTermDates}
              disabled={savingTermDates || !termStart.trim() || !termEnd.trim()}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {savingTermDates ? "..." : t.save}
            </button>
          </div>
          {activeCourseId && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{t.courseColor ?? "Course colour"}:</span>
              <div className="flex gap-1">
                {COURSE_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    disabled={courseColorSaving}
                    onClick={() => handleCourseColorChange(activeCourseId, hex)}
                    className="h-6 w-6 rounded-full border-2 border-transparent hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: hex }}
                    title={hex}
                    aria-label={t.courseColor ?? "Course colour"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {needsClassTime && (
        <div className="mt-5 rounded-xl bg-[var(--orange-light)] shadow-soft p-5">
          <p className="text-sm font-bold text-[var(--text)]">
            {t.enterClassTime} — {needsClassTime.courseName}
          </p>
          <p className="mt-1 text-xs font-semibold text-[var(--green)]">Course saved. Add when it meets below.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.needsClassTimePrompt}</p>
          {needsClassTime.suggestedDays?.length ? (
            <p className="mt-1 text-xs text-[var(--muted)]">{t.suggestedDaysFromDates}</p>
          ) : null}
          <div className="mt-4 space-y-4">
            {blocks.map((block, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/80 p-3"
              >
                <input
                  type="time"
                  value={block.start}
                  onChange={(e) => updateBlock(i, { start: e.target.value })}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
                <span className="text-[var(--muted)]">–</span>
                <input
                  type="time"
                  value={block.end}
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
                {blocks.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeBlock(i)}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    {t.removeBlock}
                  </button>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={addBlock}
                className="rounded-xl border border-dashed border-[var(--accent)] bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-light)]"
              >
                + {t.addAnotherTime}
              </button>
              <button
                type="button"
                onClick={handleSaveClassTime}
                disabled={savingClassTime || !blocks.some((b) => b.days.length > 0)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {t.save}
              </button>
            </div>
          </div>
          {activeCourseId && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{t.courseColor ?? "Course colour"}:</span>
              <div className="flex gap-1">
                {COURSE_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    disabled={courseColorSaving}
                    onClick={() => handleCourseColorChange(activeCourseId, hex)}
                    className="h-6 w-6 rounded-full border-2 border-transparent hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: hex }}
                    title={hex}
                    aria-label={t.courseColor ?? "Course colour"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
