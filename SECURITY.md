# Security

## Build

The project builds successfully with `npm run build`.

## Security measures in place

### Headers (Next.js + middleware)
- **X-Frame-Options: DENY** — Prevents clickjacking (site cannot be embedded in iframes).
- **X-Content-Type-Options: nosniff** — Prevents MIME sniffing.
- **Referrer-Policy: strict-origin-when-cross-origin** — Limits referrer data sent off-site.
- **Permissions-Policy** — Disables camera, microphone, geolocation.
- **Strict-Transport-Security (HSTS)** — Enforces HTTPS when supported by the host.

### Authentication & authorization
- All protected routes (dashboard, account, admin, creator) require login; middleware redirects unauthenticated users to `/login`.
- API routes that modify data require `supabase.auth.getUser()` and return 401 when not logged in.
- Admin and creator APIs check role (admin/creator) before returning sensitive data.
- Course/event updates and deletes are scoped to the current user (e.g. `eq("user_id", user.id)"`).

### API hardening
- **Parse syllabus:** Max file size 15 MB; only PDF and Word (.docx) allowed; file type validated.
- **Chat:** Request body parsed safely; message length capped at 4000 characters.
- **Class time (PATCH):** Course ID validated as UUID; JSON body parsed in try/catch; max 20 schedule blocks per request.
- **Cron reminders:** Requires `Authorization: Bearer <CRON_SECRET>`; returns 503 if `CRON_SECRET` is not set.
- **Stripe webhook:** Verifies signature using `STRIPE_WEBHOOK_SECRET` before processing.

### Data & secrets
- `.env` is in `.gitignore`; never commit secrets (Supabase keys, Stripe keys, OpenAI key, CRON_SECRET).
- Supabase RLS (row-level security) should be enabled on all tables so the anon key cannot access other users’ data.
- Service role key is used only in server-side API routes and cron, never exposed to the client.

### Recommendations
1. Use **HTTPS** in production (Vercel/hosts provide it).
2. Set strong **CRON_SECRET** and **STRIPE_WEBHOOK_SECRET** in production.
3. Keep **NEXT_PUBLIC_*** env vars limited to non-secret values (e.g. app URL, Supabase URL, anon key).
4. Run `npm audit` periodically and fix high/critical vulnerabilities.
5. In production, avoid exposing stack traces (the app already hides details when `NODE_ENV !== "development"`).
