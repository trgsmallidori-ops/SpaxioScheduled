export const HOMEPAGE_FAQS = [
  {
    question: "What is SpaxioScheduled?",
    answer:
      "SpaxioScheduled is an AI-powered school calendar and course outline calendar for students. You upload your PDF or Word syllabi, and our AI extracts assignments, tests, exams, and class times into one unified calendar. Export to Google Calendar, Apple Calendar, or Outlook.",
  },
  {
    question: "How does the AI syllabus parsing work?",
    answer:
      "Our AI reads your syllabus document and identifies key information: course name, assignment due dates, exam dates, class times, and weights. You can review and edit the extracted data before adding it to your calendar. We support both PDF and Word (.docx) formats.",
  },
  {
    question: "Is SpaxioScheduled free?",
    answer:
      "Yes. You get 2 free syllabus uploads when you sign up. After that, you can subscribe for $20 per year to get 50 uploads per year. The subscription renews annually and you can cancel anytime.",
  },
  {
    question: "Can I export to Google Calendar or Apple Calendar?",
    answer:
      "Yes. SpaxioScheduled exports your calendar as an .ics file, which is compatible with Google Calendar, Apple Calendar, Outlook, and most other calendar apps. You can import it with one click.",
  },
  {
    question: "What file formats are supported for syllabi?",
    answer:
      "We support PDF and Microsoft Word (.docx) files. These are the most common formats professors use for syllabi. If your syllabus is in another format, try converting it to PDF first.",
  },
  {
    question: "Does SpaxioScheduled work for college and university students?",
    answer:
      "Yes. SpaxioScheduled is designed for students at any level—college, university, or high school. If your course has a syllabus with dates, our AI can extract and organize it into a school calendar.",
  },
  {
    question: "Can I add or edit events manually?",
    answer:
      "Yes. After the AI parses your syllabus, you can add, edit, or delete any events. You can also add class times if they weren't found in the document. Full control stays with you.",
  },
  {
    question: "What is the AI chatbot for?",
    answer:
      "The AI chatbot answers questions about your schedule. Ask things like 'What do I have due today?' or 'When is my next test?' and get instant answers based on your calendar. It's like having a personal assistant for your coursework.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. We use Supabase for authentication and storage, and Stripe for payments. We do not sell your data. Your syllabi and calendar data are stored securely and only accessible to you. See our Privacy Policy for details.",
  },
  {
    question: "Can I use SpaxioScheduled in French?",
    answer:
      "Yes. SpaxioScheduled supports both English and French. You can switch the language in the app. Our AI can also parse syllabi in French.",
  },
] as const;
