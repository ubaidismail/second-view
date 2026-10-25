# Second View — Engineering Handoff

**Purpose:** Developer and operator guide for the current web MVP.  
**Updated:** 2026-10-24  
**Application:** Next.js App Router, TypeScript, React, Tailwind CSS, Supabase, Groq

## 1. Project status

Second View is a responsive web application for pseudonymous reflections, a moderated feed, and mentor applications. It is not a native mobile app. The application uses Supabase Auth for identity and passwords, PostgreSQL for application data, and Supabase Storage for private mentor credential files.

The current local worktree contains uncommitted AI-writing changes and documentation changes. Vercel deploys the commit pushed to the connected Git branch; local edits are not part of the deployed site until they are committed and pushed.

## 2. Routes and user flows

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product landing page | Public |
| `/login` | Signup, password sign-in, and password-reset request | Public |
| `/auth/callback` | Exchanges the Supabase one-time auth code for a session | Auth callback |
| `/set-password` | Set a password after signup verification or a password reset | Valid auth session required to save |
| `/feed` | Browse approved reflections, submit a pending reflection, and report a post | Browse public; submit/report signed-in |
| `/profile` | Edit the community display name | Signed-in |
| `/mentor-apply` | Submit a mentor application and private credential proof | Signed-in |
| `/admin` | Review pending posts, responses, mentor applications, and reports | Admin role |
| `/admin/proof/[userId]` | View an applicant's private credential proof through a short-lived signed URL | Admin role only |

### Authentication

1. A new account is created with Supabase Auth email verification.
2. The email link returns through `/auth/callback`; signup then leads to `/set-password`.
3. Future sign-ins use email and password. Password reset is requested on `/login`, returns through the same callback, and leads to `/set-password`.
4. Passwords are managed by Supabase Auth. Do not add a plaintext password column to `public.profiles` or another app table.

The reset/signup redirect uses the current browser origin in `app/login/auth-form.tsx`. Supabase must allow the exact callback URL for each domain in **Authentication → URL Configuration → Redirect URLs**. Set Supabase **Site URL** to the canonical public domain so it is the fallback destination.

### Reflection and moderation flow

- Signed-in seekers submit a title, body, category, pseudonym, and optional sensitivity veil.
- New posts are stored with `pending` status. Only approved content appears in the public feed views.
- The feed currently offers explicit AI draft/refine assistance. On click, the title and current body are sent to Groq. The suggestion replaces the editable draft only after a successful response; users should review it before submitting.
- Users can report posts. Admins can review the post and report queues.

### Mentor flow

- Signed-in applicants submit their professional details, focus areas, and an optional proof document to the private `mentor-proof` bucket.
- An admin manually approves or rejects applications. Approval synchronizes the profile role to `mentor` through a database trigger.
- The application has admin review for responses, but mentor response authoring, seeker follow-ups, and the helpful/relief interaction are not complete product flows yet.

## 3. Source tree map

All paths below are relative to the repository root.

| Path | Edit this for |
| --- | --- |
| `app/page.tsx` | Landing page sections and copy |
| `app/login/page.tsx` | Login page layout |
| `app/login/auth-form.tsx` | Signup, password login, password reset, and auth redirect behavior |
| `app/auth/callback/route.ts` | Supabase callback code exchange and post-auth destination |
| `app/set-password/page.tsx` | Set/reset password form and Supabase password update |
| `app/feed/page.tsx` | Feed UI, composer, AI button, filters, and report UI |
| `app/feed/actions.ts` | Server-side Groq request, post creation, and report insertion |
| `app/profile/page.tsx` | Profile/community display-name UI and update |
| `app/mentor-apply/page.tsx` | Mentor application form and proof upload UI |
| `app/mentor-apply/actions.ts` | Server-side mentor application submission |
| `app/admin/page.tsx` | Admin review dashboard and queue presentation |
| `app/admin/actions.ts` | Admin-only post, response, application, and report decisions |
| `app/admin/proof/[userId]/route.ts` | Authorization and signed URL for credential proof |
| `app/components/site-header.tsx` | Shared app header/navigation |
| `app/components/site-footer.tsx` | Shared footer and footer links |
| `app/components/site-brand.tsx` | Shared brand mark/name |
| `app/components/moderation-notice.tsx` | Shared moderation note |
| `app/layout.tsx` | Root layout, metadata, global CSS imports |
| `app/globals.css` | Application-wide layout, component, and responsive styles |
| `app/prototype.css` | Admin/prototype-specific styles |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client and cookie handling |
| `middleware.ts` | Supabase session refresh/request middleware |
| `supabase/migrations/20261003000000_core_schema.sql` | Initial database schema, RLS, views, triggers, categories, and storage policies |
| `.env.example` | Names of required environment variables; placeholders only |
| `next.config.ts` | Next.js configuration. No custom Webpack settings are currently present. |

### Editing workflow

1. Edit the tracked source file listed above; do not edit `.next/` or browser bundle output. Those are generated build/dev artifacts.
2. Run the app locally with `pnpm dev` if you want to inspect changes at `http://localhost:3000`.
3. Commit and push changes to the Vercel-connected branch to deploy them. Review Vercel's build and function logs when a deployed route fails.

## 4. Environment configuration

Copy `.env.example` to `.env.local` for local development. Add the same applicable variables to Vercel under **Project → Settings → Environment Variables** for the environments where the feature should run.

| Variable | Secret? | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL, used by browser and server clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Supabase publishable/anon client key; database access remains governed by RLS |
| `GROQ_API_KEY` | **Yes** | Server-only Groq API credential; never rename it to a `NEXT_PUBLIC_` variable |
| `OPENAI_MODEL` | No | Groq model identifier; currently `openai/gpt-oss-120b` |

After changing Vercel environment variables, redeploy. Restart the local dev server after changing `.env.local`. Never commit `.env.local`, provider secrets, or a Supabase service-role/secret key.

### AI data handling

The Groq key is read only in `app/feed/actions.ts`. AI writing assistance is optional and only calls the provider after a user clicks the control. The title and body text are sent to Groq for that request. Make this processor/data flow clear to users and review the provider's current terms and data settings before accepting real sensitive disclosures.

## 5. Supabase setup and administration

### Initial schema

The initial migration is `supabase/migrations/20261003000000_core_schema.sql`. Apply it once to a new Supabase project using the Supabase SQL Editor. Do not rerun the initial migration against an already initialized database; write a new migration for future schema changes.

Main tables:

- `profiles` — one row per Supabase Auth user; community display name and app role (`seeker`, `mentor`, `admin`).
- `categories` — active feed channels.
- `posts` — pseudonymous seeker reflections and moderation state.
- `mentor_applications` — private application and credential metadata.
- `responses`, `followups`, `reports` — response/review/report data models.

Public feed access is through filtered `public_posts`, `public_responses`, and `public_followups` views. RLS policies protect base tables. The `mentor-proof` Storage bucket is private and guarded by storage policies.

### Promote the first admin

1. Create and verify the account through the app.
2. In Supabase **Authentication → Users**, copy its user UID.
3. In **SQL Editor**, run:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE_AUTH_USER_UID_HERE';
```

Sign out and back in, then open `/admin`. Do not add an admin role selector to public signup.

## 6. Run, deploy, and diagnose

### Local development

This project uses pnpm (`pnpm-lock.yaml`). From the repository root:

```sh
pnpm install
pnpm dev
```

The Next.js dev server compiles routes on request and writes generated output to `.next/`. The `eval-source-map` banner belongs to development debugging output; it is not source code and is not a file to edit.

If local development shows `__webpack_modules__[moduleId] is not a function` after switching between dev and production output, stop the local dev server, remove the generated `.next/` directory, then start `pnpm dev` again. Next.js regenerates `.next/`. Do not remove source files or edit generated chunks to address this error.

### Vercel deployment

- Vercel builds the source commit connected to the project. Local uncommitted changes are not deployed.
- Confirm Vercel's root directory is the repository root and the framework preset is Next.js.
- Configure Supabase and Groq environment variables for the target environment.
- Add `https://YOUR_PUBLIC_DOMAIN/auth/callback` to Supabase's allowed redirect URLs and set the Supabase Site URL to the canonical public domain.
- If a deployment fails at runtime, inspect **Vercel → Project → Deployments → deployment → Functions/Runtime Logs** for the failing route and exception. If build artifacts appear stale, redeploy without the existing build cache.

### What the current runtime error check established

After removing the local generated `.next/` directory and starting a fresh dev server, the landing page, feed, login, profile, mentor application, and set-password route rendered successfully. The admin route redirected to login as expected for a signed-out visitor. The local server log showed successful route responses and no reproduction of the reported module-loader exception. This does not verify a remote Vercel deployment; its runtime logs and failing URL are needed to pinpoint a deployed-only error.

## 7. Product and operational limitations

- The app is an MVP and has not had an independent security, privacy, clinical, or legal review.
- Public pseudonyms hide the sign-in email from public feed views; they do not make a post unknown to the service operator. Auth identity and post authorship remain linked in the database for authorization/moderation.
- Do not promise end-to-end encryption: the current app stores post bodies in Supabase and sends selected drafts to Groq when AI assistance is used.
- Mentor credentials are intended for manual review; the app does not perform an authoritative license audit automatically.
- Mentor response authoring, follow-up submission, and helpful/relief interactions are not complete flows despite their database tables.
- Crisis keyword flags are only a routing signal, not assessment or emergency monitoring. The app does not provide a guaranteed response time.

Before inviting real users to submit sensitive stories, complete a privacy/security review, test RLS and authorization using separate accounts, establish moderation and incident-response ownership, and confirm applicable provider/legal requirements.

## 8. Delivery history in this repository

- Built a responsive Next.js web application with landing, sign-in, feed, profile, mentor application, and admin review routes.
- Added Supabase Auth, profile creation, Postgres schema/RLS/views, post/report/application writes, and private credential storage.
- Consolidated repeated brand/footer/moderation-note UI into shared components and applied the requested wording cleanup in the app.
- Added title-based AI drafting and existing-description refinement through a server action calling Groq's Responses API with `openai/gpt-oss-120b`.
- Added environment-variable examples and this engineering handoff.

The latest AI assistance and documentation changes are currently local/uncommitted. Push them to the connected branch before expecting Vercel to serve them.
