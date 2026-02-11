import { createClient } from "@/lib/supabase/server";
import { isCreator } from "@/lib/auth";
import { reminderEmailSubject, reminderEmailHtml, type ReminderItem } from "@/lib/email-templates";
import { isSmtpConfigured, sendMail } from "@/lib/mailer";
import { addDays, format } from "date-fns";
import { handleUnexpectedError } from "@/lib/api-errors";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Sample reminder items for the test email (next 7 days from today). */
function sampleReminderItems(): ReminderItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [
    { title: "Sample assignment – Essay draft", event_type: "assignment", event_date: format(addDays(today, 2), "yyyy-MM-dd"), course: "Sample Course 101" },
    { title: "Sample midterm", event_type: "exam", event_date: format(addDays(today, 5), "yyyy-MM-dd"), course: "Sample Course 101" },
    { title: "Sample quiz", event_type: "test", event_date: format(addDays(today, 7), "yyyy-MM-dd") },
  ];
}

/**
 * POST: Send a test reminder email to the creator's email (creator-only).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isCreator(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = user.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "No email on your account. Add an email to receive the test." },
        { status: 400 }
      );
    }

    if (!isSmtpConfigured("reminder")) {
      return NextResponse.json(
        { error: "Reminder SMTP is not configured. Set REMINDER_SMTP_* env vars." },
        { status: 503 }
      );
    }

    const items = sampleReminderItems();
    const locale = "en";
    const subject = reminderEmailSubject(items, locale);
    const html = reminderEmailHtml(items, locale);

    await sendMail({
      to: email,
      subject,
      html,
      profile: "reminder",
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/535|Invalid login|Username and Password not accepted|BadCredentials/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "SMTP login failed. For Gmail/Workspace: use an App Password for this exact address (Google Account → Security → App passwords). If reminders@spaxio.ca is not a Google account, use your real provider's SMTP server (e.g. smtp.office365.com), not smtp.gmail.com. You can also try port 587 with REMINDER_SMTP_SECURE=false.",
        },
        { status: 502 }
      );
    }
    return handleUnexpectedError(err, "creator/test-reminders");
  }
}
