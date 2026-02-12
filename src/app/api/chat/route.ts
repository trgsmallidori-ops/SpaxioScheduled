import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a helpful assistant for SpaxioScheduled, a student app where users upload course syllabi and see a unified calendar. The calendar includes:
- Assignments (due dates, projects, homework, presentations, lab reports)
- Tests and exams (quizzes, pop quizzes, practice tests, midterms, finals)
- Other events (in-class topics, "what we're doing that day", guest speakers, review sessions, workshops, discussions)

You MUST only answer questions about:
- The user's courses and class schedule
- Upcoming or past assignments, tests, exams, quizzes, and other calendar events
- What they have (or had) on a specific day
- Dates and deadlines from their calendar
- In-class topics or activities (events with type "other")

IMPORTANT: Use the "Calendar events" list in the context to answer. It includes the last 7 days and all upcoming events. Event types: assignment, test, exam, other.
- "When is my next assignment?" or "next assignment" → First event with type "assignment". If none, say they have no upcoming assignments.
- "When is my next test/exam/quiz?" → First event with type "test" or "exam" (includes quizzes, pop quizzes, practice tests, midterms, finals).
- "What do I have today?" or "what's today?" → List ALL events whose date equals today's date (assignments, tests, exams, and "other" like in-class topics).
- "What's due soon?" or "what's coming up?" → List the first few upcoming events in order (any type).
- "What are we covering in class?" / "What's the topic this week?" / "Any guest speakers?" → Look at events with type "other" (in-class topics, activities) and give dates and titles.
- "What do I have this week?" → List events from today through the end of the week, any type.
- "What did I have yesterday?" / "What was due last week?" → Use events with dates before today from the list (recent past is included).

If the user asks about anything else (general knowledge, or things not in their calendar data), politely say you can only help with their SpaxioScheduled calendar and courses, and suggest asking about today, next test, or upcoming events.

Answer in the same language the user writes in (English or French). Be concise and use the provided context.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  const MAX_MESSAGE_LENGTH = 4000;
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code, class_time_start, class_time_end, class_days")
    .eq("user_id", user.id);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const fromDate = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, event_date, event_time, course_id")
    .eq("user_id", user.id)
    .gte("event_date", fromDate)
    .order("event_date", { ascending: true })
    .limit(120);

  const courseNames: Record<string, string> = {};
  (courses || []).forEach((c) => {
    courseNames[c.id] = c.name || c.code || "Course";
  });

  const eventsText = (events || [])
    .map((e) => {
      const d = e.event_date;
      const t = e.event_time ? ` at ${e.event_time}` : "";
      const course = e.course_id ? courseNames[e.course_id] : "";
      return `- ${d}${t}: ${e.title} (${e.event_type})${course ? ` [${course}]` : ""}`;
    })
    .join("\n");

  const coursesText = (courses || [])
    .map(
      (c) =>
        `- ${c.name}${c.code ? ` (${c.code})` : ""}: ${c.class_days?.join(", ") || "no days"} ${c.class_time_start || ""}-${c.class_time_end || ""}`
    )
    .join("\n");

  const context = `
Today's date: ${todayStr}

User's courses:
${coursesText || "No courses."}

Calendar events (last 7 days through upcoming, ordered by date). Types: assignment, test, exam, other (e.g. in-class topics, guest speakers):
${eventsText || "No events in this range."}
`;

  if (!openai) {
    return NextResponse.json(
      { reply: "AI is not configured. Here is your context:\n" + context },
      { status: 200 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT + "\n\nContext:\n" + context },
        { role: "user", content: message.slice(0, MAX_MESSAGE_LENGTH) },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/rate limit|quota|insufficient_quota|429/i.test(msg)) {
      return NextResponse.json(
        {
          error: "Our AI is under heavy load. Please try again in a few minutes.",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
    }
    console.error("[chat]", msg);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "Chat failed. Please try again." },
      { status: 500 }
    );
  }
}
