import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  FREE_UPLOADS,
  PAID_UPLOADS_PER_PURCHASE,
  stripe,
} from "@/lib/stripe";
import { isCreatorOrAdmin } from "@/lib/auth";
import type { ParsedSyllabus } from "@/types/database";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const EXTRACT_PROMPT = `You are parsing a course syllabus. Extract the following and return ONLY valid JSON with no markdown or extra text.

Return this exact structure:
{
  "courseName": "string - full course name",
  "courseCode": "string or null - e.g. CS 101",
  "assignmentWeights": { "Assignment type": number (percent), ... },
  "tentativeSchedule": [
    { "date": "YYYY-MM-DD", "title": "string", "type": "assignment|test|exam|other" }
  ],
  "classSchedule": [ { "days": ["Mon","Tue",...], "start": "HH:MM", "end": "HH:MM" }, ... ]
}

CRITICAL RULES:

1) tentativeSchedule - BE THOROUGH finding ALL test and exam dates:
   - Search the ENTIRE document for: "midterm", "mid-term", "exam", "final", "test", "quiz", "assessment", "due date", "deadline", "assignment due".
   - Look in: "Tentative Schedule", "Important Dates", "Exam Schedule", "Course Calendar", tables, bullet lists, paragraphs.
   - Dates may appear as "Oct 15", "10/15", "October 15", "Week 7", "March 10th". Convert to YYYY-MM-DD (use 2025 for year if not given).
   - Include EVERY assignment due date, test date, quiz date, midterm, final exam you find. Prefer type "exam" for finals/midterms, "test" for tests/quizzes, "assignment" for assignments.
   - Do NOT include type "class" in tentativeSchedule. Do NOT add recurring weekly class meetings here. Only include specific dated events (assignments, tests, exams).

2) classSchedule - different times on different days:
   - If the syllabus says e.g. "Lecture MWF 9:00-9:50" and "Lab Tue 14:00-15:30", return TWO blocks: [ { "days": ["Mon","Wed","Fri"], "start": "09:00", "end": "09:50" }, { "days": ["Tue"], "start": "14:00", "end": "15:30" } ].
   - Use exactly: "Mon","Tue","Wed","Thu","Fri","Sat","Sun". Map T/Th, MWF, etc. to these.
   - If there is only one meeting pattern, return one block. If no schedule found, return [].

3) assignmentWeights: keys like "Assignments", "Midterm", "Final", "Participation". Values 0-100.`;

export async function POST(request: NextRequest) {
  try {
    return await handleParseSyllabus(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[parse-syllabus]", message, stack ?? "");
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev ? message : "Failed to parse syllabus",
        ...(isDev && { details: String(stack || err) }),
      },
      { status: 500 }
    );
  }
}

async function handleParseSyllabus(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const courseId = formData.get("courseId") as string | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 15 MB." },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.indexOf(file.type) === -1) {
    const name = (file.name || "").toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      return NextResponse.json({ error: "Invalid file type. Use PDF or Word (.docx)." }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data: quota } = await admin
    .from("user_quota")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const freeUsed = quota?.free_uploads_used ?? 0;
  const paidPurchased = quota?.paid_uploads_purchased ?? 0;
  const paidUsed = quota?.paid_uploads_used ?? 0;
  const paidAvailable = paidPurchased - paidUsed;
  const freeAccess = isCreatorOrAdmin(user.id);

  // Server-side quota check — never skip. Blocks direct API calls or URL bypass.
  if (!freeAccess) {
    if (freeUsed >= FREE_UPLOADS && paidAvailable <= 0) {
      return NextResponse.json(
        { error: "No uploads left", code: "QUOTA_EXCEEDED" },
        { status: 403 }
      );
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  const isDocx =
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  let text: string;
  try {
    if (isDocx) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data?.text ?? "";
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[parse-syllabus] doc read error", msg);
    return NextResponse.json(
      { error: isDocx ? "Could not read Word document" : "Could not read PDF" },
      { status: 400 }
    );
  }

  const trimmed = (text || "").trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "No text could be extracted from the file (e.g. image-only PDF)" },
      { status: 400 }
    );
  }
  text = trimmed;

  if (!openai) {
    return NextResponse.json(
      { error: "AI not configured" },
      { status: 500 }
    );
  }

  let completion;
  try {
    completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content: EXTRACT_PROMPT,
      },
      {
        role: "user",
        content: `Syllabus text:\n\n${text.slice(0, 12000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/rate limit|quota|insufficient_quota|429/i.test(msg)) {
      return NextResponse.json({ error: "AI rate limit — try again later" }, { status: 429 });
    }
    if (/invalid.*key|api_key|401|403/i.test(msg)) {
      return NextResponse.json({ error: "AI service configuration error" }, { status: 500 });
    }
    console.error("[parse-syllabus] OpenAI error", e);
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? msg : "AI parsing failed" },
      { status: 500 }
    );
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return NextResponse.json({ error: "AI could not parse syllabus" }, { status: 500 });
  }

  let parsed: ParsedSyllabus;
  try {
    parsed = JSON.parse(raw) as ParsedSyllabus;
  } catch {
    return NextResponse.json({ error: "Invalid AI response" }, { status: 500 });
  }

  const ext = isDocx ? "docx" : "pdf";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("syllabi")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const shortDay = (s: string) =>
    dayOrder[
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(s)
    ] ?? s;

  const rawClassSchedule = (() => {
    if (Array.isArray(parsed.classSchedule) && parsed.classSchedule.length > 0) {
      return parsed.classSchedule.filter(
        (b): b is { days: string[]; start: string; end: string } =>
          Array.isArray(b?.days) && b.days.length > 0 && Boolean(b?.start && b?.end)
      );
    }
    const ct = parsed.classTime;
    if (ct && Array.isArray(ct.days) && ct.days.length > 0 && ct.start && ct.end) {
      return [{ days: ct.days, start: ct.start, end: ct.end }];
    }
    return null;
  })();

  // Reject "all 7 days" — AI often returns every day when it didn't find a real schedule
  const isAllSevenDays = (blocks: { days: string[] }[] | null) => {
    if (!blocks?.length) return false;
    const union = new Set<string>();
    for (const b of blocks) {
      for (const d of b.days) {
        const n = typeof d === "string" ? shortDay(d) : null;
        if (n && dayOrder.includes(n)) union.add(n);
      }
    }
    return union.size >= 7;
  };

  // Never use AI class schedule for DB or calendar — always ask the user to enter it
  const singleBlock =
    rawClassSchedule && !isAllSevenDays(rawClassSchedule) && rawClassSchedule.length === 1
      ? rawClassSchedule[0]
      : null;

  // Normalize time to HH:MM or HH:MM:SS for Postgres time columns
  const toTime = (s: string | null | undefined): string | null => {
    if (!s || typeof s !== "string") return null;
    const trimmed = s.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(":");
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const sec = parts[2] ? parts[2].padStart(2, "0") : "00";
      return `${h}:${m}:${sec}`;
    }
    return null;
  };

  // Re-check quota right before creating course (defense in depth: no bypass via direct API/URL).
  if (!freeAccess) {
    const { data: quotaRecheck } = await admin
      .from("user_quota")
      .select("free_uploads_used, paid_uploads_purchased, paid_uploads_used")
      .eq("user_id", user.id)
      .single();
    const fr = (quotaRecheck?.free_uploads_used ?? 0) as number;
    const pp = (quotaRecheck?.paid_uploads_purchased ?? 0) as number;
    const pu = (quotaRecheck?.paid_uploads_used ?? 0) as number;
    const paidAvail = pp - pu;
    if (fr >= FREE_UPLOADS && paidAvail <= 0) {
      return NextResponse.json(
        { error: "No uploads left", code: "QUOTA_EXCEEDED" },
        { status: 403 }
      );
    }
  }

  const { data: course, error: courseErr } = await admin
    .from("courses")
    .insert({
      user_id: user.id,
      name: (parsed.courseName && String(parsed.courseName).trim()) || "Untitled Course",
      code: parsed.courseCode != null && String(parsed.courseCode).trim() ? String(parsed.courseCode).trim() : null,
      class_time_start: null,
      class_time_end: null,
      class_days: null,
      class_schedule: null,
      raw_schedule: parsed.tentativeSchedule ?? [],
      assignment_weights: parsed.assignmentWeights ?? {},
      file_path: path,
    })
    .select("id")
    .single();

  if (courseErr || !course) {
    const errMsg = courseErr?.message || "Unknown error";
    console.error("[parse-syllabus] course insert", courseErr?.code, errMsg, courseErr?.details);
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Failed to save course",
        ...(isDev && { details: errMsg + (courseErr?.details ? ` — ${JSON.stringify(courseErr.details)}` : "") }),
      },
      { status: 500 }
    );
  }

  const events: {
    user_id: string;
    course_id: string;
    title: string;
    event_type: "assignment" | "test" | "exam" | "other";
    event_date: string;
    event_time: string | null;
    end_time: string | null;
    weight_percent: number | null;
  }[] = [];

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  for (const item of parsed.tentativeSchedule || []) {
    const date = item?.date && String(item.date).trim();
    if (!date || !dateOnly.test(date)) continue;
    const type =
      item.type === "exam"
        ? "exam"
        : item.type === "test"
          ? "test"
          : item.type === "assignment"
            ? "assignment"
            : "other";
    events.push({
      user_id: user.id,
      course_id: course.id,
      title: (item.title && String(item.title).trim()) || "Event",
      event_type: type,
      event_date: date,
      event_time: null,
      end_time: null,
      weight_percent: null,
    });
  }

  if (events.length > 0) {
    const { error: eventsErr } = await admin.from("calendar_events").insert(events);
    if (eventsErr) {
      console.error("[parse-syllabus] calendar_events insert", eventsErr);
      return NextResponse.json({ error: "Failed to save events" }, { status: 500 });
    }
  }

  const { format } = await import("date-fns");
  const { enUS } = await import("date-fns/locale");

  if (!freeAccess) {
    if (freeUsed < FREE_UPLOADS) {
      await admin
        .from("user_quota")
        .update({
          free_uploads_used: freeUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await admin
        .from("user_quota")
        .update({
          paid_uploads_used: paidUsed + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }
  }

  const suggestedDays: string[] = [];
  if (parsed.tentativeSchedule?.length) {
    const seen = new Set<string>();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    for (const item of parsed.tentativeSchedule) {
      const d = item?.date && String(item.date).trim();
      if (!d || !dateOnly.test(d)) continue;
      const dayName = format(new Date(d + "T12:00:00"), "EEE", { locale: enUS });
      if (dayOrder.includes(dayName)) seen.add(dayName);
    }
    suggestedDays.push(...dayOrder.filter((day) => seen.has(day)));
  }

  return NextResponse.json({
    courseId: course.id,
    needsClassTime: true,
    suggestedDays: suggestedDays.length ? suggestedDays : undefined,
    suggestedStart: singleBlock?.start ?? undefined,
    suggestedEnd: singleBlock?.end ?? undefined,
    parsed: {
      courseName: parsed.courseName,
      courseCode: parsed.courseCode,
      assignmentWeights: parsed.assignmentWeights,
      tentativeSchedule: parsed.tentativeSchedule,
      classTime: parsed.classTime,
    },
  });
}
