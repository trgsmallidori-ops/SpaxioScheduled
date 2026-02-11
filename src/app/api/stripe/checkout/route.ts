import { createClient } from "@/lib/supabase/server";
import { stripe, PAID_UPLOADS_PER_PURCHASE, PRICE_UPLOADS_CENTS } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

const PRODUCT_BY_LOCALE = {
  en: { name: "10 more uploads", description: "10 additional syllabus uploads for SpaxioScheduled" },
  fr: { name: "10 téléversements de plus", description: "10 téléversements de syllabus supplémentaires pour SpaxioScheduled" },
} as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!stripe) {
      console.error("[stripe/checkout] STRIPE_SECRET_KEY is missing");
      return NextResponse.json(
        { error: "Payments are not configured. Add STRIPE_SECRET_KEY in your environment (e.g. Vercel)." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const locale = body.locale === "fr" ? "fr" : "en";
    const product = PRODUCT_BY_LOCALE[locale];

    const { data: quota } = await supabase
      .from("user_quota")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      locale,
      automatic_tax: { enabled: true },
      adaptive_pricing: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: PRICE_UPLOADS_CENTS,
            product_data: {
              name: product.name,
              description: product.description,
              metadata: { uploads: String(PAID_UPLOADS_PER_PURCHASE) },
            },
          },
        },
      ],
      success_url: `${appUrl}/dashboard?success=1`,
      cancel_url: `${appUrl}/dashboard?canceled=1`,
      customer_email: quota?.stripe_customer_id ? undefined : user.email,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      payment_intent_data: {
        receipt_email: user.email,
      },
    });

    if (!session.url) {
      console.error("[stripe/checkout] Stripe did not return a session URL");
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/checkout]", message);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? message
            : "Checkout failed. Check your Stripe configuration (STRIPE_SECRET_KEY).",
      },
      { status: 500 }
    );
  }
}
