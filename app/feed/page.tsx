"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import ModerationNotice from "../components/moderation-notice";
import UiIcon from "../components/ui-icon";
import { createClient } from "@/lib/supabase/client";
import ReplyThread, { type Reply } from "./reply-thread";
import {
  assistWithReflectionAction,
  createPostAction,
  reportPostAction,
} from "./actions";

type Perspective = {
  id: string;
  body: string;
  mentor_name: string;
  mentor_title: string;
  is_helpful: boolean;
};
type FeedPost = {
  id: string;
  category: string;
  alias: string;
  title: string;
  body: string;
  sensitivityVeil: boolean;
  responses: Perspective[];
  replies: Reply[];
  canReply: boolean;
};
const categories = [
  "All reflections",
  "Career & Purpose",
  "Emotional Wellbeing",
  "Grief & Transitions",
  "Relationships",
  "Identity",
];
const categoryIcons = [
  "squares-2x2",
  "briefcase",
  "heart",
  "arrow-path",
  "user-group",
  "fingerprint",
] as const;

export default function FeedPage() {
  const [selected, setSelected] = useState("All reflections");
  const [livePosts, setLivePosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [alias, setAlias] = useState("Anonymous Meadow");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Career & Purpose");
  const [sensitivityVeil, setSensitivityVeil] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assisting, setAssisting] = useState(false);
  const [assistNotice, setAssistNotice] = useState("");
  const [submittedDraft, setSubmittedDraft] = useState<{
    id: string;
    alias: string;
    title: string;
    body: string;
    category: string;
  } | null>(null);
  const [reportingId, setReportingId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportNotice, setReportNotice] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let feedSettled = false;
    const finishFeedLoad = () => {
      if (!active || feedSettled) return;
      feedSettled = true;
      window.clearTimeout(feedTimeout);
      setFeedLoading(false);
    };
    const feedTimeout = window.setTimeout(() => {
      if (!active || feedSettled) return;
      feedSettled = true;
      setFeedError(
        "Community reflections are taking longer than expected to load. Refresh the page to try again.",
      );
      setFeedLoading(false);
    }, 12000);
    void Promise.resolve(
      supabase
        .from("public_posts")
        .select("id, category_name, pseudonym, title, body, sensitivity_veil")
        .order("created_at", { ascending: false })
        .limit(30),
    )
      .then(async ({ data, error }) => {
        if (!active || feedSettled) return;
        if (error) {
          console.error("[feed] post query failed", error.code);
          setFeedError(
            "We couldn’t load community reflections. Please refresh to try again.",
          );
          finishFeedLoad();
          return;
        }
        const rows = (data ?? []) as unknown as Array<{
          id: string;
          category_name: string;
          pseudonym: string;
          title: string;
          body: string;
          sensitivity_veil: boolean;
        }>;
        if (rows.length === 0) {
          setLivePosts([]);
          finishFeedLoad();
          return;
        }
        const postIds = rows.map((post) => post.id);
        const { data: responseData, error: responseError } = await supabase
          .from("public_responses")
          .select("id, post_id, body, mentor_name, mentor_title, is_helpful")
          .in("post_id", postIds)
          .order("created_at", { ascending: true });
        if (!active || feedSettled) return;
        if (responseError) {
          console.error("[feed] response query failed", responseError.code);
          setFeedError(
            "We couldn’t load community responses. Please refresh to try again.",
          );
          finishFeedLoad();
          return;
        }
        const responses = (responseData ?? []) as unknown as Array<
          Perspective & { post_id: string }
        >;
        const { data: replyData } = await supabase
          .from("public_replies")
          .select("id, post_id, parent_id, body, created_at, is_post_owner, author_name, author_title, edited_at, is_mine").in("post_id", postIds)
          .order("created_at", { ascending: true });
        const { data: allowedIds } = await supabase.rpc("my_replyable_post_ids", { pids: postIds });
        if (!active || feedSettled) return;
        const replies = (replyData ?? []) as unknown as Reply[];
        const replyable = new Set((allowedIds ?? []) as string[]);
        setLivePosts(
          rows.map((post) => ({
            id: post.id,
            category: post.category_name,
            alias: post.pseudonym,
            title: post.title,
            body: post.body,
            sensitivityVeil: post.sensitivity_veil,
            responses: responses.filter(
              (response) => response.post_id === post.id,
            ),
            replies: replies.filter((r) => r.post_id === post.id),
            canReply: replyable.has(post.id),
          })),
        );
        finishFeedLoad();
      })
      .catch((error: unknown) => {
        if (!active || feedSettled) return;
        console.error(
          "[feed] load failed",
          error instanceof Error ? error.name : "unknown error",
        );
        setFeedError(
          "We couldn’t load community reflections. Please refresh to try again.",
        );
        finishFeedLoad();
      });
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.user));
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", data.user.id)
          .maybeSingle();
        if (active && profile?.display_name) setAlias(profile.display_name);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSignedIn(Boolean(session?.user)),
    );
    return () => {
      active = false;
      window.clearTimeout(feedTimeout);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const posts = livePosts;
  const filtered =
    selected === "All reflections"
      ? posts
      : posts.filter((post) => post.category === selected);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) {
      setNotice("Sign in with your email before submitting a reflection.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    const result = await createPostAction({
      title,
      body,
      pseudonym: alias,
      category,
      sensitivityVeil,
    });
    // console.log("createPostAction result", result);
    // return false;
    setSubmitting(false);
    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    setSubmittedDraft({
      id: result.postId,
      alias,
      title: title.trim(),
      body: body.trim(),
      category,
    });
    setTitle("");
    setBody("");
    setNotice(
      "Your reflection was saved and is waiting for moderator review. It will appear publicly only after approval.",
    );
  }

  async function report(postId: string) {
    const result = await reportPostAction(postId, reportReason);
    setReportNotice(
      result.ok ? "Report sent to the moderation queue." : result.message,
    );
    if (result.ok) {
      setReportingId("");
      setReportReason("");
    }
  }

  async function assistWithWriting() {
    setAssisting(true);
    setAssistNotice("");
    const result = await assistWithReflectionAction({ title, body });
    setAssisting(false);
    if (!result.ok) {
      setAssistNotice(result.message);
      return;
    }
    setBody(result.text);
    setAssistNotice(
      body.trim()
        ? "Your draft has been refined. Review it before submitting."
        : "A starting draft is ready. Make it your own before submitting.",
    );
  }

  function shuffleAlias() {
    const names = [
      "Anonymous Willow",
      "Anonymous Harbor",
      "Anonymous Finch",
      "Anonymous Birch",
    ];
    setAlias(names[Math.floor(Math.random() * names.length)]);
  }

  return (
    <>
      <SiteHeader active="feed" />
      <main className="feed-layout">
        <aside className="feed-sidebar">
          <section className="surface-card sidebar-card">
            <div className="section-kicker">SANCTUARY CHANNELS</div>
            {categories.map((item, i) => (
              <button
                key={item}
                className={selected === item ? "channel active" : "channel"}
                onClick={() => setSelected(item)}
              >
                <span><UiIcon name={categoryIcons[i]} size="sm" /></span>
                {item}
                <small>
                  {item === "All reflections"
                    ? posts.length
                    : posts.filter((post) => post.category === item).length}
                </small>
              </button>
            ))}
          </section>
          <section className="surface-card sidebar-card">
            <div className="section-kicker">COMMUNITY NOTE</div>
            <p className="sidebar-note">
              <ModerationNotice />
            </p>
          </section>
        </aside>
        <section className="feed-main">
          <div className="surface-card composer-card">
            <div className="alias-row">
              <span className="alias-badge">
                <UiIcon name="user-circle" size="sm" /> Writing as <b>{alias}</b>
              </span>
              <button
                type="button"
                className="text-link"
                onClick={shuffleAlias}
              >
                <UiIcon name="arrow-path" size="xs" /> Shuffle name
              </button>
            </div>
            {signedIn ? (
              <form onSubmit={submit}>
                <label className="sr-only" htmlFor="post-title">
                  Title your reflection
                </label>
                <input
                  id="post-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={8}
                  maxLength={160}
                  placeholder="Title your reflection in a sentence…"
                  required
                />
                <label className="compose-label" htmlFor="post-category">
                  Choose a channel
                </label>
                <select
                  id="post-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.slice(1).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <div className="compose-field-heading">
                  <label className="compose-label" htmlFor="post-body">
                    Your reflection
                  </label>
                  <button
                    className="ai-assist-button"
                    type="button"
                    onClick={assistWithWriting}
                    disabled={assisting || title.trim().length < 8}
                    aria-label={
                      body.trim()
                        ? "Refine your reflection with AI"
                        : "Draft your reflection with AI"
                    }
                  >
                    <UiIcon name="sparkles" size="xs" />
                    {assisting
                      ? "Writing…"
                      : body.trim()
                        ? "Refine with AI"
                        : "Write with AI"}
                  </button>
                </div>
                <textarea
                  id="post-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={5}
                  minLength={20}
                  maxLength={10000}
                  placeholder="What has been weighing on you? Take your time…"
                  required
                />
                <p className="ai-assist-note" aria-live="polite">
                  {assistNotice ||
                    "When you choose AI help, your title and draft are sent to our AI provider. Review all suggestions before sharing."}
                </p>
                <label className="veil-choice">
                  <input
                    type="checkbox"
                    checked={sensitivityVeil}
                    onChange={(event) =>
                      setSensitivityVeil(event.target.checked)
                    }
                  />{" "}
                  Add a sensitivity veil for readers
                </label>

                <div className="compose-bottom">
                  <span>
                    <ModerationNotice />
                  </span>
                  <button
                    className="button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit for review"}{" "}
                    <UiIcon name="arrow-right" size="sm" />
                  </button>
                </div>
                {notice && (
                  <p className="form-notice" role="status">
                    {notice}
                  </p>
                )}
              </form>
            ) : (
              <div className="sign-in-gate">
                <p>
                  Sign in with your email and password to write a reflection.
                  Browse approved posts without an account.
                </p>
                <Link className="button" href="/login">
                  Sign in <UiIcon name="arrow-right" size="sm" />
                </Link>
              </div>
            )}
          </div>
          {submittedDraft && (
            <article className="surface-card local-draft">
              <div>
                <span className="sample-pill">PENDING REVIEW</span>
                <button type="button" onClick={() => setSubmittedDraft(null)}>
                  Dismiss preview
                </button>
              </div>
              <h2>{submittedDraft.title}</h2>
              <p>{submittedDraft.body}</p>
              <small>
                {submittedDraft.alias} · {submittedDraft.category}
              </small>
              <p className="draft-note">
                This post is saved privately and will not appear in the
                community feed until a moderator approves it.
              </p>
            </article>
          )}
          <div className="feed-tabs" role="group" aria-label="Feed filter">
            <button className="active" type="button">
              Recent reflections
            </button>
            <span>
              {livePosts.length
                ? "Approved community posts"
                : "Community reflections"}
            </span>
          </div>
          {feedError && (
            <p className="form-notice" role="alert">
              {feedError}
            </p>
          )}
          {feedLoading && (
            <div className="surface-card empty-state">
              Loading approved reflections…
            </div>
          )}
          {!feedLoading && !feedError && filtered.length === 0 && (
            <div className="surface-card empty-state">
              <h2>No approved reflections here yet.</h2>
              <p>
                New reflections appear after moderator review. You can share
                yours when you’re ready.
              </p>
            </div>
          )}
          {!feedLoading &&
            !feedError &&
            filtered.map((post) => (
              <article className="surface-card feed-post" key={post.id}>
                <div className="post-meta">
                  <span className="post-avatar">
                    {post.alias.split(" ").at(-1)?.[0] ?? "A"}
                  </span>
                  <div>
                    <b>{post.alias}</b>
                    <small>{post.category}</small>
                  </div>
                  {post.sensitivityVeil && (
                    <span className="sample-pill">Sensitive topic</span>
                  )}
                </div>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                {post.responses.length > 0 ? (
                  post.responses.map((response) => (
                    <div className="response-preview" key={response.id}>
                      <div className="section-kicker">
                        {response.mentor_title} · {response.mentor_name}
                      </div>
                      <p>{response.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="response-preview">
                    {/* <p>Reviewed mentor responses will appear here.</p> */}
                    <ReplyThread postId={post.id} replies={post.replies} canReply={post.canReply} />
                  </div>
                )}

                <div className="post-bottom">
                  <span>Approved reflection</span>
                  {signedIn && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportingId(reportingId === post.id ? "" : post.id);
                        setReportNotice("");
                      }}
                    >
                      Report
                    </button>
                  )}
                </div>
                {reportingId === post.id && (
                  <div className="report-form">
                    <label htmlFor={`report-${post.id}`}>
                      Why are you reporting this reflection?
                    </label>
                    <textarea
                      id={`report-${post.id}`}
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      minLength={5}
                      maxLength={2000}
                      rows={3}
                      required
                    />
                    <button
                      className="button button-small"
                      type="button"
                      onClick={() => void report(post.id)}
                    >
                      Send report
                    </button>
                    {reportNotice && <p role="status">{reportNotice}</p>}
                  </div>
                )}
              </article>
            ))}
        </section>
        <aside className="feed-right">
          <section className="surface-card sidebar-card">
            <div className="section-kicker">A THOUGHTFUL COMMUNITY</div>
            <h3>Make room for perspective.</h3>
            <p>
              Conversations are moderated before they’re published. Mentor
              credentials must be reviewed before they can respond.
            </p>
            <Link className="text-link" href="/profile">
              Set your community name <UiIcon name="arrow-up-right" size="xs" />
            </Link>
          </section>
          <section className="surface-card sidebar-card">
            <div className="section-kicker">SHARE YOUR EXPERIENCE</div>
            <h3>Become a mentor</h3>
            <p>Offer a considered perspective on your own schedule.</p>
            <Link className="button button-small" href="/mentor-apply">
              View the application <UiIcon name="arrow-right" size="sm" />
            </Link>
          </section>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
