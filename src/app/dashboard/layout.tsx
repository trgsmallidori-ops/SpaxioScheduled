import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Dashboard",
    description: "Your SpaxioScheduled calendar — view assignments, tests, and class times. Upload syllabi and manage your school schedule.",
    path: "/dashboard",
    noIndex: true,
  }),
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
