import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Sign up",
    description: "Create a free SpaxioScheduled account — AI school calendar, syllabus planner, and course outline calendar for students.",
    path: "/signup",
  }),
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
