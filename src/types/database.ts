export type ClassScheduleBlock = {
  days: string[];
  start: string;
  end: string;
};

export type Course = {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  class_time_start: string | null;
  class_time_end: string | null;
  class_days: string[] | null;
  class_schedule: ClassScheduleBlock[] | null;
  raw_schedule: Record<string, unknown> | null;
  assignment_weights: Record<string, number> | null;
  file_path: string | null;
  term_start_date: string | null;
  term_end_date: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  event_type: "class" | "assignment" | "test" | "exam" | "other";
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  weight_percent: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type UserQuota = {
  user_id: string;
  free_uploads_used: number;
  paid_uploads_used: number;
  paid_uploads_purchased: number;
  stripe_customer_id: string | null;
  subscription_status?: "active" | "canceled" | "past_due" | "incomplete" | null;
  subscription_id?: string | null;
  subscription_current_period_start?: string | null;
  subscription_current_period_end?: string | null;
  subscription_uploads_quota?: number;
  subscription_uploads_used?: number;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
};

export type ParsedSyllabus = {
  courseName: string;
  courseCode?: string;
  assignmentWeights: Record<string, number>;
  tentativeSchedule: { date: string; title: string; type?: string }[];
  classTime?: { start: string; end: string; days: string[] };
  classSchedule?: { days: string[]; start: string; end: string }[];
  termStartDate?: string | null;
  termEndDate?: string | null;
};
