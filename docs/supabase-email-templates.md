# Supabase Email Templates – SpaxioScheduled Branding

Copy these templates into **Supabase Dashboard → Authentication → Email Templates**.

**Important:** Set **Site URL** in **Authentication → URL Configuration** to your app URL (e.g. `https://spaxioscheduled.com`). The logo uses `{{ .SiteURL }}/logo.png`.

---

## 1. Confirm signup

**Subject:** `Confirm your email – SpaxioScheduled`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Nunito', system-ui, -apple-system, sans-serif; background: #faf8f5; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <img src="{{ .SiteURL }}/logo.png" alt="SpaxioScheduled" style="height: 40px; margin-bottom: 24px; display: block;">
    <h1 style="color: #2c2c28; font-size: 22px; margin: 0 0 8px;">Confirm your email</h1>
    <p style="color: #6b6b65; margin: 8px 0 20px; line-height: 1.5;">Thanks for signing up for SpaxioScheduled. Click the button below to verify your email address and get started.</p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #4255ff; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify email</a>
    <p style="font-size: 13px; color: #9a9a94; margin-top: 24px;">If you didn't create an account, you can ignore this email.</p>
    <p style="font-size: 12px; color: #9a9a94; margin-top: 16px;">SpaxioScheduled – your syllabus, one calendar.</p>
  </div>
</body>
</html>
```

---

## 2. Magic Link

**Subject:** `Your login link – SpaxioScheduled`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Nunito', system-ui, -apple-system, sans-serif; background: #faf8f5; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <img src="{{ .SiteURL }}/logo.png" alt="SpaxioScheduled" style="height: 40px; margin-bottom: 24px; display: block;">
    <h1 style="color: #2c2c28; font-size: 22px; margin: 0 0 8px;">Sign in to SpaxioScheduled</h1>
    <p style="color: #6b6b65; margin: 8px 0 20px; line-height: 1.5;">Click the button below to sign in. This link expires soon.</p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #4255ff; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Log in</a>
    <p style="font-size: 13px; color: #9a9a94; margin-top: 24px;">If you didn't request this link, you can ignore this email.</p>
    <p style="font-size: 12px; color: #9a9a94; margin-top: 16px;">SpaxioScheduled – your syllabus, one calendar.</p>
  </div>
</body>
</html>
```

---

## 3. Reset Password

**Subject:** `Reset your password – SpaxioScheduled`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Nunito', system-ui, -apple-system, sans-serif; background: #faf8f5; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <img src="{{ .SiteURL }}/logo.png" alt="SpaxioScheduled" style="height: 40px; margin-bottom: 24px; display: block;">
    <h1 style="color: #2c2c28; font-size: 22px; margin: 0 0 8px;">Reset your password</h1>
    <p style="color: #6b6b65; margin: 8px 0 20px; line-height: 1.5;">We received a request to reset the password for {{ .Email }}. Click the button below to set a new password.</p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #4255ff; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset password</a>
    <p style="font-size: 13px; color: #9a9a94; margin-top: 24px;">If you didn't request a password reset, you can ignore this email.</p>
    <p style="font-size: 12px; color: #9a9a94; margin-top: 16px;">SpaxioScheduled – your syllabus, one calendar.</p>
  </div>
</body>
</html>
```

---

## 4. Change Email Address

**Subject:** `Confirm your new email – SpaxioScheduled`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Nunito', system-ui, -apple-system, sans-serif; background: #faf8f5; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <img src="{{ .SiteURL }}/logo.png" alt="SpaxioScheduled" style="height: 40px; margin-bottom: 24px; display: block;">
    <h1 style="color: #2c2c28; font-size: 22px; margin: 0 0 8px;">Confirm your new email</h1>
    <p style="color: #6b6b65; margin: 8px 0 20px; line-height: 1.5;">You requested to change your email to {{ .NewEmail }}. Click the button below to confirm this change.</p>
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #4255ff; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Confirm email change</a>
    <p style="font-size: 13px; color: #9a9a94; margin-top: 24px;">If you didn't request this change, you can ignore this email.</p>
    <p style="font-size: 12px; color: #9a9a94; margin-top: 16px;">SpaxioScheduled – your syllabus, one calendar.</p>
  </div>
</body>
</html>
```

---

## Supabase Dashboard configuration

### URL Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Open **Authentication** → **URL Configuration**.
3. Set **Site URL** to your app URL:
   - Production: `https://spaxioscheduled.com`
   - Local dev: `http://localhost:3000`
4. Under **Redirect URLs**, add:
   - `https://spaxioscheduled.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for local testing)

The Site URL is used for `{{ .SiteURL }}` in templates (e.g. logo at `{{ .SiteURL }}/logo.png`).

### Email verification flow

When users click the verify link in the email:

1. Supabase verifies the token
2. User is redirected to `/auth/callback?code=...`
3. The callback exchanges the code for a session and redirects to `/auth/confirm`
4. The confirmation page shows "Email confirmed! Return to your previous tab" and the user is logged in

### Applying email templates

1. Open **Authentication** → **Email Templates**.
2. For each template (Confirm signup, Magic Link, Reset Password, Change Email Address):
   - Paste the subject line into the **Subject** field.
   - Paste the HTML body into the **Body** field.
   - Ensure the template type is set to **HTML** (not plain text).
3. Click **Save** for each template.

## Template variables reference

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Full verification/reset link |
| `{{ .SiteURL }}` | Your app URL from URL Configuration |
| `{{ .Email }}` | User's email address |
| `{{ .NewEmail }}` | New email (Change Email template only) |
| `{{ .Token }}` | 6-digit OTP (alternative to link) |
