/**
 * Adds multi-currency options to the existing Stripe subscription price.
 * Run: npx tsx scripts/add-currency-options.ts
 * Requires: STRIPE_SECRET_KEY and STRIPE_SUBSCRIPTION_PRICE_ID in .env
 *
 * Stripe will present the price in the customer's local currency based on their
 * location (IP) when they visit the Checkout page.
 *
 * Amounts are approximate equivalents to $20 CAD. Update as needed for your pricing.
 */

import Stripe from "stripe";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually for standalone script
try {
  const envPath = resolve(process.cwd(), ".env");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {
  // .env not found, use existing env
}

const secretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

if (!secretKey || !priceId) {
  if (!secretKey) console.error("Missing STRIPE_SECRET_KEY. Run with env loaded (e.g. from .env).");
  if (!priceId) console.error("Missing STRIPE_SUBSCRIPTION_PRICE_ID. Add it to .env first.");
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
const subscriptionPriceId = priceId!;

/**
 * Currency options: amounts in smallest unit (cents for most, whole units for JPY etc.)
 * Base: $20 CAD = 2000 cents
 * Approximate equivalents - adjust for your target markets.
 */
const CURRENCY_OPTIONS: Record<string, number> = {
  usd: 1500, // ~$15 USD
  eur: 1400, // ~€14 EUR
  gbp: 1200, // ~£12 GBP
  aud: 2200, // ~$22 AUD
  chf: 1300, // ~CHF 13
  jpy: 2200, // ~¥2200 (JPY has no decimal)
  mxn: 35000, // ~$350 MXN (in centavos)
  brl: 9000, // ~R$90 BRL (in centavos)
  inr: 120000, // ~₹1200 INR (in paise)
};

async function main() {
  await stripe.prices.update(subscriptionPriceId, {
    currency_options: Object.fromEntries(
      Object.entries(CURRENCY_OPTIONS).map(([currency, unitAmount]) => [
        currency,
        { unit_amount: unitAmount },
      ])
    ),
  });

  console.log("\n=== Currency options added successfully ===\n");
  console.log("Price ID:", subscriptionPriceId);
  console.log("\nCurrencies now supported:");
  for (const [currency, amount] of Object.entries(CURRENCY_OPTIONS)) {
    const formatted =
      ["jpy", "krw"].includes(currency.toLowerCase())
        ? amount
        : (amount / 100).toFixed(2);
    console.log(`  ${currency.toUpperCase()}: ${formatted}`);
  }
  console.log("\nStripe will present the price in the customer's local currency");
  console.log("based on their location when they visit the Checkout page.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
