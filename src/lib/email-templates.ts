const APP_NAME = "SpaxioScheduled";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
