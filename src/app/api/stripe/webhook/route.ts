import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, PAID_UPLOADS_PER_PURCHASE } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook error" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id || session.client_reference_id;
    if (!userId) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = createAdminClient();
    await admin.from("payments").insert({
      user_id: userId,
      stripe_payment_id: session.payment_intent as string || session.id,
      amount_cents: session.amount_total ?? 0,
      uploads_granted: PAID_UPLOADS_PER_PURCHASE,
    });

    const { data: quota } = await admin
      .from("user_quota")
      .select("paid_uploads_purchased")
      .eq("user_id", userId)
      .single();

    await admin
      .from("user_quota")
      .update({
        paid_uploads_purchased: (quota?.paid_uploads_purchased ?? 0) + PAID_UPLOADS_PER_PURCHASE,
        stripe_customer_id: session.customer as string || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  return NextResponse.json({ received: true });
}
