import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Log in",
    description: "Log in to SpaxioScheduled — your AI school calendar and course outline calendar.",
    path: "/login",
  }),
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
