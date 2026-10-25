# Second View

Responsive web MVP built with Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase.

See the [Engineering Handoff](docs/ENGINEERING_HANDOFF.md) for the source-file map, environment setup, Supabase administration, deployment guidance, and current limitations.

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

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GROQ_API_KEY`, and `OPENAI_MODEL`. The Groq key is server-only; never add a `NEXT_PUBLIC_` prefix or commit local credentials. Signup verifies the email by magic link and then asks the user to set a password; later sign-ins use email and password. Password reset uses a one-time email link. Add `http://localhost:3000/auth/callback` to Supabase Auth's allowed redirect URLs for local development, and add the deployed callback URL before production.

The initial migration at `supabase/migrations/20261003000000_core_schema.sql` creates the app schema, RLS policies, filtered public views, starter categories, and private `mentor-proof` storage. For a new Supabase project, apply this migration once in the SQL Editor. If the schema is already installed, do not run it again; use a new migration for future schema changes.

After creating your first account, promote that account to admin in the Supabase SQL Editor. Find the account UUID under Authentication → Users, then run:

```sql
update public.profiles
set role = 'admin'
where id = '<your auth.users UUID>';
```

## Current backend scope

Email verification and password authentication, editable community display name, pending post submission, community reporting, mentor application submission, private proof-file upload, and the admin review queues are connected to Supabase. Posts remain pending until moderation. The feed reads approved public posts and responses through filtered database views. The feed also offers optional AI drafting/refinement; the title and draft are sent to Groq only when a signed-in user clicks the AI control.

Mentor response authoring, seeker follow-up submission, and the helpful/relief interaction are not yet connected. The crisis keyword flag is only a routing signal and is not a reliable assessment or emergency monitoring. This MVP has not had an independent security, privacy, clinical, or legal review; see the Engineering Handoff before inviting users to submit sensitive disclosures.

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
- `GROQ_API_KEY` (server-only; required for AI writing assistance)
- `OPENAI_MODEL` (currently `openai/gpt-oss-120b`)

After the first Vercel deployment, add `https://<your-vercel-domain>/auth/callback` to Supabase **Authentication → URL Configuration → Redirect URLs**, and set the production site URL there. Add the same callback URL for preview deployments only if you intend to test email authentication on previews. Redeploy after setting environment variables or changing the domain.

Keep `.env.local` and all secret/service-role keys out of the public repository. `.env.example` contains placeholders only.
