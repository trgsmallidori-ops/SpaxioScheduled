import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { format, parseISO } from "date-fns";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `You are a helpful assistant for SpaxioScheduled, a student app where users upload course syllabi and see a unified calendar with assignments, tests, and class times.

You MUST only answer questions about:
- The user's courses and class schedule
- Upcoming assignments, tests, exams
- What they have on a specific day
- Dates and deadlines from their calendar

If the user asks about anything else (general knowledge, other topics, or things not in their data), politely say: "I can only help with your SpaxioScheduled calendar and courses. Ask me what you have today, when your next test is, or similar."

Answer in the same language the user writes in (English or French). Be concise and use the provided context.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = (await request.json()) as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code, class_time_start, class_time_end, class_days")
    .eq("user_id", user.id);

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, event_date, event_time, course_id")
    .eq("user_id", user.id)
    .gte("event_date", new Date().toISOString().slice(0, 10))
    .order("event_date", { ascending: true })
    .limit(100);

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
User's courses:
${coursesText || "No courses."}

Upcoming events (from today):
${eventsText || "No upcoming events."}
`;

  if (!openai) {
    return NextResponse.json(
      { reply: "AI is not configured. Here is your context:\n" + context },
      { status: 200 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT + "\n\nContext:\n" + context },
      { role: "user", content: message },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response.";
  return NextResponse.json({ reply });
}
