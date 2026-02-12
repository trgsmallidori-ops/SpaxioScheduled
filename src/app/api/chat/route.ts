import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { format, subDays } from "date-fns";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_TYPES = ["class", "assignment", "test", "exam", "other"] as const;

function toTime(s: string | null | undefined): string | null {
  if (s == null || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  const parts = t.split(":");
  const h = parts[0]?.padStart(2, "0") ?? "00";
  const m = parts[1]?.padStart(2, "0") ?? "00";
  const sec = parts[2] ? parts[2].padStart(2, "0") : "00";
  return `${h}:${m}:${sec}`;
}

const CALENDAR_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "update_calendar_event",
      description: "Update an existing calendar event (change title, date, time, or type). Use the event id from the context.",
      parameters: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "UUID of the event from the calendar list" },
          title: { type: "string", description: "New title" },
          event_date: { type: "string", description: "New date YYYY-MM-DD" },
          event_time: { type: "string", description: "New time e.g. 14:00" },
          event_type: { type: "string", enum: ["class", "assignment", "test", "exam", "other"] },
        },
      },
      required: ["event_id"],
    },
  },
  {
    type: "function",
    function: {
      name: "delete_calendar_event",
      description: "Delete a calendar event. Use the event id from the context.",
      parameters: {
        type: "object",
        properties: { event_id: { type: "string", description: "UUID of the event" } },
        required: ["event_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_calendar_event",
      description: "Create a new calendar event.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          event_date: { type: "string", description: "Date YYYY-MM-DD" },
          event_time: { type: "string", description: "Time e.g. 14:00" },
          event_type: { type: "string", enum: ["class", "assignment", "test", "exam", "other"] },
        },
      },
      required: ["title", "event_date"],
    },
  },
];

const SYSTEM_PROMPT = `You are a helpful assistant for SpaxioScheduled, a student app where users upload course syllabi and see a unified calendar. The calendar includes:
- Assignments (due dates, projects, homework, presentations, lab reports)
- Tests and exams (quizzes, pop quizzes, practice tests, midterms, finals)
- Other events (in-class topics, "what we're doing that day", guest speakers, review sessions, workshops, discussions)

You can ANSWER questions about the calendar AND perform QUICK CHANGES when the user asks (e.g. "move my math test to Friday", "change the title of the event on March 5 to Quiz 2", "delete the assignment due next Tuesday", "add a meeting on March 10 at 2pm").

Use the "Calendar events" list in the context. Each event line includes [id: <uuid>] so you can use that id when calling tools to update or delete. Event types: assignment, test, exam, other.
- Questions: "When is my next assignment?", "What do I have today?", "What's due soon?" → Answer from the list.
- Changes: "Move X to Friday", "Rename Y to Z", "Delete the event on ...", "Add a meeting on ..." → Use the appropriate tool (update_calendar_event, delete_calendar_event, create_calendar_event) with the event id or details, then confirm briefly.

For update_calendar_event use the event's id from the context. For dates use YYYY-MM-DD. For create_calendar_event you must provide title and event_date; event_type defaults to "other" if not specified.

If the user asks about anything unrelated to their calendar, politely say you can only help with their SpaxioScheduled calendar and quick edits.

Answer in the same language the user writes in (English or French). Be concise.`;

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
      return `- [id: ${e.id}] ${d}${t}: ${e.title} (${e.event_type})${course ? ` [${course}]` : ""}`;
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

  type Message =
    | OpenAI.Chat.Completions.ChatCompletionMessageParam
    | (OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam & { content: string | null; tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] });

  const systemContent = SYSTEM_PROMPT + "\n\nContext:\n" + context;
  const messages: Message[] = [
    { role: "system", content: systemContent },
    { role: "user", content: message.slice(0, MAX_MESSAGE_LENGTH) },
  ];

  async function runTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    if (name === "update_calendar_event") {
      const eventId = typeof args.event_id === "string" ? args.event_id.trim() : "";
      if (!UUID_REGEX.test(eventId)) return "Invalid event id.";
      const { data: event } = await supabase
        .from("calendar_events")
        .select("id")
        .eq("id", eventId)
        .eq("user_id", user.id)
        .single();
      if (!event) return "Event not found.";
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof args.title === "string" && args.title.trim()) updates.title = args.title.trim();
      if (typeof args.event_date === "string" && DATE_ONLY.test(args.event_date.trim())) updates.event_date = args.event_date.trim();
      if (args.event_time !== undefined) updates.event_time = args.event_time === null || args.event_time === "" ? null : toTime(String(args.event_time));
      if (typeof args.event_type === "string" && EVENT_TYPES.includes(args.event_type as (typeof EVENT_TYPES)[number])) updates.event_type = args.event_type;
      const { error } = await supabase.from("calendar_events").update(updates).eq("id", eventId).eq("user_id", user.id);
      return error ? "Update failed." : "Updated.";
    }
    if (name === "delete_calendar_event") {
      const eventId = typeof args.event_id === "string" ? args.event_id.trim() : "";
      if (!UUID_REGEX.test(eventId)) return "Invalid event id.";
      const { data: event } = await supabase
        .from("calendar_events")
        .select("id")
        .eq("id", eventId)
        .eq("user_id", user.id)
        .single();
      if (!event) return "Event not found.";
      const { error } = await supabase.from("calendar_events").delete().eq("id", eventId).eq("user_id", user.id);
      return error ? "Delete failed." : "Deleted.";
    }
    if (name === "create_calendar_event") {
      const title = typeof args.title === "string" ? args.title.trim() : "";
      const eventDate = typeof args.event_date === "string" && DATE_ONLY.test(args.event_date.trim()) ? args.event_date.trim() : "";
      if (!title || !eventDate) return "Missing title or event_date.";
      const eventType = typeof args.event_type === "string" && EVENT_TYPES.includes(args.event_type as (typeof EVENT_TYPES)[number])
        ? (args.event_type as (typeof EVENT_TYPES)[number])
        : "other";
      const eventTime = args.event_time !== undefined && args.event_time !== null && args.event_time !== "" ? toTime(String(args.event_time)) : null;
      const { error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title,
        event_date: eventDate,
        event_time: eventTime,
        event_type: eventType,
      });
      return error ? "Create failed." : "Created.";
    }
    return "Unknown tool.";
  }

  try {
    const MAX_TOOL_ROUNDS = 5;
    let round = 0;
    let reply: string = "I couldn't generate a response.";
    let calendarUpdated = false;

    while (round < MAX_TOOL_ROUNDS) {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        tools: CALENDAR_TOOLS,
        tool_choice: "auto",
      });

      const choice = completion.choices[0]?.message;
      if (!choice) break;

      if (choice.content) reply = choice.content;

      const toolCalls = choice.tool_calls;
      if (!toolCalls?.length) {
        break;
      }

      messages.push({
        role: "assistant",
        content: choice.content ?? null,
        tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function" as const, function: { name: tc.function.name, arguments: tc.function.arguments } })),
      });

      for (const tc of toolCalls) {
        let result: string;
        try {
          const args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
          result = await runTool(tc.function.name, args);
          calendarUpdated = true;
        } catch {
          result = "Tool error.";
        }
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      round++;
    }

    return NextResponse.json({ reply, ...(calendarUpdated ? { calendarUpdated: true } : {}) });
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
