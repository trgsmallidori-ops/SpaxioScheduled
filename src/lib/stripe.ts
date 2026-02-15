import Stripe from "stripe";

export const stripe =
  process.env.STRIPE_SECRET_KEY &&
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

export const FREE_UPLOADS = 2;
export const SUBSCRIPTION_UPLOADS_PER_YEAR = 50;
export const SUBSCRIPTION_PRICE_CENTS = 2000; // $20 CAD
export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

/** @deprecated Legacy one-time purchase - no longer used */
export const PAID_UPLOADS_PER_PURCHASE = 10;
/** @deprecated Legacy one-time purchase - no longer used */
export const PRICE_UPLOADS_CENTS = 500;
