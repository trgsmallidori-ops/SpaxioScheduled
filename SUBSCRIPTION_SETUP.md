# Subscription Setup Checklist

Before deploying the $20/year subscription, complete these steps:

## 1. Run Database Migration

In **Supabase Dashboard → SQL Editor**, run the contents of:

```
supabase/migrations/add_subscription_fields.sql
```

This adds subscription columns to `user_quota` and `payments`.

## 2. Configure Stripe Webhook

In **Stripe Dashboard → Developers → Webhooks**, ensure your webhook endpoint listens for:

- `checkout.session.completed` (already used)
- `invoice.paid` (for annual renewals)
- `customer.subscription.updated` (status changes)
- `customer.subscription.deleted` (subscription ended)

If you create a new webhook, copy the signing secret to `STRIPE_WEBHOOK_SECRET` in your environment.

## 3. Verify Environment Variables

Ensure `.env` (or your deployment env) has:

```
STRIPE_SUBSCRIPTION_PRICE_ID=price_xxxxxxxxxxxxx
```

This was set when you ran `npm run create-stripe-subscription`. If you need to create a new price, run that script again.

## 4. Test the Flow

1. Start the app: `npm run dev`
2. Sign up or log in
3. Use your 2 free uploads
4. Click "Subscribe — $20/year" and complete checkout (use Stripe test card `4242 4242 4242 4242`)
5. Verify you see "Subscription activated! You have 50 uploads this year."
6. Upload a syllabus and confirm it uses subscription quota

## 5. Test Webhooks Locally (Optional)

Use Stripe CLI to forward webhooks to localhost:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then trigger test events from the Stripe Dashboard.
