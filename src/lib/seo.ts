export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spaxioscheduled.com";

/** Full URL for OG/Twitter image (crawlers need absolute URLs). */
export const ogImageUrl = `${SITE_URL}/logo.png`;

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
        name: "SpaxioScheduled",
        alternateName: "Spaxio Scheduled",
        description: defaultMeta.description,
        url: SITE_URL,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "AI syllabus parsing",
          "Course outline to calendar",
          "School calendar with assignments and exams",
          "Export to Google Calendar, Apple Calendar, Outlook",
          "PDF and Word syllabus upload",
        ],
      },
      {
        "@type": "Organization",
        name: "SpaxioScheduled",
        alternateName: "Spaxio Scheduled",
        url: SITE_URL,
        description: "AI-powered school calendar and course outline calendar for students.",
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
          { "@type": "ListItem", position: 2, name: "Log in", item: `${SITE_URL}/login` },
          { "@type": "ListItem", position: 3, name: "Sign up", item: `${SITE_URL}/signup` },
          { "@type": "ListItem", position: 4, name: "Privacy", item: `${SITE_URL}/privacy` },
          { "@type": "ListItem", position: 5, name: "Terms", item: `${SITE_URL}/terms` },
          { "@type": "ListItem", position: 6, name: "Cookies", item: `${SITE_URL}/cookies` },
          { "@type": "ListItem", position: 7, name: "Contact / Refunds", item: `${SITE_URL}/contact` },
        ],
      },
    ],
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
