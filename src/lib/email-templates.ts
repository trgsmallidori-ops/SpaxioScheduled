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
  const unsubscribeText = isFr ? "Désactiver les rappels" : "Unsubscribe from reminders";
  const unsubscribeHint = isFr
    ? "Pour ne plus recevoir ces courriels, désactivez les rappels depuis le tableau de bord (icône cloche)."
    : "To stop these emails, turn off reminders in the Dashboard (bell icon).";

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
    <p style="font-size: 12px; color: #9a9a94; margin-top: 12px;"><a href="${APP_URL}/dashboard" style="color: #8b9f7e;">${unsubscribeText}</a> — ${unsubscribeHint}</p>
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

type PurchaseEmailArgs = {
  locale: "en" | "fr";
  uploadsGranted: number;
  amountCents: number;
  currency: string;
  dashboardUrl?: string;
};

export function purchaseReceiptSubject({ locale, uploadsGranted }: PurchaseEmailArgs): string {
  if (locale === "fr") {
    return `Paiement confirmé — ${uploadsGranted} téléversements débloqués`;
  }
  return `Payment confirmed — ${uploadsGranted} uploads unlocked`;
}

export function purchaseReceiptHtml({
  locale,
  uploadsGranted,
  amountCents,
  currency,
  dashboardUrl = `${APP_URL}/dashboard`,
}: PurchaseEmailArgs): string {
  const isFr = locale === "fr";
  const amountFormatted = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
  const headline = isFr ? "Merci pour votre achat" : "Thanks for your purchase";
  const intro = isFr
    ? `Vous avez obtenu ${uploadsGranted} téléversements supplémentaires sur ${APP_NAME}.`
    : `You unlocked ${uploadsGranted} additional uploads on ${APP_NAME}.`;
  const dashboardLabel = isFr ? "Accéder au tableau de bord" : "Go to dashboard";
  const note = isFr
    ? "Ce courriel confirme votre paiement Stripe. Aucun autre action n'est requise."
    : "This email confirms your Stripe payment. No further action is required.";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; background: #faf8f5; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <h1 style="color: #2c2c28; font-size: 22px; margin-bottom: 8px;">${headline}</h1>
    <p style="color: #6b6b65; margin: 8px 0;">${intro}</p>
    <div style="margin: 16px 0; padding: 16px; border-radius: 12px; background: #f6f2ea;">
      <p style="margin: 0; color: #2c2c28; font-weight: 600;">${amountFormatted}</p>
      <p style="margin: 4px 0 0; color: #6b6b65;">${
        isFr ? "Montant facturé par Stripe" : "Amount charged via Stripe"
      }</p>
    </div>
    <p style="margin: 16px 0;"><a href="${dashboardUrl}" style="color: #8b9f7e; font-weight: 600;">${dashboardLabel}</a></p>
    <p style="font-size: 13px; color: #6b6b65;">${note}</p>
    <p style="font-size: 12px; color: #9a9a94; margin-top: 32px;">${APP_NAME}</p>
  </div>
</body>
</html>`;
}
