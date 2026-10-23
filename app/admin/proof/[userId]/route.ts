import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(userId))
    return new NextResponse("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const reviewerId = claims?.claims.sub;
  if (claimsError || typeof reviewerId !== "string")
    return new NextResponse("Sign in required", { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", reviewerId)
    .maybeSingle();
  if (profile?.role !== "admin")
    return new NextResponse("Not found", { status: 404 });

  const { data: application } = await supabase
    .from("mentor_applications")
    .select("proof_path")
    .eq("user_id", userId)
    .maybeSingle();
  if (!application?.proof_path)
    return new NextResponse("Credential document not found", { status: 404 });
  const { data: signedFile, error } = await supabase.storage
    .from("mentor-proof")
    .createSignedUrl(application.proof_path, 60);
  if (error || !signedFile?.signedUrl)
    return new NextResponse("Credential document unavailable", { status: 404 });

  return NextResponse.redirect(signedFile.signedUrl, {
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
