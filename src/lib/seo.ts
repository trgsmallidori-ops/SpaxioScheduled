export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://spaxioscheduled.com";

export const defaultMeta = {
  title: "SpaxioScheduled — AI School Calendar & Course Outline Calendar",
  description:
    "Turn your syllabi into one smart school calendar. AI-powered course outline calendar for students: upload syllabi, get assignments, tests, and class times in one place. Free syllabus planner with reminders.",
  keywords: [
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
        description: defaultMeta.description,
        url: SITE_URL,
        applicationCategory: "EducationalApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: [
          "AI syllabus parsing",
          "Course outline to calendar",
          "School calendar with assignments and exams",
          "Class schedule and reminders",
        ],
      },
      {
        "@type": "Organization",
        name: "SpaxioScheduled",
        url: SITE_URL,
        description: "AI-powered school calendar and course outline calendar for students.",
      },
      {
        "@type": "WebSite",
        name: "SpaxioScheduled",
        url: SITE_URL,
        description: defaultMeta.description,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/dashboard` },
          "query-input": "required name=term",
        },
      },
    ],
  };
}
