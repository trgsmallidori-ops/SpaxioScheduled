/** Preset hex colors for course calendar display. Default is first. */
export const COURSE_COLOR_PRESETS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow/amber
  "#ef4444", // red
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
] as const;

export const DEFAULT_COURSE_COLOR = COURSE_COLOR_PRESETS[0];

export function isValidCourseColor(value: unknown): value is string {
  if (typeof value !== "string" || value.length !== 7) return false;
  return /^#[0-9a-fA-F]{6}$/.test(value);
}
