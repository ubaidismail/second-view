"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SiteBrand from "../components/site-brand";
import UiIcon from "../components/ui-icon";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(
    "Confirm your email, then choose a password for future sign-ins.",
  );

  useEffect(() => {
    let active = true;
    void createClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (!active) return;
        setReady(Boolean(data.user) && !error);
        if (error || !data.user)
          setNotice(
            "This password link is missing or has expired. Request a new one from the sign-in page.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setNotice("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setNotice("The passwords do not match.");
      return;
    }
    setSaving(true);
    setNotice("");
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (error) {
      console.error("[auth] password update failed", error.code);
      setNotice(
        error.code === "weak_password"
          ? "Choose a stronger password and try again."
          : "We couldn’t update your password. Request a new link and try again.",
      );
      return;
    }
    setNotice(
      "Your password is set. You can now sign in with your email and password.",
    );
    window.setTimeout(() => {
      router.replace("/feed");
      router.refresh();
    }, 900);
  }

  return (
    <main className="set-password-page">
      <section className="surface-card set-password-card">
        <SiteBrand />
        <span className="eyebrow">ACCOUNT SECURITY</span>
        <h1>Set your password</h1>
        <p>Confirm your email once. Use your password for future sign-ins.</p>
        {ready ? (
          <form onSubmit={savePassword}>
            <label className="field-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <label className="field-label" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Set password"} <UiIcon name="arrow-right" size="sm" />
            </button>
          </form>
        ) : (
          <Link className="button" href="/login">
            Back to sign in <UiIcon name="arrow-right" size="sm" />
          </Link>
        )}
        <p className="form-notice" role="status">
          {notice}
        </p>
      </section>
    </main>
  );
}
