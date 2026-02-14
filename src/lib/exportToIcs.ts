import type { CalendarEvent } from "@/types/database";

/**
 * Parse event_time string (e.g. "14:00", "2:00 PM", "09:30") to { hours, minutes }.
 * Returns null if unparseable (treat as all-day).
 */
function parseEventTime(timeStr: string | null): { hours: number; minutes: number } | null {
  if (!timeStr || !timeStr.trim()) return null;
  const s = timeStr.trim();

  // 24h: "14:00" or "14:00:00"
  const m24 = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = parseInt(m24[2], 10);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { hours: h, minutes: min };
  }

  // 12h: "2:00 PM", "9:30 AM", "12:00 pm"
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const pm = m12[3].toLowerCase() === "pm";
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { hours: h, minutes: min };
  }

  return null;
}

/**
 * Escape special chars for ICS text (SUMMARY, DESCRIPTION).
 */
function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * Format date for ICS: YYYYMMDD or YYYYMMDDTHHMMSS (floating, no timezone).
 */
function toIcsDate(dateStr: string, time: { hours: number; minutes: number } | null): string {
  const d = dateStr.replace(/-/g, "");
  if (!time) return d;
  const h = String(time.hours).padStart(2, "0");
  const m = String(time.minutes).padStart(2, "0");
  return `${d}T${h}${m}00`;
}

/**
 * Get default reminder trigger (VALARM) based on event type.
 * - Assignments: 1 day before
 * - Tests/Exams: 3 days before
 * - Classes: 15 minutes before
 * - Other: 1 day before
 */
function getAlarmTrigger(eventType: CalendarEvent["event_type"]): string {
  switch (eventType) {
    case "assignment":
    case "other":
      return "-P1D"; // 1 day before
    case "test":
    case "exam":
      return "-P3D"; // 3 days before
    case "class":
      return "-PT15M"; // 15 minutes before
    default:
      return "-P1D";
  }
}

/**
 * Generate iCalendar (.ics) content from calendar events.
 * Compatible with Google Calendar and Apple Calendar.
 * Includes default reminders (VALARM) based on event type.
 */
export function eventsToIcs(events: CalendarEvent[], courseNames: Record<string, string> = {}): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SpaxioScheduled//Calendar Export//EN",
    "X-WR-CALNAME:SpaxioScheduled",
    "X-WR-CALDESC:Course schedule from SpaxioScheduled",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const e of events) {
    const time = parseEventTime(e.event_time);
    const endTime = e.end_time ? parseEventTime(e.end_time) : null;
    const dtStart = toIcsDate(e.event_date, time);
    let dtEnd: string;
    if (time) {
      if (endTime) {
        dtEnd = toIcsDate(e.event_date, endTime);
      } else {
        const totalMins = time.hours * 60 + time.minutes + 60;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        dtEnd = toIcsDate(e.event_date, { hours: endH, minutes: endM });
      }
    } else {
      // All-day: DTEND is exclusive, use next day
      const nextDay = e.event_date.replace(/-/g, "");
      const y = parseInt(nextDay.slice(0, 4), 10);
      const m = parseInt(nextDay.slice(4, 6), 10) - 1;
      const d = parseInt(nextDay.slice(6, 8), 10) + 1;
      const next = new Date(y, m, d);
      const nextStr =
        next.getFullYear() +
        String(next.getMonth() + 1).padStart(2, "0") +
        String(next.getDate()).padStart(2, "0");
      dtEnd = nextStr;
    }

    const suffix = e.course_id && courseNames[e.course_id] ? ` — ${courseNames[e.course_id]}` : "";
    const summary = escapeIcsText(e.title + suffix);

    const now = new Date();
    const stamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "T" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@spaxioscheduled`);
    lines.push(`DTSTAMP:${stamp}`);
    if (time) {
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    }
    lines.push(`SUMMARY:${summary}`);
    if (e.notes) lines.push(`DESCRIPTION:${escapeIcsText(e.notes)}`);
    const trigger = getAlarmTrigger(e.event_type);
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:${trigger}`);
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeIcsText(e.title + suffix)}`);
    lines.push("END:VALARM");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger download of .ics file in the browser.
 */
export function downloadIcs(icsContent: string, filename = "spaxio-calendar.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download .ics and attempt to open with default calendar app.
 * On macOS/iOS this may open Calendar directly; on Windows it typically saves to Downloads.
 */
export function autoImportIcs(icsContent: string, filename = "spaxio-calendar.ics"): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
