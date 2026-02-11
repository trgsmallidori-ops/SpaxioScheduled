import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Contact & Refunds",
    description: "Request a refund or contact SpaxioScheduled. Refunds are only considered within 7 days of purchase.",
    path: "/contact",
  }),
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
