import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a free SpaxioScheduled account — AI school calendar, syllabus planner, and course outline calendar for students.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
