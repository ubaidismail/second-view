# Second View

Responsive web MVP built with Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Main routes:

- `/` — landing page
- `/login` — email verification at signup, then email-and-password sign-in
- `/set-password` — set or reset your password after email verification
- `/feed` — public feed, pending post submission, and reports
- `/profile` — edit your account’s community display name
- `/mentor-apply` — authenticated mentor application and private credential upload
- `/admin` — moderation and mentor review queues (admin role required)

## Supabase configuration

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable or browser code. Signup verifies the email by magic link and then asks the user to set a password; later sign-ins use email and password. Password reset uses a one-time email link. Add `http://localhost:3000/auth/callback` to Supabase Auth's allowed redirect URLs for local development, and add the deployed callback URL before production.

The initial migration at `supabase/migrations/20261003000000_core_schema.sql` creates the app schema, RLS policies, filtered public views, starter categories, and private `mentor-proof` storage. This migration has already been applied to the configured project. Do not run it again; use a new migration for future schema changes.

After creating your first account, promote that account to admin in the Supabase SQL Editor. Find the account UUID under Authentication → Users, then run:

```sql
update public.profiles
set role = 'admin'
where id = '<your auth.users UUID>';
```

## Current backend scope

Email verification and password authentication, editable community display name, pending post submission, community reporting, mentor application submission, private proof-file upload, and the admin review queues are connected to Supabase. Posts remain pending until moderation. The feed reads approved public posts and responses through filtered database views.

Full thread response/follow-up flows and the helpful/relief interaction are not yet connected. The starter crisis keyword trigger is only a routing aid; it is not a reliable crisis assessment. Keep human moderation and crisis-resource messaging in place, and do not use this MVP to collect real sensitive disclosures until the full workflow and security posture have been reviewed.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Deploy to Vercel

Import the GitHub repository into Vercel using the Next.js preset. Add these environment variables in Vercel for **Production**, **Preview**, and **Development**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

After the first Vercel deployment, add `https://<your-vercel-domain>/auth/callback` to Supabase **Authentication → URL Configuration → Redirect URLs**, and set the production site URL there. Add the same callback URL for preview deployments only if you intend to test email authentication on previews. Redeploy after setting environment variables or changing the domain.

Never commit `.env.local` or a Supabase secret/service-role key. `.env.example` contains placeholders only.
