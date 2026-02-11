import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to SpaxioScheduled — your AI school calendar and course outline calendar.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
