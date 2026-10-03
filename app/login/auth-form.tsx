"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [role, setRole] = useState<"seeker" | "mentor">("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(params.get("error") === "auth" ? "That email link could not be confirmed. Request a fresh link and try again." : "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=/set-password`;
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } });
        if (error) {
          const message = error.message.toLowerCase();
          if (message.includes("signups not allowed") || message.includes("signup is disabled")) {
            throw new Error("New account creation is disabled in this Supabase project. Enable signups under Authentication → Providers → Email, then try again.");
          }
          if (message.includes("already registered") || message.includes("already been registered")) {
            throw new Error("This email already has an account. Sign in with your password, or use Forgot password.");
          }
          throw error;
        }
        setNotice(`Check ${email} for your verification link. After confirming your email, you’ll set a password.`);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("invalid login credentials")) {
          throw new Error("Email or password is incorrect. If you registered before passwords were added, use Forgot password to set one.");
        }
        throw error;
      }
      const requestedNext = params.get("next");
      const nextPath = role === "mentor" ? "/mentor-apply" : requestedNext === "/admin" ? "/admin" : "/feed";
      window.location.assign(nextPath);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not complete that request. Please try again.");
    } finally { setLoading(false); }
  }

  async function sendPasswordReset() {
    if (!email) { setNotice("Enter your email first, then choose Forgot password."); return; }
    setLoading(true);
    setNotice("");
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
      });
      if (error) throw error;
      setNotice(`If an account exists for ${email}, a password reset link has been sent.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "We could not send a password reset link. Please try again.");
    } finally { setLoading(false); }
  }

  return <div className="auth-content"><div className="auth-top"><div className="tabs" role="tablist" aria-label="Account action"><button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "tab active" : "tab"} onClick={() => { setMode("signin"); setNotice(""); }}>Sign in</button><button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "tab active" : "tab"} onClick={() => { setMode("signup"); setNotice(""); }}>Create account</button></div><span className="secure-label">◇ &nbsp;{mode === "signup" ? "Email verification" : "Email and password"}</span></div>
    <div className="auth-label">CHOOSE YOUR PATH</div><div className="role-picker" role="group" aria-label="Account type"><button type="button" className={role === "seeker" ? "role-choice selected" : "role-choice"} onClick={() => setRole("seeker")}><span className="role-icon">◉</span><span><b>Seek guidance</b><small>Share as a pseudonym</small></span></button><button type="button" className={role === "mentor" ? "role-choice selected" : "role-choice"} onClick={() => setRole("mentor")}><span className="role-icon">✳</span><span><b>Become a mentor</b><small>Apply for review</small></span></button></div>
    <form onSubmit={handleSubmit}><label className="field-label" htmlFor="email">Email address</label><input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required/>{mode === "signin" && <><label className="field-label" htmlFor="password">Password</label><input id="password" name="password" type="password" placeholder="Your password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/><button className="text-link forgot-password" type="button" onClick={() => void sendPasswordReset()} disabled={loading}>Forgot password?</button></>}<div className="privacy-note"><span>◇</span><p>{mode === "signup" ? "We’ll email a verification link. After confirming your email, you’ll create a password for future sign-ins." : "Sign in with your email and password. Use Forgot password if you need to reset it."}</p></div><button className="button auth-submit" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <span>→</span></button>{notice && <p className="form-notice" role="status">{notice}</p>}</form>
    {role === "mentor" && <p className="auth-disclaimer">Mentor access requires a separate application and manual credential review. Creating an account does not grant mentor permissions.</p>}<div className="auth-disclaimer">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</div><div className="auth-bottom">Having a difficult moment? This service isn’t monitored for emergencies. <a href="tel:988">Find immediate support</a>.</div>
  </div>;
}
