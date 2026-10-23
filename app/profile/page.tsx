"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!active) return;
      if (profileError) {
        console.error("[profile] load failed", profileError.code);
        setNotice(
          "We couldn’t load your profile. Please refresh and try again.",
        );
      } else if (profile) {
        setDisplayName(profile.display_name ?? "");
        setRole(profile.role);
      } else
        setNotice(
          "Your profile record was not found. Please sign out and sign in again.",
        );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 60) {
      setNotice("Choose a display name between 2 and 60 characters.");
      return;
    }
    setSaving(true);
    setNotice("");
    const { error } = await createClient()
      .from("profiles")
      .update({ display_name: name })
      .eq("id", userId);
    setSaving(false);
    if (error) console.error("[profile] update failed", error.code);
    setNotice(
      error
        ? "We couldn’t save your profile. Please try again."
        : "Your profile has been saved.",
    );
  }

  return (
    <>
      <SiteHeader active="profile" />
      <main className="profile-page">
        <div className="profile-heading">
          <div>
            <span className="eyebrow">MY ACCOUNT</span>
            <h1>Your profile and community name.</h1>
            <p>
              Manage the name shown when you submit a reflection. Your sign-in
              email stays private.
            </p>
          </div>
        </div>
        {loading ? (
          <section className="surface-card seeker-profile-card">
            Loading your account…
          </section>
        ) : !userId ? (
          <section className="surface-card seeker-profile-card">
            <h2>Sign in to edit your profile</h2>
            <p>Your profile settings are available after you sign in.</p>
            <Link className="button" href="/login">
              Sign in <span>→</span>
            </Link>
          </section>
        ) : (
          <section className="surface-card seeker-profile-card">
            <form onSubmit={saveProfile} className="profile-edit-form">
              <label className="field-label" htmlFor="profile-email">
                Sign-in email
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                aria-readonly="true"
              />
              <label className="field-label" htmlFor="display-name">
                Community display name
              </label>
              <input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={2}
                maxLength={60}
                placeholder="For example, Anonymous Willow"
                required
              />
              <p className="profile-help">
                This name is used as the default pseudonym for new reflections.
                You can still change it in the composer before submitting.
              </p>
              <div className="profile-account-row">
                <span>Account type</span>
                <b>{role || "Seeker"}</b>
              </div>
              <button className="button" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"} <span>→</span>
              </button>
              {notice && (
                <p className="form-notice" role="status">
                  {notice}
                </p>
              )}
            </form>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
