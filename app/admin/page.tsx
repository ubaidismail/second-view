import Link from "next/link";
import { redirect } from "next/navigation";
import SiteHeader from "../components/site-header";
import SiteFooter from "../components/site-footer";
import { createClient } from "@/lib/supabase/server";
import {
  reviewMentorAction,
  reviewPostAction,
  reviewReportAction,
  reviewResponseAction,
} from "./actions";
import SubmitButton from "./submit-button";

/* ------------------------------------------------------------------ */
/* 1. TYPES                                                            */
/* ------------------------------------------------------------------ */

type SearchParams = Promise<{ error?: string; updated?: string }>;
type FormAction = (formData: FormData) => void | Promise<void>;

type PostRow = {
  id: string;
  category_id: string;
  pseudonym: string;
  title: string;
  body: string;
  crisis_flag: boolean;
  flag_reasons: string[] | null;
  status: string;
  created_at: string;
};

type ResponseRow = {
  id: string;
  post_id: string;
  mentor_id: string;
  body: string;
  created_at: string;
};

type MentorRow = {
  user_id: string;
  full_name: string;
  professional_title: string;
  licensing_board: string;
  license_number: string;
  professional_email: string;
  affiliation: string | null;
  focus_areas: string[] | null;
  proof_path: string | null;
  created_at: string;
};

type ReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
};

/* ------------------------------------------------------------------ */
/* 2. DATA LOADING (all database queries live here)                    */
/* ------------------------------------------------------------------ */

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function loadAdminData(supabase: Supabase) {
  const [posts, responses, mentors, reports, categories] = await Promise.all([
    // Pending posts come from the admin_post_queue view
    supabase
      .from("admin_post_queue")
      .select(
        "id, category_id, pseudonym, title, body, crisis_flag, flag_reasons, status, created_at",
      )
      .order("crisis_flag", { ascending: false })
      .order("created_at", { ascending: true }),

    supabase
      .from("responses")
      .select("id, post_id, mentor_id, body, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),

    supabase
      .from("mentor_applications")
      .select(
        "user_id, full_name, professional_title, credential_type, licensing_board, license_number, professional_email, affiliation, focus_areas, proof_path, created_at",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),

    supabase
      .from("reports")
      .select("id, target_type, target_id, reason, status, created_at")
      .in("status", ["open", "reviewing"])
      .order("created_at", { ascending: true }),

    supabase.from("categories").select("id, name"),
  ]);

  const hasError = [
    posts.error,
    responses.error,
    mentors.error,
    reports.error,
    categories.error,
  ].some(Boolean);

  return {
    posts: (posts.data ?? []) as PostRow[],
    responses: (responses.data ?? []) as ResponseRow[],
    mentors: (mentors.data ?? []) as MentorRow[],
    reports: (reports.data ?? []) as ReportRow[],
    categoryNames: new Map<string, string>(
      (categories.data ?? []).map((c) => [c.id, c.name]),
    ),
    hasError,
  };
}

/* ------------------------------------------------------------------ */
/* 3. SMALL REUSABLE PIECES                                            */
/* ------------------------------------------------------------------ */

function Section({
  title,
  count,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-section">
      <div className="admin-section-title">
        <h2>{title}</h2>
        <span>{count}</span>
      </div>
      {count > 0 ? children : <p className="admin-empty-line">{emptyText}</p>}
    </section>
  );
}

function ApproveRejectForm({
  action,
  fieldName = "id",
  fieldValue,
  approveLabel = "Approve",
  rejectExtra,
}: {
  action: FormAction;
  fieldName?: string;
  fieldValue: string;
  approveLabel?: string;
  rejectExtra?: React.ReactNode; // e.g. the rejection reason input
}) {
  return (
    <div className="admin-actions">
      <StatusForm
        action={action}
        fieldName={fieldName}
        fieldValue={fieldValue}
        status="approved"
        label={approveLabel}
      />
      <StatusForm
        action={action}
        fieldName={fieldName}
        fieldValue={fieldValue}
        status="rejected"
        label="Reject"
        className="button button-small button-danger"
      >
        {rejectExtra}
      </StatusForm>
    </div>
  );
}
function StatusForm({ action, fieldName = "id", fieldValue, status, label, className = "button button-small", children }: {
  action: FormAction;
  fieldName?: string;
  fieldValue: string;
  status: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} style={{ display: "contents" }}>
      <input type="hidden" name={fieldName} value={fieldValue} />
      <input type="hidden" name="status" value={status} />
      {children}
      <SubmitButton label={label} className={className} />
    </form>
  );
}

function Notice({
  role,
  children,
}: {
  role: "status" | "alert";
  children: React.ReactNode;
}) {
  return (
    <p className="form-notice" role={role}>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* 4. CARDS (one per section)                                          */
/* ------------------------------------------------------------------ */

function PostCard({
  post,
  categoryName,
}: {
  post: PostRow;
  categoryName: string;
}) {
  return (
    <article className="surface-card admin-card">
      <div className="admin-card-meta">
        <span className={post.crisis_flag ? "crisis-pill" : "sample-pill"}>
          {post.crisis_flag ? "Priority safety review" : "Pending review"}
        </span>
        <span>{categoryName}</span>
        <span>{post.pseudonym}</span>
      </div>

      <h3>{post.title}</h3>
      <p className="admin-post-body">{post.body}</p>

      {post.crisis_flag && (
        <p className="admin-flag-reasons">
          Matched terms: {(post.flag_reasons ?? []).join(", ")}
        </p>
      )}

      <ApproveRejectForm action={reviewPostAction} fieldValue={post.id} />
    </article>
  );
}

function ResponseCard({ response }: { response: ResponseRow }) {
  return (
    <article className="surface-card admin-card">
      <div className="admin-card-meta">
        <span className="sample-pill">Post {response.post_id}</span>
        <span>Mentor {response.mentor_id}</span>
      </div>

      <p className="admin-post-body">{response.body}</p>

      <ApproveRejectForm action={reviewResponseAction} fieldValue={response.id} />
    </article>
  );
}

function MentorCard({ mentor }: { mentor: MentorRow }) {
  const focus = (mentor.focus_areas ?? []).join(", ") || "Not specified";

  return (
    <article className="surface-card admin-card">
      <div className="admin-card-meta">
        <span className="sample-pill">Credential review</span>
        <span>{new Date(mentor.created_at).toLocaleDateString()}</span>
      </div>

      <h3>
        {mentor.full_name} · {mentor.professional_title}
      </h3>

      <p className="admin-post-body">
        {mentor.licensing_board} · {mentor.license_number}
        <br />
        {mentor.professional_email}
        {mentor.affiliation ? ` · ${mentor.affiliation}` : ""}
        <br />
        Focus: {focus}
      </p>

      {mentor.proof_path && (
        <a
          className="text-link"
          href={`/admin/proof/${mentor.user_id}`}
          target="_blank"
          rel="noreferrer"
        >
          Open private credential file ↗
        </a>
      )}

      <ApproveRejectForm
  action={reviewMentorAction}
  fieldName="userId"
  fieldValue={mentor.user_id}
  approveLabel="Approve mentor"
  rejectExtra={
    <label className="reject-reason">
      Reason if rejecting
      <input
        name="rejectionReason"
        minLength={5}
        maxLength={1000}
        placeholder="Required when you choose Reject"
      />
    </label>
  }
/>
    </article>
  );
}

function ReportCard({ report }: { report: ReportRow }) {
  return (
    <article className="surface-card admin-card">
      <div className="admin-card-meta">
        <span>
          {report.target_type} · {report.target_id}
        </span>
        <span>{report.status}</span>
      </div>

      <p className="admin-post-body">{report.reason}</p>

      <div className="admin-actions">
        <StatusForm action={reviewReportAction} fieldValue={report.id} status="reviewing" label="Mark reviewing" className="button button-small button-quiet" />
        <StatusForm action={reviewReportAction} fieldValue={report.id} status="resolved" label="Resolve" />
        <StatusForm action={reviewReportAction} fieldValue={report.id} status="dismissed" label="Dismiss" className="button button-small button-danger" />
      </div>
    </article>
  );
}

function AccessDenied() {
  return (
    <>
      <SiteHeader />
      <main className="admin-page">
        <section className="surface-card admin-empty">
          <h1>Moderator access required</h1>
          <p>This account has not been given the admin role.</p>
          <Link href="/feed">Return to the community feed</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 5. THE PAGE                                                         */
/* ------------------------------------------------------------------ */

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();

  // --- Step 1: must be logged in ---
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (typeof userId !== "string") redirect("/login?next=/admin");

  // --- Step 2: must be an admin ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role !== "admin") return <AccessDenied />;

  // --- Step 3: load everything ---
  const params = await searchParams;
  const { posts, responses, mentors, reports, categoryNames, hasError } =
    await loadAdminData(supabase);


    // TEMP DEBUG: remove when fixed
const { data: isAdminResult, error: isAdminError } = await supabase.rpc("is_admin");
const { data: rawPosts, error: rawPostsError } = await supabase
  .from("posts")
  .select("id, status")
  .limit(5);
const viewCheck = await supabase.from("admin_post_queue").select("id");

console.log("[debug] userId:", userId);
console.log("[debug] is_admin():", isAdminResult, isAdminError);
console.log("[debug] posts table:", rawPosts, rawPostsError);
console.log("[debug] admin_post_queue:", viewCheck.data, viewCheck.error);

  const updatedText = params.updated ? `Saved ${params.updated} review.` : "";
  const errorText = params.error
    ? "A review action could not be completed. Check the record and try again."
    : "";

  // --- Step 4: render ---
  return (
    <>
      <SiteHeader />
      <main className="admin-page">
        <div className="admin-title">
          <div>
            <span className="section-kicker">MODERATION WORKSPACE</span>
            <h1>Review queue</h1>
            <p>
              Review each submission before deciding whether it can be
              published.
            </p>
          </div>
          <span className="admin-badge">ADMIN</span>
        </div>

        {updatedText && <Notice role="status">{updatedText}</Notice>}
        {errorText && <Notice role="alert">{errorText}</Notice>}
        {hasError && (
          <Notice role="alert">
            We couldn’t load all review queues. Refresh the page or contact the
            site administrator.
          </Notice>
        )}

        <Section
          title="Pending posts"
          count={posts.length}
          emptyText="No pending posts."
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              categoryName={
                categoryNames.get(post.category_id) ?? "Uncategorized"
              }
            />
          ))}
        </Section>

        <Section
          title="Pending mentor responses"
          count={responses.length}
          emptyText="No pending responses."
        >
          {responses.map((response) => (
            <ResponseCard key={response.id} response={response} />
          ))}
        </Section>

        <Section
          title="Mentor applications"
          count={mentors.length}
          emptyText="No pending applications."
        >
          {mentors.map((mentor) => (
            <MentorCard key={mentor.user_id} mentor={mentor} />
          ))}
        </Section>

        <Section
          title="Open reports"
          count={reports.length}
          emptyText="No open reports."
        >
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}