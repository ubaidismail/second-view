"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { createClient } from "@/lib/supabase/client";
import { createPostAction, reportPostAction } from "./actions";

type Perspective = { id: string; body: string; mentor_name: string; mentor_title: string; is_helpful: boolean };
type FeedPost = { id: string; category: string; alias: string; title: string; body: string; sensitivityVeil: boolean; responses: Perspective[]; example?: boolean };
const categories = ["All reflections", "Career & Purpose", "Emotional Wellbeing", "Grief & Transitions", "Relationships", "Identity"];
const examples: FeedPost[] = [
  { id: "sample-career", category: "Career & Purpose", alias: "Anonymous Cedar", title: "Walking away from a role I worked years to earn", body: "I reached a point where the work that used to energize me feels heavy. I’m trying to understand what I want before making a big decision.", sensitivityVeil: false, responses: [{ id: "sample-response-1", body: "It may help to treat this feeling as information, not a verdict. Notice which parts of the week still give you energy before deciding what comes next.", mentor_name: "Example mentor", mentor_title: "Illustrative response", is_helpful: false }], example: true },
  { id: "sample-grief", category: "Grief & Transitions", alias: "Anonymous Fern", title: "Is it okay to feel a little joy while grieving?", body: "Some days I laugh at something small, then wonder if I’m moving on too quickly. I miss my mother and don’t know how to hold both feelings.", sensitivityVeil: false, responses: [{ id: "sample-response-2", body: "Joy and grief can sit beside each other. A lighter moment does not take away from how much you love or miss someone.", mentor_name: "Example mentor", mentor_title: "Illustrative response", is_helpful: false }], example: true },
  { id: "sample-wellbeing", category: "Emotional Wellbeing", alias: "Anonymous Lark", title: "I keep replaying a difficult conversation", body: "I wish I had said things differently. I’m not sure whether to follow up or give it a little time.", sensitivityVeil: false, responses: [{ id: "sample-response-3", body: "Before choosing a next step, it can help to separate what you know from what you’re assuming the other person thinks.", mentor_name: "Example mentor", mentor_title: "Illustrative response", is_helpful: false }], example: true },
];

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
  const [submittedDraft, setSubmittedDraft] = useState<{ id: string; alias: string; title: string; body: string; category: string } | null>(null);
  const [reportingId, setReportingId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportNotice, setReportNotice] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.from("public_posts").select("id, category_name, pseudonym, title, body, sensitivity_veil")
      .order("created_at", { ascending: false }).limit(30)
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) { setFeedError("We couldn’t load community reflections. Please refresh to try again."); setFeedLoading(false); return; }
        const rows = (data ?? []) as unknown as Array<{ id: string; category_name: string; pseudonym: string; title: string; body: string; sensitivity_veil: boolean }>;
        if (rows.length === 0) { setLivePosts([]); setFeedLoading(false); return; }
        const postIds = rows.map((post) => post.id);
        const { data: responseData } = await supabase.from("public_responses")
          .select("id, post_id, body, mentor_name, mentor_title, is_helpful")
          .in("post_id", postIds).order("created_at", { ascending: true });
        if (!active) return;
        const responses = (responseData ?? []) as unknown as Array<Perspective & { post_id: string }>;
        setLivePosts(rows.map((post) => ({
          id: post.id,
          category: post.category_name,
          alias: post.pseudonym,
          title: post.title,
          body: post.body,
          sensitivityVeil: post.sensitivity_veil,
          responses: responses.filter((response) => response.post_id === post.id),
        })));
        setFeedLoading(false);
      });
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data.user));
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", data.user.id).maybeSingle();
        if (active && profile?.display_name) setAlias(profile.display_name);
      }
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => { active = false; authListener.subscription.unsubscribe(); };
  }, []);

  const posts = livePosts.length > 0 ? livePosts : examples;
  const filtered = selected === "All reflections" ? posts : posts.filter((post) => post.category === selected);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) { setNotice("Sign in with your email before submitting a reflection."); return; }
    setSubmitting(true); setNotice("");
    const result = await createPostAction({ title, body, pseudonym: alias, category, sensitivityVeil });
    setSubmitting(false);
    if (!result.ok) { setNotice(result.message); return; }
    setSubmittedDraft({ id: result.postId, alias, title: title.trim(), body: body.trim(), category });
    setTitle(""); setBody(""); setNotice("Your reflection was saved to Supabase as pending review. It will appear publicly only after moderation.");
  }

  async function report(postId: string) {
    const result = await reportPostAction(postId, reportReason);
    setReportNotice(result.ok ? "Report sent to the moderation queue." : result.message);
    if (result.ok) { setReportingId(""); setReportReason(""); }
  }

  function shuffleAlias() { const names = ["Anonymous Willow", "Anonymous Harbor", "Anonymous Finch", "Anonymous Birch"]; setAlias(names[Math.floor(Math.random() * names.length)]); }

  return <><SiteHeader active="feed"/><div className="crisis-strip"><span>Second View is not emergency care. For immediate danger, contact local emergency services.</span><a href="tel:988">US: call or text 988 ↗</a></div><main className="feed-layout"><aside className="feed-sidebar"><section className="surface-card sidebar-card"><div className="section-kicker">SANCTUARY CHANNELS</div>{categories.map((item, i) => <button key={item} className={selected === item ? "channel active" : "channel"} onClick={() => setSelected(item)}><span>{["✧", "↗", "♡", "◌", "⌁", "◇"][i]}</span>{item}<small>{item === "All reflections" ? posts.length : posts.filter((post) => post.category === item).length}</small></button>)}</section><section className="surface-card sidebar-card"><div className="section-kicker">COMMUNITY NOTE</div><p className="sidebar-note">Posts are held for review before publication. Replies do not replace professional treatment or emergency care.</p></section><section className="safe-card"><strong>Need immediate support?</strong><p>Second View is not emergency care.</p><a href="tel:988">US: call or text 988</a></section></aside>
    <section className="feed-main"><div className="surface-card composer-card"><div className="alias-row"><span className="alias-badge">◉ &nbsp;Writing as <b>{alias}</b></span><button type="button" className="text-link" onClick={shuffleAlias}>↻ Shuffle name</button></div>{signedIn ? <form onSubmit={submit}><label className="sr-only" htmlFor="post-title">Title your reflection</label><input id="post-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={8} maxLength={160} placeholder="Title your reflection in a sentence…" required/><label className="compose-label" htmlFor="post-category">Choose a channel</label><select id="post-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><label className="sr-only" htmlFor="post-body">Your reflection</label><textarea id="post-body" value={body} onChange={(event) => setBody(event.target.value)} rows={5} minLength={20} maxLength={10000} placeholder="What has been weighing on you? Take your time…" required/><label className="veil-choice"><input type="checkbox" checked={sensitivityVeil} onChange={(event) => setSensitivityVeil(event.target.checked)}/> Add a sensitivity veil for readers</label><p className="disclaimer-inline">Second View is not emergency care or a substitute for professional treatment.</p><div className="compose-bottom"><span>Posts are reviewed before they appear publicly.</span><button className="button" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit for review"} <span>→</span></button></div>{notice && <p className="form-notice" role="status">{notice}</p>}</form> : <div className="sign-in-gate"><p>Sign in with an email link to write a reflection. You can browse approved posts without an account.</p><Link className="button" href="/login?mode=signup">Continue with email <span>→</span></Link></div>}</div>
      {submittedDraft && <article className="surface-card local-draft"><div><span className="sample-pill">PENDING REVIEW</span><button type="button" onClick={() => setSubmittedDraft(null)}>Dismiss preview</button></div><h2>{submittedDraft.title}</h2><p>{submittedDraft.body}</p><small>{submittedDraft.alias} · {submittedDraft.category}</small><p className="draft-note">This post is saved privately and will not appear in the community feed until a moderator approves it.</p><div className="submission-support"><b>Support is available now.</b><p>If you may be in immediate danger, contact local emergency services. In the US, call or text <a href="tel:988">988</a> for the Suicide &amp; Crisis Lifeline.</p></div></article>}
      <div className="feed-tabs" role="group" aria-label="Feed filter"><button className="active" type="button">Recent reflections</button><span>{livePosts.length ? "Approved community posts" : "Illustrative examples"}</span></div>{feedError && <p className="form-notice" role="alert">{feedError}</p>}{feedLoading && <div className="surface-card empty-state">Loading approved reflections…</div>}{!feedLoading && !feedError && filtered.length === 0 && <div className="surface-card empty-state">No approved reflections in this channel yet.</div>}{!feedLoading && !feedError && filtered.map((post) => <article className="surface-card feed-post" key={post.id}><div className="post-meta"><span className="post-avatar">{post.alias.split(" ").at(-1)?.[0] ?? "A"}</span><div><b>{post.alias}</b><small>{post.category}{post.example ? " · Example" : ""}</small></div>{post.sensitivityVeil && <span className="sample-pill">Sensitive topic</span>}</div><h2>{post.title}</h2><p>{post.body}</p>{post.responses.length > 0 ? post.responses.map((response) => <div className="response-preview" key={response.id}><div className="section-kicker">{response.mentor_title} · {response.mentor_name}</div><p>{response.body}</p>{post.example && <small>Example only · Not clinical advice</small>}</div>) : <div className="response-preview"><p>A mentor perspective will appear here after review.</p></div>}<div className="post-bottom"><span>{post.example ? "Example content" : "Approved reflection"}</span>{!post.example && signedIn && <button type="button" onClick={() => { setReportingId(reportingId === post.id ? "" : post.id); setReportNotice(""); }}>Report</button>}</div>{reportingId === post.id && <div className="report-form"><label htmlFor={`report-${post.id}`}>Why are you reporting this reflection?</label><textarea id={`report-${post.id}`} value={reportReason} onChange={(event) => setReportReason(event.target.value)} minLength={5} maxLength={2000} rows={3} required/><button className="button button-small" type="button" onClick={() => void report(post.id)}>Send report</button>{reportNotice && <p role="status">{reportNotice}</p>}</div>}</article>)}</section>
    <aside className="feed-right"><section className="surface-card sidebar-card"><div className="section-kicker">A THOUGHTFUL COMMUNITY</div><h3>Make room for perspective.</h3><p>Conversations are moderated before they’re published. Mentor credentials must be reviewed before they can respond.</p><Link className="text-link" href="/profile">See how profiles work ↗</Link></section><section className="surface-card sidebar-card"><div className="section-kicker">SHARE YOUR EXPERIENCE</div><h3>Become a mentor</h3><p>Offer a considered perspective on your own schedule.</p><Link className="button button-small" href="/mentor-apply">View the application <span>→</span></Link></section></aside></main><SiteFooter/></>;
}
