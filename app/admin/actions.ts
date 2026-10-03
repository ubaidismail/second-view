"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function adminClient() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (error || typeof userId !== "string") return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return profile?.role === "admin" ? { supabase, userId } : null;
}

export async function reviewPostAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuidPattern.test(id) || !["approved", "rejected"].includes(status)) redirect("/admin?error=invalid");
  const admin = await adminClient();
  if (!admin) redirect("/admin?error=unauthorized");
  const { error } = await admin.supabase.from("posts").update({ status, reviewed_by: admin.userId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin?error=review");
  revalidatePath("/admin"); revalidatePath("/feed"); redirect("/admin?updated=post");
}

export async function reviewResponseAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuidPattern.test(id) || !["approved", "rejected"].includes(status)) redirect("/admin?error=invalid");
  const admin = await adminClient();
  if (!admin) redirect("/admin?error=unauthorized");
  const { error } = await admin.supabase.from("responses").update({ status, reviewed_by: admin.userId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin?error=review");
  revalidatePath("/admin"); revalidatePath("/feed"); redirect("/admin?updated=response");
}

export async function reviewMentorAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();
  if (!uuidPattern.test(userId) || !["approved", "rejected"].includes(status) || (status === "rejected" && rejectionReason.length < 5) || rejectionReason.length > 1000) {
    redirect("/admin?error=invalid");
  }
  const admin = await adminClient();
  if (!admin) redirect("/admin?error=unauthorized");
  const { error } = await admin.supabase.from("mentor_applications").update({
    status,
    reviewed_by: admin.userId,
    reviewed_at: new Date().toISOString(),
    rejection_reason: status === "rejected" ? rejectionReason : null,
  }).eq("user_id", userId);
  if (error) redirect("/admin?error=review");
  revalidatePath("/admin"); revalidatePath("/mentor-apply"); redirect("/admin?updated=mentor");
}

export async function reviewReportAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuidPattern.test(id) || !["reviewing", "resolved", "dismissed"].includes(status)) redirect("/admin?error=invalid");
  const admin = await adminClient();
  if (!admin) redirect("/admin?error=unauthorized");
  const { error } = await admin.supabase.from("reports").update({ status, reviewed_by: admin.userId, reviewed_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin?error=review");
  revalidatePath("/admin"); redirect("/admin?updated=report");
}
