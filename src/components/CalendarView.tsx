"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addYears,
  subYears,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  getMonth,
} from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";
import { ConfirmModal } from "@/components/ConfirmModal";
import { DEFAULT_COURSE_COLOR } from "@/lib/courseColors";
import type { CalendarEvent } from "@/types/database";
import { formatDisplayDate } from "@/lib/formatDate";

export type CalendarViewMode = "day" | "week" | "month" | "year";

const EVENT_TYPE_LABELS: Record<string, string> = {
  class: "Class",
  assignment: "Assignment",
  test: "Test",
  exam: "Exam",
  other: "Other",
};

const EVENT_TYPES = ["class", "assignment", "test", "exam", "other"] as const;

export function CalendarView({
  events,
  courseNames = {},
  courseColors = {},
  onUpdate,
  onDeleteEvent,
  onAddEvent,
  onUpdateEvent,
}: {
  events: CalendarEvent[];
  courseNames?: Record<string, string>;
  courseColors?: Record<string, string>;
  onUpdate: () => void;
  onDeleteEvent?: (eventId: string) => void | Promise<void>;
  onAddEvent?: (payload: { title: string; event_date: string; event_time: string | null }) => void | Promise<void>;
  onUpdateEvent?: (
    eventId: string,
    payload: { title: string; event_date: string; event_time: string | null; event_type: (typeof EVENT_TYPES)[number] }
  ) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const [current, setCurrent] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addEventDay, setAddEventDay] = useState<string | null>(null);
  const [addEventTitle, setAddEventTitle] = useState("");
  const [addEventTime, setAddEventTime] = useState("");
  const [addEventSaving, setAddEventSaving] = useState(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<string | null>(null);
  const [editEventSaving, setEditEventSaving] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    event_date: string;
    event_time: string;
    event_type: (typeof EVENT_TYPES)[number];
  }>({ title: "", event_date: "", event_time: "", event_type: "other" });

  useEffect(() => {
    if (selectedEvent) {
      setEditForm({
        title: selectedEvent.title,
        event_date: selectedEvent.event_date,
        event_time: selectedEvent.event_time ? selectedEvent.event_time.slice(0, 5) : "",
        event_type: EVENT_TYPES.includes(selectedEvent.event_type as (typeof EVENT_TYPES)[number])
          ? (selectedEvent.event_type as (typeof EVENT_TYPES)[number])
          : "other",
      });
    }
  }, [selectedEvent]);

  const getEventsForDay = (day: Date | string) => {
    const key = typeof day === "string" ? day : format(day, "yyyy-MM-dd");
    return events.filter((e) => e.event_date === key);
  };

  const goPrev = () => {
    if (viewMode === "day") setCurrent((d) => subDays(d, 1));
    else if (viewMode === "week") setCurrent((d) => subWeeks(d, 1));
    else if (viewMode === "month") setCurrent((d) => subMonths(d, 1));
    else setCurrent((d) => subYears(d, 1));
  };

  const goNext = () => {
    if (viewMode === "day") setCurrent((d) => addDays(d, 1));
    else if (viewMode === "week") setCurrent((d) => addWeeks(d, 1));
    else if (viewMode === "month") setCurrent((d) => addMonths(d, 1));
    else setCurrent((d) => addYears(d, 1));
  };

  const goToday = () => setCurrent(new Date());

  const title =
    viewMode === "day"
      ? format(current, "EEEE, MMMM do yyyy")
      : viewMode === "week"
        ? `${format(startOfWeek(current, { weekStartsOn: 1 }), "MMM d")} – ${format(endOfWeek(current, { weekStartsOn: 1 }), "MMM d, yyyy")}`
        : viewMode === "month"
          ? format(current, "MMMM yyyy")
          : format(current, "yyyy");

  function openDeleteConfirm() {
    if (selectedEvent && onDeleteEvent) setShowDeleteConfirm(true);
  }

  async function confirmDeleteEvent() {
    if (!selectedEvent || !onDeleteEvent) return;
    setDeleting(true);
    try {
      await onDeleteEvent(selectedEvent.id);
      setSelectedEvent(null);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  function openAddForDay(day: Date) {
    if (!onAddEvent) return;
    setAddEventDay(format(day, "yyyy-MM-dd"));
    setAddEventTitle("");
    setAddEventTime("");
  }

  async function submitAddEvent() {
    if (!addEventDay || !onAddEvent || !addEventTitle.trim()) return;
    setAddEventSaving(true);
    try {
      await onAddEvent({
        title: addEventTitle.trim(),
        event_date: addEventDay,
        event_time: addEventTime.trim() || null,
      });
      onUpdate();
      setAddEventDay(null);
    } finally {
      setAddEventSaving(false);
    }
  }

  async function submitEditEvent() {
    if (!selectedEvent || !onUpdateEvent || !editForm.title.trim()) return;
    setEditEventSaving(true);
    try {
      await onUpdateEvent(selectedEvent.id, {
        title: editForm.title.trim(),
        event_date: editForm.event_date,
        event_time: editForm.event_time.trim() || null,
        event_type: editForm.event_type,
      });
      onUpdate();
      setSelectedEvent(null);
    } finally {
      setEditEventSaving(false);
    }
  }

  const viewButtons: { mode: CalendarViewMode; label: string }[] = [
    { mode: "day", label: t.viewDay },
    { mode: "week", label: t.viewWeek },
    { mode: "month", label: t.viewMonth },
    { mode: "year", label: t.viewYear },
  ];

  const dayLabels = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];

  function eventLabel(e: CalendarEvent) {
    const courseName = e.course_id ? courseNames[e.course_id] : null;
    if (e.event_type === "class" && courseName) return `${e.title} — ${courseName}`;
    if (courseName) return `${e.title} (${courseName})`;
    return e.title;
  }

  function EventChip({ e }: { e: CalendarEvent }) {
    const label = eventLabel(e);
    const courseName = e.course_id ? courseNames[e.course_id] : null;
    const fullTitle = courseName ? `${e.title} — ${courseName}` : e.title;
    const color = e.course_id ? (courseColors[e.course_id] ?? DEFAULT_COURSE_COLOR) : DEFAULT_COURSE_COLOR;
    return (
      <button
        type="button"
        className="w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-tight text-[var(--text)] hover:opacity-90 border-l-2"
        style={{ borderLeftColor: color, backgroundColor: `${color}18` }}
        title={`${formatDisplayDate(e.event_date)}${e.event_time ? " " + e.event_time : ""} — ${fullTitle} (click to delete)`}
        onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
      >
        {e.event_time ? `${e.event_time} ` : ""}
        {label}
      </button>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-xl bg-[var(--border-subtle)] px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-xl bg-[var(--border-subtle)] px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)]"
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-xl bg-[var(--border-subtle)] px-3 py-2 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)]"
          >
            →
          </button>
        </div>
        <h3 className="min-w-0 flex-1 text-center text-lg font-bold text-[var(--text)]">
          {title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {viewButtons.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-xl px-3 py-2 text-sm font-bold ${
                viewMode === mode
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Day view */}
      {viewMode === "day" && (() => {
        const dayEvents = getEventsForDay(current);
        dayEvents.sort((a, b) => (a.event_time || "").localeCompare(b.event_time || ""));
        return (
          <div className="rounded-xl bg-[var(--surface)] p-4 shadow-calendar-cell">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--muted)]">
                {formatDisplayDate(format(current, "yyyy-MM-dd"))}
              </p>
              {onAddEvent && (
                <button
                  type="button"
                  onClick={() => openAddForDay(current)}
                  className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white hover:bg-[var(--accent-hover)]"
                >
                  + {t.addEvent}
                </button>
              )}
            </div>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{t.noEvents}</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id}>
                    <EventChip e={e} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

      {/* Week view */}
      {viewMode === "week" && (() => {
        const weekStart = startOfWeek(current, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        return (
          <div className="grid grid-cols-7 gap-2 text-sm">
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`flex min-h-[140px] flex-col rounded-xl bg-[var(--surface)] p-2 shadow-calendar-cell ${
                    isToday ? "ring-1 ring-[var(--accent)] bg-[var(--accent-light)]" : ""
                  }`}
                >
                  <div className="flex shrink-0 items-center justify-between gap-1">
                    <p className={`font-bold ${isToday ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                      {format(day, "d")} {dayLabels[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                    </p>
                    {onAddEvent && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openAddForDay(day); }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                        title={t.addEvent}
                        aria-label={t.addEvent}
                      >
                        <span className="text-lg leading-none">+</span>
                      </button>
                    )}
                  </div>
                  <div className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto max-h-[200px]">
                    {dayEvents.length === 0 ? (
                      <span className="text-[10px] text-[var(--muted)]">{t.noEvents}</span>
                    ) : (
                      dayEvents.map((e) => <EventChip key={e.id} e={e} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Month view */}
      {viewMode === "month" && (() => {
        const monthStart = startOfMonth(current);
        const monthEnd = endOfMonth(current);
        const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days: Date[] = [];
        let d = calStart;
        while (d <= calEnd) {
          days.push(d);
          d = addDays(d, 1);
        }
        return (
          <div className="grid grid-cols-7 gap-1 text-sm">
            {dayLabels.map((label) => (
              <div key={label} className="py-2 text-center font-bold text-[var(--muted)]">
                {label}
              </div>
            ))}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, current);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`flex min-h-[130px] flex-col rounded-xl bg-[var(--surface)] p-2 shadow-calendar-cell ${
                    !isCurrentMonth ? "opacity-60" : ""
                  } ${isToday ? "ring-1 ring-[var(--accent)] bg-[var(--accent-light)]" : ""}`}
                >
                  <div className="flex shrink-0 items-center justify-between gap-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDayForDetail(dayKey)}
                      className={`min-w-0 flex-1 rounded px-1 text-left font-semibold hover:bg-[var(--border-subtle)] ${
                        isToday ? "font-bold text-[var(--accent)]" : "text-[var(--text)]"
                      }`}
                      title={t.viewDay}
                    >
                      {format(day, "d")}
                    </button>
                    {onAddEvent && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openAddForDay(day); }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
                        title={t.addEvent}
                        aria-label={t.addEvent}
                      >
                        <span className="text-sm leading-none">+</span>
                      </button>
                    )}
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDayForDetail(dayKey)}
                    onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelectedDayForDetail(dayKey); } }}
                    className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto max-h-[280px] cursor-pointer text-left"
                  >
                    {dayEvents.length === 0 ? (
                      <span className="text-[10px] text-[var(--muted)]">{t.noEvents}</span>
                    ) : (
                      dayEvents.map((e) => <EventChip key={e.id} e={e} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Year view */}
      {viewMode === "year" && (() => {
        const year = current.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {months.map((month) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
              const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
              const days: Date[] = [];
              let d = calStart;
              while (d <= calEnd) {
                days.push(d);
                d = addDays(d, 1);
              }
              const isCurrentMonth = getMonth(current) === getMonth(month);
              return (
                <div
                  key={month.toISOString()}
                  className={`rounded-xl bg-[var(--surface)] p-3 shadow-calendar-cell ${
                    isCurrentMonth ? "ring-1 ring-[var(--accent)]" : ""
                  }`}
                >
                  <p className="mb-2 text-center text-sm font-bold text-[var(--text)]">
                    {format(month, "MMMM")}
                  </p>
                  <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                    {dayLabels.map((l) => (
                      <div key={l} className="text-center font-semibold text-[var(--muted)]">
                        {l.slice(0, 1)}
                      </div>
                    ))}
                    {days.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const isThisMonth = isSameMonth(day, month);
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={`rounded py-0.5 text-center ${
                            !isThisMonth ? "invisible" : isToday ? "font-bold text-[var(--accent)]" : "text-[var(--text)]"
                          }`}
                          title={
                            dayEvents.length > 0
                              ? `${format(day, "d")}: ${dayEvents.map((e) => e.title).join(", ")}`
                              : undefined
                          }
                        >
                          {format(day, "d")}
                          {dayEvents.length > 0 && (
                            <span className="ml-0.5 text-[var(--accent)]">•</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Day detail modal (month view: click a day to see everything without spill-over) */}
      {selectedDayForDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedDayForDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-detail-title"
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-[var(--surface)] p-6 shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="day-detail-title" className="text-lg font-bold text-[var(--text)]">
              {formatDisplayDate(selectedDayForDetail)}
            </h3>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
              {getEventsForDay(selectedDayForDetail).length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t.noEvents}</p>
              ) : (
                getEventsForDay(selectedDayForDetail)
                  .sort((a, b) => (a.event_time || "").localeCompare(b.event_time || ""))
                  .map((e) => <EventChip key={e.id} e={e} />)
              )}
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedDayForDetail(null)}
                className="flex-1 rounded-xl bg-[var(--border-subtle)] py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)]"
              >
                {t.cancel}
              </button>
              {onAddEvent && (
                <button
                  type="button"
                  onClick={() => {
                    openAddForDay(new Date(selectedDayForDetail + "T12:00:00"));
                    setSelectedDayForDetail(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-2.5 text-sm font-bold text-white hover:bg-green-600"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-lg leading-none">+</span>
                  {t.addEvent}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !deleting && !editEventSaving && setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-dialog-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--surface)] p-6 shadow-soft-lg border border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="event-dialog-title" className="text-lg font-bold text-[var(--text)]">
              {t.edit} {EVENT_TYPE_LABELS[selectedEvent.event_type] ?? selectedEvent.event_type}
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)]">{t.addEventTitle}</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t.addEventTitlePlaceholder}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)]">{t.date}</label>
                <input
                  type="date"
                  value={editForm.event_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)]">{t.addEventTimeOptional}</label>
                <input
                  type="time"
                  value={editForm.event_time}
                  onChange={(e) => setEditForm((f) => ({ ...f, event_time: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)]">{t.eventType ?? "Type"}</label>
                <select
                  value={editForm.event_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, event_type: e.target.value as (typeof EVENT_TYPES)[number] }))}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)]"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                disabled={deleting || editEventSaving}
                className="flex-1 min-w-0 rounded-xl bg-[var(--border-subtle)] py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-50"
              >
                {t.cancel}
              </button>
              {onUpdateEvent && (
                <button
                  type="button"
                  onClick={submitEditEvent}
                  disabled={editEventSaving || !editForm.title.trim()}
                  className="flex-1 min-w-0 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {editEventSaving ? "..." : t.save}
                </button>
              )}
              {onDeleteEvent && (
                <button
                  type="button"
                  onClick={openDeleteConfirm}
                  disabled={deleting || editEventSaving}
                  className="flex-1 min-w-0 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? "..." : t.delete}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteConfirm && selectedEvent !== null}
        title={t.delete}
        message={t.deleteEventConfirm ?? "Are you sure you want to delete this event? This cannot be undone."}
        confirmLabel={t.delete}
        cancelLabel={t.cancel}
        variant="danger"
        loading={deleting}
        onConfirm={confirmDeleteEvent}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
      />

      {/* Add event modal */}
      {addEventDay !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !addEventSaving && setAddEventDay(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-event-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[var(--surface)] p-6 shadow-soft-lg border border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="add-event-title" className="text-lg font-bold text-[var(--text)]">
              {t.addEvent}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {formatDisplayDate(addEventDay)}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-bold text-[var(--text)]">
                  {t.addEventTitle}
                </label>
                <input
                  type="text"
                  value={addEventTitle}
                  onChange={(e) => setAddEventTitle(e.target.value)}
                  placeholder={t.addEventTitlePlaceholder}
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text)]">
                  {t.addEventTimeOptional}
                </label>
                <input
                  type="text"
                  value={addEventTime}
                  onChange={(e) => setAddEventTime(e.target.value)}
                  placeholder="e.g. 2:00 PM"
                  className="mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text)]"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => !addEventSaving && setAddEventDay(null)}
                disabled={addEventSaving}
                className="flex-1 rounded-xl bg-[var(--border-subtle)] py-2.5 text-sm font-bold text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={submitAddEvent}
                disabled={addEventSaving || !addEventTitle.trim()}
                className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {addEventSaving ? "..." : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
