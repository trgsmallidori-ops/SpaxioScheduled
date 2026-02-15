export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spaxioscheduled.com";

/** Full URL for OG/Twitter image (crawlers need absolute URLs). Use 1200x630 og-image for social sharing. */
export const ogImageUrl = `${SITE_URL}/og-image.png`;

export const defaultMeta = {
  title: "Spaxio Scheduled — AI School Calendar & Course Outline Calendar | SpaxioScheduled",
  description:
    "Spaxio Scheduled: turn your syllabi into one smart school calendar. AI-powered course outline calendar for students: upload syllabi, get assignments, tests, and class times in one place. Export to Google Calendar, Apple Calendar, or Outlook.",
  keywords: [
    "Spaxio Scheduled",
    "SpaxioScheduled",
    "course outline calendar",
    "school calendar",
    "AI school calendar",
    "syllabus calendar",
    "course calendar",
    "student calendar",
    "syllabus planner",
    "academic calendar",
    "class schedule planner",
    "assignment calendar",
    "exam calendar",
    "college calendar",
    "university calendar",
  ].join(", "),
};

export function buildJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: "SpaxioScheduled",
        alternateName: "Spaxio Scheduled",
        description: defaultMeta.description,
        url: SITE_URL,
        applicationCategory: "EducationalApplication",
        applicationSubCategory: "Syllabus Planner",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "2 free syllabus uploads",
          availability: "https://schema.org/InStock",
        },
        featureList: [
          "AI syllabus parsing",
          "Course outline to calendar",
          "School calendar with assignments and exams",
          "Export to Google Calendar, Apple Calendar, Outlook",
          "PDF and Word syllabus upload",
          "AI chatbot for schedule questions",
          "Multi-language support (English, French)",
        ],
        screenshot: `${SITE_URL}/og-image.png`,
      },
      {
        "@type": "Organization",
        name: "SpaxioScheduled",
        alternateName: "Spaxio Scheduled",
        url: SITE_URL,
        description: "AI-powered school calendar and course outline calendar for students.",
        logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        sameAs: [],
      },
      {
        "@type": "WebSite",
        name: "SpaxioScheduled",
        alternateName: "Spaxio Scheduled",
        url: SITE_URL,
        description: defaultMeta.description,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/dashboard` },
          "query-input": "required name=term",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: "About", item: `${SITE_URL}/about` },
          { "@type": "ListItem", position: 4, name: "Features", item: `${SITE_URL}/features` },
          { "@type": "ListItem", position: 5, name: "Pricing", item: `${SITE_URL}/pricing` },
          { "@type": "ListItem", position: 6, name: "FAQ", item: `${SITE_URL}/faq` },
          { "@type": "ListItem", position: 7, name: "Log in", item: `${SITE_URL}/login` },
          { "@type": "ListItem", position: 8, name: "Sign up", item: `${SITE_URL}/signup` },
          { "@type": "ListItem", position: 9, name: "Privacy", item: `${SITE_URL}/privacy` },
          { "@type": "ListItem", position: 10, name: "Terms", item: `${SITE_URL}/terms` },
          { "@type": "ListItem", position: 11, name: "Cookies", item: `${SITE_URL}/cookies` },
          { "@type": "ListItem", position: 12, name: "Contact / Refunds", item: `${SITE_URL}/contact` },
        ],
      },
    ],
  };
}

/** Build FAQ schema for Schema.org (used on homepage and FAQ page). */
export function buildFaqSchema(
  faqs: ReadonlyArray<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Build page-level metadata for consistent titles and Open Graph. */
export function pageMeta({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}) {
  const url = path ? `${SITE_URL}${path}` : SITE_URL;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "SpaxioScheduled",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "SpaxioScheduled" }],
    },
    twitter: { card: "summary_large_image" as const, title, description },
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}
