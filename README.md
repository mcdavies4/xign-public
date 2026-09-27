# Signature capture — public version

Multi-tenant: anyone can sign up with their email, generate signing links, and
only ever sees their own requests. No document, no PDF — just a captured
signature image per link.

## What changed from the private version

- **Real accounts**: email magic-link sign-in via Supabase Auth (no passwords).
- **Data isolation**: every request row has a `user_id`; Row Level Security
  ensures you can only ever read/write your own rows — enforced by the
  database, not just app code.
- **Public sign page is now API-mediated**: the `/sign/[token]` page no longer
  queries Supabase directly (it has no permission to). It calls
  `/api/signatures/[token]` (GET) and `/api/signatures` (POST), both of which
  run server-side with a service-role key that can act on behalf of an
  unauthenticated signer without exposing your database to the browser.
- **Basic abuse guard**: each user is capped at 100 new links per rolling 24h
  — generous for real use, cheap insurance against runaway scripts.
- **A signed link can't be reused**: submitting a signature twice for the same
  token is rejected once it's already marked "signed".

## Setup

1. **Supabase project**
   - Run `supabase-schema.sql` in the SQL Editor.
   - In Authentication → Providers, confirm **Email** is enabled with
     "Confirm email" and magic-link sign-in on (default).
   - In Authentication → URL Configuration, add your site's `/auth/callback`
     URL (e.g. `https://yourdomain.com/auth/callback`) to the redirect
     allow-list — magic links are rejected otherwise.
   - Copy from Settings → API: **Project URL**, **anon public key**, and the
     **service_role key** (keep this one secret — never expose it client-side).

2. **Install dependencies**
   ```
   npm install @supabase/ssr @supabase/supabase-js
   ```
   (You no longer need the old `@supabase/supabase-js`-only setup — `@supabase/ssr`
   supersedes it for session handling across client/server/middleware.)

3. **Environment variables** (`.env.local`, and matching ones in Vercel):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # no NEXT_PUBLIC_ prefix — server only
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

4. **Files** — same paths as before, plus new ones:
   ```
   middleware.ts                          (replaces the old basic-auth version)
   lib/supabase/client.ts
   lib/supabase/server.ts
   lib/supabase/admin.ts
   app/page.tsx                           (new landing page)
   app/login/page.tsx                     (new)
   app/auth/callback/route.ts             (new)
   app/admin/page.tsx                     (replaces old)
   app/api/signatures/route.ts            (replaces old)
   app/api/signatures/[token]/route.ts    (new)
   app/sign/[token]/page.tsx              (replaces old)
   components/SignaturePad.tsx            (unchanged)
   ```
   Delete `lib/supabase.ts` from the old version — it's replaced by the three
   files under `lib/supabase/`.

5. **Test locally**
   ```
   npm run dev
   ```
   Visit `/`, click "Get started", sign in with your email, check your inbox
   for the magic link, land on `/admin`, generate a link, open it in another
   tab, sign it, confirm it shows up back on `/admin`.

## Notes on going further

- **Rate limit is per-user, not per-IP** — someone could still create many
  accounts to get around the 100/day cap. Fine for a free tool with low
  abuse incentive; revisit if it ever gets popular.
- **Storage cleanup** — old signature images aren't automatically deleted.
  Fine at small scale; worth a periodic cleanup job later.

## Email delivery (optional)

Automatic emails now send when you provide a signer's email — but only work
for real recipients once you've verified a sending domain with Resend.
Without one, Resend only lets you email your own account's address (useful
for testing, not for real signers).

1. Sign up at resend.com, get an API key.
2. Add `RESEND_API_KEY` to your env vars (locally and in Vercel).
3. `npm install resend`
4. When you're ready to email real signers: Resend dashboard → Domains → add
   and verify a domain you own, then update the `from` address in
   `lib/resend.ts` to use it (e.g. `notifications@yourdomain.com`).

Until a domain's verified, the link still always works via manual
copy/paste from the dashboard — email is a convenience layer on top, not a
requirement.

## Legal pages

`/privacy` and `/terms` are included and linked from the landing page. Read
them over and adjust the wording (especially the contact section) to reflect
your actual business details before treating this as production-ready for
the public.

## Supabase free tier — what actually matters here

As of mid-2026, the free tier gives you 500 MB database, 1 GB file storage
(signature images), 5 GB egress/month, 50,000 monthly active users, and 2
active projects per organization.

The one that will actually bite you first: **free projects pause after 7
days of inactivity**. If nobody uses the tool for a week, it goes dark until
someone manually un-pauses it from the Supabase dashboard — visitors would
hit an error, not a graceful message. If you want this genuinely always-on
for the public, that's the main reason to eventually upgrade to Pro
($25/month) — not storage or bandwidth, which you're unlikely to hit at
small scale with plain signature PNGs.

**This is now handled automatically** — see "Keeping Supabase awake" below.

## Keeping Supabase awake

A Vercel Cron job hits `/api/keepalive` once a day (the max frequency
allowed on Vercel's free Hobby tier), which runs a trivial database query —
enough to count as activity and stop the 7-day auto-pause from ever
triggering.

Setup:
1. Add `CRON_SECRET` to your env vars — any random string works, e.g.
   generate one with `openssl rand -hex 32` or just mash the keyboard.
   Add the same value in Vercel too.
2. `vercel.json` (included) registers the daily schedule automatically on
   deploy — no dashboard configuration needed.
3. Confirm it's working: Vercel dashboard → your project → Cron Jobs tab,
   should show `/api/keepalive` scheduled and its run history after the
   first day.

## Abuse reporting

Signers see a small "Report this request" link at the bottom of the
signing page. If used, it emails you directly with the token, which
account requested it, and their stated reason — no dashboard or database
table needed.

Setup:
1. Add `REPORT_EMAIL` to your env vars — the address that should receive
   reports (e.g. your own email).
2. Uses the same `RESEND_API_KEY` you already configured for signing-link
   emails — no separate setup.

