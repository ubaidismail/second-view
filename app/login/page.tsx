import AuthForm from "./auth-form";
import Link from "next/link";
import { Suspense } from "react";
import SiteBrand from "../components/site-brand";

export default function LoginPage() {
  return (
    <>
      <main className="auth-shell">
        <section className="auth-story">
          <SiteBrand />
          <div className="story-content">
            <div className="eyebrow">
              <span>●</span> A SPACE TO FIND PERSPECTIVE
            </div>
            <h1>A thoughtful harbor for life’s complicated moments.</h1>
            <p>
              Share what is weighing on you and hear considered perspectives
              from people with experience and care.
            </p>
            <p className="story-note">
              Second View is a moderated space for pseudonymous, asynchronous
              reflection.
            </p>
          </div>
          <div className="trust-list">
            <span>✓ &nbsp;Use a pseudonym in the community</span>
            <span>✓ &nbsp;Mentors are reviewed before responding</span>
            <span>✓ &nbsp;Your story deserves thoughtful care</span>
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
