import AuthForm from "./auth-form";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return <><main className="auth-shell"><section className="auth-story"><Link className="brand" href="/"><span className="brand-mark">◇</span><span>Second View</span></Link><div className="story-content"><div className="eyebrow"><span>●</span> A SPACE TO FIND PERSPECTIVE</div><h1>A thoughtful harbor for life’s complicated moments.</h1><p>Share what is weighing on you and hear considered perspectives from people with experience and care.</p><blockquote>“A good outside perspective can help you see a little more clearly.”<cite>— The Second View community</cite></blockquote></div><div className="trust-list"><span>✓ &nbsp;Use a pseudonym in the community</span><span>✓ &nbsp;Mentors are reviewed before responding</span><span>✓ &nbsp;Your story deserves thoughtful care</span></div></section><section className="auth-panel"><Suspense fallback={<p>Loading sign in…</p>}><AuthForm /></Suspense></section></main><footer className="auth-footer"><span>Second View</span><p>Not emergency care or a substitute for professional treatment. In the US, call or text <a href="tel:988">988</a> for crisis support.</p><Link href="/">Back to home</Link></footer></>;
}
