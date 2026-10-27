"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import UiIcon from "../components/ui-icon";

export default function AuthForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [role, setRole] = useState<"seeker" | "mentor">(
    params.get("role") === "mentor" ? "mentor" : "seeker",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(
    params.get("error") === "auth"
      ? "That email link could not be confirmed. Request a fresh link and try again."
      : "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=/set-password`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo },
        });
        if (error) {
          const message = error.message.toLowerCase();
          if (
            message.includes("signups not allowed") ||
            message.includes("signup is disabled")
          ) {
            throw new Error(
              "Account creation isn’t available right now. Please contact support.",
            );
          }
          if (
            message.includes("already registered") ||
            message.includes("already been registered")
          ) {
            throw new Error(
              "This email already has an account. Sign in with your password, or use Forgot password.",
            );
          }
          throw error;
        }
        setNotice(
          `Check ${email} for your verification link. After confirming your email, you’ll set a password.`,
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        const message = error.message.toLowerCase();
        if (message.includes("invalid login credentials")) {
          throw new Error(
            "Email or password is incorrect. If you registered before passwords were added, use Forgot password to set one.",
          );
        }
        throw error;
      }
      const requestedNext = params.get("next");
      const nextPath =
        role === "mentor"
          ? "/mentor-apply"
          : requestedNext === "/admin"
            ? "/admin"
            : "/feed";
      window.location.assign(nextPath);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("rate limit"))
        setNotice(
          "Too many requests were made recently. Wait a few minutes and try again.",
        );
      else if (message.includes("error sending magic link email"))
        setNotice(
          "We couldn’t send the verification email. Please wait a few minutes and try again.",
        );
      else if (
        error instanceof Error &&
        (message.includes("please sign up first") ||
          message.includes("disabled") ||
          message.includes("already has an account") ||
          message.includes("incorrect"))
      )
        setNotice(error.message);
      else {
        console.error("[auth] sign-in or sign-up request failed");
        setNotice(
          "We couldn’t complete that request. Please try again shortly.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (!email) {
      setNotice("Enter your email first, then choose Forgot password.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/set-password`,
      });
      if (error) throw error;
      setNotice(
        `If an account exists for ${email}, a password reset link has been sent.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("rate limit"))
        setNotice(
          "A reset email was requested recently. Wait a few minutes and try again.",
        );
      else {
        console.error("[auth] password reset request failed");
        setNotice(
          "We couldn’t send a password reset email. Please try again shortly.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-content">
      <div className="auth-top">
        <div className="tabs" role="tablist" aria-label="Account action">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "tab active" : "tab"}
            onClick={() => {
              setMode("signin");
              setNotice("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => {
              setMode("signup");
              setNotice("");
            }}
          >
            Create account
          </button>
        </div>
        <span className="secure-label">
          <UiIcon name="shield-check" size="xs" />
          {mode === "signup" ? "Email verification" : "Email and password"}
        </span>
      </div>
      <div className="auth-label">CHOOSE YOUR PATH</div>
      <div className="role-picker" role="group" aria-label="Account type">
        <button
          type="button"
          className={role === "seeker" ? "role-choice selected" : "role-choice"}
          onClick={() => setRole("seeker")}
        >
          <span className="role-icon"><UiIcon name="user" size="md" /></span>
          <span>
            <b>Seek guidance</b>
            <small>Share anonymously</small>
          </span>
        </button>
        <button
          type="button"
          className={role === "mentor" ? "role-choice selected" : "role-choice"}
          onClick={() => setRole("mentor")}
        >
          <span className="role-icon"><UiIcon name="briefcase" size="md" /></span>
          <span>
            <b>Become a mentor</b>
            <small>Apply for review</small>
          </span>
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {mode === "signin" && (
          <>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="text-link forgot-password"
              type="button"
              onClick={() => void sendPasswordReset()}
              disabled={loading}
            >
              Forgot password?
            </button>
          </>
        )}
        <div className="privacy-note">
          <span><UiIcon name="lock" size="md" /></span>
          <p>
            {mode === "signup"
              ? "We’ll email a verification link. After confirming your email, you’ll create a password for future sign-ins."
              : "Sign in with your email and password. Use Forgot password if you need to reset it."}
          </p>
        </div>
        <button className="button auth-submit" type="submit" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}{" "}
          <UiIcon name="arrow-right" size="sm" />
        </button>
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
      </form>
      {role === "mentor" && (
        <p className="auth-disclaimer">
          Mentor access requires a separate application and manual credential
          review. Creating an account does not grant mentor permissions.
        </p>
      )}
    </div>
  );
}
