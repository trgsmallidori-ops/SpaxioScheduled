import { createClient } from "@/lib/supabase/server";
import { stripe, SUBSCRIPTION_PRICE_ID } from "@/lib/stripe";
import { apiError, handleUnexpectedError } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const checkoutBodySchema = z.object({ locale: z.enum(["en", "fr"]).optional() });

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return apiError("Unauthorized", 401);
    }

    if (!stripe) {
      console.error("[stripe/checkout] STRIPE_SECRET_KEY is missing");
      return apiError(
        "Payments are not configured. Add STRIPE_SECRET_KEY in your environment (e.g. Vercel).",
        503
      );
    }

    if (!SUBSCRIPTION_PRICE_ID) {
      console.error("[stripe/checkout] STRIPE_SUBSCRIPTION_PRICE_ID is missing");
      return apiError(
        "Subscription price not configured. Run npm run create-stripe-subscription and add STRIPE_SUBSCRIPTION_PRICE_ID to .env.",
        503
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parsed = checkoutBodySchema.safeParse(rawBody);
    const locale = parsed.success && parsed.data.locale === "fr" ? "fr" : "en";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      locale,
      automatic_tax: { enabled: true },
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard?success=1`,
      cancel_url: `${appUrl}/dashboard?canceled=1`,
      client_reference_id: user.id,
      metadata: { user_id: user.id },
    });

    if (!session.url) {
      console.error("[stripe/checkout] Stripe did not return a session URL");
      return apiError("Could not create checkout session", 500);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return handleUnexpectedError(err, "stripe/checkout");
  }
}
