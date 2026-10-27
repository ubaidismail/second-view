"use server";

import { createClient } from "@/lib/supabase/server";
import type { Reply } from "./reply-thread";
import { exit } from "process";

export async function assistWithReflectionAction(input: {
  title: string;
  body: string;
}) {
  const title = input.title.trim();
  const body = input.body.trim();

  if (title.length < 8 || title.length > 160 || body.length > 10000) {
    return {
      ok: false as const,
      message: "Add a reflection title before asking for writing help.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } =
      await supabase.auth.getClaims();
    if (claimsError || typeof claims?.claims.sub !== "string") {
      return {
        ok: false as const,
        message: "Sign in before using writing assistance.",
      };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        message: "AI writing help is not configured yet.",
      };
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "openai/gpt-oss-120b",
          instructions:
            "Help someone express a personal reflection clearly and gently. If they provided a draft, preserve its meaning, facts, voice, and level of detail while improving clarity and flow. If they did not provide a draft, write a short first-person starting draft based only on the title, using no invented personal details and leaving room for the person to edit. Do not give advice, diagnose, or add a greeting, heading, or explanation. Return only the reflection text.",
          input: body
            ? `Title: ${title}\n\nCurrent draft to refine:\n${body}`
          : `Title: ${title}\n\nWrite a short first-person starting draft for this reflection.`,
        max_output_tokens: 600,
      }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!response.ok) {
      console.error("[feed:ai] provider request failed", response.status);
      return {
        ok: false as const,
        message: "Writing help is unavailable right now. Please try again.",
      };
    }

    const result = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const generatedText =
      result.output_text ??
      result.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => item.type === "output_text")?.text ??
      "";
    const text = generatedText.trim();

    if (!text) {
      return {
        ok: false as const,
        message: "Writing help returned no text. Please try again.",
      };
    }

    return { ok: true as const, text: text.slice(0, 10000) };
  } catch {
    return {
      ok: false as const,
      message: "We could not connect to writing help. Please try again.",
    };
  }
}

const categorySlugs: Record<string, string> = {
  "Career & Purpose": "career-purpose",
  "Emotional Wellbeing": "emotional-wellbeing",
  Identity: "identity",
  "Grief & Transitions": "grief-transitions",
  Relationships: "relationships",
};

export async function createPostAction(input: {
  title: string;
  body: string;
  pseudonym: string;
  category: string;
  sensitivityVeil: boolean;
}) {
  const title = input.title.trim();
  const body = input.body.trim();
  const pseudonym = input.pseudonym.trim();
  const slug = categorySlugs[input.category];
  
  if (
    !slug ||
    title.length < 8 ||
    title.length > 160 ||
    body.length < 20 ||
    body.length > 10000 ||
    pseudonym.length < 2 ||
    pseudonym.length > 60
  ) {
    return {
      ok: false as const,
      code: "validation" as const,
      message:
        "Check the title, reflection, and selected category, then try again.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (claimsError || typeof userId !== "string") {
      return {
        ok: false as const,
        code: "auth" as const,
        message: "Sign in before submitting a reflection.",
      };
    }

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (categoryError || !category) {
      if (categoryError)
        console.error(
          "[feed:create] category lookup failed",
          categoryError.code,
        );
      return {
        ok: false as const,
        code: "save" as const,
        message: "We couldn’t prepare your reflection. Please try again.",
      };
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        category_id: category.id,
        pseudonym,
        title,
        body,
        sensitivity_veil: input.sensitivityVeil,
        status: "pending",
      })
      .select("id")
      .single();
      
    if (error || !post) {
      if (error) console.error("[feed:create] post insert failed", error.code);
      return {
        ok: false as const,
        code: "save" as const,
        message:
          "We couldn’t save your reflection. Please try again. If the problem continues, contact support.",
      };
    }

    return { ok: true as const, postId: post.id };
  } catch {
    return {
      ok: false as const,
      code: "save" as const,
      message: "We could not connect to Second View. Please try again.",
    };
  }
}

export async function reportPostAction(postId: string, reason: string) {
  if (
    !/^[0-9a-f-]{36}$/i.test(postId) ||
    reason.trim().length < 5 ||
    reason.trim().length > 2000
  ) {
    return {
      ok: false as const,
      message: "Choose a reason with at least five characters.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (claimsError || typeof userId !== "string")
      return { ok: false as const, message: "Sign in to report a reflection." };
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      target_type: "post",
      target_id: postId,
      reason: reason.trim(),
    });
    if (error)
      return {
        ok: false as const,
        message: "We could not submit this report. Please try again.",
      };
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "We could not connect to Second View. Please try again.",
    };
  }
}
const replyColumns =
  "id, post_id, parent_id, body, created_at, is_post_owner, author_name, author_title, edited_at, is_mine";

  export async function createReplyAction(input: {
  postId: string;
  parentId: string | null;
  body: string;
}) {
  const body = input.body.trim();
  const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

  if (
    !isUuid(input.postId) ||
    (input.parentId !== null && !isUuid(input.parentId)) ||
    body.length < 2 ||
    body.length > 4000
  ) {
    return { ok: false as const, message: "Write a reply of at least two characters." };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (claimsError || typeof userId !== "string")
      return { ok: false as const, message: "Sign in to reply." };

    if (input.parentId) {
      const { data: parent } = await supabase
        .from("public_replies")
        .select("id")
        .eq("id", input.parentId)
        .eq("post_id", input.postId)
        .maybeSingle();
      if (!parent)
        return { ok: false as const, message: "That comment is no longer available." };
    }

    const { data: inserted, error } = await supabase
      .from("replies")
      .insert({
        post_id: input.postId,
        parent_id: input.parentId,
        author_id: userId,
        body,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      if (error) console.error("[feed:reply] insert failed", error.code);
      return {
        ok: false as const,
        message:
          error?.code === "42501"
            ? "Only the author of this reflection and verified mentors can reply."
            : "We couldn’t send your reply. Please try again.",
      };
    }

    const { data: reply } = await supabase
      .from("public_replies")
      .select(replyColumns)
      .eq("id", inserted.id)
      .maybeSingle();
    if (!reply)
      return { ok: false as const, message: "Your reply was saved. Refresh the page to see it." };

    return { ok: true as const, reply: reply as unknown as Reply };
  } catch {
    return { ok: false as const, message: "We could not connect to Second View. Please try again." };
  }
}

export async function updateReplyAction(input: { replyId: string; body: string }) {
  const body = input.body.trim();
  if (!/^[0-9a-f-]{36}$/i.test(input.replyId) || body.length < 2 || body.length > 4000) {
    return { ok: false as const, message: "Write a reply of at least two characters." };
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (claimsError || typeof userId !== "string")
      return { ok: false as const, message: "Sign in to edit your reply." };

    const { data: updated, error } = await supabase
      .from("replies")
      .update({ body })
      .eq("id", input.replyId)
      .eq("author_id", userId)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[feed:reply] update failed", error.code);
      return { ok: false as const, message: "We couldn’t save your changes. Please try again." };
    }
    if (!updated)
      return { ok: false as const, message: "You can only edit your own replies." };

    const { data: reply } = await supabase
      .from("public_replies")
      .select(replyColumns)
      .eq("id", input.replyId)
      .maybeSingle();
    if (!reply)
      return { ok: false as const, message: "Saved. Refresh the page to see the change." };

    return { ok: true as const, reply: reply as unknown as Reply };
  } catch {
    return { ok: false as const, message: "We could not connect to Second View. Please try again." };
  }
}