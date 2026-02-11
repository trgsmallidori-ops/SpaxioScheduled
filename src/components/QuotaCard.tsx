"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import type { UserQuota } from "@/types/database";
import { FREE_UPLOADS } from "@/lib/stripe";

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
  const paidAvailable = (quota?.paid_uploads_purchased ?? 0) - (quota?.paid_uploads_used ?? 0);
  const totalLeft = Math.max(0, FREE_UPLOADS - freeUsed) + paidAvailable;

  async function handleBuy() {
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
        onClick={handleBuy}
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
              <span className="ml-2 text-[var(--muted)]">({t.free}: {FREE_UPLOADS - freeUsed})</span>
            )}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {t.freeUploads} · {t.thenPay}
          </p>
        </div>
        <button
          type="button"
          onClick={handleBuy}
          className={`rounded-xl px-6 py-3 text-base font-bold transition ${
            totalLeft <= 0
              ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
              : "border border-[var(--accent)]/50 bg-[var(--surface)] text-[var(--accent)] hover:bg-[var(--accent-light)]"
          }`}
        >
          {t.buyUploads}
        </button>
      </div>
      {checkoutError && (
        <p className="mt-3 text-sm font-semibold text-red-600">{checkoutError}</p>
      )}
    </div>
  );
}
