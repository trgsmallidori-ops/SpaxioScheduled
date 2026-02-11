import { createClient } from "@/lib/supabase/server";
import { stripe, PAID_UPLOADS_PER_PURCHASE, PRICE_UPLOADS_CENTS } from "@/lib/stripe";
import { apiError, handleUnexpectedError } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PRODUCT_BY_LOCALE = {
  en: { name: "10 more uploads", description: "10 additional syllabus uploads for SpaxioScheduled" },
  fr: { name: "10 téléversements de plus", description: "10 téléversements de syllabus supplémentaires pour SpaxioScheduled" },
} as const;

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

    const rawBody = await request.json().catch(() => ({}));
    const parsed = checkoutBodySchema.safeParse(rawBody);
    const locale = parsed.success && parsed.data.locale === "fr" ? "fr" : "en";
    const product = PRODUCT_BY_LOCALE[locale];

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
