import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, PAID_UPLOADS_PER_PURCHASE } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

/**
 * Stripe webhook: verifies signature with raw body, then handles successful
 * checkout to credit paid uploads. Idempotent via payments.stripe_payment_id.
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

    try {
      const admin = createAdminClient();

      const { data: existing } = await admin
        .from("payments")
        .select("id")
        .eq("stripe_payment_id", sessionId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const amountTotal = typeof session.amount_total === "number" ? session.amount_total : 0;

      const { error: insertErr } = await admin.from("payments").insert({
        user_id: userId,
        stripe_payment_id: sessionId,
        amount_cents: amountTotal,
        uploads_granted: PAID_UPLOADS_PER_PURCHASE,
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          return NextResponse.json({ received: true, duplicate: true });
        }
        console.error("[stripe/webhook] payments insert failed", insertErr);
        return NextResponse.json(
          { error: "Failed to record payment" },
          { status: 500 }
        );
      }

      const { data: quota } = await admin
        .from("user_quota")
        .select("paid_uploads_purchased")
        .eq("user_id", userId)
        .single();

      const current = (quota?.paid_uploads_purchased ?? 0) as number;
      const { error: updateErr } = await admin
        .from("user_quota")
        .update({
          paid_uploads_purchased: current + PAID_UPLOADS_PER_PURCHASE,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateErr) {
        console.error("[stripe/webhook] user_quota update failed", updateErr);
        return NextResponse.json(
          { error: "Failed to credit uploads" },
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
  }

  return NextResponse.json({ received: true });
}
