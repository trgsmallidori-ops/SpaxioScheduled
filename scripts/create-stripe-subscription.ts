/**
 * One-time script to create Stripe product and annual price for SpaxioScheduled.
 * Run: npm run create-stripe-subscription
 * Requires: STRIPE_SECRET_KEY in .env
 *
 * Outputs the price ID to add to .env as STRIPE_SUBSCRIPTION_PRICE_ID
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
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Run with env loaded (e.g. from .env).");
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

async function main() {
  const product = await stripe.products.create({
    name: "SpaxioScheduled Annual Subscription",
    description: "50 syllabus uploads per year for SpaxioScheduled",
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "cad",
    unit_amount: 2000, // $20 CAD
    recurring: { interval: "year" },
  });

  console.log("\n=== Stripe Subscription Created ===\n");
  console.log("Product ID:", product.id);
  console.log("Price ID:", price.id);
  console.log("\nAdd to your .env file:");
  console.log(`STRIPE_SUBSCRIPTION_PRICE_ID=${price.id}`);
  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
