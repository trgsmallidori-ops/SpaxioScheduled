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
import { DEFAULT_COURSE_COLOR } from "@/lib/courseColors";
import type { ParsedSyllabus } from "@/types/database";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const EXTRACT_PROMPT = `You are parsing a course syllabus with EXTREME ACCURACY. Your goal is to populate a student's calendar with every important dated event. Extract the following and return ONLY valid JSON with no markdown or extra text.

Return this exact structure:
{
  "courseName": "string - full course name",
  "courseCode": "string or null - e.g. CS 101",
  "assignmentWeights": { "Assignment type": number (percent), ... },
  "tentativeSchedule": [
    { "date": "YYYY-MM-DD", "title": "string", "type": "assignment|test|exam|other" }
  ],
  "classSchedule": [ { "days": ["Mon","Tue",...], "start": "HH:MM", "end": "HH:MM" }, ... ],
  "termStartDate": "YYYY-MM-DD or null",
  "termEndDate": "YYYY-MM-DD or null"
}

CRITICAL RULES:

0) termStartDate and termEndDate - TRY HARD to find the first and last day of the term/course:
   - Look for: "first day of class", "classes begin", "semester begins", "start date", "course runs", "Jan 15 - May 10", "through May 10", "last day of class", "last day of classes", "final exam period", "exam week", academic calendar section, semester dates.
   - If the syllabus gives a date range (e.g. "Spring 2025: Jan 15 to May 10"), use those as termStartDate and termEndDate.
   - If you only find one end (e.g. "Final exam May 15"), set termEndDate to that date and termStartDate to null (or infer from context).
   - Use the SAME year as the tentative schedule dates. If no year is given anywhere, use the current academic year (e.g. 2025 for spring).
   - Return null only when you truly cannot find any indication of term start or end in the document.

1) tentativeSchedule - BE EXTREMELY THOROUGH. Extract EVERYTHING that has a date or can be assigned a date. Include:

   ASSESSMENTS (use type "test" or "exam" or "assignment" as below):
   - Quizzes, pop quizzes, surprise quizzes → type "test". Title e.g. "Quiz on Ch. 2", "Pop quiz", "Week 4 Quiz".
   - Practice tests, mock exams, review tests → type "test". Title e.g. "Practice midterm", "Mock exam".
   - Tests, in-class tests, unit tests → type "test".
   - Midterms, mid-term exams, half-term exam → type "exam".
   - Final exam, final, comprehensive exam → type "exam".
   - Any "assessment", "evaluation" with a date → choose test or exam by scope.

   ASSIGNMENTS (type "assignment"):
   - Assignment due dates, homework due, problem set due, essay due, paper due.
   - Project due date, group project deadline, presentation due, lab report due.
   - Any "due", "deadline", "submit by" with a date → type "assignment".

   IN-CLASS CONTENT / LECTURE TOPICS (type "other"):
   - Week-by-week or day-by-day schedule: "Week 3: Introduction to X", "Demand Forecasting", "Product & Service Design". Use type "other" with a descriptive title (e.g. "Ch. 3: Introduction to Loops", "Process Design and Facility Layout"). These are for calendar visibility only.
   - "Guest speaker", "Field trip", "Review session", "Workshop", "Discussion of Ch. 5" → type "other".
   - NEVER add an event titled "Class" or with type "class". If a day already has an important event (test, quiz, assignment, review, feedback), do NOT add a separate "Class" or generic lecture event for that same date. Only add the important event(s). You may add the lecture topic as type "other" with a descriptive title on the same or adjacent date, but the primary entry for that day must be the test/quiz/assignment/review/feedback—never "Class".
   - Important events (tests, quizzes, assignments, review, feedback, study break) always take priority: use type "test", "exam", or "assignment". Regular lecture topics (e.g. "Demand Forecasting", "Strategic Capacity Planning") are type "other" only.

   CLASS DAYS CONSTRAINT (CRITICAL):
   - If the syllabus states that class meets only on specific days (e.g. "Tuesday and Thursday", "T/Th", "Tues/Thurs", "MWF", "Mon Wed Fri"), you MUST assign in-class topics (type "other") ONLY to those weekdays. Never assign a lecture topic to a day that is not a class day. Example: if the syllabus says "Class meets Tuesday and Thursday only", then every topic from the schedule table goes on a Tuesday or Thursday—never on Monday, Wednesday, or Friday.
   - Use the classSchedule you extract (or explicit text like "T/Th", "Tuesday and Thursday") to determine allowed weekdays. When distributing multiple topic lines across dates, only use dates that fall on those allowed weekdays. If a date range spans a non-class day, skip that day when assigning topics.

   TABLE PARSING (Week / Date / Topic / Readings):
   - When the syllabus has a table with dates (e.g. "Jan 22-Jan 24" or "Jan 20 - 22") and a Topic column:
     - DATE NOTATION: "Jan 22-Jan 24" (two dates with a hyphen) usually means ONLY those two days—Jan 22 AND Jan 24—NOT "Jan 22 through Jan 24" including the day in between. So do NOT assign any topic to Jan 23 unless Jan 23 is explicitly listed elsewhere. Same for "Jan 20 - 22": often it means just Jan 20 and Jan 22 (the class days in that week), not Jan 21. Prefer interpreting hyphenated date pairs as "on these dates" (list of class days) rather than "every day from first to last". When in doubt and the course meets only on specific days (e.g. T/Th), use only the dates that fall on those weekdays.
     - Distribute topic lines to the dates that are actually class days for that row. E.g. "Jan 22-Jan 24" with two topic lines → first topic → Jan 22, second topic → Jan 24 (not Jan 23). If there are three lines and only two dates listed, put two topics on the two dates and the third on the next class day (e.g. next Tuesday or Thursday).
     - Exception: if the lines are clearly one sentence split across two lines (e.g. "Course Introduction" and "Introduction to Operations Management" as one intro), treat as ONE topic and use the first listed date.
   - Items in blue, bold, or with keywords "Test", "Review", "Feedback", "Study Break", "Quiz", "Due" are important events → use type "test", "exam", or "assignment". Do not duplicate that day with a "Class" event.
   - Blank "Readings" for a row often means the Topic is an event (test, review) rather than a reading-based lecture—use that as a hint.

   DATE HANDLING (CRITICAL - ACCURACY IS ESSENTIAL):
   - YEAR: Use the year provided in the "Today's date" line below for ALL dates. If the syllabus says "Jan 22" or "January 22nd", convert to that exact calendar date in that year (e.g. 2026-01-22). Jan 22, 2026 is a Thursday—verify your dates against the real calendar.
   - SPECIFIC DATE PRIORITY: When the syllabus gives an EXPLICIT calendar date (e.g. "Jan 22", "Jan 22nd", "January 22", "1/22", "Jan 22 2026", "Jan 22-Jan 24"), use that EXACT date. Do NOT substitute a different date based on day-of-week. "Jan 22" means 2026-01-22—put the event on that date, not on "the next Tuesday" or any other day. The syllabus author chose that date; honor it.
   - CLASS DAYS: When distributing topics across weeks without specific dates, use ONLY the course's class days (e.g. T/Th). But when the syllabus explicitly lists "Jan 22" or "Jan 22-Jan 24", those ARE the specific dates—use them as-is, even if that date falls on a class day (it should, since the professor scheduled it).
   - Search the ENTIRE document: "Tentative Schedule", "Course Calendar", "Important Dates", "Weekly Schedule", tables, bullet lists, paragraphs, and any phrase like "class meets", "T/Th", "Tuesday and Thursday".
   - Convert "Oct 15", "10/15", "October 15", "March 10th", "Week 7" to YYYY-MM-DD. For hyphenated pairs like "Jan 22-Jan 24", use only the listed dates (Jan 22 and Jan 24), not the days in between. For "Week N", use termStartDate: first day of that week (e.g. Week 1 = termStartDate, Week 2 = termStartDate + 7 days).
   - When the syllabus uses vague durations like "roughly 4 weeks" or "Weeks 4–7: work on Assignment 1" without exact day-by-day dates, anchor that span to calendar weeks using termStartDate AND place the related topics/assignment ONLY on the actual class meeting days from the lecture schedule (e.g. the Tue/Thu or MWF pattern in classSchedule). Do NOT invent extra non-class days; repeat the item on each class day across that span instead of sprinkling it on random weekdays.
   - When one row has both an important event and a lecture topic (e.g. "Review & Test #1" and "Test #1", or "Feedback on Test #1" and "Process Design and Facility Layout"), create separate entries with the correct dates; do not add "Class" for that day.
   - Do NOT include recurring weekly "class" or "lecture" meetings in tentativeSchedule. Do NOT add any event titled "Class". Reminders are only sent for assignment, test, and exam—never for type "other".

2) classSchedule - different times on different days:
   - If the syllabus says e.g. "Lecture MWF 9:00-9:50" and "Lab Tue 14:00-15:30", return TWO blocks: [ { "days": ["Mon","Wed","Fri"], "start": "09:00", "end": "09:50" }, { "days": ["Tue"], "start": "14:00", "end": "15:30" } ].
   - Use exactly: "Mon","Tue","Wed","Thu","Fri","Sat","Sun". Map T/Th, MWF, etc. to these.
   - If there is only one meeting pattern, return one block. If no schedule found, return [].

3) assignmentWeights: keys like "Assignments", "Midterm", "Final", "Participation", "Quizzes". Values 0-100.`;

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
        content: `Today's date: ${new Date().toISOString().slice(0, 10)} (use this year for all dates unless the syllabus explicitly states a different year).

Syllabus text:

${text.slice(0, 12000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/rate limit|quota|insufficient_quota|429/i.test(msg)) {
      return NextResponse.json(
        {
          error: "Our AI is under heavy load. Please try again in a few minutes.",
          code: "RATE_LIMIT",
        },
        { status: 429 }
      );
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

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const termStart =
    parsed.termStartDate && String(parsed.termStartDate).trim() && dateOnly.test(String(parsed.termStartDate).trim())
      ? String(parsed.termStartDate).trim()
      : null;
  const termEnd =
    parsed.termEndDate && String(parsed.termEndDate).trim() && dateOnly.test(String(parsed.termEndDate).trim())
      ? String(parsed.termEndDate).trim()
      : null;

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
      term_start_date: termStart,
      term_end_date: termEnd,
      color: DEFAULT_COURSE_COLOR,
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

  const rawTypeToEventType = (
    raw: string | null | undefined
  ): "assignment" | "test" | "exam" | "other" => {
    const t = (raw && String(raw).trim().toLowerCase()) || "";
    if (["exam", "midterm", "mid-term", "final", "finals"].some((k) => t === k || t.includes(k)))
      return "exam";
    if (
      [
        "test",
        "quiz",
        "quizzes",
        "pop quiz",
        "pop_quiz",
        "practice test",
        "practice_test",
        "mock exam",
        "assessment",
        "review",
        "feedback",
      ].some((k) => t === k || t.includes(k))
    )
      return "test";
    if (
      ["assignment", "assignments", "homework", "project", "presentation", "lab report", "due", "deadline"].some(
        (k) => t === k || t.includes(k)
      )
    )
      return "assignment";
    return "other";
  };

  for (const item of parsed.tentativeSchedule || []) {
    const date = item?.date && String(item.date).trim();
    if (!date || !dateOnly.test(date)) continue;
    const type = rawTypeToEventType(item.type);
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

  // Suggest class days only from the syllabus lecture schedule (e.g. "Tue/Thu"), never from
  // assignment/test dates — those are one-off and would wrongly suggest every weekday.
  const suggestedDays: string[] = [];
  if (rawClassSchedule && !isAllSevenDays(rawClassSchedule)) {
    const seen = new Set<string>();
    for (const b of rawClassSchedule) {
      for (const d of b.days || []) {
        const n = typeof d === "string" ? shortDay(d) : null;
        if (n && dayOrder.includes(n)) seen.add(n);
      }
    }
    suggestedDays.push(...dayOrder.filter((day) => seen.has(day)));
  }
  let suggestedTermStart: string | undefined;
  let suggestedTermEnd: string | undefined;
  if (parsed.tentativeSchedule?.length) {
    const validDates: string[] = [];
    for (const item of parsed.tentativeSchedule) {
      const d = item?.date && String(item.date).trim();
      if (!d || !dateOnly.test(d)) continue;
      validDates.push(d);
    }
    if (validDates.length > 0) {
      validDates.sort();
      suggestedTermStart = validDates[0];
      suggestedTermEnd = validDates[validDates.length - 1];
    }
  }

  const needsTermDates = !termStart || !termEnd;

  return NextResponse.json({
    courseId: course.id,
    needsClassTime: true,
    needsTermDates: needsTermDates || undefined,
    suggestedTermStart: needsTermDates ? (termStart ?? suggestedTermStart) : undefined,
    suggestedTermEnd: needsTermDates ? (termEnd ?? suggestedTermEnd) : undefined,
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
