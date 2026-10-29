"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { createClient } from "@/lib/supabase/client";
import { createMentorApplicationAction } from "./actions";
import UiIcon from "../components/ui-icon";
import { useRouter } from "next/navigation";

const focusAreas = [
  "Career transitions",
  "Burnout",
  "Grief & bereavement",
  "Relationships",
  "Identity",
  "Leadership",
  "Life changes",
];
const maxFileBytes = 10 * 1024 * 1024;

export default function MentorApplyPage() {
  const router = useRouter();

  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    "Career transitions",
  ]);
  const [fileName, setFileName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null,
  );
  const [statusLoading, setStatusLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user.id ?? null);
        setAuthReady(true);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setApplicationStatus(null);
      router.replace("/login?mode=signup&role=mentor");
      return;
    }
    let active = true;
    setStatusLoading(true);
    void createClient()
      .from("mentor_applications")
      .select("status")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setApplicationStatus(error ? "unavailable" : (data?.status ?? null));
        setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  function toggleFocus(focus: string) {
    setSelectedFocus((current) =>
      current.includes(focus)
        ? current.filter((item) => item !== focus)
        : [...current, focus],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const credential = formData.get("credential");
    if (!(credential instanceof File) || credential.size === 0) {
      setNotice("Choose a credential document before submitting.");
      return;
    }
    if (
      credential.size > maxFileBytes ||
      !["application/pdf", "image/png", "image/jpeg"].includes(credential.type)
    ) {
      setNotice("Choose a PDF, PNG, or JPEG file up to 10 MB.");
      return;
    }
    if (selectedFocus.length === 0) {
      setNotice("Select at least one area of focus.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      router.replace("/login?mode=signup&role=mentor");
      return;
    }

    const extension =
      credential.type === "application/pdf"
        ? "pdf"
        : credential.type === "image/png"
          ? "png"
          : "jpg";
    const proofPath = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("mentor-proof")
      .upload(proofPath, credential, {
        contentType: credential.type,
        upsert: false,
      });
    if (uploadError) {
      setSubmitting(false);
      setNotice(
        "The document could not be uploaded. Check your connection and try again.",
      );
      return;
    }

    const text = (name: string) => {
      const value = formData.get(name);
      return typeof value === "string" ? value : "";
    };
    const result = await createMentorApplicationAction({
      fullName: text("name"),
      professionalTitle: text("title"),
      licensingBoard: text("board"),
      licenseNumber: text("license"),
      professionalEmail: text("email"),
      affiliation: text("practice"),
      focusAreas: selectedFocus,
      proofPath,
    });

    if (!result.ok) {
      await supabase.storage.from("mentor-proof").remove([proofPath]);
      setSubmitting(false);
      setNotice(result.message);
      return;
    }
    setApplicationStatus("pending");
    setSubmitting(false);
    setNotice("Your application has been submitted for manual review.");
  }

  const showApplication =
    applicationStatus === null && userId !== null && !statusLoading;
  return (
    <>
      <SiteHeader active="mentor" />
      <main className="mentor-apply-page">
        <section className="mentor-apply-hero">
          <span className="eyebrow">MENTOR APPLICATION</span>
          <h1>
            Share your experience
            <br className="desktop-break" /> with care and intention.
          </h1>
          <p>
            Apply to offer thoughtful, asynchronous perspectives to people
            navigating a difficult decision or transition.
          </p>
          <div className="apply-values">
            <span><UiIcon name="clock" size="xs" /> Flexible written responses</span>
            <span><UiIcon name="check-badge" size="xs" /> Credentials reviewed before approval</span>
            <span><UiIcon name="heart" size="xs" /> Clear community guidelines</span>
          </div>
        </section>
        <div className="apply-columns">
          <section className="surface-card application-card">
            <div className="application-title">
              <div>
                <span className="section-kicker">MENTOR CREDENTIALING</span>
                <h2>Tell us about your practice</h2>
                <p>
                  Credentials and supporting documents are private and reviewed
                  manually.
                </p>
              </div>
              <span className="step-count">APPLICATION · 1 OF 1</span>
            </div>
            {!authReady || statusLoading ? (
              <div className="submit-success">
                Checking your account and application status…
              </div>
            ) : !userId ? (
              <div className="sign-in-gate">
                
                <Link
                  className="button"
                  href="/login?mode=signup&amp;role=mentor"
                >
                  Sign in or create an account <UiIcon name="arrow-right" size="sm" />
                </Link>
              </div>
            ) : applicationStatus === "unavailable" ? (
              <div className="form-notice" role="alert">
                We couldn’t check application status. Please refresh and try
                again.
              </div>
            ) : applicationStatus ? (
              <div className="submit-success" role="status">
                <span><UiIcon name={applicationStatus === "approved" ? "check-circle" : "clock"} size="md" /></span>
                <h3>
                  {applicationStatus === "approved"
                    ? "Application approved"
                    : applicationStatus === "rejected"
                      ? "Application reviewed"
                      : "Application pending review"}
                </h3>
                <p>
                  {applicationStatus === "approved"
                    ? "Your mentor account has been approved."
                    : applicationStatus === "rejected"
                      ? "Your application has been reviewed. Mentor access is not enabled."
                      : "Your application is saved. A reviewer will verify your credentials before mentor access is enabled."}
                </p>
                {notice && <p>{notice}</p>}
              </div>
            ) : showApplication ? (
              <form className="application-form" onSubmit={submit}>
                <div className="form-grid">
                  <label>
                    Full name
                    <input
                      name="name"
                      autoComplete="name"
                      minLength={2}
                      maxLength={160}
                      placeholder="Your professional name"
                      required
                    />
                  </label>
                  <label>
                    Professional title
                    <input
                      name="title"
                      minLength={2}
                      maxLength={120}
                      placeholder="e.g. Licensed Counselor"
                      required
                    />
                  </label>
                  <label>
                    Licensing board or certification body
                    <input
                      name="board"
                      minLength={2}
                      maxLength={200}
                      placeholder="Governing board or organization"
                      required
                    />
                  </label>
                  <label>
                    License or registry number
                    <input
                      name="license"
                      minLength={2}
                      maxLength={120}
                      placeholder="Enter your credential ID"
                      required
                    />
                  </label>
                  <label>
                    Professional email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@yourpractice.org"
                      required
                    />
                  </label>
                  <label>
                    Practice or organization{" "}
                    <span className="optional">Optional</span>
                    <input
                      name="practice"
                      maxLength={200}
                      placeholder="Practice or organization name"
                    />
                  </label>
                </div>
                <fieldset className="focus-field">
                  <legend>
                    Areas of focus{" "}
                    <span className="optional">Select all that apply</span>
                  </legend>
                  <div className="focus-chips">
                    {focusAreas.map((focus) => (
                      <button
                        className={
                          selectedFocus.includes(focus)
                            ? "focus-chip selected"
                            : "focus-chip"
                        }
                        type="button"
                        key={focus}
                        aria-pressed={selectedFocus.includes(focus)}
                        onClick={() => toggleFocus(focus)}
                      >
                        <UiIcon name={selectedFocus.includes(focus) ? "check" : "plus"} size="xs" />
                        {focus}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="upload-label">
                  Credential document{" "}
                  <span className="optional">PDF or image, up to 10 MB</span>
                  <input
                    className="file-input"
                    name="credential"
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    required
                    onChange={(event) =>
                      setFileName(event.target.files?.[0]?.name ?? "")
                    }
                  />
                  <span className="upload-box">
                    <span className="upload-icon"><UiIcon name="arrow-up-tray" size="md" /></span>
                    <b>{fileName || "Choose a credential document"}</b>
                    <small>
                      Stored in a private bucket; accessible to you and
                      authorized reviewers.
                    </small>
                  </span>
                </label>
                <label className="agreement">
                  <input type="checkbox" required />
                  <span>I agree to follow the community guidance.</span>
                </label>
                {notice && (
                  <p className="form-notice" role="alert">
                    {notice}
                  </p>
                )}
                <button
                  className="button apply-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting securely…"
                    : "Submit for credential review"}{" "}
                  <UiIcon name="arrow-right" size="sm" />
                </button>
              </form>
            ) : null}
          </section>
          <aside className="apply-aside">
            <section className="mentor-callout">
              <span><UiIcon name="check-badge" size="lg" /></span>
              <h2>Vetted by people, not an algorithm.</h2>
              <p>
                Applications are intended for manual review. Verification must
                be completed before a mentor is presented as approved.
              </p>
            </section>
            <section className="surface-card faq-card">
              <div className="section-kicker">BEFORE YOU APPLY</div>
              <h2>What to expect</h2>
              <div>
                <b>Review and verification</b>
                <p>
                  The team will need to confirm credentials with the relevant
                  professional body before approval.
                </p>
              </div>
              <div>
                <b>Thoughtful, asynchronous guidance</b>
                <p>
                  Mentor participation is written and non-urgent. It is not a
                  real-time response service.
                </p>
              </div>
              <div>
                <b>Clear professional boundaries</b>
                <p>
                  Community responses do not create a clinical relationship or
                  replace care from a professional you choose.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
