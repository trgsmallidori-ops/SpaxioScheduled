import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, SUBSCRIPTION_UPLOADS_PER_YEAR } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

async function updateUserQuotaSubscription(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const status = subscription.status as "active" | "canceled" | "past_due" | "incomplete";
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error } = await admin
    .from("user_quota")
    .update({
      subscription_status: status,
      subscription_id: subscription.id,
      subscription_current_period_start: periodStart,
      subscription_current_period_end: periodEnd,
      subscription_uploads_quota: SUBSCRIPTION_UPLOADS_PER_YEAR,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return error;
}

/**
 * Stripe webhook: handles subscription lifecycle events.
 * - checkout.session.completed: initial subscription creation
 * - invoice.paid: subscription renewal (reset uploads)
 * - customer.subscription.updated: status changes
 * - customer.subscription.deleted: subscription ended
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  if (!stripe) {
    console.error("[stripe/webhook] Stripe client not configured");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error("[stripe/webhook] Failed to read body", e);
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  if (!rawBody || rawBody.length === 0) {
    return NextResponse.json(
      { error: "Empty body" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const userId = (session.metadata?.user_id as string) || (session.client_reference_id as string) || null;

    if (!userId) {
      console.error("[stripe/webhook] checkout.session.completed missing user_id and client_reference_id", sessionId);
      return NextResponse.json(
        { error: "Missing user reference" },
        { status: 400 }
      );
    }

    if (session.mode !== "subscription" || !session.subscription) {
      console.error("[stripe/webhook] checkout.session.completed is not a subscription", sessionId);
      return NextResponse.json({ received: true });
    }

    try {
      const { data: existing } = await admin
        .from("payments")
        .select("id")
        .eq("stripe_payment_id", sessionId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ["items.data.price"],
      });

      const amountTotal = typeof session.amount_total === "number" ? session.amount_total : 0;

      await admin.from("payments").insert({
        user_id: userId,
        stripe_payment_id: sessionId,
        amount_cents: amountTotal,
        uploads_granted: SUBSCRIPTION_UPLOADS_PER_YEAR,
        payment_type: "subscription",
        subscription_id: subscription.id,
      });

      const updateErr = await updateUserQuotaSubscription(admin, userId, subscription);
      if (updateErr) {
        console.error("[stripe/webhook] user_quota update failed", updateErr);
        return NextResponse.json(
          { error: "Failed to activate subscription" },
          { status: 500 }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[stripe/webhook] Processing error", message, err);
      return NextResponse.json(
        { error: "Processing failed" },
        { status: 500 }
      );
    }
  } else if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    if (!invoice.subscription) {
      return NextResponse.json({ received: true });
    }

    try {
      const { data: quota } = await admin
        .from("user_quota")
        .select("user_id")
        .eq("subscription_id", invoice.subscription)
        .maybeSingle();

      if (!quota) {
        return NextResponse.json({ received: true });
      }

      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

      const { error } = await admin
        .from("user_quota")
        .update({
          subscription_uploads_used: 0,
          subscription_current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", quota.user_id);

      if (error) {
        console.error("[stripe/webhook] invoice.paid user_quota update failed", error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[stripe/webhook] invoice.paid processing error", message, err);
    }
  } else if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      const { data: quota } = await admin
        .from("user_quota")
        .select("user_id")
        .eq("subscription_id", subscription.id)
        .maybeSingle();

      if (!quota) {
        return NextResponse.json({ received: true });
      }

      const status = subscription.status as "active" | "canceled" | "past_due" | "incomplete";
      const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      await admin
        .from("user_quota")
        .update({
          subscription_status: status,
          subscription_current_period_start: periodStart,
          subscription_current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", quota.user_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[stripe/webhook] customer.subscription.updated error", message, err);
    }
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      const { error } = await admin
        .from("user_quota")
        .update({
          subscription_status: null,
          subscription_id: null,
          subscription_current_period_start: null,
          subscription_current_period_end: null,
          subscription_uploads_quota: 0,
          subscription_uploads_used: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("subscription_id", subscription.id);

      if (error) {
        console.error("[stripe/webhook] customer.subscription.deleted update failed", error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[stripe/webhook] customer.subscription.deleted error", message, err);
    }
  }

  return NextResponse.json({ received: true });
}
