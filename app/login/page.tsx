import AuthForm from "./auth-form";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import SiteBrand from "../components/site-brand";
import { createClient } from "@/lib/supabase/server";
import UiIcon from "../components/ui-icon";

type SearchParams = Promise<{ next?: string }>;

// Only allow internal paths like "/admin", never "https://evil.com" or "//evil.com"
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/feed";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (typeof claims?.claims.sub === "string") {
    const { next } = await searchParams;
    redirect(safeNext(next));
  }

  return (
    <>
      <main className="auth-shell">
        <section className="auth-story">
          <SiteBrand />
          <div className="story-content">
            <div className="eyebrow">
              <UiIcon name="sparkles" size="xs" /> A SPACE TO SHARE AND REFLECT
            </div>
            <h1>Share what’s on your mind.</h1>
            <p>
              Share what is weighing on you and hear perspectives
              from people with experience.
            </p>
            <p className="story-note">
              Second View is a space to share anonymously
              and receive thoughtful replies over time.
            </p>
          </div>
          <div className="trust-list">
            <span><UiIcon name="check" size="xs" /> Choose the name people see on your post</span>
            <span><UiIcon name="check" size="xs" /> Mentors are reviewed before responding</span>
            <span><UiIcon name="check" size="xs" /> Your story deserves thoughtful care</span>
          </div>
        </section>
        <section className="auth-panel">
          <Suspense fallback={<p>Loading sign in…</p>}>
            <AuthForm />
          </Suspense>
        </section>
      </main>
      <footer className="auth-footer">
        <span>Second View</span>

        <Link href="/">Back to home</Link>
      </footer>
    </>
  );
}
