import { formatDisplayDate } from "./formatDate";

const APP_NAME = "SpaxioScheduled";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type ReminderItem = {
  title: string;
  event_type: string;
  event_date: string;
  course?: string;
};

export function reminderEmailSubject(items: ReminderItem[], locale: "en" | "fr"): string {
  if (locale === "fr") {
    return items.length === 1
      ? `Rappel : ${items[0].title} — ${APP_NAME}`
      : `${items.length} rappels — ${APP_NAME}`;
  }
  return items.length === 1
    ? `Reminder: ${items[0].title} — ${APP_NAME}`
    : `${items.length} upcoming reminders — ${APP_NAME}`;
}

export function reminderEmailHtml(items: ReminderItem[], locale: "en" | "fr"): string {
  const isFr = locale === "fr";
  const intro = isFr
    ? "Voici vos prochains travaux et examens :"
    : "Here are your upcoming assignments and tests:";
  const viewCalendar = isFr ? "Voir le calendrier" : "View calendar";
  const footer = isFr
    ? "Vous recevez ce courriel car vous avez activé les rappels sur SpaxioScheduled."
    : "You're receiving this email because you enabled reminders on SpaxioScheduled.";

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;">${escapeHtml(i.title)}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;">${formatDisplayDate(i.event_date)}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #eee;">${i.event_type}</td>
          ${i.course ? `<td style="padding:8px 12px; border-bottom:1px solid #eee;">${escapeHtml(i.course)}</td>` : ""}
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; background: #faf8f5; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <h1 style="color: #2c2c28; font-size: 20px;">${APP_NAME}</h1>
    <p style="color: #6b6b65;">${intro}</p>
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px 12px; color: #6b6b65; font-weight: 600;">${isFr ? "Titre" : "Title"}</th>
          <th style="text-align:left; padding:8px 12px; color: #6b6b65; font-weight: 600;">${isFr ? "Date" : "Date"}</th>
          <th style="text-align:left; padding:8px 12px; color: #6b6b65; font-weight: 600;">${isFr ? "Type" : "Type"}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p><a href="${APP_URL}/dashboard" style="color: #8b9f7e; font-weight: 600;">${viewCalendar}</a></p>
    <p style="font-size: 12px; color: #6b6b65;">${footer}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
