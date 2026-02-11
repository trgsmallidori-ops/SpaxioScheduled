import { format, parseISO } from "date-fns";

/**
 * Format a date string (YYYY-MM-DD or ISO) as "January 2nd 2026".
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = dateStr.includes("T") ? parseISO(dateStr) : new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return format(d, "MMMM do yyyy");
  } catch {
    return dateStr;
  }
}
