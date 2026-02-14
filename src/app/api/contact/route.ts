import { NextRequest, NextResponse } from "next/server";
import { isSmtpConfigured, sendMail } from "@/lib/mailer";
import { apiError, handleUnexpectedError } from "@/lib/api-errors";

const REASON_MAX_LENGTH = 2000;

/** Where to send refund/contact emails. CONTACT_EMAIL is required so you receive them. */
function getContactToEmail(): string | null {
  const contact = process.env.CONTACT_EMAIL?.trim();
  if (contact) return contact;
  if (process.env.SMTP_FROM?.trim()) return process.env.SMTP_FROM.trim();
  return null;
}

function getContactProfile(): "default" | null {
  return isSmtpConfigured("default") ? "default" : null;
}

export async function POST(request: NextRequest) {
  try {
    const toEmail = getContactToEmail();
    if (!toEmail) {
      return apiError(
        "Refund requests are not configured. Set CONTACT_EMAIL in your environment to the email where you want to receive refund requests.",
        503
      );
    }
    const profile = getContactProfile();
    if (!profile) {
      return apiError(
        "Refund requests require SMTP. Configure SMTP_* in your environment.",
        503
      );
    }

    const body = await request.json().catch(() => ({}));
    const type = body.type === "refund" ? "refund" : "contact";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!email) {
      return apiError("Email is required.", 400);
    }
    if (!reason) {
      return apiError("Reason is required.", 400);
    }
    if (reason.length > REASON_MAX_LENGTH) {
      return apiError(`Reason must be at most ${REASON_MAX_LENGTH} characters.`, 400);
    }

    const subject =
      type === "refund"
        ? `[SpaxioScheduled] Refund request from ${email}`
        : `[SpaxioScheduled] Contact from ${email}`;
    const html = `
      <p><strong>From:</strong> ${escapeHtml(email)}</p>
      <p><strong>Type:</strong> ${type === "refund" ? "Refund request" : "Contact"}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(reason)}</pre>
      <p style="font-size: 12px; color: #666;">Refunds are only considered within 7 days of purchase.</p>
    `;

    await sendMail({
      to: toEmail,
      subject,
      html,
      profile,
      replyTo: email,
    });

    console.info(`[contact] ${type} request sent to: ${toEmail} (from: ${email})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] Failed to send email", err);
    return handleUnexpectedError(err, "contact");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
