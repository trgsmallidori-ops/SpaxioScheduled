"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import type { UserQuota } from "@/types/database";
import { FREE_UPLOADS, SUBSCRIPTION_UPLOADS_PER_YEAR } from "@/lib/stripe";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function QuotaCard({
  quota,
  isCreatorOrAdmin,
  onPurchaseComplete,
  showTestCheckout,
}: {
  quota: UserQuota | null;
  isCreatorOrAdmin: boolean;
  onPurchaseComplete: () => void;
  showTestCheckout?: boolean;
}) {
  const { t, locale } = useLocale();
  const [checkoutError, setCheckoutError] = useState("");
  const freeUsed = quota?.free_uploads_used ?? 0;
  const subStatus = quota?.subscription_status;
  const subQuota = quota?.subscription_uploads_quota ?? SUBSCRIPTION_UPLOADS_PER_YEAR;
  const subUsed = quota?.subscription_uploads_used ?? 0;
  const subscriptionAvailable =
    subStatus === "active" || subStatus === "past_due"
      ? Math.max(0, subQuota - subUsed)
      : 0;
  const freeAvailable = Math.max(0, FREE_UPLOADS - freeUsed);
  const totalLeft = freeAvailable + subscriptionAvailable;
  const isSubscribed = subStatus === "active" || subStatus === "past_due";
  const subscriptionEnd = quota?.subscription_current_period_end ?? null;

  async function handleSubscribe() {
    setCheckoutError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: locale === "fr" ? "fr" : "en" }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    if (!res.ok) {
      setCheckoutError(data.error || "Checkout failed. Check your Stripe configuration.");
    }
  }

  if (isCreatorOrAdmin && !showTestCheckout) {
    return (
      <div className="mt-5 rounded-xl bg-[var(--green-light)] shadow-soft px-5 py-3 text-sm font-semibold text-[var(--text)]">
        {t.youHaveFreeAccess}
      </div>
    );
  }

  if (isCreatorOrAdmin && showTestCheckout) {
    return (
      <button
        type="button"
        onClick={handleSubscribe}
        className="rounded-xl border border-[var(--accent)]/50 bg-[var(--surface)] px-4 py-2 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-light)]"
      >
        {t.testCheckout}
      </button>
    );
  }

  return (
    <div className="mt-5 rounded-xl bg-[var(--surface)] p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-base font-bold text-[var(--text)]">
            {t.uploadsLeft}: <span className="text-[var(--accent)]">{totalLeft}</span>
            {freeUsed < FREE_UPLOADS && (
              <span className="ml-2 text-[var(--muted)]">
                ({t.free}: {FREE_UPLOADS - freeUsed})
              </span>
            )}
            {isSubscribed && (
              <span className="ml-2 text-[var(--muted)]">
                ({t.subscription}: {subscriptionAvailable})
              </span>
            )}
          </p>
          {isSubscribed && subscriptionEnd ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t.activeUntil}{" "}
              {format(new Date(subscriptionEnd), "MMM d, yyyy", {
                locale: locale === "fr" ? fr : undefined,
              })}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t.freeUploads} · {t.thenSubscribe}
            </p>
          )}
        </div>
        {!isSubscribed && (
          <button
            type="button"
            onClick={handleSubscribe}
            className={`rounded-xl px-6 py-3 text-base font-bold transition ${
              totalLeft <= 0
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                : "border border-[var(--accent)]/50 bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--accent-light)]"
            }`}
          >
            {t.subscribeForYear}
          </button>
        )}
      </div>
      {checkoutError && (
        <p className="mt-3 text-sm font-semibold text-red-600">{checkoutError}</p>
      )}
    </div>
  );
}
