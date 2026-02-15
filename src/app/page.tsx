import type { Metadata } from "next";
import { defaultMeta, pageMeta, buildFaqSchema } from "@/lib/seo";
import { HOMEPAGE_FAQS } from "@/lib/faq";
import { HomePageContent } from "@/components/HomePageContent";

export const metadata: Metadata = {
  ...pageMeta({
    title: "Spaxio Scheduled — AI School Calendar & Course Outline Calendar",
    description: defaultMeta.description,
    path: "/",
  }),
};

export default function HomePage() {
  const faqSchema = buildFaqSchema(HOMEPAGE_FAQS);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomePageContent />
    </>
  );
}
